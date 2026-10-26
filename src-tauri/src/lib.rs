mod pdf_export;

use serde::Serialize;
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, Manager, State};

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FilePayload {
    pub path: String,
    pub name: String,
    pub content: String,
}

/// Paths delivered by the OS before (or after) the UI is ready.
struct PendingFiles(Mutex<Vec<String>>);

fn normalize_open_arg(raw: &str) -> Option<PathBuf> {
    if raw.starts_with('-') {
        return None;
    }
    let path = if let Some(rest) = raw.strip_prefix("file://") {
        // file:///C:/Users/... or file:///home/...
        let stripped = rest.trim_start_matches('/');
        if cfg!(windows) && stripped.chars().nth(1) == Some(':') {
            PathBuf::from(stripped)
        } else {
            PathBuf::from(format!("/{stripped}"))
        }
    } else {
        PathBuf::from(raw)
    };
    path.exists().then_some(path)
}

fn collect_cli_files() -> Vec<String> {
    std::env::args()
        .skip(1)
        .filter_map(|a| normalize_open_arg(&a))
        .map(|p| p.to_string_lossy().into_owned())
        .collect()
}

fn push_files(app: &AppHandle, paths: Vec<String>) {
    if paths.is_empty() {
        return;
    }
    if let Some(state) = app.try_state::<PendingFiles>() {
        if let Ok(mut guard) = state.0.lock() {
            guard.extend(paths.iter().cloned());
        }
    }
    let _ = app.emit("nppx-open-files", paths);
}

#[tauri::command]
fn take_pending_files(state: State<'_, PendingFiles>) -> Vec<String> {
    state.0.lock().map(|mut g| std::mem::take(&mut *g)).unwrap_or_default()
}

#[tauri::command]
fn read_text_file(path: String) -> Result<FilePayload, String> {
    let path_buf = PathBuf::from(&path);
    let content = fs::read_to_string(&path_buf).map_err(|e| e.to_string())?;
    let name = path_buf
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("untitled")
        .to_string();
    Ok(FilePayload {
        path,
        name,
        content,
    })
}

#[tauri::command]
fn write_text_file(path: String, content: String) -> Result<(), String> {
    if let Some(parent) = PathBuf::from(&path).parent() {
        if !parent.as_os_str().is_empty() {
            fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
    }
    fs::write(&path, content).map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let pending = collect_cli_files();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .manage(PendingFiles(Mutex::new(pending)))
        .setup(|app| {
            #[cfg(desktop)]
            {
                app.handle()
                    .plugin(tauri_plugin_updater::Builder::new().build())?;
                app.handle().plugin(tauri_plugin_process::init())?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            read_text_file,
            write_text_file,
            take_pending_files,
            pdf_export::export_html_to_pdf
        ])
        .build(tauri::generate_context!())
        .expect("error while building npp-x")
        .run(|app, event| {
            #[cfg(target_os = "macos")]
            if let tauri::RunEvent::Opened { urls } = event {
                let paths = urls
                    .into_iter()
                    .filter_map(|u| u.to_file_path().ok())
                    .map(|p| p.to_string_lossy().into_owned())
                    .collect::<Vec<_>>();
                push_files(&app, paths);
            }
            #[cfg(not(target_os = "macos"))]
            {
                let _ = (app, event);
            }
        });
}
