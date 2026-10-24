# Opening npp-x on macOS

Free CI builds are **ad-hoc signed**, not Apple-notarized. Gatekeeper will block the first launch. That is expected.

**Important (macOS 15 Sequoia and later):**  
Control-click / right-click → **Open** **no longer bypasses** Gatekeeper. Use System Settings or Terminal below.

Pick the right DMG:

| Your Mac (`uname -m`) | Download |
|-----------------------|----------|
| `arm64` (Apple Silicon / M1–M4) | `npp-x_*_aarch64.dmg` |
| `x86_64` (Intel) | `npp-x_*_x64.dmg` |

---

## Method 1 — System Settings (Sequoia / recommended)

1. Drag `npp-x.app` from the DMG into **Applications**.
2. Double-click `npp-x.app`.
3. In the warning dialog, click **Done** or **Cancel** — **do not** click Move to Trash.
4. Open **Apple menu → System Settings → Privacy & Security**.
5. Scroll to the **bottom** of the pane.
6. Find *“npp-x was blocked to protect your Mac”* → click **Open Anyway**.
7. Unlock with password / Touch ID → confirm **Open**.

The **Open Anyway** button only appears for about an hour after a blocked launch. If it’s missing, double-click the app once more, click Done, then return to Privacy & Security.

After this succeeds once, normal double-click works for that install.

---

## Method 2 — Terminal (most reliable)

```bash
xattr -cr /Applications/npp-x.app
open /Applications/npp-x.app
```

Or download **Open-npp-x.command** from the same GitHub Release, then:

1. Right-click the `.command` → **Open** (scripts still allow this on many setups), **or**
2. In Terminal: `chmod +x ~/Downloads/Open-npp-x.command && ~/Downloads/Open-npp-x.command`

---

## Method 3 — Older macOS (Sonoma 14 and earlier)

1. Drag to Applications.
2. Control-click `npp-x.app` → **Open** → **Open**.

If that fails, use Method 1 or 2.

---

## Still won’t open?

1. Confirm architecture (`uname -m`) matches the DMG (see table above).
2. Try the `.app.tar.gz` from the release instead of the DMG: extract → move `npp-x.app` to Applications → Method 1 or 2.
3. Re-download the asset (corrupt downloads can look “damaged”).
4. Build locally: `npm install && npm run tauri build` (still may need Method 1 once).

---

## Notarized builds (silent double-click)

Needs a paid [Apple Developer](https://developer.apple.com/) account (~$99/year), Developer ID signing, and notarization in CI. Empty `APPLE_CERTIFICATE` secrets must not be passed to Tauri (they break Mac CI). See release workflow comments when you add real certs.
