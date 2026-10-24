# npp-x

Cross-platform **Notepad++–inspired** desktop editor for **Linux, Windows, and macOS**.

Stack: **Tauri 2 + Rust + React + Monaco**, reconstructed from Notepad++ 8.8.1 shipped artifacts via **REA** (see [docs/REA-RECONSTRUCTION.md](docs/REA-RECONSTRUCTION.md)).

## Features (v1)

- Multi-tab documents
- New / Open / Save / Save As / Close (native dialogs in Tauri)
- Find & Replace
- Word wrap, light/dark chrome
- Status bar: line, column, selection length, encoding, language
- Syntax highlighting via Monaco (N++ language subset)

## Prerequisites

- Node.js 20+ (fnm/nvm fine)
- Rust stable (`rustup`)
- Linux Tauri deps (Nobara/Fedora):

```bash
sudo dnf install webkit2gtk4.1-devel gtk3-devel librsvg2-devel \
  dbus-devel openssl-devel curl wget file pkgconf-pkg-config
```

  See also [Tauri Linux prerequisites](https://tauri.app/start/prerequisites/).

## Develop

```bash
npm install
npm run tauri dev
```

Frontend-only (browser fallback for UI work without WebKit):

```bash
npm run dev
```

In the browser, Open/Save use the download/file-picker fallback; native FS requires `tauri dev`.

## Build

```bash
npm run tauri build
```

## Why not Next.js?

npp-x is a **native desktop** app. Rust handles file I/O and packaging; the webview hosts the editor UI. That matches Notepad++’s performance expectations far better than a web-server stack.
