# npp-x brand guidelines

## Concept

**Theme:** Cross-platform editor, N++ heritage, 2026 IDE honesty.  
**Promise:** Notepad++ muscle memory on Linux, macOS, and Windows.  
**Mood:** Precise, fast, familiar, no fluff — “the wait is over.”

## Positioning

> For developers who grew up on Notepad++, **npp-x** is the cross-platform desktop editor that keeps the N++ workflow while shipping a modern Monaco engine, theme/plugin stores, and first-class Mac & Linux builds — unlike classic N++ (Windows-first) or heavyweight IDEs that throw away the muscle memory.

## Voice

| Do | Don’t |
| --- | --- |
| Direct, technical, a little triumphant | Corporate buzzwords (“synergy”, “AI-powered” unless true) |
| Honest about reconstruction vs official N++ | Claim to be Notepad++ itself |
| Show proof (menus, shortcuts, platforms) | Vague “better editor” claims |

**10-second pitch:** The Mac & Linux Notepad++ people waited decades for.  
**30-second pitch:** npp-x brings Notepad++ muscle memory to Linux, macOS, and Windows with a modern Monaco core, native Tauri shell, and one-click theme/plugin installs from file or git — reconstructed from N++ 8.8.1, not a random clone.

## Color

| Role | Hex | Notes |
| --- | --- | --- |
| Slate (chrome) | `#0F172A` | Default dark shell |
| Run green (accent) | `#22C55E` | CTAs, caret, brand energy |
| Forest (logo plate) | `#15803D` | Logo fill — solid, flat |
| Ink on green | `#F0FDF4` / `#14532D` | Logo page / lines |
| Light chrome | `#F8FAFC` / `#16A34A` | Light themes |

No purple gradients. No cream+serif marketing look.

## Typography

- UI: **Plus Jakarta Sans**
- Editor: **JetBrains Mono** (Monaco)

## Logo

**File:** `public/logo.svg` (icon-only mark)

**Meaning**

- Bold lowercase **n** — notepad / npp lineage  
- Accent **x** — cross-platform (the “-x” in npp-x)  
- Forest plate `#15803D` + mint type — N++ green heritage, flat 2026 mark  

**Rejected earlier directions**

- Document + spark / document + X — looked like a generic notes app; X read as “close”  
- Double-ring plate — muddy under 32px  

**Rules**

- Prefer the SVG; no gradients or drop shadows (flat design).  
- Clear space ≥ 1/4 of mark height.  
- Minimum: **24px** icon; **32px** in chrome; always pair with the “npp-x” wordmark under ~20px.  
- Keep the green plate on light *and* dark marketing surfaces (don’t gray-invert).  
- Don’t stretch, rotate, or recolor outside the palette.  

**Optional next upgrades (if you want more punch later)**

1. Horizontal lockup: mark + “npp-x” wordmark in Plus Jakarta Sans Bold  
2. Regenerate Tauri `src-tauri/icons/*` from this SVG so installers match the chrome favicon  
3. Optional mascot *aside* from the app icon (chameleon is N++’s — we stay clear of copying it)

## Messaging pillars

1. **The wait is over** — Mac & Linux as first-class, not afterthoughts.  
2. **Muscle memory** — N++ menus & shortcuts, not a new religion.  
3. **Modern where it counts** — Monaco + stores + native packaging.  
4. **Honest lineage** — reconstructed from N++ 8.8.1; independent project.
