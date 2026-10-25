/**
 * Export preview HTML as PDF via the system print dialog
 * (Chrome/WebView → Destination: Save as PDF / Microsoft Print to PDF).
 * No extra PDF libraries — works for HTML, CSV tables, and Markdown+Mermaid.
 */

const PRINT_CSS = `<style id="nppx-print">
@media print {
  body { background: #fff !important; color: #0f172a !important; }
  a { color: #15803d !important; }
  .meta, .companion-close { display: none !important; }
  .mermaid, pre, table, img { break-inside: avoid; }
  pre, code, th { background: #f1f5f9 !important; color: inherit !important; }
}
@page { margin: 12mm; }
</style>`;

export function prepareHtmlForPdf(html: string): string {
  const trimmed = html.trim();
  if (/<html[\s>]/i.test(trimmed)) {
    if (/id=["']nppx-print["']/.test(trimmed)) return trimmed;
    if (/<\/head>/i.test(trimmed)) {
      return trimmed.replace(/<\/head>/i, `${PRINT_CSS}</head>`);
    }
    return trimmed.replace(
      /<html([^>]*)>/i,
      `<html$1><head><meta charset="utf-8"/>${PRINT_CSS}</head>`,
    );
  }
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>${PRINT_CSS}</head><body>${trimmed}</body></html>`;
}

export type PdfExportResult = "ok" | "blocked" | "error";

/** Open a print window; user chooses Save as PDF in the dialog. */
export async function exportHtmlAsPdf(
  html: string,
  opts?: { /** Extra wait for Mermaid CDN / images */ waitMs?: number },
): Promise<PdfExportResult> {
  const doc = prepareHtmlForPdf(html);
  const needsDiagrams =
    /mermaid|cdn\.jsdelivr\.net\/npm\/mermaid/i.test(doc);
  const waitMs = opts?.waitMs ?? (needsDiagrams ? 2400 : 350);

  const w = window.open("", "_blank");
  if (!w) return "blocked";

  try {
    w.document.open();
    w.document.write(doc);
    w.document.close();
    await new Promise<void>((resolve) => {
      const done = () => resolve();
      if (w.document.readyState === "complete") {
        window.setTimeout(done, waitMs);
      } else {
        w.addEventListener("load", () => window.setTimeout(done, waitMs), {
          once: true,
        });
        window.setTimeout(done, waitMs + 500);
      }
    });
    w.focus();
    w.print();
    return "ok";
  } catch {
    try {
      w.close();
    } catch {
      /* ignore */
    }
    return "error";
  }
}
