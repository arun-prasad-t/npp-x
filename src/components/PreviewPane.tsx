export type PreviewLayout = "split" | "full";

type Props = {
  title: string;
  html: string;
  layout: PreviewLayout;
  allowScripts?: boolean;
  onLayout: (layout: PreviewLayout) => void;
  onClose: () => void;
  onRefresh?: () => void;
  onExportPdf?: () => void;
};

/**
 * Preview surface for HTML / CSV / Markdown.
 * Defaults to side-by-side with the editor; user can expand to full.
 */
export function PreviewPane({
  title,
  html,
  layout,
  allowScripts,
  onLayout,
  onClose,
  onRefresh,
  onExportPdf,
}: Props) {
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
          {onRefresh ? (
            <button type="button" onClick={onRefresh}>
              Refresh
            </button>
          ) : null}
          {onExportPdf ? (
            <button
              type="button"
              className="primary"
              title="Opens the print dialog — choose Save as PDF"
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
        srcDoc={html}
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
