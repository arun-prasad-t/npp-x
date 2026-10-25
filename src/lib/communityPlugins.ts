/**
 * Optional community plugins — listed in Plugin Store, OFF by default.
 * JSON copies under community/examples/ for install-from-file / git demos.
 */
import type { PluginPackage } from "./plugins";

export const COMMUNITY_PLUGINS: PluginPackage[] = [
  {
    schema: "npp-x.plugin/1",
    id: "community.html-preview",
    name: "HTML Preview",
    author: "community",
    version: "1.0.0",
    description:
      "Optional: render the active buffer as HTML (sandboxed preview, CSS ok, scripts blocked).",
    contributes: {
      commands: [
        { id: "community.html.preview", title: "HTML: Preview" },
        { id: "community.html.previewClose", title: "HTML: Close Preview" },
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
    author: "community",
    version: "1.0.0",
    description:
      "Optional: parse CSV/TSV in the active buffer and show a table preview.",
    contributes: {
      commands: [
        { id: "community.csv.table", title: "CSV: Table Preview" },
        { id: "community.csv.tableClose", title: "CSV: Close Preview" },
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
];
