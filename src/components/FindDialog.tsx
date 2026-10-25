import { useEffect, useRef, useState } from "react";
import type { FindOptions, SearchMode } from "../lib/findEngine";

export type FindTab = "find" | "replace" | "mark";

export type FindActionName =
  | "findNext"
  | "count"
  | "findAllCurrent"
  | "findAllOpened"
  | "replace"
  | "replaceAll"
  | "replaceAllOpened"
  | "markAll"
  | "clearMarks"
  | "copyMarked";

type Props = {
  tab: FindTab;
  onTab: (t: FindTab) => void;
  query: string;
  replacement: string;
  options: FindOptions;
  status: string;
  /** Count of characters currently selected in the editor (for "In selection"). */
  hasSelection: () => boolean;
  onQuery: (v: string) => void;
  onReplacement: (v: string) => void;
  onOptions: (patch: Partial<FindOptions>) => void;
  onAction: (a: FindActionName) => void;
  onClose: () => void;
};

const MODES: { id: SearchMode; label: string }[] = [
  { id: "normal", label: "Normal" },
  { id: "extended", label: "Extended (\\n, \\r, \\t, \\0, \\x...)" },
  { id: "regex", label: "Regular expression" },
];

/** N++-style Find / Replace / Mark dialog (layout from REA dialog 1600). */
export function FindDialog(p: Props) {
  const input = useRef<HTMLInputElement | null>(null);
  const [hist, setHist] = useState<string[]>([]);
  useEffect(() => {
    input.current?.focus();
    input.current?.select();
  }, [p.tab]);

  const act = (a: FindActionName) => {
    if (p.query && !hist.includes(p.query)) setHist((h) => [p.query, ...h].slice(0, 20));
    p.onAction(a);
  };
  const keys = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") p.onClose();
    else if (e.key === "Enter") {
      e.preventDefault();
      act(p.tab === "replace" && e.target !== input.current ? "replace" : "findNext");
    }
  };
  const check = (key: keyof FindOptions, label: string, disabled = false) => (
    <label className="fd-check">
      <input
        type="checkbox"
        checked={Boolean(p.options[key])}
        disabled={disabled}
        onChange={(e) => p.onOptions({ [key]: e.target.checked })}
      />
      {label}
    </label>
  );
  const btn = (a: FindActionName, label: string, primary = false) => (
    <button
      type="button"
      className={primary ? "primary" : undefined}
      onClick={() => act(a)}
    >
      {label}
    </button>
  );

  return (
    <div className="find-dialog" role="dialog" aria-label="Find and Replace" onKeyDown={keys}>
      <div className="fd-tabs" role="tablist">
        {(["find", "replace", "mark"] as FindTab[]).map((t) => (
          <button
            key={t}
            role="tab"
            type="button"
            aria-selected={p.tab === t}
            className={p.tab === t ? "on" : undefined}
            onClick={() => p.onTab(t)}
          >
            {t === "find" ? "Find" : t === "replace" ? "Replace" : "Mark"}
          </button>
        ))}
        <span className="fd-spacer" />
        <button type="button" className="fd-x" aria-label="Close" onClick={p.onClose}>
          ×
        </button>
      </div>

      <div className="fd-body">
        <div className="fd-fields">
          <label>
            Find what :
            <input
              ref={input}
              list="fd-hist"
              value={p.query}
              onChange={(e) => p.onQuery(e.target.value)}
              spellCheck={false}
            />
            <datalist id="fd-hist">
              {hist.map((h) => (
                <option key={h} value={h} />
              ))}
            </datalist>
          </label>
          {p.tab === "replace" ? (
            <label>
              Replace with :
              <input
                value={p.replacement}
                onChange={(e) => p.onReplacement(e.target.value)}
                spellCheck={false}
              />
            </label>
          ) : null}

          <div className="fd-opts">
            <div className="fd-col">
              {check("backward", "Backward direction")}
              {check("wholeWord", "Match whole word only")}
              {check("matchCase", "Match case")}
              {check("wrap", "Wrap around")}
              <label className="fd-check">
                <input
                  type="checkbox"
                  checked={p.options.inSelection}
                  onChange={(e) => {
                    if (e.target.checked && !p.hasSelection()) return;
                    p.onOptions({ inSelection: e.target.checked });
                  }}
                />
                In selection
              </label>
            </div>
            <fieldset className="fd-col fd-modes">
              <legend>Search Mode</legend>
              {MODES.map((m) => (
                <label key={m.id} className="fd-check">
                  <input
                    type="radio"
                    name="fd-mode"
                    checked={p.options.mode === m.id}
                    onChange={() => p.onOptions({ mode: m.id })}
                  />
                  {m.label}
                </label>
              ))}
              {check("dotAll", ". matches newline", p.options.mode !== "regex")}
            </fieldset>
          </div>
          <div className="fd-status" role="status">{p.status}</div>
        </div>

        <div className="fd-buttons">
          {p.tab === "find" ? (
            <>
              {btn("findNext", "Find Next", true)}
              {btn("count", "Count")}
              {btn("findAllCurrent", "Find All in Current Document")}
              {btn("findAllOpened", "Find All in All Opened Documents")}
            </>
          ) : null}
          {p.tab === "replace" ? (
            <>
              {btn("findNext", "Find Next", true)}
              {btn("replace", "Replace")}
              {btn("replaceAll", "Replace All")}
              {btn("replaceAllOpened", "Replace All in All Opened Documents")}
            </>
          ) : null}
          {p.tab === "mark" ? (
            <>
              {btn("markAll", "Mark All", true)}
              {btn("clearMarks", "Clear all marks")}
              {btn("copyMarked", "Copy Marked Text")}
            </>
          ) : null}
          <button type="button" onClick={p.onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
