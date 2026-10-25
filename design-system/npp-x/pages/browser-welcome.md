# Page Override: Browser welcome (Online mode)

> Overrides `MASTER.md` for the Cloudflare Pages / browser-host entry dialog only.

**Route / surface:** First visit dialog + always-on download strip above the menu bar; Help → Download desktop…

## Purpose

Brand-first try-before-download. Always-visible light bar for Download; one-shot Online mode dialog on first visit. Not a separate marketing landing.

## Layout

- One composition: logo plate (56px) + **npp-x** wordmark as hero signal
- Eyebrow: “Online mode” (accent, uppercase)
- One headline (10-second brand pitch)
- One supporting sentence (desktop = native FS)
- CTA group: primary Download · secondary Continue in browser
- Honesty line (not official Notepad++)

## Tokens

Use app chrome tokens (`--npp-*`), not MASTER IBM Plex. Brand type: **Plus Jakarta Sans**. Accent `#22C55E` on slate. Logo keeps forest plate `#15803D`.

## Motion

Reuse `toast-in` (~180ms). Honor `prefers-reduced-motion` via existing global rules.

## A11y

`role="dialog"` + `aria-labelledby`; Escape dismisses; focus primary CTA on open; 44px min hit targets; visible `:focus-visible` ring.
