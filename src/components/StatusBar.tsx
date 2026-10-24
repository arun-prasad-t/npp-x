import { LANGUAGES, labelForLanguage } from "../lib/languages";

type Props = {
  line: number;
  column: number;
  length: number;
  selection: number;
  encoding: string;
  language: string;
  onLanguageChange: (id: string) => void;
  path: string | null;
};

export function StatusBar(props: Props) {
  return (
    <footer className="status-bar">
      <span className="status-path" title={props.path ?? "unsaved"}>
        {props.path ?? "new"}
      </span>
      <span>
        Ln : {props.line}  Col : {props.column}
      </span>
      <span>Sel : {props.selection}</span>
      <span>length : {props.length}</span>
      <span>{props.encoding}</span>
      <label className="status-lang">
        <span className="sr-only">Language</span>
        <select
          value={props.language}
          onChange={(e) => props.onLanguageChange(e.target.value)}
          aria-label="Language"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.id} value={lang.id}>
              {lang.label}
            </option>
          ))}
        </select>
        <span className="status-lang-label">{labelForLanguage(props.language)}</span>
      </label>
    </footer>
  );
}
