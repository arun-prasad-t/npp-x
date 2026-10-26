/**
 * Export preview HTML as PDF.
 * - Browser / Windows / Linux: system print dialog via a hidden iframe.
 * - macOS desktop: native WKWebView print-to-PDF (JS window.print is a no-op there).
 */

import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import { isTauri } from "./tauri";

function isMacTauri(): boolean {
  return isTauri() && /Mac/i.test(navigator.userAgent || navigator.platform || "");
}

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

export type PdfExportResult = "ok" | "blocked" | "error" | "cancelled";

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

/** iframe print — works in browsers and WebView2; silent no-op on macOS WKWebView. */
async function exportViaIframe(
  doc: string,
  waitMs: number,
): Promise<PdfExportResult> {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("title", "npp-x PDF export");
  iframe.setAttribute("aria-hidden", "true");
  // Non-zero size: some engines refuse to print 0×0 frames.
  Object.assign(iframe.style, {
    position: "fixed",
    left: "-10000px",
    top: "0",
    width: "800px",
    height: "1100px",
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
    window.setTimeout(cleanup, 60_000);
    return "ok";
  } catch {
    cleanup();
    return "error";
  }
}

/** macOS: save dialog + native print-to-PDF. */
async function exportViaMacNative(doc: string): Promise<PdfExportResult> {
  const path = await save({
    defaultPath: "npp-x-preview.pdf",
    filters: [{ name: "PDF", extensions: ["pdf"] }],
  });
  if (!path) return "cancelled";
  await invoke("export_html_to_pdf", { html: doc, path });
  return "ok";
}

/** Open print / save-PDF for the prepared HTML. */
export async function exportHtmlAsPdf(
  html: string,
  opts?: { /** Extra wait for Mermaid CDN / images */ waitMs?: number },
): Promise<PdfExportResult> {
  const doc = prepareHtmlForPdf(html);
  const needsDiagrams =
    /mermaid|cdn\.jsdelivr\.net\/npm\/mermaid/i.test(doc);
  const waitMs = opts?.waitMs ?? (needsDiagrams ? 2400 : 350);

  if (isMacTauri()) {
    try {
      return await exportViaMacNative(doc);
    } catch (err) {
      console.error("Native PDF export failed", err);
      return "error";
    }
  }

  return exportViaIframe(doc, waitMs);
}
