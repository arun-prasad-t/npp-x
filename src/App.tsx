import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Editor, { loader, type OnMount } from "@monaco-editor/react";
import type { editor as MonacoEditor } from "monaco-editor";
import { open as openDialog, save as saveDialog } from "@tauri-apps/plugin-dialog";
import { MenuBar } from "./components/MenuBar";
import { TabBar } from "./components/TabBar";
import { StatusBar } from "./components/StatusBar";
import { FindBar } from "./components/FindBar";
import { MarketplacePanel } from "./components/MarketplacePanel";
import {
  createFromFile,
  createUntitled,
  type DocumentTab,
} from "./lib/documents";
import { ENCODINGS, monacoForLanguage } from "./lib/languages";
import {
  listInstalledPlugins,
} from "./lib/marketplace";
import {
  activatePlugin,
  EXAMPLE_PLUGIN,
  type PluginPackage,
} from "./lib/plugins";
import {
  applyChromeTheme,
  BUILTIN_THEMES,
  type ThemePackage,
} from "./lib/themes";
import { isTauri, readTextFile, writeTextFile } from "./lib/tauri";
import "./App.css";

type Cursor = { line: number; column: number; selection: number };

const THEME_KEY = "nppx.activeThemeId";
const PLUGIN_ENABLED_KEY = "nppx.enabledPlugins";

function loadEnabledPlugins(): string[] {
  try {
    const raw = localStorage.getItem(PLUGIN_ENABLED_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [EXAMPLE_PLUGIN.id];
  } catch {
    return [EXAMPLE_PLUGIN.id];
  }
}

export default function App() {
  const [tabs, setTabs] = useState<DocumentTab[]>(() => [createUntitled()]);
  const [activeId, setActiveId] = useState(() => tabs[0].id);
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
  const [toast, setToast] = useState<string | null>(null);
  const [marketOpen, setMarketOpen] = useState(false);
  const [marketTab, setMarketTab] = useState<"themes" | "plugins">("themes");
  const [activeThemeId, setActiveThemeId] = useState(
    () => localStorage.getItem(THEME_KEY) ?? "npp-classic",
  );
  const [enabledPluginIds, setEnabledPluginIds] = useState(loadEnabledPlugins);
  const [catalogTick, setCatalogTick] = useState(0);
  const [monacoThemeName, setMonacoThemeName] = useState("vs");

  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null);
  const commandHandlers = useRef<Map<string, () => void | Promise<void>>>(
    new Map(),
  );

  const active = useMemo(
    () => tabs.find((t) => t.id === activeId) ?? tabs[0],
    [tabs, activeId],
  );

  const allThemes = useMemo(() => {
    void catalogTick;
    const installed = JSON.parse(
      localStorage.getItem("nppx.installed.themes") ?? "[]",
    ) as ThemePackage[];
    return [
      ...BUILTIN_THEMES,
      ...installed.filter((t) => !BUILTIN_THEMES.some((b) => b.id === t.id)),
    ];
  }, [catalogTick]);

  const allPlugins = useMemo(() => {
    void catalogTick;
    const installed = listInstalledPlugins();
    return [
      EXAMPLE_PLUGIN,
      ...installed.filter((p) => p.id !== EXAMPLE_PLUGIN.id),
    ];
  }, [catalogTick]);

  const updateActive = useCallback(
    (patch: Partial<DocumentTab>) => {
      setTabs((prev) =>
        prev.map((t) => (t.id === activeId ? { ...t, ...patch } : t)),
      );
    },
    [activeId],
  );

  const notify = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2400);
  }, []);

  const applyTheme = useCallback(
    async (theme: ThemePackage) => {
      applyChromeTheme(theme);
      setActiveThemeId(theme.id);
      localStorage.setItem(THEME_KEY, theme.id);
      const monaco = await loader.init();
      const name = `nppx-${theme.id}`;
      monaco.editor.defineTheme(name, {
        base: theme.monaco.base,
        inherit: theme.monaco.inherit ?? true,
        rules: theme.monaco.rules ?? [],
        colors: theme.monaco.colors ?? {},
      });
      monaco.editor.setTheme(name);
      setMonacoThemeName(name);
      editorRef.current?.updateOptions({});
    },
    [],
  );

  const wirePlugins = useCallback(() => {
    commandHandlers.current.clear();
    for (const plugin of allPlugins) {
      if (!enabledPluginIds.includes(plugin.id)) continue;
      const api = {
        id: plugin.id,
        notify,
        getActiveText: () => {
          const tab = tabs.find((t) => t.id === activeId);
          return tab?.content ?? "";
        },
        setActiveText: (text: string) => {
          setTabs((prev) =>
            prev.map((t) =>
              t.id === activeId ? { ...t, content: text, dirty: true } : t,
            ),
          );
        },
        insertText: (text: string) => {
          const ed = editorRef.current;
          if (!ed) {
            setTabs((prev) =>
              prev.map((t) =>
                t.id === activeId
                  ? { ...t, content: t.content + text, dirty: true }
                  : t,
              ),
            );
            return;
          }
          const sel = ed.getSelection();
          if (!sel) return;
          ed.executeEdits("plugin", [
            { range: sel, text, forceMoveMarkers: true },
          ]);
        },
        registerCommand: (id: string, handler: () => void | Promise<void>) => {
          commandHandlers.current.set(id, handler);
        },
      };
      const result = activatePlugin(plugin, api);
      if (!result.ok) notify(`Plugin ${plugin.id}: ${result.error}`);
    }
  }, [allPlugins, enabledPluginIds, notify, tabs, activeId]);

  useEffect(() => {
    const theme =
      allThemes.find((t) => t.id === activeThemeId) ?? BUILTIN_THEMES[0];
    void applyTheme(theme);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- boot once

  useEffect(() => {
    wirePlugins();
  }, [wirePlugins]);

  useEffect(() => {
    localStorage.setItem(PLUGIN_ENABLED_KEY, JSON.stringify(enabledPluginIds));
  }, [enabledPluginIds]);

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
        const picked = await saveDialog({ defaultPath: active.name });
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
    if (model.getValueInRange(sel) === query) {
      ed.executeEdits("replace", [
        { range: sel, text: replacement, forceMoveMarkers: true },
      ]);
    }
    findNext();
  };

  const replaceAll = () => {
    if (!active || !query) return;
    const next = active.content.split(query).join(replacement);
    updateActive({ content: next, dirty: true });
  };

  const runPluginCommand = (plugin: PluginPackage, commandId: string) => {
    wirePlugins();
    const handler = commandHandlers.current.get(commandId);
    if (!handler) {
      notify(`Command not registered: ${commandId} (${plugin.name})`);
      return;
    }
    void handler();
  };

  const pluginCommands = useMemo(() => {
    const cmds: Array<{ plugin: PluginPackage; id: string; title: string }> =
      [];
    for (const plugin of allPlugins) {
      if (!enabledPluginIds.includes(plugin.id)) continue;
      for (const cmd of plugin.contributes?.commands ?? []) {
        cmds.push({ plugin, id: cmd.id, title: cmd.title });
      }
    }
    return cmds;
  }, [allPlugins, enabledPluginIds]);

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
        onUndo={() => editorRef.current?.trigger("menu", "undo", null)}
        onRedo={() => editorRef.current?.trigger("menu", "redo", null)}
        onCut={() =>
          editorRef.current?.trigger(
            "menu",
            "editor.action.clipboardCutAction",
            null,
          )
        }
        onCopy={() =>
          editorRef.current?.trigger(
            "menu",
            "editor.action.clipboardCopyAction",
            null,
          )
        }
        onPaste={() =>
          editorRef.current?.trigger(
            "menu",
            "editor.action.clipboardPasteAction",
            null,
          )
        }
        onSelectAll={() =>
          editorRef.current?.trigger("menu", "editor.action.selectAll", null)
        }
        language={active?.language ?? "normal"}
        encoding={active?.encoding ?? "UTF-8"}
        onLanguageChange={(key) => updateActive({ language: key })}
        onEncodingChange={(encoding) => updateActive({ encoding })}
        onOpenThemeStore={() => {
          setMarketTab("themes");
          setMarketOpen(true);
        }}
        onOpenPluginStore={() => {
          setMarketTab("plugins");
          setMarketOpen(true);
        }}
        pluginCommands={pluginCommands}
        onPluginCommand={runPluginCommand}
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
          theme={monacoThemeName}
          language={monacoForLanguage(active?.language ?? "normal")}
          value={active?.content ?? ""}
          onMount={onMount}
          onChange={(value) =>
            updateActive({ content: value ?? "", dirty: true })
          }
          options={{
            fontFamily:
              "'JetBrains Mono', 'Cascadia Code', Consolas, monospace",
            fontSize: 14,
            minimap: { enabled: true, scale: 1 },
            lineNumbers: "on",
            wordWrap: wordWrap ? "on" : "off",
            automaticLayout: true,
            scrollBeyondLastLine: false,
            renderWhitespace: "selection",
            tabSize: 4,
            smoothScrolling: true,
            cursorBlinking: "smooth",
            cursorSmoothCaretAnimation: "on",
          }}
        />
      </div>

      <StatusBar
        line={cursor.line}
        column={cursor.column}
        length={active?.content.length ?? 0}
        selection={cursor.selection}
        encoding={active?.encoding ?? "UTF-8"}
        language={active?.language ?? "normal"}
        onLanguageChange={(key) => updateActive({ language: key })}
        onEncodingChange={(encoding) => updateActive({ encoding })}
        encodings={ENCODINGS}
        path={active?.path ?? null}
      />

      <MarketplacePanel
        open={marketOpen}
        tab={marketTab}
        activeThemeId={activeThemeId}
        onClose={() => setMarketOpen(false)}
        onSelectTheme={(theme) => void applyTheme(theme)}
        onInstall={() => setCatalogTick((n) => n + 1)}
        onRunPluginCommand={runPluginCommand}
        enabledPluginIds={enabledPluginIds}
        onTogglePlugin={(id, enabled) => {
          setEnabledPluginIds((prev) =>
            enabled
              ? Array.from(new Set([...prev, id]))
              : prev.filter((x) => x !== id),
          );
        }}
      />

      {toast ? <div className="toast">{toast}</div> : null}
    </div>
  );
}
