//! Desktop PDF export.
//!
//! On macOS, WKWebView's JavaScript `window.print()` is a silent no-op. We render
//! HTML in a WKWebView and drive AppKit print-to-PDF (`NSPrintSaveJob`).
//!
//! Empty/white PDFs usually come from: printing before load finishes, vertically
//! centered empty pages, off-screen views that never paint, or dark CSS vars
//! with no `@media print` application. This path waits for `isLoading == false`,
//! disables centering, keeps a near-invisible on-screen window, and expects the
//! HTML to already carry forced light print colors.

use tauri::AppHandle;

#[cfg(target_os = "macos")]
mod macos {
    use std::fs;
    use std::path::Path;
    use std::sync::mpsc;
    use std::time::{Duration, Instant};

    use objc2::rc::Retained;
    use objc2::{MainThreadMarker, MainThreadOnly};
    use objc2_app_kit::{
        NSBackingStoreType, NSPrintInfo, NSPrintJobSavingURL, NSPrintOperation, NSPrintSaveJob,
        NSPrintingPaginationMode, NSWindow, NSWindowStyleMask,
    };
    use objc2_core_foundation::{CGPoint, CGRect, CGSize};
    use objc2_foundation::{NSDate, NSRunLoop, NSString, NSURL};
    use objc2_web_kit::{WKWebView, WKWebViewConfiguration};
    use tauri::AppHandle;

    fn spin_runloop(seconds: f64) {
        let rl = NSRunLoop::currentRunLoop();
        let until = NSDate::dateWithTimeIntervalSinceNow(seconds);
        rl.runUntilDate(&until);
    }

    fn wait_for_pdf(path: &Path, timeout: Duration) -> Result<(), String> {
        let start = Instant::now();
        let mut last_size = 0u64;
        let mut stable = 0u8;
        while start.elapsed() < timeout {
            if let Ok(meta) = fs::metadata(path) {
                let len = meta.len();
                if len > 64 && len == last_size {
                    stable += 1;
                    if stable >= 4 {
                        return Ok(());
                    }
                } else {
                    stable = 0;
                    last_size = len;
                }
            }
            spin_runloop(0.1);
        }
        if path.is_file() && fs::metadata(path).map(|m| m.len()).unwrap_or(0) > 64 {
            Ok(())
        } else {
            Err("Timed out waiting for PDF file".into())
        }
    }

    fn wait_until_loaded(webview: &WKWebView, timeout: Duration) {
        let start = Instant::now();
        while start.elapsed() < timeout {
            let loading = unsafe { webview.isLoading() };
            if !loading {
                // One more turn for layout / fonts / late paints.
                spin_runloop(0.15);
                if !unsafe { webview.isLoading() } {
                    return;
                }
            }
            spin_runloop(0.05);
        }
    }

    pub fn export_html_to_pdf(
        app: AppHandle,
        html: String,
        pdf_path: String,
    ) -> Result<(), String> {
        let (tx, rx) = mpsc::channel::<Result<(), String>>();

        app.run_on_main_thread(move || {
            let result = (|| {
                let mtm = MainThreadMarker::new()
                    .ok_or_else(|| "PDF export must run on the main thread".to_string())?;

                // On-screen but nearly invisible — far-offscreen windows often
                // print as blank white pages on WKWebView.
                let page_w = 794.0; // ~A4 at 96dpi
                let page_h = 1123.0;
                let frame = CGRect::new(CGPoint::new(40.0, 40.0), CGSize::new(page_w, page_h));
                let content = CGRect::new(CGPoint::new(0.0, 0.0), CGSize::new(page_w, page_h));

                let window: Retained<NSWindow> = unsafe {
                    NSWindow::initWithContentRect_styleMask_backing_defer(
                        NSWindow::alloc(mtm),
                        frame,
                        NSWindowStyleMask::Borderless,
                        NSBackingStoreType::Buffered,
                        false,
                    )
                };
                window.setTitle(&NSString::from_str("npp-x Export PDF"));
                unsafe { window.setReleasedWhenClosed(false) };
                window.setAlphaValue(0.02);
                window.orderFrontRegardless();

                let config = unsafe { WKWebViewConfiguration::new(mtm) };
                let webview = unsafe {
                    WKWebView::initWithFrame_configuration(
                        WKWebView::alloc(mtm),
                        content,
                        &config,
                    )
                };
                window.setContentView(Some(&*webview));

                // Prefer loadHTMLString with an https base so Mermaid/marked
                // CDN modules resolve (file:// often blocks them → empty page).
                let html_ns = NSString::from_str(&html);
                let base = NSURL::URLWithString(&NSString::from_str("https://cdn.jsdelivr.net/"))
                    .ok_or_else(|| "Invalid base URL".to_string())?;
                unsafe {
                    webview.loadHTMLString_baseURL(&html_ns, Some(&base));
                }

                wait_until_loaded(&webview, Duration::from_secs(20));
                // Mermaid / late layout
                let extra = if html.contains("mermaid") { 3.0 } else { 0.8 };
                let start = Instant::now();
                while start.elapsed() < Duration::from_secs_f64(extra) {
                    spin_runloop(0.05);
                }

                // Tall frame so content below the first viewport is still painted.
                let tall = CGSize::new(page_w, page_h * 8.0);
                window.setContentSize(tall);
                webview.setFrame(CGRect::new(CGPoint::new(0.0, 0.0), tall));
                spin_runloop(0.2);

                let print_info = NSPrintInfo::sharedPrintInfo();
                // Centering empty/short content produces blank white pages.
                print_info.setHorizontallyCentered(false);
                print_info.setVerticallyCentered(false);
                print_info.setHorizontalPagination(NSPrintingPaginationMode::Automatic);
                print_info.setVerticalPagination(NSPrintingPaginationMode::Automatic);
                print_info.setTopMargin(28.0);
                print_info.setBottomMargin(28.0);
                print_info.setLeftMargin(28.0);
                print_info.setRightMargin(28.0);

                let pdf_ns = NSString::from_str(&pdf_path);
                let pdf_url = NSURL::fileURLWithPath(&pdf_ns);
                // Remove any previous attempt so wait_for_pdf doesn't succeed early.
                let _ = fs::remove_file(&pdf_path);
                unsafe {
                    print_info.setJobDisposition(NSPrintSaveJob);
                    let dict = print_info.dictionary();
                    dict.insert(NSPrintJobSavingURL, &*pdf_url);
                }

                let op: Retained<NSPrintOperation> =
                    unsafe { webview.printOperationWithPrintInfo(&print_info) };
                op.setShowsPrintPanel(false);
                op.setShowsProgressPanel(false);
                op.setJobTitle(Some(&NSString::from_str("npp-x Preview")));
                op.setCanSpawnSeparateThread(false);

                let _ok = op.runOperation();
                spin_runloop(0.3);
                wait_for_pdf(Path::new(&pdf_path), Duration::from_secs(60))?;

                // Reject tiny "empty" PDFs (headers only / blank pages).
                let len = fs::metadata(&pdf_path).map(|m| m.len()).unwrap_or(0);
                if len < 800 {
                    let _ = fs::remove_file(&pdf_path);
                    return Err(format!(
                        "PDF looks empty ({len} bytes). Preview may still be loading — try again."
                    ));
                }

                window.close();
                Ok(())
            })();

            let _ = tx.send(result);
        })
        .map_err(|e| e.to_string())?;

        rx.recv().map_err(|e| e.to_string())?
    }
}

#[cfg(target_os = "macos")]
#[tauri::command]
pub fn export_html_to_pdf(
    app: AppHandle,
    html: String,
    path: String,
) -> Result<(), String> {
    macos::export_html_to_pdf(app, html, path)
}

#[cfg(not(target_os = "macos"))]
#[tauri::command]
pub fn export_html_to_pdf(
    _app: AppHandle,
    _html: String,
    _path: String,
) -> Result<(), String> {
    Err("Native PDF export is implemented for macOS; use the print dialog on this platform.".into())
}
