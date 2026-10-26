//! Desktop PDF export.
//!
//! On macOS, WKWebView's JavaScript `window.print()` is a silent no-op (wry only
//! shims print for WebView2). We render the HTML in an off-screen WKWebView and
//! drive AppKit's print-to-PDF (`NSPrintSaveJob`) instead.

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
                if len > 0 && len == last_size {
                    stable += 1;
                    if stable >= 3 {
                        return Ok(());
                    }
                } else {
                    stable = 0;
                    last_size = len;
                }
            }
            spin_runloop(0.1);
        }
        if path.is_file() && fs::metadata(path).map(|m| m.len()).unwrap_or(0) > 0 {
            Ok(())
        } else {
            Err("Timed out waiting for PDF file".into())
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

                let tmp_dir = std::env::temp_dir().join("npp-x-pdf");
                fs::create_dir_all(&tmp_dir).map_err(|e| e.to_string())?;
                let html_path = tmp_dir.join(format!("export-{}.html", std::process::id()));
                fs::write(&html_path, html.as_bytes()).map_err(|e| e.to_string())?;

                let frame = CGRect::new(CGPoint::new(-2400.0, -2400.0), CGSize::new(900.0, 1200.0));
                let content = CGRect::new(CGPoint::new(0.0, 0.0), CGSize::new(900.0, 1200.0));

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

                let config = unsafe { WKWebViewConfiguration::new(mtm) };
                let webview = unsafe {
                    WKWebView::initWithFrame_configuration(
                        WKWebView::alloc(mtm),
                        content,
                        &config,
                    )
                };
                window.setContentView(Some(&*webview));
                window.orderBack(None);

                let html_ns = NSString::from_str(&html_path.to_string_lossy());
                let dir_ns = NSString::from_str(&tmp_dir.to_string_lossy());
                let file_url = unsafe { NSURL::fileURLWithPath(&html_ns) };
                let dir_url = unsafe { NSURL::fileURLWithPath(&dir_ns) };
                unsafe {
                    webview.loadFileURL_allowingReadAccessToURL(&file_url, &dir_url);
                }

                // Allow HTML + Mermaid CDN to settle before printing.
                let wait_ms = if html.contains("mermaid") { 2800 } else { 700 };
                let start = Instant::now();
                while start.elapsed() < Duration::from_millis(wait_ms) {
                    spin_runloop(0.05);
                }

                let print_info = NSPrintInfo::sharedPrintInfo();
                print_info.setJobDisposition(NSPrintSaveJob);
                print_info.setHorizontalPagination(NSPrintingPaginationMode::Automatic);
                print_info.setVerticalPagination(NSPrintingPaginationMode::Automatic);
                print_info.setTopMargin(36.0);
                print_info.setBottomMargin(36.0);
                print_info.setLeftMargin(36.0);
                print_info.setRightMargin(36.0);

                let pdf_ns = NSString::from_str(&pdf_path);
                let pdf_url = unsafe { NSURL::fileURLWithPath(&pdf_ns) };
                unsafe {
                    let dict = print_info.dictionary();
                    dict.insert(NSPrintJobSavingURL, &*pdf_url);
                }

                let op: Retained<NSPrintOperation> =
                    unsafe { webview.printOperationWithPrintInfo(&print_info) };
                op.setShowsPrintPanel(false);
                op.setShowsProgressPanel(true);
                op.setJobTitle(Some(&NSString::from_str("npp-x Preview")));

                // Save-to-URL job (no print panel). WKWebView may finish async —
                // wait for the PDF bytes on disk instead of trusting the bool.
                let _started = op.runOperation();
                spin_runloop(0.25);
                wait_for_pdf(Path::new(&pdf_path), Duration::from_secs(45))?;
                let _ = fs::remove_file(&html_path);
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
