import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Editor, { loader, type OnMount } from "@monaco-editor/react";
import type { editor as MonacoEditor } from "monaco-editor";
import { open as openDialog, save as saveDialog } from "@tauri-apps/plugin-dialog";
import { MenuBar } from "./components/MenuBar";
import { TabBar } from "./components/TabBar";
import { StatusBar } from "./components/StatusBar";
import { FindBar } from "./components/FindBar";
import { MarketplacePanel } from "./components/MarketplacePanel";
import { ShortcutMapper } from "./components/ShortcutMapper";
import { DiffPane } from "./components/DiffPane";
import { formatJson, formatXml } from "./lib/formatters";
import {
  createFromFile,
  createUntitled,
  type DocumentTab,
} from "./lib/documents";
import { ENCODINGS, monacoForLanguage } from "./lib/languages";
import { listInstalledPlugins } from "./lib/marketplace";
import {
  activatePlugin,
  EXAMPLE_PLUGIN,
  type PluginPackage,
} from "./lib/plugins";
import { DEFAULT_PLUGINS } from "./lib/defaultPlugins";
import {
  applyChromeTheme,
  BUILTIN_THEMES,
  type ThemePackage,
} from "./lib/themes";
import { dispatchCommand, digestHex, md5 } from "./lib/commandDispatch";
import { matchShortcut } from "./lib/npp/shortcuts";
import { isTauri, readTextFile, writeTextFile } from "./lib/tauri";
import "./App.css";

type Cursor = { line: number; column: number; selection: number };

const THEME_KEY = "nppx.activeThemeId";
const PLUGIN_ENABLED_KEY = "nppx.enabledPlugins";
const MACRO_KEY = "nppx.savedMacros";

function defaultEnabled(): string[] {
  return [EXAMPLE_PLUGIN.id, ...DEFAULT_PLUGINS.map((p) => p.id)];
}

function loadEnabledPlugins(): string[] {
  try {
    const raw = localStorage.getItem(PLUGIN_ENABLED_KEY);
    return raw ? (JSON.parse(raw) as string[]) : defaultEnabled();
  } catch {
    return defaultEnabled();
  }
}

export default function App() {
  const [tabs, setTabs] = useState<DocumentTab[]>(() => [createUntitled()]);
  const [activeId, setActiveId] = useState(() => tabs[0].id);
  const [wordWrap, setWordWrap] = useState(false);
  const [fontSize, setFontSize] = useState(14);
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
  const [shortcutOpen, setShortcutOpen] = useState(false);
  const [activeThemeId, setActiveThemeId] = useState(
    () => localStorage.getItem(THEME_KEY) ?? "npp-2026",
  );
  const [enabledPluginIds, setEnabledPluginIds] = useState(loadEnabledPlugins);
  const [catalogTick, setCatalogTick] = useState(0);
  const [monacoThemeName, setMonacoThemeName] = useState("vs");
  const [recording, setRecording] = useState(false);
  const [macroBuffer, setMacroBuffer] = useState<number[]>([]);
  const [savedMacros, setSavedMacros] = useState<
    Array<{ name: string; steps: number[] }>
  >(() => {
    try {
      return JSON.parse(localStorage.getItem(MACRO_KEY) ?? "[]");
    } catch {
      return [];
    }
  });
  const [diff, setDiff] = useState<{
    original: string;
    modified: string;
    language: string;
    label: string;
  } | null>(null);

  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null);
  const commandHandlers = useRef<Map<string, () => void | Promise<void>>>(
    new Map(),
  );
  const activeIdRef = useRef(activeId);
  activeIdRef.current = activeId;

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
    const base = [...DEFAULT_PLUGINS, EXAMPLE_PLUGIN];
    return [
      ...base,
      ...installed.filter((p) => !base.some((b) => b.id === p.id)),
    ];
  }, [catalogTick]);

  const updateActive = useCallback(
    (patch: Partial<DocumentTab>) => {
      setTabs((prev) =>
        prev.map((t) =>
          t.id === activeIdRef.current ? { ...t, ...patch } : t,
        ),
      );
    },
    [],
  );

  const notify = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2600);
  }, []);

  const applyTheme = useCallback(async (theme: ThemePackage) => {
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
  }, []);

  const wirePlugins = useCallback(() => {
    commandHandlers.current.clear();
    for (const plugin of allPlugins) {
      if (!enabledPluginIds.includes(plugin.id)) continue;
      const api = {
        id: plugin.id,
        notify,
        getActiveText: () => {
          const id = activeIdRef.current;
          return tabs.find((t) => t.id === id)?.content ?? "";
        },
        setActiveText: (text: string) => {
          updateActive({ content: text, dirty: true });
        },
        insertText: (text: string) => {
          const ed = editorRef.current;
          if (!ed) {
            updateActive({
              content: (tabs.find((t) => t.id === activeIdRef.current)?.content ?? "") + text,
              dirty: true,
            });
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
  }, [allPlugins, enabledPluginIds, notify, tabs, updateActive]);

  useEffect(() => {
    const theme =
      allThemes.find((t) => t.id === activeThemeId) ?? BUILTIN_THEMES[0];
    void applyTheme(theme);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    wirePlugins();
  }, [wirePlugins]);

  useEffect(() => {
    localStorage.setItem(PLUGIN_ENABLED_KEY, JSON.stringify(enabledPluginIds));
  }, [enabledPluginIds]);

  useEffect(() => {
    localStorage.setItem(MACRO_KEY, JSON.stringify(savedMacros));
  }, [savedMacros]);

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
    a.download = active.name;
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

  const findNext = (reverse = false) => {
    const ed = editorRef.current;
    if (!ed || !query) return;
    const model = ed.getModel();
    if (!model) return;
    const matches = model.findMatches(query, true, false, false, null, true);
    if (!matches.length) return;
    const pos = ed.getPosition();
    const ordered = reverse ? [...matches].reverse() : matches;
    const next =
      ordered.find((m) =>
        reverse
          ? m.range.startLineNumber < (pos?.lineNumber ?? 0) ||
            (m.range.startLineNumber === pos?.lineNumber &&
              m.range.startColumn < (pos?.column ?? 0))
          : m.range.startLineNumber > (pos?.lineNumber ?? 0) ||
            (m.range.startLineNumber === pos?.lineNumber &&
              m.range.startColumn >= (pos?.column ?? 0)),
      ) ?? ordered[0];
    ed.setSelection(next.range);
    ed.revealRangeInCenter(next.range);
  };

  const runPluginCommand = (_plugin: PluginPackage, commandId: string) => {
    wirePlugins();
    const handler = commandHandlers.current.get(commandId);
    if (!handler) {
      notify(`Command not registered: ${commandId}`);
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
        cmds.push({ plugin, id: cmd.id, title: `${plugin.name}: ${cmd.title}` });
      }
    }
    return cmds;
  }, [allPlugins, enabledPluginIds]);

  const transformSelectionOrDoc = (fn: (s: string) => string) => {
    const ed = editorRef.current;
    const model = ed?.getModel();
    const sel = ed?.getSelection();
    if (ed && model && sel && !sel.isEmpty()) {
      const text = model.getValueInRange(sel);
      ed.executeEdits("xform", [
        { range: sel, text: fn(text), forceMoveMarkers: true },
      ]);
      return;
    }
    updateActive({ content: fn(active?.content ?? ""), dirty: true });
  };

  const runCommand = useCallback(
    async (id: number) => {
      await dispatchCommand(id, {
        notify,
        editor: editorRef.current,
        getText: () =>
          tabs.find((t) => t.id === activeIdRef.current)?.content ?? "",
        setText: (text, dirty = true) => updateActive({ content: text, dirty }),
        transformSelectionOrDoc,
        newFile: handleNew,
        openFile: () => void handleOpen(),
        save: (saveAs) => void persist(!!saveAs),
        close: () => handleClose(activeIdRef.current),
        closeAll: () => {
          const blank = createUntitled();
          setTabs([blank]);
          setActiveId(blank.id);
        },
        exit: () => window.close(),
        find: () => {
          setFindMode("find");
          setFindOpen(true);
        },
        findNext: () => findNext(false),
        findPrev: () => findNext(true),
        replace: () => {
          setFindMode("replace");
          setFindOpen(true);
        },
        gotoLine: () => {
          const n = window.prompt("Go to line:");
          const line = Number(n);
          if (!line) return;
          editorRef.current?.revealLineInCenter(line);
          editorRef.current?.setPosition({ lineNumber: line, column: 1 });
        },
        toggleWordWrap: () => setWordWrap((v) => !v),
        zoom: (delta) =>
          setFontSize((s) => (delta === 0 ? 14 : Math.min(32, Math.max(10, s + delta)))),
        setEncoding: (enc) => updateActive({ encoding: enc }),
        setEol: (eol) => {
          const text =
            tabs.find((t) => t.id === activeIdRef.current)?.content ?? "";
          updateActive({
            content: text.replace(/\r\n|\r|\n/g, eol),
            dirty: true,
          });
          notify(
            eol === "\r\n"
              ? "EOL → Windows (CR LF)"
              : eol === "\n"
                ? "EOL → Unix (LF)"
                : "EOL → Macintosh (CR)",
          );
        },
        openThemeStore: () => {
          setMarketTab("themes");
          setMarketOpen(true);
        },
        openPluginStore: () => {
          setMarketTab("plugins");
          setMarketOpen(true);
        },
        openShortcutMapper: () => setShortcutOpen(true),
        formatDocument: (kind, minify) => {
          try {
            const src = tabs.find((t) => t.id === activeIdRef.current)?.content ?? "";
            const next =
              kind === "json" ? formatJson(src, minify) : formatXml(src, minify);
            updateActive({
              content: next,
              dirty: true,
              language: kind === "json" ? "json" : "xml",
            });
            notify(minify ? `${kind.toUpperCase()} minified` : `${kind.toUpperCase()} formatted`);
          } catch (e) {
            notify(
              `${kind.toUpperCase()} format failed: ${e instanceof Error ? e.message : String(e)}`,
            );
          }
        },
        openDiffTabs: () => {
          const list = tabs;
          if (list.length < 2) {
            notify("Open at least two tabs to compare");
            return;
          }
          const names = list.map((t, i) => `${i + 1}. ${t.name}`).join("\n");
          const pick = window.prompt(
            `Compare active tab with which tab number?\n${names}`,
            list.findIndex((t) => t.id !== activeIdRef.current) + 1 + "",
          );
          const idx = Number(pick) - 1;
          const other = list[idx];
          const cur = list.find((t) => t.id === activeIdRef.current);
          if (!other || !cur || other.id === cur.id) {
            notify("Invalid tab selection");
            return;
          }
          setDiff({
            original: other.content,
            modified: cur.content,
            language: monacoForLanguage(cur.language),
            label: `Diff: ${other.name} ← → ${cur.name}`,
          });
        },
        openDiffClipboard: () => {
          void (async () => {
            try {
              const clip = await navigator.clipboard.readText();
              const cur = tabs.find((t) => t.id === activeIdRef.current);
              setDiff({
                original: clip,
                modified: cur?.content ?? "",
                language: monacoForLanguage(cur?.language ?? "normal"),
                label: "Diff: Clipboard ← → Active",
              });
            } catch {
              notify("Clipboard read failed — allow clipboard permission");
            }
          })();
        },
        exitDiff: () => setDiff(null),
        macroStart: () => {
          setMacroBuffer([]);
          setRecording(true);
          notify("Macro recording started");
        },
        macroStop: () => {
          setRecording(false);
          notify(`Macro recording stopped (${macroBuffer.length} steps)`);
        },
        macroPlay: () => {
          if (!macroBuffer.length) {
            notify("No recorded macro");
            return;
          }
          void (async () => {
            for (const step of macroBuffer) await runCommand(step);
            notify("Macro playback finished");
          })();
        },
        macroSave: () => {
          const name = window.prompt("Macro name:", `Macro ${savedMacros.length + 1}`);
          if (!name) return;
          setSavedMacros((prev) => [...prev, { name, steps: [...macroBuffer] }]);
          notify(`Saved macro “${name}”`);
        },
        macroMulti: () => {
          const times = Number(window.prompt("Run macro how many times?", "1"));
          if (!times || !macroBuffer.length) return;
          void (async () => {
            for (let i = 0; i < times; i++) {
              for (const step of macroBuffer) await runCommand(step);
            }
          })();
        },
        hashSelection: (algo, toClipboard) => {
          const ed = editorRef.current;
          const model = ed?.getModel();
          const sel = ed?.getSelection();
          const text =
            ed && model && sel && !sel.isEmpty()
              ? model.getValueInRange(sel)
              : tabs.find((t) => t.id === activeIdRef.current)?.content ?? "";
          void (async () => {
            const hash =
              algo === "MD5"
                ? md5(text)
                : await digestHex(algo, text);
            if (toClipboard) {
              await navigator.clipboard.writeText(hash);
              notify(`${algo} copied to clipboard`);
            } else {
              window.alert(`${algo}\n${hash}`);
            }
          })();
        },
        runDialog: () => {
          const cmd = window.prompt(
            "Run (opens URL or shows command — sandbox limited):",
            "https://",
          );
          if (!cmd) return;
          if (/^https?:\/\//i.test(cmd)) window.open(cmd, "_blank");
          else notify(`Run command recorded: ${cmd}`);
        },
        recordAction: (cmdId) => {
          if (recording) setMacroBuffer((b) => [...b, cmdId]);
        },
      });
    },
    [
      notify,
      tabs,
      updateActive,
      macroBuffer,
      recording,
      savedMacros.length,
      transformSelectionOrDoc,
    ],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const binding = matchShortcut(e);
      if (!binding) return;
      e.preventDefault();
      void runCommand(binding.id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [runCommand]);

  return (
    <div className="npp-shell">
      <MenuBar
        language={active?.language ?? "normal"}
        encoding={active?.encoding ?? "UTF-8"}
        onCommand={(id) => void runCommand(id)}
        onLanguageChange={(key) => updateActive({ language: key })}
        pluginCommands={pluginCommands}
        onPluginCommand={runPluginCommand}
        recording={recording}
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
        onFindNext={() => findNext(false)}
        onReplace={() => {
          const ed = editorRef.current;
          const sel = ed?.getSelection();
          const model = ed?.getModel();
          if (ed && sel && model && model.getValueInRange(sel) === query) {
            ed.executeEdits("replace", [
              { range: sel, text: replacement, forceMoveMarkers: true },
            ]);
          }
          findNext(false);
        }}
        onReplaceAll={() => {
          if (!query || !active) return;
          updateActive({
            content: active.content.split(query).join(replacement),
            dirty: true,
          });
        }}
        onClose={() => setFindOpen(false)}
      />

      <div className="editor-pane">
        {diff ? (
          <DiffPane
            original={diff.original}
            modified={diff.modified}
            language={diff.language}
            theme={monacoThemeName}
            fontSize={fontSize}
            label={diff.label}
            onExit={() => setDiff(null)}
          />
        ) : (
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
              fontSize,
              minimap: { enabled: true },
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
        )}
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

      <ShortcutMapper open={shortcutOpen} onClose={() => setShortcutOpen(false)} />

      {toast ? <div className="toast">{toast}</div> : null}
      {recording ? <div className="rec-pill">REC</div> : null}
    </div>
  );
}
