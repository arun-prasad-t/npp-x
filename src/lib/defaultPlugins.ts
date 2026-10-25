/**
 * Default plugins shipped with Notepad++ 8.8.1 portable (REA artifact):
 * mimeTools, NppConverter, NppExport — plus HTML Preview and CSV Table View.
 */
import type { PluginPackage } from "./plugins";

export const DEFAULT_PLUGINS: PluginPackage[] = [
  {
    schema: "npp-x.plugin/1",
    id: "npp.mimeTools",
    name: "Mime tools",
    author: "npp-x (from N++ mimeTools)",
    version: "1.0.0",
    description: "Base64 encode/decode selection (N++ default plugin).",
    contributes: {
      commands: [
        { id: "mime.base64.encode", title: "Base64 Encode" },
        { id: "mime.base64.decode", title: "Base64 Decode" },
      ],
      menus: { tools: ["mime.base64.encode", "mime.base64.decode"] },
    },
    code: `
nppx.registerCommand("mime.base64.encode", () => {
  const t = nppx.getActiveText();
  try {
    nppx.setActiveText(btoa(unescape(encodeURIComponent(t))));
    nppx.notify("Base64 encoded");
  } catch (e) { nppx.notify("Base64 encode failed"); }
});
nppx.registerCommand("mime.base64.decode", () => {
  const t = nppx.getActiveText().trim();
  try {
    nppx.setActiveText(decodeURIComponent(escape(atob(t))));
    nppx.notify("Base64 decoded");
  } catch (e) { nppx.notify("Base64 decode failed"); }
});
`,
  },
  {
    schema: "npp-x.plugin/1",
    id: "npp.converter",
    name: "Converter",
    author: "npp-x (from N++ NppConverter)",
    version: "1.0.0",
    description: "ASCII ↔ Hex conversion (N++ default plugin).",
    contributes: {
      commands: [
        { id: "conv.ascii2hex", title: "ASCII to Hex" },
        { id: "conv.hex2ascii", title: "Hex to ASCII" },
      ],
      menus: { tools: ["conv.ascii2hex", "conv.hex2ascii"] },
    },
    code: `
nppx.registerCommand("conv.ascii2hex", () => {
  const t = nppx.getActiveText();
  const hex = Array.from(t).map(c => c.charCodeAt(0).toString(16).padStart(2,"0")).join(" ");
  nppx.setActiveText(hex);
  nppx.notify("Converted to hex");
});
nppx.registerCommand("conv.hex2ascii", () => {
  const parts = nppx.getActiveText().trim().split(/\\s+/).filter(Boolean);
  try {
    nppx.setActiveText(parts.map(h => String.fromCharCode(parseInt(h,16))).join(""));
    nppx.notify("Converted to ASCII");
  } catch (e) { nppx.notify("Hex convert failed"); }
});
`,
  },
  {
    schema: "npp-x.plugin/1",
    id: "npp.export",
    name: "NppExport",
    author: "npp-x (from N++ NppExport)",
    version: "1.0.0",
    description: "Export document as HTML (N++ default plugin).",
    contributes: {
      commands: [
        { id: "export.html", title: "Export to HTML" },
      ],
      menus: { tools: ["export.html"] },
    },
    code: `
nppx.registerCommand("export.html", () => {
  const body = nppx.getActiveText()
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const html = "<!DOCTYPE html><html><head><meta charset=\\"utf-8\\"><title>export</title></head><body><pre>"+body+"</pre></body></html>";
  nppx.setActiveText(html);
  nppx.notify("Exported as HTML in buffer — Save As to keep");
});
`,
  },
  {
    schema: "npp-x.plugin/1",
    id: "community.html-preview",
    name: "HTML Preview",
    author: "npp-x",
    version: "1.0.0",
    description:
      "Render the active buffer as HTML (sandboxed preview, CSS ok, scripts blocked). Enabled by default.",
    contributes: {
      commands: [
        { id: "community.html.preview", title: "Preview" },
        { id: "community.html.previewClose", title: "Close Preview" },
      ],
      menus: {
        tools: ["community.html.preview", "community.html.previewClose"],
      },
    },
    code: `
nppx.registerCommand("community.html.preview", () => {
  const raw = nppx.getActiveText();
  if (!raw.trim()) {
    nppx.notify("Nothing to preview");
    return;
  }
  nppx.openPreview({
    title: "HTML Preview — " + (nppx.getActiveFileName() || "untitled"),
    html: raw,
  });
});
nppx.registerCommand("community.html.previewClose", () => {
  nppx.closePreview();
});
`,
  },
  {
    schema: "npp-x.plugin/1",
    id: "community.csv-table",
    name: "CSV Table View",
    author: "npp-x",
    version: "1.0.0",
    description:
      "Parse CSV/TSV in the active buffer as a table preview. Enabled by default.",
    contributes: {
      commands: [
        { id: "community.csv.table", title: "Table Preview" },
        { id: "community.csv.tableClose", title: "Close Preview" },
      ],
      menus: {
        tools: ["community.csv.table", "community.csv.tableClose"],
      },
    },
    code: `
function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let i = 0;
  let q = false;
  const s = text.replace(/^\\uFEFF/, "");
  while (i < s.length) {
    const c = s[i];
    if (q) {
      if (c === '"') {
        if (s[i + 1] === '"') { cell += '"'; i += 2; continue; }
        q = false; i++; continue;
      }
      cell += c; i++; continue;
    }
    if (c === '"') { q = true; i++; continue; }
    if (c === "," || c === "\\t") { row.push(cell); cell = ""; i++; continue; }
    if (c === "\\n" || c === "\\r") {
      if (c === "\\r" && s[i + 1] === "\\n") i++;
      row.push(cell); cell = "";
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = []; i++; continue;
    }
    cell += c; i++;
  }
  row.push(cell);
  if (row.length > 1 || row[0] !== "") rows.push(row);
  return rows;
}
function esc(t) {
  return String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
nppx.registerCommand("community.csv.table", () => {
  const raw = nppx.getActiveText();
  if (!raw.trim()) { nppx.notify("Empty buffer"); return; }
  const rows = parseCsv(raw);
  if (!rows.length) { nppx.notify("No CSV rows found"); return; }
  const header = rows[0];
  const body = rows.slice(1);
  let thead = "<tr>" + header.map(h => "<th>" + esc(h) + "</th>").join("") + "</tr>";
  let tbody = body.map(r => {
    const cells = header.map((_, i) => "<td>" + esc(r[i] ?? "") + "</td>").join("");
    return "<tr>" + cells + "</tr>";
  }).join("");
  const html = "<!DOCTYPE html><html><head><meta charset=\\"utf-8\\"><style>"
    + "body{font:13px/1.4 system-ui,sans-serif;margin:12px;background:#0f172a;color:#e2e8f0}"
    + "table{border-collapse:collapse;width:100%}"
    + "th,td{border:1px solid #334155;padding:6px 10px;text-align:left}"
    + "th{background:#1e293b;position:sticky;top:0}"
    + "tr:nth-child(even) td{background:#1e293b88}"
    + "caption{text-align:left;margin-bottom:8px;color:#94a3b8}"
    + "</style></head><body>"
    + "<caption>" + esc(nppx.getActiveFileName() || "CSV") + " — " + rows.length + " rows</caption>"
    + "<table><thead>" + thead + "</thead><tbody>" + tbody + "</tbody></table>"
    + "</body></html>";
  nppx.openPreview({ title: "CSV Table — " + (nppx.getActiveFileName() || "untitled"), html });
});
nppx.registerCommand("community.csv.tableClose", () => {
  nppx.closePreview();
});
`,
  },
  {
    schema: "npp-x.plugin/1",
    id: "community.md-preview",
    name: "Markdown Preview",
    author: "npp-x",
    version: "1.0.0",
    description:
      "GFM Markdown preview with Mermaid diagrams (flow, sequence, class, state, …). Enabled by default.",
    contributes: {
      commands: [
        { id: "community.md.preview", title: "Preview" },
        { id: "community.md.previewClose", title: "Close Preview" },
      ],
      menus: {
        tools: ["community.md.preview", "community.md.previewClose"],
      },
    },
    code: `
nppx.registerCommand("community.md.preview", () => {
  const raw = nppx.getActiveText();
  if (!raw.trim()) {
    nppx.notify("Nothing to preview");
    return;
  }
  nppx.openPreview({
    title: "Markdown — " + (nppx.getActiveFileName() || "untitled"),
    html: raw,
    mode: "markdown",
    allowScripts: true,
  });
});
nppx.registerCommand("community.md.previewClose", () => {
  nppx.closePreview();
});
`,
  },
];
