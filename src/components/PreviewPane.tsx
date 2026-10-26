import { useMemo } from "react";
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
};

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
}: Props) {
  const srcDoc = useMemo(
    () => withPreviewScheme(html, scheme),
    [html, scheme],
  );

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
        className="preview-frame"
        title={title}
        // Markdown/Mermaid needs scripts; plain HTML/CSV stay script-free.
        sandbox={
          allowScripts
            ? "allow-scripts allow-popups allow-downloads"
            : ""
        }
        srcDoc={srcDoc}
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
