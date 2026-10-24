/**
 * Menu labels mirrored from Notepad++ 8.8.1 english.xml (REA shipped-artifact).
 */
import { ENCODINGS, LANGUAGE_MENU } from "../lib/languages";

type Props = {
  onNew: () => void;
  onOpen: () => void;
  onSave: () => void;
  onSaveAs: () => void;
  onClose: () => void;
  onCloseAll: () => void;
  onFind: () => void;
  onReplace: () => void;
  onWordWrap: () => void;
  wordWrap: boolean;
  onThemeToggle: () => void;
  dark: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onCut: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onSelectAll: () => void;
  language: string;
  encoding: string;
  onLanguageChange: (id: string) => void;
  onEncodingChange: (encoding: string) => void;
};

function Item({
  label,
  shortcut,
  onClick,
  checked,
}: {
  label: string;
  shortcut?: string;
  onClick?: () => void;
  checked?: boolean;
}) {
  return (
    <button type="button" className="menu-item" onClick={onClick} role="menuitem">
      <span>
        {checked ? "✓ " : ""}
        {label}
      </span>
      {shortcut ? <kbd>{shortcut}</kbd> : null}
    </button>
  );
}

export function MenuBar(props: Props) {
  return (
    <nav className="menu-bar" aria-label="Main menu">
      <div className="menu">
        <button type="button" className="menu-trigger">
          File
        </button>
        <div className="menu-dropdown" role="menu">
          <Item label="New" shortcut="Ctrl+N" onClick={props.onNew} />
          <Item label="Open..." shortcut="Ctrl+O" onClick={props.onOpen} />
          <div className="menu-sep" />
          <Item label="Close" shortcut="Ctrl+W" onClick={props.onClose} />
          <Item label="Close All" onClick={props.onCloseAll} />
          <div className="menu-sep" />
          <Item label="Save" shortcut="Ctrl+S" onClick={props.onSave} />
          <Item label="Save As..." shortcut="Ctrl+Alt+S" onClick={props.onSaveAs} />
          <div className="menu-sep" />
          <Item label="Exit" shortcut="Alt+F4" onClick={() => window.close()} />
        </div>
      </div>

      <div className="menu">
        <button type="button" className="menu-trigger">
          Edit
        </button>
        <div className="menu-dropdown" role="menu">
          <Item label="Undo" shortcut="Ctrl+Z" onClick={props.onUndo} />
          <Item label="Redo" shortcut="Ctrl+Y" onClick={props.onRedo} />
          <div className="menu-sep" />
          <Item label="Cut" shortcut="Ctrl+X" onClick={props.onCut} />
          <Item label="Copy" shortcut="Ctrl+C" onClick={props.onCopy} />
          <Item label="Paste" shortcut="Ctrl+V" onClick={props.onPaste} />
          <Item label="Select All" shortcut="Ctrl+A" onClick={props.onSelectAll} />
        </div>
      </div>

      <div className="menu">
        <button type="button" className="menu-trigger">
          Search
        </button>
        <div className="menu-dropdown" role="menu">
          <Item label="Find..." shortcut="Ctrl+F" onClick={props.onFind} />
          <Item label="Replace..." shortcut="Ctrl+H" onClick={props.onReplace} />
        </div>
      </div>

      <div className="menu">
        <button type="button" className="menu-trigger">
          View
        </button>
        <div className="menu-dropdown" role="menu">
          <Item
            label="Word wrap"
            checked={props.wordWrap}
            onClick={props.onWordWrap}
          />
          <Item
            label={props.dark ? "Light Mode" : "Dark Mode"}
            onClick={props.onThemeToggle}
          />
        </div>
      </div>

      <div className="menu">
        <button type="button" className="menu-trigger">
          Encoding
        </button>
        <div className="menu-dropdown" role="menu">
          {ENCODINGS.map((enc) => (
            <Item
              key={enc}
              label={enc}
              checked={props.encoding === enc}
              onClick={() => props.onEncodingChange(enc)}
            />
          ))}
        </div>
      </div>

      <div className="menu menu-scroll">
        <button type="button" className="menu-trigger">
          Language
        </button>
        <div className="menu-dropdown" role="menu">
          {LANGUAGE_MENU.map((lang) => (
            <Item
              key={lang.key}
              label={lang.label}
              checked={props.language === lang.key}
              onClick={() => props.onLanguageChange(lang.key)}
            />
          ))}
        </div>
      </div>

      <div className="brand-chip" title="npp-x — cross-platform N++ inspired editor">
        npp-x
      </div>
    </nav>
  );
}
