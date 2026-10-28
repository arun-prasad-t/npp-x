## npp-x 0.1.11

### Fixes
- **macOS Export PDF** — Export no longer freezes the app while writing the PDF
- **Release workflow** — Manual Actions version/tag now rewrites the app version before build (tag and binary match)

### From 0.1.10
- macOS ⌘Q quits (comment is ⌃Q) · PDF load wait / light print CSS

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
