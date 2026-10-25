/** Preview kinds that ship as default plugins — power the quick-preview chip. */
export type PreviewOffer = {
  kind: "html" | "csv" | "markdown";
  label: string;
  commandId: string;
  pluginId: string;
};

const OFFERS: PreviewOffer[] = [
  {
    kind: "html",
    label: "HTML Preview",
    commandId: "community.html.preview",
    pluginId: "community.html-preview",
  },
  {
    kind: "csv",
    label: "CSV Table",
    commandId: "community.csv.table",
    pluginId: "community.csv-table",
  },
  {
    kind: "markdown",
    label: "Markdown Preview",
    commandId: "community.md.preview",
    pluginId: "community.md-preview",
  },
];

function looksHtml(text: string): boolean {
  const t = text.trimStart().slice(0, 400).toLowerCase();
  return (
    t.startsWith("<!doctype html") ||
    t.startsWith("<html") ||
    /^<(div|section|main|body|head|style|table|h[1-6])\b/.test(t)
  );
}

function looksMarkdown(text: string): boolean {
  const t = text.trimStart();
  if (/^#{1,6}\s+\S/m.test(t)) return true;
  if (/```\s*(mermaid|sequence)/i.test(t)) return true;
  if (/^\s*[-*+]\s+\S/m.test(t) && /\n\s*[-*+]\s+/.test(t)) return true;
  if (/^\|.+\|[\t ]*\n\|?[\t :|-]+\|/m.test(t)) return true;
  return false;
}

function looksCsv(text: string): boolean {
  const lines = text
    .trim()
    .split(/\r?\n/)
    .filter((l) => l.trim())
    .slice(0, 8);
  if (lines.length < 2) return false;
  const delim = lines[0].includes("\t")
    ? "\t"
    : lines[0].includes(";")
      ? ";"
      : ",";
  const cols = lines[0].split(delim).length;
  if (cols < 2) return false;
  let ok = 0;
  for (const line of lines) {
    if (line.split(delim).length === cols) ok++;
  }
  return ok >= Math.ceil(lines.length * 0.7);
}

/** Pick a preview offer from language + buffer content. */
export function detectPreviewOffer(
  language: string,
  text: string,
  enabledPluginIds: Iterable<string>,
): PreviewOffer | null {
  if (!text.trim()) return null;
  const enabled = new Set(enabledPluginIds);
  const lang = language.toLowerCase();
  let kind: PreviewOffer["kind"] | null = null;

  if (lang === "html" || lang === "xml") kind = "html";
  else if (lang === "csv") kind = "csv";
  else if (lang === "markdown" || lang === "md") kind = "markdown";
  else if (looksHtml(text)) kind = "html";
  else if (looksMarkdown(text)) kind = "markdown";
  else if (looksCsv(text)) kind = "csv";

  if (!kind) return null;
  const offer = OFFERS.find((o) => o.kind === kind)!;
  return enabled.has(offer.pluginId) ? offer : null;
}

export const PREVIEW_PLUGIN_IDS = OFFERS.map((o) => o.pluginId);
