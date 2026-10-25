# Contributing to npp-x

Thanks for helping. Maintainer / CODEOWNER: **[@arun-prasad-t](https://github.com/arun-prasad-t)**.

Please read [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). Security issues → [SECURITY.md](SECURITY.md) (not public issues).

## Pull requests

1. Fork and branch from `main`.
2. Keep PRs focused; fill out the PR template.
3. Don’t commit secrets, signing keys, or private REA / N++ binary dumps.
4. CODEOWNERS will request review from `@arun-prasad-t`.
5. `npm run build` should pass before you ask for merge.

---

# Themes & plugins

Anyone can ship a theme or plugin as a **JSON file** or a **public git repo**, then install it in **Theme Store** / **Plugin Store** via:

- **Install from file…** — pick a `.json` package
- **Install from URL** — paste a raw JSON URL or a GitHub link (`github.com/owner/repo` or `…/blob/main/theme.json`)

## Theme package (`npp-x.theme/1`)

```json
{
  "schema": "npp-x.theme/1",
  "id": "my-theme",
  "name": "My Theme",
  "author": "you",
  "version": "1.0.0",
  "description": "Short blurb",
  "chrome": {
    "--npp-chrome": "#111",
    "--npp-accent": "#8bc34a",
    "color-scheme": "dark"
  },
  "monaco": {
    "base": "vs-dark",
    "inherit": true,
    "rules": [],
    "colors": { "editor.background": "#111" }
  }
}
```

Chrome keys map to CSS variables on `:root`. Monaco fields follow Monaco’s `defineTheme` shape.

See `community/examples/theme.obsidian-ink.json`.

## Plugin package (`npp-x.plugin/1`)

```json
{
  "schema": "npp-x.plugin/1",
  "id": "my.plugin",
  "name": "My Plugin",
  "version": "1.0.0",
  "contributes": {
    "commands": [{ "id": "my.plugin.run", "title": "Run me" }],
    "menus": { "tools": ["my.plugin.run"] }
  },
  "code": "nppx.registerCommand(\"my.plugin.run\", () => { nppx.notify(\"hi\"); });"
}
```

### Host API (`nppx`)

| Method | Purpose |
| --- | --- |
| `notify(message)` | Toast / status message |
| `getActiveText()` | Active document text |
| `getActiveFileName()` | Active tab name |
| `getActiveLanguage()` | Language key (e.g. `html`, `csv`) |
| `setActiveText(text)` | Replace active document |
| `insertText(text)` | Insert at cursor (best-effort) |
| `openPreview({ title, html, allowScripts?, mode? })` | Preview pane (default **split** with editor; `mode: "markdown"` builds Mermaid-ready HTML) |
| `closePreview()` | Dismiss preview |
| `openBottomDock({ id, title, html, height?, allowScripts? })` | Panel under the editor (e.g. YouTube) |
| `updateBottomDock(id, patch)` | Update dock HTML / title / height |
| `closeBottomDock(id?)` | Close one dock, or all if `id` omitted |
| `openCompanion({ id, html, speech?, state?, width?, height?, allowMedia? })` | Corner buddy / PiP (`allowMedia` for YouTube embeds; default ~150×100) |
| `updateCompanion(id, { html?, speech?, state?, width?, height?, allowMedia? })` | `state` → `postMessage({ type: "nppx:companion", state })` — animate without reloading |
| `closeCompanion(id?)` | Dismiss buddy |
| `onTyping(handler)` | `{ cps, delta, idleMs }` on each edit; one handler per plugin; returns unsubscribe |
| `registerCommand(id, fn)` | Bind a contributed command |

Plugins run in a restricted `Function` sandbox with only the `nppx` argument. Treat third-party plugins like any untrusted code you choose to enable. Set `allowScripts: true` only when required (e.g. YouTube embed).

**Shipped enabled by default** (also under `community/examples/` for install-from-file demos):

- `plugin.html-preview.json` — HTML design preview (split / full)
- `plugin.csv-table.json` — CSV / TSV table render (split / full)
- `plugin.md-preview.json` — Markdown + Mermaid diagrams (sequence, flow, …)

**Optional fun plugins** (Plugin Store → enable; off by default):

- `plugin.youtube-dock.json` — corner YouTube PiP
- `plugin.type-runner.json` — typing-speed buddy
- `plugin.trim-trailing.json` — trim trailing spaces

## Git repo layout (recommended)

```
nppx.package.json   # or theme.json / plugin.json
README.md
```

Point the installer at the repo URL or the raw file URL.

## PR / community

Open a PR that adds your package under `community/examples/` or link your repo in an issue. Bundled gallery slots may feature community packages after review.
