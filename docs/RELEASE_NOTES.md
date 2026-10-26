## npp-x 0.1.10

### Fixes
- **macOS ⌘Q** — Quit the app (N++ Ctrl+Q comment no longer steals it); comment is **⌃Q**
- **macOS Export PDF** — Wait for WKWebView load, force light print CSS, avoid blank white pages

### From 0.1.9
- Native Save dialog + AppKit print-to-PDF for Export Preview

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
