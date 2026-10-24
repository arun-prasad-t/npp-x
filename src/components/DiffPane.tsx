import { DiffEditor } from "@monaco-editor/react";

type Props = {
  original: string;
  modified: string;
  language: string;
  theme: string;
  fontSize: number;
  onExit: () => void;
  label?: string;
};

export function DiffPane({
  original,
  modified,
  language,
  theme,
  fontSize,
  onExit,
  label,
}: Props) {
  return (
    <div className="diff-pane">
      <div className="diff-toolbar">
        <span>{label ?? "Diff"}</span>
        <button type="button" onClick={onExit}>
          Exit Diff
        </button>
      </div>
      <DiffEditor
        height="100%"
        theme={theme}
        language={language}
        original={original}
        modified={modified}
        options={{
          fontFamily:
            "'JetBrains Mono', 'Cascadia Code', Consolas, monospace",
          fontSize,
          readOnly: true,
          renderSideBySide: true,
          automaticLayout: true,
          minimap: { enabled: false },
        }}
      />
    </div>
  );
}
