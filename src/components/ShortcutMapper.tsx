import { SHORTCUTS, formatShortcut, labelForCommand } from "../lib/npp/shortcuts";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function ShortcutMapper({ open, onClose }: Props) {
  if (!open) return null;
  return (
    <div className="market-overlay" role="dialog" aria-modal="true">
      <div className="market-panel">
        <header className="market-header">
          <div>
            <h2>Shortcut Mapper</h2>
            <p>
              Defaults from Notepad++ 8.8.1 <code>winKeyDefs</code> (Parameters.cpp),
              verified against the portable PE via REA.
            </p>
          </div>
          <button type="button" className="ghost" onClick={onClose}>
            Close
          </button>
        </header>
        <div className="shortcut-table-wrap">
          <table className="shortcut-table">
            <thead>
              <tr>
                <th>Command</th>
                <th>ID</th>
                <th>Shortcut</th>
              </tr>
            </thead>
            <tbody>
              {SHORTCUTS.map((s) => (
                <tr key={`${s.cmd}-${formatShortcut(s)}`}>
                  <td>{labelForCommand(s.id)}</td>
                  <td>
                    <code>{s.cmd}</code>
                  </td>
                  <td>
                    <kbd>{formatShortcut(s)}</kbd>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
