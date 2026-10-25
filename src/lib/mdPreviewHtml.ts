/**
 * Markdown preview document with Mermaid (flowcharts, sequence, class, …).
 * Renders inside a sandboxed iframe with scripts allowed for diagram engines.
 */
export function buildMarkdownPreviewHtml(source: string): string {
  const payload = JSON.stringify(source);
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
:root{color-scheme:dark}
*{box-sizing:border-box}
body{margin:0;padding:20px 24px 48px;font:15px/1.6 ui-sans-serif,system-ui,sans-serif;background:#0f172a;color:#e2e8f0}
.wrap{max-width:920px;margin:0 auto}
h1,h2,h3,h4{line-height:1.25;margin:1.4em 0 .55em;letter-spacing:-.02em}
h1{font-size:1.75rem;border-bottom:1px solid #334155;padding-bottom:.35em}
h2{font-size:1.35rem;border-bottom:1px solid #1e293b;padding-bottom:.25em}
a{color:#4ade80}a:hover{color:#86efac}
code{font-family:ui-monospace,"JetBrains Mono",Consolas,monospace;font-size:.9em;background:#1e293b;padding:.12em .4em;border-radius:4px}
pre{background:#1e293b;border:1px solid #334155;border-radius:10px;padding:14px 16px;overflow:auto}
pre code{background:none;padding:0}
blockquote{margin:1em 0;padding:.2em 1em;border-left:3px solid #22c55e;color:#94a3b8}
table{border-collapse:collapse;width:100%;margin:1em 0;font-size:.92em}
th,td{border:1px solid #334155;padding:8px 10px;text-align:left}
th{background:#1e293b}
tr:nth-child(even) td{background:#1e293b66}
img{max-width:100%;border-radius:8px}
.mermaid{background:#111827;border:1px solid #334155;border-radius:12px;padding:16px;margin:1.25em 0;text-align:center;overflow:auto}
.err{color:#fca5a5;background:#450a0a33;border:1px solid #7f1d1d;padding:10px 12px;border-radius:8px;font-size:13px}
.meta{font-size:12px;color:#64748b;margin-bottom:18px}
hr{border:0;border-top:1px solid #334155;margin:2em 0}
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
    theme: "dark",
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
}
