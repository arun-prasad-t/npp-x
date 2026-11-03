import { DiffEditor } from "@monaco-editor/react";
import { useState } from "react";

export type DiffSourceOption = {
  id: string;
  label: string;
};

type Props = {
  leftId: string;
  rightId: string;
  options: DiffSourceOption[];
  original: string;
  modified: string;
  language: string;
  theme: string;
  fontSize: number;
  onLeftChange: (id: string) => void;
  onRightChange: (id: string) => void;
  onSwap: () => void;
  onRefreshClipboard?: () => void;
  onExit: () => void;
};

export function DiffPane({
  leftId,
  rightId,
  options,
  original,
  modified,
  language,
  theme,
  fontSize,
  onLeftChange,
  onRightChange,
  onSwap,
  onRefreshClipboard,
  onExit,
}: Props) {
  const [sideBySide, setSideBySide] = useState(true);
  const usesClipboard = leftId === "__clipboard__" || rightId === "__clipboard__";

  return (
    <div className="diff-pane">
      <div className="diff-toolbar">
        <div className="diff-pickers">
          <span className="diff-badge">DIFF</span>
          <label className="diff-select-wrap">
            <span className="diff-side-label">Base</span>
            <select
              aria-label="Diff base source"
              value={leftId}
              onChange={(e) => onLeftChange(e.target.value)}
            >
              {options.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="diff-swap"
            title="Swap Base and Target"
            aria-label="Swap Base and Target"
            onClick={onSwap}
          >
            ⇄
          </button>
          <label className="diff-select-wrap">
            <span className="diff-side-label">Target</span>
            <select
              aria-label="Diff target source"
              value={rightId}
              onChange={(e) => onRightChange(e.target.value)}
            >
              {options.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="diff-actions">
          <button
            type="button"
            className={sideBySide ? "on" : undefined}
            title="Side-by-side split view"
            onClick={() => setSideBySide(true)}
          >
            Split
          </button>
          <button
            type="button"
            className={!sideBySide ? "on" : undefined}
            title="Unified inline diff"
            onClick={() => setSideBySide(false)}
          >
            Inline
          </button>
          {usesClipboard && onRefreshClipboard ? (
            <button
              type="button"
              title="Re-read system clipboard"
              onClick={onRefreshClipboard}
            >
              Re-read Clipboard
            </button>
          ) : null}
          <button type="button" onClick={onExit}>
            Close Diff
          </button>
        </div>
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
          renderSideBySide: sideBySide,
          automaticLayout: true,
          minimap: { enabled: false },
        }}
      />
    </div>
  );
}
