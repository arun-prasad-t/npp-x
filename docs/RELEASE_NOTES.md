## npp-x 0.1.9

### Fixes
- **macOS Export PDF** — JS `print()` is a no-op in WKWebView; desktop now uses a native Save dialog + AppKit print-to-PDF so a real `.pdf` file is written

### From 0.1.8
- Preview Light / Dark toggle · workers.dev asset deploy · download welcome every visit

### Downloads
| Platform | Asset |
|----------|--------|
| macOS Apple Silicon | `npp-x_*_aarch64.dmg` + `Open-npp-x.command` |
| macOS Intel | `npp-x_*_x64.dmg` + `Open-npp-x.command` |
| Windows x64 | `.msi` / `.exe` |
| Linux x64 | `.AppImage` / `.deb` |

### macOS (Gatekeeper)
Builds are **ad-hoc signed**. Use **Open-npp-x.command**, or:
`xattr -cr /Applications/npp-x.app && open /Applications/npp-x.app`

Guide: https://github.com/arun-prasad-t/npp-x/blob/main/docs/MACOS-OPEN.md
