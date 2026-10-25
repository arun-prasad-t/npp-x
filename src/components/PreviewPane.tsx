type Props = {
  title: string;
  html: string;
  onClose: () => void;
  onRefresh?: () => void;
};

/**
 * Sandboxed HTML preview for plugins (HTML design / CSV tables).
 * Scripts are blocked; CSS and markup still render.
 */
export function PreviewPane({ title, html, onClose, onRefresh }: Props) {
  return (
    <div className="preview-pane">
      <div className="preview-toolbar">
        <span>{title}</span>
        <div className="preview-actions">
          {onRefresh ? (
            <button type="button" onClick={onRefresh}>
              Refresh
            </button>
          ) : null}
          <button type="button" onClick={onClose}>
            Close Preview
          </button>
        </div>
      </div>
      <iframe
        className="preview-frame"
        title={title}
        sandbox=""
        srcDoc={html}
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
