export type DockPanel = {
  id: string;
  title: string;
  html: string;
  height: number;
  /** YouTube embeds need scripts; keep off unless the plugin asks. */
  allowScripts?: boolean;
};

type Props = {
  docks: DockPanel[];
  onClose: (id: string) => void;
};

export function PluginDocks({ docks, onClose }: Props) {
  if (!docks.length) return null;
  return (
    <div className="plugin-docks" aria-label="Plugin panels">
      {docks.map((dock) => (
        <section
          key={dock.id}
          className="plugin-dock"
          style={{ height: dock.height }}
        >
          <header className="plugin-dock-toolbar">
            <span>{dock.title}</span>
            <button type="button" onClick={() => onClose(dock.id)}>
              Close
            </button>
          </header>
          <iframe
            className="plugin-dock-frame"
            title={dock.title}
            sandbox={
              dock.allowScripts
                ? "allow-scripts allow-same-origin allow-presentation allow-popups"
                : ""
            }
            allow={
              dock.allowScripts
                ? "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                : undefined
            }
            srcDoc={dock.html}
            referrerPolicy="no-referrer"
          />
        </section>
      ))}
    </div>
  );
}
