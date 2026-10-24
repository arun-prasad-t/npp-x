<p align="center">
  <img src="public/logo.svg" width="96" height="96" alt="npp-x" />
</p>

<h1 align="center">npp-x</h1>

<p align="center">
  <strong>The Mac &amp; Linux Notepad++ people asked for — for decades.</strong><br />
  Same muscle memory. Modern engine. Every major desktop OS.
</p>

<p align="center">
  <a href="https://github.com/arun-prasad-t/npp-x/releases">Download</a>
  ·
  <a href="CONTRIBUTING.md">Themes &amp; plugins</a>
  ·
  <a href="docs/REA-RECONSTRUCTION.md">How we reconstructed N++</a>
</p>

---

## The wait is over

Notepad++ became the default text editor for a generation of Windows developers — fast, honest, keyboard-first, no ceremony. And for just as long, Mac and Linux users lived with a shrug: *use something else*, or fire up Wine, or keep a Windows VM just to open a log file the way their fingers already know.

**npp-x** is that long-awaited cross-platform port — not a half-remembered clone, and not “VS Code with the menus renamed.” It’s a native desktop editor (Tauri 2 + Rust + React + Monaco) rebuilt from **Notepad++ 8.8.1** evidence: menus, shortcuts, macros, tools, and the workflows you already have in muscle memory — running on **Linux, macOS, and Windows**.

If you ever said *“I wish N++ just worked on my Mac / Fedora box,”* this is that wish, shipped.

---

## Why npp-x instead of classic Notepad++?

| | Classic Notepad++ | **npp-x** |
| --- | --- | --- |
| **Platforms** | Windows-first | **Linux · macOS · Windows** as equals |
| **Engine** | Scintilla (great, aging stack) | **Monaco** — modern highlighting, multi-cursor DNA, web-native rendering |
| **Shell** | Win32 UI | **Native Tauri** window + OS dialogs / FS |
| **Themes** | Style Configurator + community packs | **Theme Store** — install from **file or git URL** in one click |
| **Plugins** | Native DLL plugins (Windows ABI) | **Plugin Store** — portable JSON/git packages, same install story everywhere |
| **Extensibility** | C++ / NPP plugin API | Lightweight **`nppx` host API** + sandboxed contributions |
| **Design** | Classic Win32 chrome | **2026 dense IDE chrome** — slate + run-green, accessible focus, reduced-motion |
| **Rebuild story** | Closed source core | Reconstruction notes from **REA** on shipped N++ 8.8.1 artifacts |

### Things we deliberately do better

1. **Truly cross-platform** — one app identity, three OSes; no “Linux someday.”
2. **Stores, not scavenger hunts** — themes and plugins install from a file or a git URL without hunting obscure zip mirrors.
3. **Familiar N++ surface** — File / Edit / Search / View / Encoding / Language / Settings / Tools / Macro / Run / Plugins shaped from real N++ menus & shortcuts.
4. **Modern editor core** — Monaco instead of fighting Scintilla packaging on every Unix.
5. **Ship-ready packaging** — GitHub Actions release matrix for macOS (Apple Silicon + Intel), Windows x64, Linux x64.
6. **Open contribution path** — JSON theme/plugin packages anyone can publish; see [CONTRIBUTING.md](CONTRIBUTING.md).

> **Honesty check:** npp-x is **inspired by and reconstructed from** Notepad++ — it is **not** an official Don Ho / Notepad++ project. Where behavior still differs, we’re closing the gap in the open.

---

## What’s in v0.1

- Multi-tab documents · New / Open / Save / Save As / Close  
- Find & Replace · Encoding & Language menus · status bar (Ln / Col / Sel / encoding / language)  
- N++-shaped menus, shortcuts, macros & tools surface (reconstructed)  
- Built-in themes including **npp-x 2026** · Theme Store + Plugin Store  
- Default plugins parity targets: mimeTools / NppConverter / NppExport style contributions  

---

## Quick start

**Prerequisites:** Node.js 20+, Rust stable.  
Linux also needs WebKitGTK (see [Tauri Linux prerequisites](https://tauri.app/start/prerequisites/)).

```bash
git clone https://github.com/arun-prasad-t/npp-x.git
cd npp-x
npm install
npm run tauri dev
```

Frontend-only UI work (no native FS):

```bash
npm run dev
```

**Release builds** (CI): push a `v*` tag or run **Actions → Release**.

```bash
npm run tauri build   # local, current OS only
```

**macOS users:** Gatekeeper may block unsigned/ad-hoc downloads — see [docs/MACOS-OPEN.md](docs/MACOS-OPEN.md) (right-click → Open, or `xattr -cr`).

**App icons:** regenerate from the brand mark with `npx tauri icon branding/app-icon.png`.

---

## Brand in one line

**npp-x** — Notepad++ muscle memory, everywhere you actually work.

- Accent: run-green `#22C55E` on slate `#0F172A`  
- Mark: geometric **nˣ** on forest green — see `public/logo.svg`  
- Full voice & visual notes: [docs/brand-guidelines.md](docs/brand-guidelines.md)

---

## Docs

| Doc | Why |
| --- | --- |
| [CONTRIBUTING.md](CONTRIBUTING.md) | PRs, themes & plugins |
| [SECURITY.md](SECURITY.md) | Vulnerability reporting |
| [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) | Community standards |
| [docs/REA-RECONSTRUCTION.md](docs/REA-RECONSTRUCTION.md) | How N++ 8.8.1 informed the UI |
| [design-system/npp-x/MASTER.md](design-system/npp-x/MASTER.md) | UI tokens (ui-ux-pro-max) |

**CODEOWNER:** [@arun-prasad-t](https://github.com/arun-prasad-t)

---

## License & trademark

Licensed under the [MIT License](LICENSE).

Notepad++ is a trademark of its respective owners. npp-x is an independent project.
