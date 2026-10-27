/**
 * Export preview HTML as PDF.
 * - Browser / Windows / Linux: system print dialog via a hidden iframe.
 * - macOS desktop: WKWebView createPDF (window.print and AppKit print both hang).
 */

import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import { isTauri } from "./tauri";

function isMacTauri(): boolean {
  return isTauri() && /Mac/i.test(navigator.userAgent || navigator.platform || "");
}

/** Applied for browser print (@media print). */
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

/**
 * Forced light ink for macOS WKWebView print-to-PDF — that path often ignores
 * @media print, so dark CSS variables become white-on-white blank pages.
 */
const NATIVE_PDF_CSS = `<style id="nppx-print-native">
html, body {
  background: #ffffff !important;
  color: #0f172a !important;
  margin: 0 !important;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}
body {
  padding: 28px !important;
  box-sizing: border-box !important;
}
a { color: #15803d !important; }
.meta, .companion-close, .preview-toolbar { display: none !important; }
code, pre, th { background: #f1f5f9 !important; color: #0f172a !important; }
pre, table, th, td, h1, h2, hr, .mermaid {
  border-color: #cbd5e1 !important;
}
.mermaid { background: #ffffff !important; }
blockquote { color: #475569 !important; }
img { max-width: 100% !important; }
@media print {
  body { background: #fff !important; color: #0f172a !important; }
}
@page { margin: 12mm; }
</style>`;

function injectHeadCss(html: string, css: string, markerId: string): string {
  const trimmed = html.trim();
  if (new RegExp(`id=["']${markerId}["']`).test(trimmed)) return trimmed;
  if (/<html[\s>]/i.test(trimmed)) {
    if (/<\/head>/i.test(trimmed)) {
      return trimmed.replace(/<\/head>/i, `${css}</head>`);
    }
    return trimmed.replace(
      /<html([^>]*)>/i,
      `<html$1><head><meta charset="utf-8"/>${css}</head>`,
    );
  }
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>${css}</head><body>${trimmed}</body></html>`;
}

export function prepareHtmlForPdf(html: string): string {
  return injectHeadCss(html, PRINT_CSS, "nppx-print");
}

/** macOS native exporter — always force light readable ink. */
export function prepareHtmlForNativePdf(html: string): string {
  return injectHeadCss(
    prepareHtmlForPdf(html),
    NATIVE_PDF_CSS,
    "nppx-print-native",
  );
}

export type PdfExportResult =
  | "ok"
  | "saved"
  | "blocked"
  | "cancelled"
  | { error: string };

let exportInFlight = false;

function describeError(err: unknown): string {
  const raw =
    typeof err === "string"
      ? err
      : err instanceof Error
        ? err.message
        : "PDF export failed";
  return raw.length > 180 ? `${raw.slice(0, 180)}…` : raw;
}

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
  } catch (err) {
    cleanup();
    return { error: describeError(err) };
  }
}

/** macOS: save dialog + native print-to-PDF. */
async function exportViaMacNative(html: string): Promise<PdfExportResult> {
  const path = await save({
    defaultPath: "npp-x-preview.pdf",
    filters: [{ name: "PDF", extensions: ["pdf"] }],
  });
  if (!path) return "cancelled";
  const doc = prepareHtmlForNativePdf(html);
  await invoke("export_html_to_pdf", { html: doc, path });
  return "saved";
}

/** Open print / save-PDF for the prepared HTML. */
export async function exportHtmlAsPdf(
  html: string,
  opts?: { /** Extra wait for Mermaid CDN / images */ waitMs?: number },
): Promise<PdfExportResult> {
  if (exportInFlight) return "blocked";
  exportInFlight = true;
  try {
    const needsDiagrams =
      /mermaid|cdn\.jsdelivr\.net\/npm\/mermaid/i.test(html);
    const waitMs = opts?.waitMs ?? (needsDiagrams ? 2400 : 350);

    if (isMacTauri()) {
      try {
        // Pass raw preview HTML — native path adds forced light print CSS.
        // Never fall back to window.print() here: on WKWebView that call hangs the app.
        return await exportViaMacNative(html);
      } catch (err) {
        console.error("Native PDF export failed", err);
        return { error: describeError(err) };
      }
    }

    return exportViaIframe(prepareHtmlForPdf(html), waitMs);
  } finally {
    exportInFlight = false;
  }
}
