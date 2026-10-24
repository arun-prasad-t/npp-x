import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import type { editor as MonacoEditor } from "monaco-editor";
import { open as openDialog, save as saveDialog } from "@tauri-apps/plugin-dialog";
import { MenuBar } from "./components/MenuBar";
import { TabBar } from "./components/TabBar";
import { StatusBar } from "./components/StatusBar";
import { FindBar } from "./components/FindBar";
import {
  createFromFile,
  createUntitled,
  type DocumentTab,
} from "./lib/documents";
import { isTauri, readTextFile, writeTextFile } from "./lib/tauri";
import "./App.css";

type Cursor = { line: number; column: number; selection: number };

export default function App() {
  const [tabs, setTabs] = useState<DocumentTab[]>(() => [createUntitled()]);
  const [activeId, setActiveId] = useState(() => tabs[0].id);
  const [dark, setDark] = useState(false);
  const [wordWrap, setWordWrap] = useState(false);
  const [cursor, setCursor] = useState<Cursor>({
    line: 1,
    column: 1,
    selection: 0,
  });
  const [findOpen, setFindOpen] = useState(false);
  const [findMode, setFindMode] = useState<"find" | "replace">("find");
  const [query, setQuery] = useState("");
  const [replacement, setReplacement] = useState("");

  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null);
  const active = useMemo(
    () => tabs.find((t) => t.id === activeId) ?? tabs[0],
    [tabs, activeId],
  );

  const updateActive = useCallback(
    (patch: Partial<DocumentTab>) => {
      setTabs((prev) =>
        prev.map((t) => (t.id === activeId ? { ...t, ...patch } : t)),
      );
    },
    [activeId],
  );

  const onMount: OnMount = (ed) => {
    editorRef.current = ed;
    ed.onDidChangeCursorSelection((e) => {
      const sel = ed.getModel()?.getValueInRange(e.selection) ?? "";
      setCursor({
        line: e.selection.positionLineNumber,
        column: e.selection.positionColumn,
        selection: sel.length,
      });
    });
    ed.focus();
  };

  const handleNew = () => {
    const tab = createUntitled();
    setTabs((prev) => [...prev, tab]);
    setActiveId(tab.id);
  };

  const handleOpen = async () => {
    if (isTauri()) {
      const selected = await openDialog({
        multiple: false,
        filters: [{ name: "Text", extensions: ["*"] }],
      });
      if (!selected || Array.isArray(selected)) return;
      const file = await readTextFile(selected);
      const tab = createFromFile(file.name, file.path, file.content);
      setTabs((prev) => [...prev, tab]);
      setActiveId(tab.id);
      return;
    }

    const input = document.createElement("input");
    input.type = "file";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const content = await file.text();
      const tab = createFromFile(file.name, file.name, content);
      setTabs((prev) => [...prev, tab]);
      setActiveId(tab.id);
    };
    input.click();
  };

  const persist = async (saveAs: boolean) => {
    if (!active) return;
    let path = active.path;

    if (isTauri()) {
      if (saveAs || !path) {
        const picked = await saveDialog({
          defaultPath: active.name,
        });
        if (!picked) return;
        path = picked;
      }
      await writeTextFile(path, active.content);
      const name = path.split(/[/\\]/).pop() ?? active.name;
      updateActive({ path, name, dirty: false });
      return;
    }

    const blob = new Blob([active.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = active.name.endsWith(".txt") ? active.name : `${active.name}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    updateActive({ dirty: false });
  };

  const handleClose = (id: string) => {
    setTabs((prev) => {
      if (prev.length === 1) {
        const blank = createUntitled();
        setActiveId(blank.id);
        return [blank];
      }
      const next = prev.filter((t) => t.id !== id);
      if (id === activeId) setActiveId(next[Math.max(0, next.length - 1)].id);
      return next;
    });
  };

  const findNext = () => {
    const ed = editorRef.current;
    if (!ed || !query) return;
    const model = ed.getModel();
    if (!model) return;
    const matches = model.findMatches(query, true, false, false, null, true);
    if (!matches.length) return;
    const pos = ed.getPosition();
    const next =
      matches.find(
        (m) =>
          m.range.startLineNumber > (pos?.lineNumber ?? 0) ||
          (m.range.startLineNumber === pos?.lineNumber &&
            m.range.startColumn >= (pos?.column ?? 0)),
      ) ?? matches[0];
    ed.setSelection(next.range);
    ed.revealRangeInCenter(next.range);
  };

  const replaceOne = () => {
    const ed = editorRef.current;
    if (!ed || !query) return;
    const sel = ed.getSelection();
    const model = ed.getModel();
    if (!sel || !model) return;
    const selected = model.getValueInRange(sel);
    if (selected === query) {
      ed.executeEdits("replace", [
        { range: sel, text: replacement, forceMoveMarkers: true },
      ]);
    }
    findNext();
  };

  const replaceAll = () => {
    if (!active || !query) return;
    const next = active.content.split(query).join(replacement);
    updateActive({ content: next, dirty: next !== active.content || active.dirty });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      const key = e.key.toLowerCase();
      if (key === "n") {
        e.preventDefault();
        handleNew();
      } else if (key === "o") {
        e.preventDefault();
        void handleOpen();
      } else if (key === "s" && e.altKey) {
        e.preventDefault();
        void persist(true);
      } else if (key === "s") {
        e.preventDefault();
        void persist(false);
      } else if (key === "w") {
        e.preventDefault();
        handleClose(activeId);
      } else if (key === "f") {
        e.preventDefault();
        setFindMode("find");
        setFindOpen(true);
      } else if (key === "h") {
        e.preventDefault();
        setFindMode("replace");
        setFindOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <div className="npp-shell">
      <MenuBar
        onNew={handleNew}
        onOpen={() => void handleOpen()}
        onSave={() => void persist(false)}
        onSaveAs={() => void persist(true)}
        onClose={() => handleClose(activeId)}
        onCloseAll={() => {
          const blank = createUntitled();
          setTabs([blank]);
          setActiveId(blank.id);
        }}
        onFind={() => {
          setFindMode("find");
          setFindOpen(true);
        }}
        onReplace={() => {
          setFindMode("replace");
          setFindOpen(true);
        }}
        onWordWrap={() => setWordWrap((v) => !v)}
        wordWrap={wordWrap}
        onThemeToggle={() => setDark((v) => !v)}
        dark={dark}
        onUndo={() =>
          editorRef.current?.trigger("menu", "undo", null)
        }
        onRedo={() =>
          editorRef.current?.trigger("menu", "redo", null)
        }
        onCut={() =>
          editorRef.current?.trigger("menu", "editor.action.clipboardCutAction", null)
        }
        onCopy={() =>
          editorRef.current?.trigger("menu", "editor.action.clipboardCopyAction", null)
        }
        onPaste={() =>
          editorRef.current?.trigger("menu", "editor.action.clipboardPasteAction", null)
        }
        onSelectAll={() =>
          editorRef.current?.trigger("menu", "editor.action.selectAll", null)
        }
      />

      <TabBar
        tabs={tabs}
        activeId={activeId}
        onSelect={setActiveId}
        onClose={handleClose}
      />

      <FindBar
        open={findOpen}
        mode={findMode}
        query={query}
        replacement={replacement}
        onQuery={setQuery}
        onReplacement={setReplacement}
        onFindNext={findNext}
        onReplace={replaceOne}
        onReplaceAll={replaceAll}
        onClose={() => setFindOpen(false)}
      />

      <div className="editor-pane">
        <Editor
          key={active?.id}
          height="100%"
          theme={dark ? "vs-dark" : "vs"}
          language={active?.language ?? "plaintext"}
          value={active?.content ?? ""}
          onMount={onMount}
          onChange={(value) =>
            updateActive({ content: value ?? "", dirty: true })
          }
          options={{
            fontFamily: "'JetBrains Mono', 'Cascadia Code', Consolas, monospace",
            fontSize: 14,
            minimap: { enabled: false },
            lineNumbers: "on",
            wordWrap: wordWrap ? "on" : "off",
            automaticLayout: true,
            scrollBeyondLastLine: false,
            renderWhitespace: "selection",
            tabSize: 4,
          }}
        />
      </div>

      <StatusBar
        line={cursor.line}
        column={cursor.column}
        length={active?.content.length ?? 0}
        selection={cursor.selection}
        encoding={active?.encoding ?? "UTF-8"}
        language={active?.language ?? "plaintext"}
        onLanguageChange={(id) => updateActive({ language: id })}
        path={active?.path ?? null}
      />
    </div>
  );
}
