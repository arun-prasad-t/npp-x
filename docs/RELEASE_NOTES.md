## npp-x 0.1.8

### Previews
- **Light / Dark toggle** on the preview toolbar — defaults to the active npp-x theme (no more forced dark)

### Desktop
- **Export PDF** — print dialog via hidden iframe (no pop-up blocked)

### Live site (https://npp-x.npp-x.workers.dev)
- Canonical URL + SEO for Markdown preview, MD/HTML/CSV → PDF, Diff check
- Worker static assets deploy (`[assets]` in wrangler) so successful builds actually ship
- Plugin Store: demo packages under `/community/examples/`, store overlay above chrome

### Still with you
- N++-style Find & Replace · Diff tabs · HTML / CSV / Markdown+Mermaid split preview
- Open-with `.txt` `.csv` `.html` `.md` · auto-update notes · optional YouTube PiP / Type Runner

### Downloads
| Platform | Asset |
|----------|--------|
| macOS Apple Silicon | `npp-x_*_aarch64.dmg` + `Open-npp-x.command` |
| macOS Intel | `npp-x_*_x64.dmg` + `Open-npp-x.command` |
| Windows x64 | `.msi` / `.exe` |
| Linux x64 | `.AppImage` / `.deb` |

### macOS (Gatekeeper)
Builds are **ad-hoc signed** (not Apple-notarized). After install, use **Open-npp-x.command** from the release, or:
`xattr -cr /Applications/npp-x.app && open /Applications/npp-x.app`

Guide: https://github.com/arun-prasad-t/npp-x/blob/main/docs/MACOS-OPEN.md
