# REA reconstruction notes — Notepad++ → npp-x

Target analyzed: **Notepad++ 8.8.1 portable x64**  
Artifact: `npp.8.8.1.portable.x64.zip`  
`notepad++.exe` SHA-256: `cca6091dce76e65bdd610cf1521b8e85b6aad8144aa629ddb11613183e3630e6`  
Format: PE32+ x86-64 GUI

## Evidence gathered (shipped-artifact)

| Source | What it established |
| --- | --- |
| REA `open_binary` on zip / exe | Package identity, PE kind, digest |
| REA `inspect_pe_resources` | PE resource tree present (icons/version/menu resources) |
| `localization/english.xml` | Exact main menus: File, Edit, Search, View, Encoding, Language, Settings, Tools, Macro, Run, Plugins, Window |
| Command IDs in english.xml | Core IDs: New `41001`, Open `41002`, Close `41003`, Save `41006`, Save As `41008`, Find `43001`, Replace `43003`, Word wrap `44022` |
| Package layout | themes/, langs.model.xml, stylers.model.xml, plugins/, autoCompletion/, functionList/ |

## Provider gaps (this host)

Deep native string/procedure analysis (`binary_overview`, `search_strings`) was **unavailable**: Ghidra / Hopper / IDA / Kuna not configured.  
Reconstruction for v1 therefore uses **config + localization surface**, not decompiled UI code.

Supporting host `strings` on the same PE (not a REA deep provider) still confirms the **Scintilla** edit engine (`ScintillaEditView`, `ScintillaContextMenu`, `ScintillaKeys`, OOM/error dialogs). npp-x uses **Monaco** as the cross-platform Scintilla stand-in for Win/macOS/Linux.

## v1 obligation slice (implemented)

| Obligation | N++ surface | npp-x owner |
| --- | --- | --- |
| Multi-document tabs | Tab bar / Window menu | `TabBar` + document store |
| File New/Open/Save/Save As/Close | File menu ids 41001–41008 | Rust `read_text_file` / `write_text_file` + dialogs |
| Find / Replace | Search 43001 / 43003 | `FindBar` + Monaco findMatches |
| Word wrap | View 44022 | Monaco `wordWrap` |
| Status Ln/Col/encoding/language | Status bar | `StatusBar` |
| Syntax languages | langs.model.xml subset | Monaco languages |

## Shortcuts & commands (v1.1)

| Source | Evidence |
| --- | --- |
| `Parameters.cpp` `winKeyDefs[]` (upstream v8.8.1) | Default accelerator table → `src/lib/npp/shortcuts.generated.json` (101 bound keys) |
| `menuCmdID.h` | Command IDs → `ids.generated.json` |
| `localization/english.xml` | Labels → `labels.generated.json` |
| Portable `plugins/` | Default plugins: **mimeTools**, **NppConverter**, **NppExport** → `src/lib/defaultPlugins.ts` |
| PE strings / classes | `MacroShortcut`, `PluginsAdminDlg`, `ScintillaKeyMap` corroborate macro/plugin/shortcut subsystems |

Settings → **Shortcut Mapper** lists the imported `winKeyDefs` map. Macro menu implements Start/Stop/Playback/Save/Multi-run against that command dispatcher.

## Deferred (later slices)

Folder as Workspace, Document Map, Function List, Column Mode, full stylers.model.xml import, session files, Plugins Admin network catalog.

## Re-run REA locally

Keep artifacts **outside** the repo (create-tauri-app `--force` wipes the tree):

```bash
mkdir -p ~/npp-x/rea-artifacts
curl -fsSL -o ~/npp-x/rea-artifacts/npp.zip \
  -L "https://github.com/notepad-plus-plus/notepad-plus-plus/releases/download/v8.8.1/npp.8.8.1.portable.x64.zip"
unzip -o ~/npp-x/rea-artifacts/npp.zip -d ~/npp-x/rea-artifacts/npp-portable
```

Then open `~/npp-x/rea-artifacts/npp-portable/notepad++.exe` with REA. For deep PE analysis, configure Ghidra (`GHIDRA_INSTALL_DIR`) or another provider.
