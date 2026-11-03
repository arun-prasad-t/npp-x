import { useMemo, useRef, useState } from "react";
import { writeClipboardHtml } from "../lib/clipboard";
import {
  type PreviewScheme,
  withPreviewScheme,
} from "../lib/previewTheme";

export type PreviewLayout = "split" | "full";

type Props = {
  title: string;
  html: string;
  layout: PreviewLayout;
  scheme: PreviewScheme;
  allowScripts?: boolean;
  onLayout: (layout: PreviewLayout) => void;
  onScheme: (scheme: PreviewScheme) => void;
  onClose: () => void;
  onRefresh?: () => void;
  onExportPdf?: () => void;
  onNotify?: (message: string) => void;
};

const PASTE_STYLE = `table{border-collapse:collapse;width:100%;font:13px/1.4 system-ui,sans-serif}
th,td{border:1px solid #cbd5e1;padding:6px 10px;text-align:left;vertical-align:top}
th{background:#f1f5f9;font-weight:600}
caption{text-align:left;margin-bottom:8px;color:#64748b;font-size:12px}`;

function tableToTsv(table: HTMLTableElement): string {
  return [...table.querySelectorAll("tr")]
    .map((tr) =>
      [...tr.querySelectorAll("th,td")]
        .map((c) => {
          const t = (c.textContent ?? "").replace(/\t|\n|\r/g, " ").trim();
          return t.includes('"') || t.includes(",") ? `"${t.replace(/"/g, '""')}"` : t;
        })
        .join("\t"),
    )
    .join("\n");
}

function wrapForPaste(fragment: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>${PASTE_STYLE}</style></head><body>${fragment}</body></html>`;
}

/**
 * Preview surface for HTML / CSV / Markdown.
 * Defaults to side-by-side with the editor; user can expand to full.
 * Light/Dark follows the app theme by default; toolbar toggle overrides.
 */
export function PreviewPane({
  title,
  html,
  layout,
  scheme,
  allowScripts,
  onLayout,
  onScheme,
  onClose,
  onRefresh,
  onExportPdf,
  onNotify,
}: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [copyBusy, setCopyBusy] = useState(false);
  const srcDoc = useMemo(
    () => withPreviewScheme(html, scheme),
    [html, scheme],
  );

  const copySelectionOrPreview = async () => {
    if (copyBusy) return;
    setCopyBusy(true);
    try {
      const doc = iframeRef.current?.contentDocument;
      if (!doc?.body) {
        onNotify?.("Preview not ready to copy");
        return;
      }
      const sel = doc.getSelection();
      let fragment = "";
      let plain = "";
      if (sel && !sel.isCollapsed && sel.rangeCount > 0) {
        const holder = doc.createElement("div");
        holder.appendChild(sel.getRangeAt(0).cloneContents());
        fragment = holder.innerHTML;
        plain = sel.toString();
      } else {
        const table = doc.querySelector("table");
        if (table) {
          fragment = table.outerHTML;
          plain = tableToTsv(table);
        } else {
          const main =
            doc.querySelector("#out") ?? doc.querySelector(".wrap") ?? doc.body;
          fragment = (main as HTMLElement).innerHTML;
          plain = (main as HTMLElement).innerText ?? "";
        }
      }
      if (!fragment.trim() && !plain.trim()) {
        onNotify?.("Nothing to copy");
        return;
      }
      await writeClipboardHtml(wrapForPaste(fragment), plain);
      onNotify?.(
        sel && !sel.isCollapsed
          ? "Copied selection (HTML + text)"
          : "Copied preview (HTML + text)",
      );
    } catch {
      onNotify?.("Copy failed");
    } finally {
      setCopyBusy(false);
    }
  };

  return (
    <div className="preview-pane">
      <div className="preview-toolbar">
        <span className="preview-title">{title}</span>
        <div className="preview-actions">
          <button
            type="button"
            className={layout === "split" ? "on" : undefined}
            title="Side by side with editor"
            onClick={() => onLayout("split")}
          >
            Split
          </button>
          <button
            type="button"
            className={layout === "full" ? "on" : undefined}
            title="Preview only"
            onClick={() => onLayout("full")}
          >
            Full
          </button>
          <button
            type="button"
            title={`Preview is ${scheme} (matches npp-x theme until you toggle)`}
            onClick={() => onScheme(scheme === "dark" ? "light" : "dark")}
          >
            {scheme === "dark" ? "Light" : "Dark"}
          </button>
          {onRefresh ? (
            <button type="button" onClick={onRefresh}>
              Refresh
            </button>
          ) : null}
          <button
            type="button"
            title="Copy selection, or the whole table/preview, as HTML for Teams/Word"
            disabled={copyBusy}
            onClick={() => void copySelectionOrPreview()}
          >
            Copy
          </button>
          {onExportPdf ? (
            <button
              type="button"
              className="primary"
              title="Save preview as PDF (macOS: save dialog; others: print → Save as PDF)"
              onClick={onExportPdf}
            >
              Export PDF
            </button>
          ) : null}
          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
      <iframe
        ref={iframeRef}
        className="preview-frame"
        title={title}
        // same-origin so selection/Copy can read the document. Scripts stay
        // limited to Markdown/Mermaid previews only.
        sandbox={
          allowScripts
            ? "allow-scripts allow-same-origin allow-popups allow-downloads"
            : "allow-same-origin"
        }
        srcDoc={srcDoc}
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
