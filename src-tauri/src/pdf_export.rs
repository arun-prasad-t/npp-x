//! Desktop PDF export.
//!
//! On macOS, `window.print()` is a silent no-op in WKWebView, and
//! `NSPrintOperation::runOperation` starts a modal print session on the main
//! thread that does not return for a save-to-PDF job. That freezes the app.
//! This path renders the HTML in a hidden WKWebView and calls `createPDF`,
//! which finishes on a completion handler and never takes over the UI.

use std::time::Duration;

use tauri::AppHandle;

/// ~A4 at 96dpi. Also the floor so a failed measurement still yields a page.
const PDF_MIN_W: f64 = 794.0;
const PDF_MIN_H: f64 = 1123.0;
/// ponytail: one tall page, not a paginated print. Cap ~100 A4 pages so a
/// runaway layout cannot allocate an unbounded off-screen web view.
const PDF_MAX_W: f64 = 4096.0;
const PDF_MAX_H: f64 = 120_000.0;

#[cfg_attr(not(any(target_os = "macos", test)), allow(dead_code))]
fn clamp_pdf_size(width: f64, height: f64) -> (f64, f64) {
    let width = if width.is_finite() {
        width.clamp(PDF_MIN_W, PDF_MAX_W)
    } else {
        PDF_MIN_W
    };
    let height = if height.is_finite() && height >= 200.0 {
        height.min(PDF_MAX_H)
    } else {
        PDF_MIN_H
    };
    (width, height)
}

/// `"width,height"` from the preview document, or a bare height.
#[cfg_attr(not(any(target_os = "macos", test)), allow(dead_code))]
fn parse_pdf_size(raw: &str) -> (f64, f64) {
    let mut parts = raw.split(',');
    let first = parts
        .next()
        .and_then(|s| s.trim().parse::<f64>().ok())
        .unwrap_or(0.0);
    match parts.next().and_then(|s| s.trim().parse::<f64>().ok()) {
        Some(height) => clamp_pdf_size(first, height),
        None => clamp_pdf_size(PDF_MIN_W, first),
    }
}

#[cfg_attr(not(any(target_os = "macos", test)), allow(dead_code))]
fn validate_pdf(bytes: &[u8]) -> Result<(), String> {
    if bytes.len() < 8 || !bytes.starts_with(b"%PDF") {
        return Err(format!(
            "PDF export produced an empty file ({} bytes). Try again after the preview finishes loading.",
            bytes.len()
        ));
    }
    Ok(())
}

#[cfg_attr(not(any(target_os = "macos", test)), allow(dead_code))]
fn min_layout_wait(html: &str) -> Duration {
    // Mermaid paints after the document load event.
    if html.contains("mermaid") {
        Duration::from_millis(2800)
    } else {
        Duration::from_millis(400)
    }
}

#[cfg(target_os = "macos")]
mod macos {
    use std::cell::RefCell;
    use std::collections::HashMap;
    use std::fs;
    use std::sync::atomic::{AtomicU64, Ordering};
    use std::sync::mpsc::Sender;
    use std::time::Instant;

    use block2::RcBlock;
    use objc2::rc::Retained;
    use objc2::runtime::AnyObject;
    use objc2::{MainThreadMarker, MainThreadOnly};
    use objc2_app_kit::{NSBackingStoreType, NSWindow, NSWindowStyleMask};
    use objc2_core_foundation::{CGPoint, CGRect, CGSize};
    use objc2_foundation::{NSData, NSError, NSNumber, NSString, NSURL};
    use objc2_web_kit::{WKPDFConfiguration, WKWebView, WKWebViewConfiguration};
    use tauri::AppHandle;

    use super::{parse_pdf_size, validate_pdf, PDF_MIN_H, PDF_MIN_W};

    const HEIGHT_JS: &str = "(function(){\
        var b=document.body,d=document.documentElement;\
        var w=Math.max(b?b.scrollWidth:0,d?d.scrollWidth:0,0);\
        var h=Math.max(b?b.scrollHeight:0,d?d.scrollHeight:0,b?b.offsetHeight:0,0);\
        return Math.ceil(w)+','+Math.ceil(h);\
    })()";

    struct PdfJob {
        window: Retained<NSWindow>,
        webview: Retained<WKWebView>,
        pdf_path: String,
        started: Instant,
        min_wait: std::time::Duration,
        tx: Sender<Result<(), String>>,
        app: AppHandle,
    }

    thread_local! {
        static JOBS: RefCell<HashMap<u64, PdfJob>> = RefCell::new(HashMap::new());
    }

    static NEXT_ID: AtomicU64 = AtomicU64::new(1);

    fn offscreen_frame(width: f64, height: f64) -> CGRect {
        // Entirely below the desktop so the helper window cannot cover the
        // editor or become the click target. Coordinates are points.
        CGRect::new(
            CGPoint::new(-20_000.0, -20_000.0 - height),
            CGSize::new(width, height),
        )
    }

    fn place(window: &NSWindow, width: f64, height: f64) {
        window.setFrame_display(offscreen_frame(width, height), true);
    }

    fn finish(id: u64, result: Result<(), String>) {
        let Some(job) = JOBS.with(|jobs| jobs.borrow_mut().remove(&id)) else {
            return;
        };
        job.window.close();
        let _ = job.tx.send(result);
    }

    fn arm(id: u64) {
        let app = JOBS.with(|jobs| jobs.borrow().get(&id).map(|job| job.app.clone()));
        let Some(app) = app else { return };
        std::thread::spawn(move || {
            std::thread::sleep(std::time::Duration::from_millis(100));
            let _ = app.run_on_main_thread(move || poll(id));
        });
    }

    fn poll(id: u64) {
        let next = JOBS.with(|jobs| {
            let jobs = jobs.borrow();
            let Some(job) = jobs.get(&id) else {
                return Poll::Gone;
            };
            let loading = unsafe { job.webview.isLoading() };
            if job.started.elapsed() > std::time::Duration::from_secs(25) {
                Poll::Timeout
            } else if loading || job.started.elapsed() < job.min_wait {
                Poll::Wait
            } else {
                Poll::Ready
            }
        });
        match next {
            Poll::Gone => {}
            Poll::Timeout => finish(id, Err("Timed out loading the preview for PDF.".into())),
            Poll::Wait => arm(id),
            Poll::Ready => measure(id),
        }
    }

    enum Poll {
        Wait,
        Ready,
        Timeout,
        Gone,
    }

    fn objc_string(value: *mut AnyObject) -> String {
        if value.is_null() {
            return String::new();
        }
        let obj = unsafe { &*value };
        if let Some(text) = obj.downcast_ref::<NSString>() {
            return text.to_string();
        }
        if let Some(number) = obj.downcast_ref::<NSNumber>() {
            return number.as_f64().to_string();
        }
        String::new()
    }

    fn measure(id: u64) {
        let prepared = JOBS.with(|jobs| {
            jobs.borrow()
                .get(&id)
                .map(|job| (job.webview.clone(), job.app.clone()))
        });
        let Some((webview, app)) = prepared else {
            return;
        };
        let js = NSString::from_str(HEIGHT_JS);
        let block = RcBlock::new(move |value: *mut AnyObject, _error: *mut NSError| {
            let (width, height) = parse_pdf_size(&objc_string(value));
            let deliver = move || resize_then_capture(id, width, height);
            if MainThreadMarker::new().is_some() {
                deliver();
            } else {
                let _ = app.run_on_main_thread(deliver);
            }
        });
        unsafe { webview.evaluateJavaScript_completionHandler(&js, Some(&block)) };
    }

    fn resize_then_capture(id: u64, width: f64, height: f64) {
        let app = JOBS.with(|jobs| {
            let jobs = jobs.borrow();
            let Some(job) = jobs.get(&id) else {
                return None;
            };
            place(&job.window, width, height);
            Some(job.app.clone())
        });
        let Some(app) = app else { return };
        std::thread::spawn(move || {
            // One turn for WebKit to relayout at the measured size.
            std::thread::sleep(std::time::Duration::from_millis(200));
            let _ = app.run_on_main_thread(move || capture(id, width, height));
        });
    }

    fn write_pdf(data: *mut NSData, error: *mut NSError, path: &str) -> Result<(), String> {
        if !error.is_null() {
            let message = unsafe { &*error }.localizedDescription().to_string();
            return Err(format!("PDF export failed: {message}"));
        }
        if data.is_null() {
            return Err("PDF export returned no data.".into());
        }
        let bytes = unsafe { &*data }.to_vec();
        validate_pdf(&bytes)?;
        if let Some(parent) = std::path::Path::new(path).parent() {
            if !parent.as_os_str().is_empty() {
                fs::create_dir_all(parent).map_err(|e| e.to_string())?;
            }
        }
        fs::write(path, bytes).map_err(|e| e.to_string())
    }

    fn capture(id: u64, width: f64, height: f64) {
        let prepared = JOBS.with(|jobs| {
            jobs.borrow()
                .get(&id)
                .map(|job| (job.webview.clone(), job.pdf_path.clone(), job.app.clone()))
        });
        let Some((webview, path, app)) = prepared else {
            return;
        };
        let Some(mtm) = MainThreadMarker::new() else {
            return;
        };
        let config = unsafe { WKPDFConfiguration::new(mtm) };
        unsafe {
            config.setRect(CGRect::new(
                CGPoint::new(0.0, 0.0),
                CGSize::new(width, height),
            ));
        }
        let block = RcBlock::new(move |data: *mut NSData, error: *mut NSError| {
            let result = write_pdf(data, error, &path);
            // Leave the WebKit callback before releasing the view.
            let app = app.clone();
            std::thread::spawn(move || {
                let _ = app.run_on_main_thread(move || finish(id, result));
            });
        });
        unsafe { webview.createPDFWithConfiguration_completionHandler(Some(&config), &block) };
    }

    fn start(app: AppHandle, html: String, pdf_path: String, tx: Sender<Result<(), String>>) {
        let started = (|| -> Result<(), String> {
            let mtm = MainThreadMarker::new()
                .ok_or_else(|| "PDF export must run on the main thread".to_string())?;
            let window: Retained<NSWindow> = unsafe {
                NSWindow::initWithContentRect_styleMask_backing_defer(
                    NSWindow::alloc(mtm),
                    offscreen_frame(PDF_MIN_W, PDF_MIN_H),
                    NSWindowStyleMask::Borderless,
                    NSBackingStoreType::Buffered,
                    false,
                )
            };
            window.setTitle(&NSString::from_str("npp-x Export PDF"));
            unsafe { window.setReleasedWhenClosed(false) };
            window.setIgnoresMouseEvents(true);
            window.setAlphaValue(0.01);
            // Ordered so WebKit paints, but the frame sits entirely below the
            // desktop and ignores clicks. This does not make the window key.
            window.orderFrontRegardless();

            let config = unsafe { WKWebViewConfiguration::new(mtm) };
            let webview = unsafe {
                WKWebView::initWithFrame_configuration(
                    WKWebView::alloc(mtm),
                    CGRect::new(CGPoint::new(0.0, 0.0), CGSize::new(PDF_MIN_W, PDF_MIN_H)),
                    &config,
                )
            };
            window.setContentView(Some(&*webview));

            let html_ns = NSString::from_str(&html);
            let base = NSURL::URLWithString(&NSString::from_str("https://cdn.jsdelivr.net/"))
                .ok_or_else(|| "Invalid base URL".to_string())?;
            unsafe { webview.loadHTMLString_baseURL(&html_ns, Some(&base)) };

            let id = NEXT_ID.fetch_add(1, Ordering::Relaxed);
            let min_wait = super::min_layout_wait(&html);
            JOBS.with(|jobs| {
                jobs.borrow_mut().insert(
                    id,
                    PdfJob {
                        window,
                        webview,
                        pdf_path,
                        started: Instant::now(),
                        min_wait,
                        tx: tx.clone(),
                        app: app.clone(),
                    },
                );
            });
            arm(id);
            let app_timeout = app.clone();
            std::thread::spawn(move || {
                std::thread::sleep(std::time::Duration::from_secs(40));
                let _ = app_timeout.run_on_main_thread(move || {
                    finish(id, Err("PDF export timed out.".into()));
                });
            });
            Ok(())
        })();
        if let Err(err) = started {
            let _ = tx.send(Err(err));
        }
    }

    pub fn export_html_to_pdf(
        app: AppHandle,
        html: String,
        pdf_path: String,
    ) -> Result<(), String> {
        let (tx, rx) = std::sync::mpsc::channel();
        let app_main = app.clone();
        if let Err(err) = app.run_on_main_thread(move || start(app_main, html, pdf_path, tx)) {
            return Err(err.to_string());
        }
        match rx.recv_timeout(std::time::Duration::from_secs(50)) {
            Ok(result) => result,
            Err(std::sync::mpsc::RecvTimeoutError::Disconnected) => {
                Err("PDF export was interrupted.".into())
            }
            Err(std::sync::mpsc::RecvTimeoutError::Timeout) => Err("PDF export timed out.".into()),
        }
    }
}

#[cfg(target_os = "macos")]
#[tauri::command]
pub async fn export_html_to_pdf(app: AppHandle, html: String, path: String) -> Result<(), String> {
    // createPDF finishes on the main thread. Waiting there deadlocks.
    tauri::async_runtime::spawn_blocking(move || macos::export_html_to_pdf(app, html, path))
        .await
        .map_err(|err| err.to_string())?
}

#[cfg(not(target_os = "macos"))]
#[tauri::command]
pub async fn export_html_to_pdf(
    _app: AppHandle,
    _html: String,
    _path: String,
) -> Result<(), String> {
    Err("Native PDF export is implemented for macOS; use the print dialog on this platform.".into())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn size_falls_back_when_measurement_is_junk() {
        assert_eq!(parse_pdf_size(""), (PDF_MIN_W, PDF_MIN_H));
        assert_eq!(parse_pdf_size("nan,nan"), (PDF_MIN_W, PDF_MIN_H));
        assert_eq!(parse_pdf_size("10,10"), (PDF_MIN_W, PDF_MIN_H));
    }

    #[test]
    fn size_keeps_real_document_and_caps_runaway() {
        assert_eq!(parse_pdf_size("900,2400"), (900.0, 2400.0));
        assert_eq!(parse_pdf_size("9000,900000"), (PDF_MAX_W, PDF_MAX_H));
        assert_eq!(parse_pdf_size("2400"), (PDF_MIN_W, 2400.0));
    }

    #[test]
    fn pdf_bytes_need_a_header() {
        assert!(validate_pdf(b"%PDF-1.4\n").is_ok());
        assert!(validate_pdf(b"not a pdf").is_err());
        assert!(validate_pdf(b"%PDF").is_err());
    }

    #[test]
    fn mermaid_waits_longer_than_plain_html() {
        assert!(min_layout_wait("<p>hi</p>") < min_layout_wait("<div class='mermaid'>"));
        assert!(min_layout_wait("graph TD") < Duration::from_secs(1));
    }
}
