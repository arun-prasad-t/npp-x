/** Light / dark appearance for sandboxed preview iframes. */

export type PreviewScheme = "light" | "dark";

export function resolveAppPreviewScheme(): PreviewScheme {
  const root = document.documentElement;
  if (root.classList.contains("light")) return "light";
  if (root.classList.contains("dark")) return "dark";
  if (root.style.colorScheme === "light") return "light";
  if (root.style.colorScheme === "dark") return "dark";
  const cs = getComputedStyle(root).colorScheme;
  return cs.includes("light") && !cs.includes("dark") ? "light" : "dark";
}

const TOKENS: Record<
  PreviewScheme,
  {
    bg: string;
    fg: string;
    muted: string;
    border: string;
    panel: string;
    accent: string;
    accentHover: string;
    mermaid: string;
  }
> = {
  dark: {
    bg: "#0f172a",
    fg: "#e2e8f0",
    muted: "#94a3b8",
    border: "#334155",
    panel: "#1e293b",
    accent: "#4ade80",
    accentHover: "#86efac",
    mermaid: "#111827",
  },
  light: {
    bg: "#f8fafc",
    fg: "#0f172a",
    muted: "#64748b",
    border: "#cbd5e1",
    panel: "#eef2f7",
    accent: "#15803d",
    accentHover: "#16a34a",
    mermaid: "#ffffff",
  },
};

/** Shared CSS vars + body defaults injected into every preview document. */
export function previewSchemeStyleTag(scheme: PreviewScheme): string {
  const t = TOKENS[scheme];
  return `<style id="nppx-preview-scheme">
:root{
  color-scheme:${scheme};
  --pv-bg:${t.bg};
  --pv-fg:${t.fg};
  --pv-muted:${t.muted};
  --pv-border:${t.border};
  --pv-panel:${t.panel};
  --pv-accent:${t.accent};
  --pv-accent-hover:${t.accentHover};
  --pv-mermaid:${t.mermaid};
}
html{color-scheme:${scheme}}
/* CSV / MD set body from these vars; raw HTML keeps author styles */
</style>`;
}

/** Inject / replace scheme stylesheet so CSV / HTML / MD all flip together. */
export function withPreviewScheme(html: string, scheme: PreviewScheme): string {
  const tag = previewSchemeStyleTag(scheme);
  const stripped = html.replace(
    /<style\s+id=["']nppx-preview-scheme["'][\s\S]*?<\/style>/i,
    "",
  );
  if (/<\/head>/i.test(stripped)) {
    return stripped.replace(/<\/head>/i, `${tag}</head>`);
  }
  if (/<html[\s>]/i.test(stripped)) {
    return stripped.replace(
      /<html([^>]*)>/i,
      `<html$1><head><meta charset="utf-8"/>${tag}</head>`,
    );
  }
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>${tag}</head><body>${stripped}</body></html>`;
}

export function mermaidThemeFor(scheme: PreviewScheme): "dark" | "default" {
  return scheme === "dark" ? "dark" : "default";
}
