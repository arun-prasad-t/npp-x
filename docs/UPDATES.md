# Auto-updates (GitHub Releases)

Desktop builds use [`tauri-plugin-updater`](https://v2.tauri.app/plugin/updater/) against:

`https://github.com/arun-prasad-t/npp-x/releases/latest/download/latest.json`

## User flow

1. App checks a few seconds after launch (Tauri only).
2. Or **Help → Check for Updates…**
3. If a newer version exists → confirm → download → install → relaunch.

Browser / static host cannot install updates; Help opens the Releases page instead.

## Maintainer notes

| Secret | Purpose |
|--------|---------|
| `TAURI_SIGNING_PRIVATE_KEY` | Signs `.sig` artifacts in CI (never commit) |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | Optional; empty if key has no password |

Public key lives in `src-tauri/tauri.conf.json` → `plugins.updater.pubkey`.

`bundle.createUpdaterArtifacts: true` makes Tauri emit updater bundles + signatures.  
`tauri-action` with `includeUpdaterJson: true` uploads `latest.json` on each release.

If the private key is lost, generate a new pair and ship a **manual** reinstall — already-installed apps cannot verify new signatures.
