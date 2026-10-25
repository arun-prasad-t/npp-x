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
  {
    schema: "npp-x.plugin/1",
    id: "community.youtube-dock",
    name: "YouTube While Typing",
    author: "community",
    version: "1.0.0",
    description:
      "Fun optional dock: paste a YouTube URL and keep a mini player under the editor while you work.",
    contributes: {
      commands: [
        { id: "community.yt.open", title: "YouTube: Play in bottom dock…" },
        { id: "community.yt.close", title: "YouTube: Close dock" },
      ],
      menus: { tools: ["community.yt.open", "community.yt.close"] },
    },
    code: `
function extractId(input) {
  const s = (input || "").trim();
  if (!s) return null;
  if (/^[\\w-]{11}$/.test(s)) return s;
  try {
    const u = new URL(s);
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.split("/").filter(Boolean)[0];
      return id && id.length === 11 ? id : null;
    }
    const v = u.searchParams.get("v");
    if (v && /^[\\w-]{11}$/.test(v)) return v;
    const m = u.pathname.match(/\\/(embed|shorts)\\/([\\w-]{11})/);
    if (m) return m[2];
  } catch (e) {}
  const loose = s.match(/(?:v=|youtu\\.be\\/|embed\\/|shorts\\/)([\\w-]{11})/);
  return loose ? loose[1] : null;
}
nppx.registerCommand("community.yt.open", () => {
  const raw = window.prompt("YouTube URL or video id:", "https://www.youtube.com/watch?v=");
  if (raw == null) return;
  const id = extractId(raw);
  if (!id) {
    nppx.notify("Could not parse a YouTube video id");
    return;
  }
  const html = "<!DOCTYPE html><html><head><meta charset=\\"utf-8\\"><style>"
    + "html,body{margin:0;height:100%;background:#0f172a;overflow:hidden}"
    + "iframe{border:0;width:100%;height:100%}"
    + "</style></head><body>"
    + "<iframe src=\\"https://www.youtube.com/embed/" + id + "?rel=0\\" title=\\"YouTube\\" "
    + "allow=\\"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share\\" "
    + "allowfullscreen></iframe>"
    + "</body></html>";
  nppx.openBottomDock({
    id: "community.yt",
    title: "YouTube — " + id,
    html: html,
    height: 220,
    allowScripts: true,
  });
  nppx.notify("YouTube dock open — type away");
});
nppx.registerCommand("community.yt.close", () => {
  nppx.closeBottomDock("community.yt");
});
`,
  },
  {
    schema: "npp-x.plugin/1",
    id: "community.type-runner",
    name: "Type Runner",
    author: "community",
    version: "1.0.0",
    description:
      "Fun optional dock: a little desert runner that speeds up with your typing (and naps when you stop).",
    contributes: {
      commands: [
        { id: "community.runner.start", title: "Type Runner: Start" },
        { id: "community.runner.stop", title: "Type Runner: Stop" },
      ],
      menus: { tools: ["community.runner.start", "community.runner.stop"] },
    },
    code: `
var unsub = null;
var lastPaint = 0;
function scene(cps, mood) {
  var dur = Math.max(0.18, 2.4 - Math.min(cps, 28) / 14);
  var dust = cps > 8 ? "1" : "0";
  var label = mood === "zoom" ? "ZOOM!" : mood === "nap" ? "zzz…" : "beep-beep";
  return "<!DOCTYPE html><html><head><meta charset=\\"utf-8\\"><style>"
    + "html,body{margin:0;height:100%;overflow:hidden;background:linear-gradient(#87ceeb 0 55%,#e8b86d 55% 70%,#c4956a 70% 100%)}"
    + ".sky{position:absolute;inset:0 0 45% 0}"
    + ".ground{position:absolute;left:0;right:0;bottom:0;height:45%;background:repeating-linear-gradient(90deg,#d2a679 0 12px,#c4956a 12px 24px)}"
    + ".cactus{position:absolute;bottom:42%;width:14px;height:36px;background:#2f7d32;border-radius:4px;animation:pan linear infinite;animation-duration:" + (dur * 3).toFixed(2) + "s}"
    + ".cactus:before,.cactus:after{content:\\"\\";position:absolute;background:#2f7d32;border-radius:4px}"
    + ".cactus:before{width:10px;height:14px;left:-10px;top:10px}"
    + ".cactus:after{width:10px;height:18px;right:-10px;top:6px}"
    + ".c1{left:10%;animation-delay:-0.2s}.c2{left:55%;height:48px;animation-delay:-1.1s}"
    + ".runner{position:absolute;bottom:46%;left:18%;font-size:28px;transform-origin:center bottom;"
    + "animation:runBob " + dur.toFixed(2) + "s ease-in-out infinite, dash " + (dur * 1.4).toFixed(2) + "s linear infinite}"
    + ".dust{position:absolute;bottom:46%;left:14%;width:40px;height:8px;border-radius:50%;background:rgba(120,80,40,.35);"
    + "opacity:" + dust + ";animation:dust " + dur.toFixed(2) + "s linear infinite}"
    + ".hud{position:absolute;top:8px;right:10px;font:600 12px ui-monospace,monospace;color:#0f172a;"
    + "background:rgba(255,255,255,.75);padding:4px 8px;border-radius:999px}"
    + "@keyframes runBob{0%,100%{transform:translateY(0) rotate(-4deg)}50%{transform:translateY(-6px) rotate(4deg)}}"
    + "@keyframes dash{0%{left:8%}100%{left:72%}}"
    + "@keyframes pan{0%{transform:translateX(110vw)}100%{transform:translateX(-20vw)}}"
    + "@keyframes dust{0%{transform:translateX(0);opacity:" + dust + "}100%{transform:translateX(-24px);opacity:0}}"
    + "</style></head><body><div class=\\"sky\\"></div><div class=\\"ground\\"></div>"
    + "<div class=\\"cactus c1\\"></div><div class=\\"cactus c2\\"></div>"
    + "<div class=\\"dust\\"></div><div class=\\"runner\\" aria-hidden=\\"true\\">🏃</div>"
    + "<div class=\\"hud\\">" + label + " · " + Math.round(cps) + " cps</div>"
    + "</body></html>";
}
function paint(cps) {
  var now = Date.now();
  if (now - lastPaint < 80) return;
  lastPaint = now;
  var mood = cps < 1.5 ? "nap" : cps > 14 ? "zoom" : "run";
  nppx.updateBottomDock("community.runner", {
    title: "Type Runner — " + Math.round(cps) + " cps",
    html: scene(cps, mood),
  });
}
nppx.registerCommand("community.runner.start", () => {
  if (unsub) unsub();
  nppx.openBottomDock({
    id: "community.runner",
    title: "Type Runner — ready",
    html: scene(0, "nap"),
    height: 120,
    allowScripts: false,
  });
  unsub = nppx.onTyping(function (ev) {
    var cps = ev.idleMs > 900 ? Math.max(0, ev.cps * 0.25) : ev.cps;
    paint(cps);
  });
  nppx.notify("Type Runner is watching your keys");
});
nppx.registerCommand("community.runner.stop", () => {
  if (unsub) { unsub(); unsub = null; }
  nppx.closeBottomDock("community.runner");
});
`,
  },
];
