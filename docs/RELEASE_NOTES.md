## npp-x 0.1.7

### Fixes
- **Export PDF on desktop** — no more “pop-ups blocked”; print dialog opens from a hidden iframe

### Site / discoverability
- Stronger SEO metadata for Markdown preview, MD/HTML/CSV → PDF, Diff check, Find & Replace
- `robots.txt` + `sitemap.xml` on https://npp-x.pages.dev

### Still in 0.1.6+
- N++-style Find & Replace; Diff tabs; HTML / CSV / Markdown+Mermaid previews (split/full)
- Export Preview as PDF; Open-with for `.txt` `.csv` `.html` `.md`
- Auto-update notes; YouTube PiP + Type Runner (optional)

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
