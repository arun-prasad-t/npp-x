import { LANGUAGE_MENU } from "../lib/languages";

type Props = {
  line: number;
  column: number;
  length: number;
  selection: number;
  encoding: string;
  language: string;
  onLanguageChange: (id: string) => void;
  onEncodingChange: (encoding: string) => void;
  path: string | null;
  encodings: readonly string[];
};

export function StatusBar(props: Props) {
  return (
    <footer className="status-bar">
      <span className="status-path" title={props.path ?? "unsaved"}>
        {props.path ?? "new"}
      </span>
      <span>
        Ln : {props.line}&nbsp;&nbsp;Col : {props.column}
      </span>
      <span>Sel : {props.selection}</span>
      <span>length : {props.length}</span>
      <label className="status-encoding">
        <select
          value={props.encoding}
          onChange={(e) => props.onEncodingChange(e.target.value)}
          aria-label="Encoding"
        >
          {props.encodings.map((enc) => (
            <option key={enc} value={enc}>
              {enc}
            </option>
          ))}
        </select>
      </label>
      <label className="status-lang">
        <select
          value={props.language}
          onChange={(e) => props.onLanguageChange(e.target.value)}
          aria-label="Language"
        >
          {LANGUAGE_MENU.map((lang) => (
            <option key={lang.key} value={lang.key}>
              {lang.label}
            </option>
          ))}
        </select>
      </label>
    </footer>
  );
}
