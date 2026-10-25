# Auto-updates (GitHub Releases)

Desktop builds use [`tauri-plugin-updater`](https://v2.tauri.app/plugin/updater/) against:

`https://github.com/arun-prasad-t/npp-x/releases/latest/download/latest.json`

## User flow

1. App checks a few seconds after launch (Tauri only).
2. Or **Help → Check for Updates…**
3. **Help → Check for Updates…** always opens a dialog with the latest release notes (even when you’re already up to date).
4. If a newer version exists → **Download & Install** → relaunch.

Browser / static host cannot auto-install; the same dialog offers **View on GitHub**.

Release body text should match `src/lib/whatsNew.ts` / `docs/RELEASE_NOTES.md` so the updater and in-app UI stay aligned.

## Maintainer notes

| Secret | Purpose |
|--------|---------|
| `TAURI_SIGNING_PRIVATE_KEY` | Signs `.sig` artifacts in CI (never commit) |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | Optional; empty if key has no password |

Public key lives in `src-tauri/tauri.conf.json` → `plugins.updater.pubkey`.

`bundle.createUpdaterArtifacts: true` makes Tauri emit updater bundles + signatures.  
`tauri-action` with `includeUpdaterJson: true` uploads `latest.json` on each release.

If the private key is lost, generate a new pair and ship a **manual** reinstall — already-installed apps cannot verify new signatures.
