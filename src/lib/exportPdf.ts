/**
 * Export preview HTML as PDF via the system print dialog
 * (Chrome/WebView → Destination: Save as PDF / Microsoft Print to PDF).
 * Uses a hidden iframe so Tauri/desktop never hits pop-up blockers.
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

function waitForFrame(win: Window, waitMs: number): Promise<void> {
  return new Promise((resolve) => {
    const done = () => resolve();
    if (win.document.readyState === "complete") {
      window.setTimeout(done, waitMs);
      return;
    }
    win.addEventListener("load", () => window.setTimeout(done, waitMs), {
      once: true,
    });
    window.setTimeout(done, waitMs + 500);
  });
}

/** Open print dialog from a same-origin iframe (no pop-up). */
export async function exportHtmlAsPdf(
  html: string,
  opts?: { /** Extra wait for Mermaid CDN / images */ waitMs?: number },
): Promise<PdfExportResult> {
  const doc = prepareHtmlForPdf(html);
  const needsDiagrams =
    /mermaid|cdn\.jsdelivr\.net\/npm\/mermaid/i.test(doc);
  const waitMs = opts?.waitMs ?? (needsDiagrams ? 2400 : 350);

  const iframe = document.createElement("iframe");
  iframe.setAttribute("title", "npp-x PDF export");
  iframe.setAttribute("aria-hidden", "true");
  Object.assign(iframe.style, {
    position: "fixed",
    right: "0",
    bottom: "0",
    width: "0",
    height: "0",
    border: "0",
    opacity: "0",
    pointerEvents: "none",
  });
  document.body.appendChild(iframe);

  const cleanup = () => {
    try {
      iframe.remove();
    } catch {
      /* ignore */
    }
  };

  try {
    const win = iframe.contentWindow;
    const idoc = iframe.contentDocument;
    if (!win || !idoc) {
      cleanup();
      return "blocked";
    }

    idoc.open();
    idoc.write(doc);
    idoc.close();
    await waitForFrame(win, waitMs);
    win.focus();
    win.print();
    // Keep iframe until after print dialog may finish painting
    window.setTimeout(cleanup, 60_000);
    return "ok";
  } catch {
    cleanup();
    return "error";
  }
}
