/**
 * Optional community fun plugins — listed in Plugin Store, OFF by default.
 * HTML Preview and CSV Table ship as default plugins (see defaultPlugins.ts).
 * JSON copies under community/examples/ for install-from-file / git demos.
 */
import type { PluginPackage } from "./plugins";
import { ROAD_RUNNER_HTML } from "./roadRunnerBuddy";

export const COMMUNITY_PLUGINS: PluginPackage[] = [
  {
    schema: "npp-x.plugin/1",
    id: "community.youtube-dock",
    name: "YouTube While Typing",
    author: "community",
    version: "1.1.1",
    description:
      "Corner picture-in-picture YouTube player — paste a URL and keep watching while you type (doesn't steal editor shortcuts).",
    contributes: {
      commands: [
        { id: "community.yt.open", title: "Play in corner…" },
        { id: "community.yt.close", title: "Close player" }
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
    + "iframe{border:0;width:100%;height:100%;display:block}"
    + "</style></head><body>"
    + "<iframe src=\\"https://www.youtube.com/embed/" + id + "?rel=0&disablekb=1\\" title=\\"YouTube\\" "
    + "allow=\\"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share\\" "
    + "allowfullscreen></iframe>"
    + "</body></html>";
  nppx.closeBottomDock("community.yt");
  nppx.openCompanion({
    id: "community.yt",
    html: html,
    width: 320,
    height: 180,
    allowMedia: true,
  });
  nppx.notify("YouTube PiP in the corner — type away");
});
nppx.registerCommand("community.yt.close", () => {
  nppx.closeCompanion("community.yt");
  nppx.closeBottomDock("community.yt");
});
`,
  },
  {
    schema: "npp-x.plugin/1",
    id: "community.type-runner",
    name: "Type Runner",
    author: "community",
    version: "1.2.0",
    description:
      "Clippy-style corner buddy: a tiny road-runner icon that runs, zooms, or naps with your typing speed.",
    contributes: {
      commands: [
        { id: "community.runner.start", title: "Show buddy" },
        { id: "community.runner.stop", title: "Hide buddy" }
],
      menus: { tools: ["community.runner.start", "community.runner.stop"] },
    },
    code: `
var HTML = ${JSON.stringify(ROAD_RUNNER_HTML)};
var ID = "community.runner";
var unsub = null, napTimer = null, lastPush = 0, lastMood = "";
function moodFor(cps) { return cps < 1.2 ? "nap" : cps > 14 ? "zoom" : "run"; }
function speechFor(cps, mood) {
  if (mood === "nap") return "zzz… wake me with keys";
  if (mood === "zoom") return "Beep-beep! " + Math.round(cps) + " cps";
  return "Running · " + Math.round(cps) + " cps";
}
function push(cps, force) {
  var now = Date.now();
  if (!force && now - lastPush < 100) return;
  lastPush = now;
  var mood = moodFor(cps);
  var patch = { state: { cps: cps, mood: mood } };
  if (mood !== lastMood) { patch.speech = speechFor(cps, mood); lastMood = mood; }
  nppx.updateCompanion(ID, patch);
}
nppx.registerCommand("community.runner.start", function () {
  if (unsub) unsub();
  lastMood = "nap";
  nppx.openCompanion({ id: ID, html: HTML, speech: "Ready when you type", state: { cps: 0, mood: "nap" } });
  unsub = nppx.onTyping(function (ev) {
    push(ev.cps);
    clearTimeout(napTimer);
    napTimer = setTimeout(function () { push(0, true); }, 900);
  });
  nppx.notify("Type Runner buddy is in the corner");
});
nppx.registerCommand("community.runner.stop", function () {
  if (unsub) { unsub(); unsub = null; }
  clearTimeout(napTimer);
  nppx.closeCompanion(ID);
});
`,
  }
];
