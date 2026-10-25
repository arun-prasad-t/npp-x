<p align="center">
  <img src="public/logo.svg" width="112" height="112" alt="npp-x — geometric nˣ on forest green" />
</p>

<h1 align="center">npp-x</h1>

<p align="center">
  <strong>The Mac &amp; Linux Notepad++ people asked for — for decades.</strong><br />
  Same muscle memory. Modern engine. Every major desktop OS.
</p>

<p align="center">
  <a href="https://github.com/arun-prasad-t/npp-x/releases"><img src="https://img.shields.io/github/v/release/arun-prasad-t/npp-x?style=flat-square&color=22C55E&label=download" alt="Latest release" /></a>
  <a href="https://github.com/arun-prasad-t/npp-x/actions/workflows/release.yml"><img src="https://img.shields.io/github/actions/workflow/status/arun-prasad-t/npp-x/release.yml?style=flat-square&label=release" alt="Release status" /></a>
  <img src="https://img.shields.io/badge/Linux%20·%20macOS%20·%20Windows-0F172A?style=flat-square" alt="Cross-platform" />
  <img src="https://img.shields.io/badge/Tauri_2-24C8DB?style=flat-square&logo=tauri&logoColor=white" alt="Tauri 2" />
  <img src="https://img.shields.io/badge/Monaco-007ACC?style=flat-square" alt="Monaco" />
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square" alt="MIT License" /></a>
</p>

<p align="center">
  <a href="https://npp-x.pages.dev"><strong>Try live → npp-x.pages.dev</strong></a>
</p>

<p align="center">
  <a href="https://github.com/arun-prasad-t/npp-x/releases">Download</a>
  ·
  <a href="https://npp-x.pages.dev">Live demo</a>
  ·
  <a href="#try-online">Host it yourself</a>
  ·
  <a href="#the-wait-is-over">The story</a>
  ·
  <a href="#why-npp-x">Why npp-x</a>
  ·
  <a href="#getting-started">Get started</a>
  ·
  <a href="CONTRIBUTING.md">Themes &amp; plugins</a>
  ·
  <a href="docs/REA-RECONSTRUCTION.md">How we reconstructed N++</a>
</p>

---

## The wait is over

Notepad++ became the default text editor for a generation of Windows developers — fast, honest, keyboard-first, no ceremony. And for just as long, Mac and Linux users lived with a shrug: *use something else*, or fire up Wine, or keep a Windows VM just to open a log file the way their fingers already know.

**npp-x** is that long-awaited cross-platform port — not a half-remembered clone, and not “VS Code with the menus renamed.” It’s a native desktop editor (**Tauri 2 + Rust + React + Monaco**) rebuilt from **Notepad++ 8.8.1** evidence: menus, shortcuts, macros, tools, and the workflows you already have in muscle memory — running on **Linux, macOS, and Windows**.

If you ever said *“I wish N++ just worked on my Mac / Fedora box,”* this is that wish, shipped.

> [!NOTE]
> npp-x is **inspired by and reconstructed from** Notepad++ — it is **not** an official Don Ho / Notepad++ project. Where behavior still differs, we’re closing the gap in the open.

---

## Why npp-x

| | Classic Notepad++ | **npp-x** |
| --- | --- | --- |
| **Platforms** | Windows-first | **Linux · macOS · Windows** as equals |
| **Engine** | Scintilla | **Monaco** — modern highlighting, multi-cursor DNA |
| **Shell** | Win32 UI | **Native Tauri** window + OS dialogs / FS |
| **Themes** | Style Configurator + community packs | **Theme Store** — install from **file or git URL** |
| **Plugins** | Native DLL plugins (Windows ABI) | **Plugin Store** — portable JSON/git packages everywhere |
| **Extensibility** | C++ / NPP plugin API | Lightweight **`nppx` host API** + sandboxed contributions |
| **Design** | Classic Win32 chrome | **2026 dense IDE chrome** — slate `#0F172A` + run-green `#22C55E` |
| **Lineage** | Closed source core | Reconstruction notes from **REA** on N++ 8.8.1 |

### What we deliberately do better

1. **Truly cross-platform** — one app identity, three OSes; no “Linux someday.”
2. **Stores, not scavenger hunts** — themes and plugins from a file or a git URL.
3. **Familiar N++ surface** — File / Edit / Search / View / Encoding / Language / Settings / Tools / Macro / Run / Plugins, shaped from real N++ menus & shortcuts.
4. **Modern editor core** — Monaco instead of fighting Scintilla packaging on every Unix.
5. **Ship-ready packaging** — GitHub Actions for Apple Silicon, Intel Mac, Windows x64, Linux x64 — plus **auto-update** from Releases.
6. **Open contribution path** — JSON theme/plugin packages anyone can publish.

---

## Highlights

| Feature | Why it matters |
| --- | --- |
| **Session restore** | Open 100 files, edit freely, **don’t hit Save** — quit and come back: every tab and unsaved buffer is still there. |
| **Per-tab undo** | Each document keeps its own undo stack — like N++, not one global history. |
| **Find & Replace** | N++-grade: Normal / Extended / Regex, Count, Find All, Mark, Replace All in open docs. |
| **Diff tabs** | Top **Diff** menu → Compare Tabs or Clipboard — opens a real tab, not a stuck overlay. |
| **HTML / CSV / Markdown preview** | On by default. **Split** with the editor first; **Full** when you want. Mermaid in Markdown. |
| **Export PDF** | From any preview (HTML, CSV table, MD + diagrams) — print dialog → Save as PDF. No extra apps. |
| **Quick preview** | Paste HTML / MD / CSV into a buffer → one-click **Open preview** chip. |
| **Open with npp-x** | Desktop registers `.txt` `.csv` `.html` `.md` — make it your default opener in the OS. |
| **Theme & Plugin stores** | Install from **file or git URL** in one click. |
| **Auto-update + notes** | Help → Check for Updates shows the full release notes; About ships the brand story. |
| **Optional fun plugins** | YouTube corner PiP + Type Runner buddy (draggable; off by default). |
| **2026 chrome** | Dense slate IDE UI, Plus Jakarta Sans, run-green accent, click-stable menus. |

### What’s new in 0.1.6

- Find / Replace / Mark dialog (REA-backed from N++ 8.8.1)
- Markdown preview with Mermaid; split/full layout for all previews
- Export Preview as PDF; file associations for text / CSV / HTML / Markdown
- Diff as a top-level menu + dedicated tab
- YouTube PiP no longer steals shortcuts; companions are freely movable
- Stronger About + update dialog with release notes

Full notes: [docs/RELEASE_NOTES.md](docs/RELEASE_NOTES.md).

> [!TIP]
> Session restore is **on by default**. Desktop survives quit/relaunch; the browser host uses `localStorage` + IndexedDB (large unsaved buffers can use noticeable storage). Toggle anytime: Settings → *Remember session for next launch*.

---

## Brand

**npp-x** — Notepad++ muscle memory, everywhere you actually work.

| Signal | Spec |
| --- | --- |
| Accent | Run-green `#22C55E` on slate `#0F172A` |
| Logo plate | Forest `#15803D` — flat **nˣ** mark (`public/logo.svg`) |
| Type | UI: **Plus Jakarta Sans** · Editor: **JetBrains Mono** |
| Mood | Precise, fast, familiar, no fluff |

The mark is a bold lowercase **n** (notepad / N++ lineage) plus an accent **x** (cross-platform). Keep the green plate on light and dark surfaces — don’t gray-invert, stretch, or recolor outside the palette.

Full voice, messaging pillars, and logo rules: [docs/brand-guidelines.md](docs/brand-guidelines.md).

---

## Try online

**Live site:** [https://npp-x.pages.dev](https://npp-x.pages.dev) — menus, Monaco, HTML/CSV/Markdown preview, Diff tabs, Find & Replace, PDF export via print, and session restore (no native FS / Open-with in the browser).

**Host your own copy on Cloudflare Pages (free):**

1. [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Workers & Pages** → Create → Connect this GitHub repo  
2. Settings → Builds (new Workers & Pages UI has **no** “Build output directory” field — that comes from `wrangler.toml`):
   - **Root directory:** empty
   - **Build command:** `npm run build`
   - **Deploy command:** empty (do **not** use `wrangler deploy`)
   - Output dir is already set in-repo: `pages_build_output_dir = "./dist"`
3. Or CLI: `npm run build && npx wrangler pages deploy dist`
4. If the API token banner says unavailable, recreate the project build token under Settings → Builds → API token

First visit opens an **Online mode** branding dialog with Download + Continue in browser. Reopen anytime: Help → Download desktop…

> Official deploy for this repo: [`npp-x.pages.dev`](https://npp-x.pages.dev). Point a custom domain in Cloudflare if you want.

## Getting started

### Download

Grab the latest build from **[Releases](https://github.com/arun-prasad-t/npp-x/releases)**:

| Platform | Asset |
| --- | --- |
| macOS Apple Silicon | `npp-x_*_aarch64.dmg` |
| macOS Intel | `npp-x_*_x64.dmg` |
| Windows x64 | `.msi` / `.exe` |
| Linux x64 | `.AppImage` / `.deb` |

> [!IMPORTANT]
> **macOS (Sequoia / 15+):** builds are ad-hoc signed, not Apple-notarized. Control-click → Open **no longer** bypasses Gatekeeper.
>
> 1. Drag `npp-x.app` into **Applications**, double-click once → **Done** / **Cancel** (not Trash).
> 2. **System Settings → Privacy & Security** → scroll to the bottom → **Open Anyway**.
> 3. Or Terminal: `xattr -cr /Applications/npp-x.app && open /Applications/npp-x.app`
>
> Full guide: [docs/MACOS-OPEN.md](docs/MACOS-OPEN.md). Releases also ship `Open-npp-x.command`.

### Run from source

**Prerequisites:** Node.js 20+, Rust stable. Linux needs WebKitGTK ([Tauri prerequisites](https://tauri.app/start/prerequisites/)).

```bash
git clone https://github.com/arun-prasad-t/npp-x.git
cd npp-x
npm install
npm run tauri dev
```

Frontend-only (no native FS):

```bash
npm run dev
```

| Command | Purpose |
| --- | --- |
| `npm run tauri dev` | Full desktop app |
| `npm run build` | Typecheck + frontend bundle |
| `npm run tauri build` | Local package for current OS |

CI ships all platforms on a `v*` tag or **Actions → Release**. Updater details: [docs/UPDATES.md](docs/UPDATES.md).

---

## Docs

| Doc | Topic |
| --- | --- |
| [docs/brand-guidelines.md](docs/brand-guidelines.md) | Voice, color, logo rules |
| [docs/MACOS-OPEN.md](docs/MACOS-OPEN.md) | Gatekeeper / Sequoia |
| [docs/UPDATES.md](docs/UPDATES.md) | GitHub Releases auto-updater |
| [docs/REA-RECONSTRUCTION.md](docs/REA-RECONSTRUCTION.md) | How N++ 8.8.1 informed the UI |
| [design-system/npp-x/MASTER.md](design-system/npp-x/MASTER.md) | UI tokens |
| [CONTRIBUTING.md](CONTRIBUTING.md) | PRs, themes, plugins |
| [SECURITY.md](SECURITY.md) | Vulnerability reporting |

**CODEOWNER:** [@arun-prasad-t](https://github.com/arun-prasad-t)

---

## FAQ

**Is this official Notepad++?**  
No. Independent MIT project. Notepad++ is a trademark of its respective owners.

**Why Monaco instead of Scintilla?**  
Cross-platform packaging and a modern editor core without fighting Scintilla on every Unix — while keeping the N++ *surface* familiar.

**Does session restore work in the browser?**  
Yes — via `localStorage` / IndexedDB. Turn it off in Settings if you want a clean slate.

**How do updates work?**  
Desktop builds check Releases after launch. **Help → Check for Updates** always shows the latest release notes (and offers install when you’re behind). Browser host shows the same notes and links to Downloads.

**Can I open `.md` / `.csv` / `.html` by double-click?**  
Yes on desktop installs — set npp-x as the default app (Help → *File types & default app…*). Then use the preview chip or Plugins menu; Export PDF from the preview toolbar.

Still stuck? Check [troubleshooting](#troubleshooting) or [open an issue](https://github.com/arun-prasad-t/npp-x/issues).

### Troubleshooting

| Symptom | Fix |
| --- | --- |
| macOS blocks the app | [docs/MACOS-OPEN.md](docs/MACOS-OPEN.md) |
| Linux WebKit build fail | [Tauri Linux prerequisites](https://tauri.app/start/prerequisites/) |
| Updater finds nothing | Need a newer desktop Release with `latest.json` |
