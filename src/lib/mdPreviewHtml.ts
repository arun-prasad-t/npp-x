import {
  mermaidThemeFor,
  type PreviewScheme,
  withPreviewScheme,
} from "./previewTheme";

/**
 * Markdown preview document with Mermaid (flowcharts, sequence, class, …).
 * Renders inside a sandboxed iframe with scripts allowed for diagram engines.
 */
export function buildMarkdownPreviewHtml(
  source: string,
  scheme: PreviewScheme = "dark",
): string {
  const payload = JSON.stringify(source);
  const mermaidTheme = mermaidThemeFor(scheme);
  const doc = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
*{box-sizing:border-box}
body{margin:0;padding:20px 24px 48px;font:15px/1.6 ui-sans-serif,system-ui,sans-serif;background:var(--pv-bg,#0f172a);color:var(--pv-fg,#e2e8f0)}
.wrap{max-width:920px;margin:0 auto}
h1,h2,h3,h4{line-height:1.25;margin:1.4em 0 .55em;letter-spacing:-.02em}
h1{font-size:1.75rem;border-bottom:1px solid var(--pv-border,#334155);padding-bottom:.35em}
h2{font-size:1.35rem;border-bottom:1px solid var(--pv-border,#334155);padding-bottom:.25em}
a{color:var(--pv-accent,#4ade80)}a:hover{color:var(--pv-accent-hover,#86efac)}
code{font-family:ui-monospace,"JetBrains Mono",Consolas,monospace;font-size:.9em;background:var(--pv-panel,#1e293b);padding:.12em .4em;border-radius:4px}
pre{background:var(--pv-panel,#1e293b);border:1px solid var(--pv-border,#334155);border-radius:10px;padding:14px 16px;overflow:auto}
pre code{background:none;padding:0}
blockquote{margin:1em 0;padding:.2em 1em;border-left:3px solid #22c55e;color:var(--pv-muted,#94a3b8)}
table{border-collapse:collapse;width:100%;margin:1em 0;font-size:.92em}
th,td{border:1px solid var(--pv-border,#334155);padding:8px 10px;text-align:left}
th{background:var(--pv-panel,#1e293b)}
tr:nth-child(even) td{background:color-mix(in srgb, var(--pv-panel,#1e293b) 40%, transparent)}
img{max-width:100%;border-radius:8px}
.mermaid{background:var(--pv-mermaid,#111827);border:1px solid var(--pv-border,#334155);border-radius:12px;padding:16px;margin:1.25em 0;text-align:center;overflow:auto}
.err{color:#b91c1c;background:#fef2f2;border:1px solid #fecaca;padding:10px 12px;border-radius:8px;font-size:13px}
.meta{font-size:12px;color:var(--pv-muted,#64748b);margin-bottom:18px}
hr{border:0;border-top:1px solid var(--pv-border,#334155);margin:2em 0}
@media print{
  body{background:#fff!important;color:#0f172a!important}
  .meta{display:none!important}
  a{color:#15803d!important}
  .mermaid,pre,table,img{break-inside:avoid}
  pre,code,th{background:#f1f5f9!important;color:inherit!important}
}
@page{margin:12mm}
</style>
</head><body><div class="wrap">
<p class="meta">Markdown · Mermaid diagrams enabled</p>
<div id="out"><p class="meta">Rendering…</p></div>
</div>
<script type="module">
const src = ${payload};
const out = document.getElementById("out");
function esc(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}
try {
  const [{ marked }, mermaidMod] = await Promise.all([
    import("https://cdn.jsdelivr.net/npm/marked@15.0.12/+esm"),
    import("https://cdn.jsdelivr.net/npm/mermaid@11.6.0/+esm"),
  ]);
  const mermaid = mermaidMod.default;
  mermaid.initialize({
    startOnLoad: false,
    theme: ${JSON.stringify(mermaidTheme)},
    securityLevel: "strict",
    fontFamily: "ui-sans-serif, system-ui, sans-serif",
  });
  const renderer = {
    code({ text, lang }) {
      const info = (lang || "").trim().toLowerCase();
      const diagram =
        info === "mermaid" ||
        info === "sequence" ||
        info === "sequencediagram" ||
        info.startsWith("mermaid");
      if (diagram) {
        return '<pre class="mermaid">' + esc(text) + "</pre>";
      }
      return "<pre><code class=\\"language-" + esc(info) + "\\">" + esc(text) + "</code></pre>";
    },
  };
  marked.use({ renderer, gfm: true, breaks: false });
  out.innerHTML = marked.parse(src || "*Empty document*");
  const nodes = out.querySelectorAll(".mermaid");
  if (nodes.length) await mermaid.run({ nodes });
} catch (e) {
  out.innerHTML = '<div class="err">Preview failed: ' + esc(e && e.message ? e.message : e) +
    "<br/>Check network access for Mermaid / marked CDNs.</div><pre>" + esc(src) + "</pre>";
}
</script>
</body></html>`;
  return withPreviewScheme(doc, scheme);
}
