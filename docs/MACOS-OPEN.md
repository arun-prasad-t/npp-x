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

When `APPLE_CERTIFICATE`, `APPLE_CERTIFICATE_PASSWORD`, `APPLE_ID`, `APPLE_PASSWORD` / app-specific password, and `APPLE_TEAM_ID` secrets are set on the repo, the Release workflow can sign + notarize. Until then, use Option A/B above.
