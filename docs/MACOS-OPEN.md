# Opening npp-x on macOS

Apple Gatekeeper blocks apps that are **not notarized** with an Apple Developer ID.  
npp-x’s free CI builds are **ad-hoc signed** (identity `-`) so they run, but macOS still shows:

> “Apple could not verify … is free from malware”

That is expected **without** a paid Apple Developer Program certificate + notarization (~$99/year). It is not a virus scan failure inside the app.

## Fix (one-time per install)

### Option A — Finder (easiest)

1. Open **Finder** → drag `npp-x.app` to **Applications** (if you haven’t).
2. **Right-click** (or Control-click) `npp-x.app` → **Open**.
3. Click **Open** in the dialog.
4. Later launches work with a normal double-click.

### Option B — Terminal (clears quarantine)

```bash
xattr -cr /Applications/npp-x.app
open /Applications/npp-x.app
```

Or download and double-click [`scripts/macos-open-npp-x.command`](../scripts/macos-open-npp-x.command) after installing the app.

## Notarized builds (silent open)

Needs a paid [Apple Developer](https://developer.apple.com/) account. After you have a Developer ID Application certificate:

1. Export a `.p12`, base64-encode it, store as repo secrets (`APPLE_CERTIFICATE`, `APPLE_CERTIFICATE_PASSWORD`, `APPLE_SIGNING_IDENTITY`, plus Apple ID / team for notarization).
2. Wire those **non-empty** env vars into `.github/workflows/release.yml` (empty `APPLE_CERTIFICATE=` makes Tauri try PKCS#12 import and **fail** the Mac jobs).
3. You can then remove or override `bundle.macOS.signingIdentity: "-"` in `tauri.conf.json`.

Until then, use Option A/B above.
