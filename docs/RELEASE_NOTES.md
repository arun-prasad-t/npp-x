## npp-x 0.1.12

### What's new
- **macOS PDF pagination** — Long Markdown / Mermaid previews slice into A4 pages after render finishes (no 2-page crush)
- **PDF filename** — Export defaults to the active tab name (`notes.md` → `notes.pdf`)
- **Preview Copy (CSV / MD / HTML)** — Select cells or click **Copy** to paste styled tables/content into Teams or Word
- **Split Diff view** — Direct **Base ⇄ Target** dropdowns (any tab or Clipboard) + Split/Inline toggle; no prompt popups

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
