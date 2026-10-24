# Contributing themes & plugins to npp-x

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
| `setActiveText(text)` | Replace active document |
| `insertText(text)` | Insert at cursor (best-effort) |
| `registerCommand(id, fn)` | Bind a contributed command |

Plugins run in a restricted `Function` sandbox with only the `nppx` argument. Treat third-party plugins like any untrusted code you choose to enable.

See `community/examples/plugin.trim-trailing.json`.

## Git repo layout (recommended)

```
nppx.package.json   # or theme.json / plugin.json
README.md
```

Point the installer at the repo URL or the raw file URL.

## PR / community

Open a PR that adds your package under `community/examples/` or link your repo in an issue. Bundled gallery slots may feature community packages after review.
