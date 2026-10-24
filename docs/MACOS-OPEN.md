# Opening npp-x on macOS

Apple Gatekeeper blocks apps that are **not notarized** with an Apple Developer ID.  
npp-x’s free CI builds are **ad-hoc signed** (identity `-`) so they *can* run, but after a browser/GitHub download macOS still shows:

> “Apple could not verify … is free from malware”

That is **quarantine + missing notarization**, not a virus inside the app. Double-click alone will keep failing until you clear quarantine or use Right-click → Open once.

## Fix (one-time per install) — do this in order

1. Open the **`.dmg`**, drag **npp-x** into **Applications**.
2. Download **[Open-npp-x.command](https://github.com/arun-prasad-t/npp-x/releases/latest/download/Open-npp-x.command)** from the same release (or use the copy in the repo `scripts/`).
3. In Finder: right-click the `.command` → **Open** → **Open** (first time only).
4. It clears quarantine and launches the app. Later opens: normal double-click on `npp-x.app`.

### Option A — Finder only (no script)

1. Drag `npp-x.app` to **Applications**.
2. **Right-click** (Control-click) `npp-x.app` → **Open** → **Open**.
3. Later launches work with a normal double-click.

### Option B — Terminal

```bash
xattr -cr /Applications/npp-x.app
open /Applications/npp-x.app
```

## Notarized builds (silent open)

Needs a paid [Apple Developer](https://developer.apple.com/) account. After you have a Developer ID Application certificate:

1. Export a `.p12`, base64-encode it, store as repo secrets (`APPLE_CERTIFICATE`, `APPLE_CERTIFICATE_PASSWORD`, `APPLE_SIGNING_IDENTITY`, plus Apple ID / team for notarization).
2. Wire those **non-empty** env vars into `.github/workflows/release.yml` (empty `APPLE_CERTIFICATE=` makes Tauri try PKCS#12 import and **fail** the Mac jobs).
3. You can then remove or override `bundle.macOS.signingIdentity: "-"` in `tauri.conf.json`.

Until then, use Option A/B above.
