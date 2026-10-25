import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Editor, { loader, type OnMount } from "@monaco-editor/react";
import type { editor as MonacoEditor } from "monaco-editor";
import { open as openDialog, save as saveDialog } from "@tauri-apps/plugin-dialog";
import { MenuBar } from "./components/MenuBar";
import { TabBar } from "./components/TabBar";
import { StatusBar } from "./components/StatusBar";
import { FindDialog, type FindActionName, type FindTab } from "./components/FindDialog";
import { FindResults } from "./components/FindResults";
import {
  DEFAULT_FIND_OPTIONS,
  type FindOptions,
} from "./lib/findEngine";
import * as finder from "./lib/findActions";
import { writeClipboardText } from "./lib/clipboard";
import { MarketplacePanel } from "./components/MarketplacePanel";
import { ShortcutMapper } from "./components/ShortcutMapper";
import { DiffPane } from "./components/DiffPane";
import { PreviewPane, type PreviewLayout } from "./components/PreviewPane";
import { PreviewOfferBar } from "./components/PreviewOffer";
import { buildMarkdownPreviewHtml } from "./lib/mdPreviewHtml";
import { exportHtmlAsPdf } from "./lib/exportPdf";
import { detectPreviewOffer, PREVIEW_PLUGIN_IDS } from "./lib/previewOffers";
import {
  PluginDocks,
  type DockPanel,
} from "./components/PluginDocks";
import {
  CompanionBubble,
  type CompanionPanel,
} from "./components/CompanionBubble";
import { AboutDialog } from "./components/AboutDialog";
import { UpdateDialog } from "./components/UpdateDialog";
import { BrowserDownloadBanner } from "./components/BrowserDownloadBanner";
import { BrowserSessionBanner } from "./components/BrowserSessionBanner";
import {
  BrowserWelcomeDialog,
  RELEASES_URL,
} from "./components/BrowserWelcomeDialog";
import { formatJson, formatXml } from "./lib/formatters";
import {
  createDiffTab,
  createFromFile,
  createUntitled,
  isDiffTab,
  type DocumentTab,
} from "./lib/documents";
import { ENCODINGS, monacoForLanguage } from "./lib/languages";
import { BROWSER_OPEN_ACCEPT, OPEN_FILE_FILTERS } from "./lib/fileFilters";
import { listInstalledPlugins } from "./lib/marketplace";
import {
  activatePlugin,
  EXAMPLE_PLUGIN,
  type BottomDockPayload,
  type PluginPackage,
  type PreviewPayload,
  type TypingEvent,
} from "./lib/plugins";
import { DEFAULT_PLUGINS } from "./lib/defaultPlugins";
import { COMMUNITY_PLUGINS } from "./lib/communityPlugins";
import { createTypingMeter } from "./lib/typingMeter";
import {
  applyChromeTheme,
  BUILTIN_THEMES,
  type ThemePackage,
} from "./lib/themes";
import { dispatchCommand, digestHex, md5 } from "./lib/commandDispatch";
import { matchShortcut } from "./lib/npp/shortcuts";
import {
  initialTabsFromSession,
  isRememberSessionEnabled,
  loadSession,
  loadSessionSync,
  saveSession,
  setRememberSessionEnabled,
} from "./lib/session";
import { checkForUpdate, installAvailableUpdate } from "./lib/updater";
import { APP_VERSION, LATEST_RELEASE_URL } from "./lib/appVersion";
import { fetchLatestReleaseNotes, WHATS_NEW } from "./lib/whatsNew";
import {
  disposeClosedTabModels,
  replaceEditorBuffer,
  tabModelPath,
} from "./lib/docModels";
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
    if (!raw) return defaultEnabled();
    const list = JSON.parse(raw) as string[];
    // One-shot: ensure default preview plugins stay on for existing sessions.
    const migrateKey = "nppx.enabledPlugins.previewDefaults.v2";
    if (!localStorage.getItem(migrateKey)) {
      localStorage.setItem(migrateKey, "1");
      const set = new Set(list);
      for (const id of PREVIEW_PLUGIN_IDS) set.add(id);
      return [...set];
    }
    return list;
  } catch {
    return defaultEnabled();
  }
}

export default function App() {
  const boot = useMemo(() => initialTabsFromSession(), []);
  const [tabs, setTabs] = useState<DocumentTab[]>(() => boot.tabs);
  const [activeId, setActiveId] = useState(() => boot.activeId);
  const [wordWrap, setWordWrap] = useState(() => boot.wordWrap);
  const [fontSize, setFontSize] = useState(() => boot.fontSize);
  const [cursor, setCursor] = useState<Cursor>({
    line: 1,
    column: 1,
    selection: 0,
  });
  const [findOpen, setFindOpen] = useState(false);
  const [findTab, setFindTab] = useState<FindTab>("find");
  const [findOptions, setFindOptions] = useState<FindOptions>(
    DEFAULT_FIND_OPTIONS,
  );
  const [findStatus, setFindStatus] = useState("");
  const [results, setResults] = useState<finder.ResultSet | null>(null);
  const findRange = useRef<[number, number] | null>(null);
  const pendingGoto = useRef<{ id: string; index: number; length: number } | null>(null);
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
  /** HTML / CSV previews are per tab id — switching files hides them. */
  const [previews, setPreviews] = useState<Record<string, PreviewPayload>>({});
  const [previewLayouts, setPreviewLayouts] = useState<
    Record<string, PreviewLayout>
  >({});
  const [dismissedOffers, setDismissedOffers] = useState<Record<string, string>>(
    {},
  );
  const [docks, setDocks] = useState<DockPanel[]>([]);
  const [companions, setCompanions] = useState<CompanionPanel[]>([]);
  const [welcomeForceOpen, setWelcomeForceOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [updateUi, setUpdateUi] = useState<{
    open: boolean;
    status: "loading" | "latest" | "available" | "error" | "browser";
    latestVersion?: string;
    notes: string;
    releaseUrl: string;
    error?: string;
    busy?: boolean;
  }>({ open: false, status: "loading", notes: "", releaseUrl: LATEST_RELEASE_URL });


  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null);
  const commandHandlers = useRef<Map<string, () => void | Promise<void>>>(
    new Map(),
  );
  const typingHandlers = useRef(new Map<string, (ev: TypingEvent) => void>());
  const typingMeter = useRef(createTypingMeter());
  const activeIdRef = useRef(activeId);
  activeIdRef.current = activeId;
  const tabsRef = useRef(tabs);
  tabsRef.current = tabs;
  const sessionTimer = useRef<number | null>(null);

  const active = useMemo(
    () => tabs.find((t) => t.id === activeId) ?? tabs[0],
    [tabs, activeId],
  );

  const activePreview = previews[activeId] ?? null;
  const previewLayout: PreviewLayout = previewLayouts[activeId] ?? "split";
  const previewOffer = detectPreviewOffer(
    active?.language ?? "normal",
    active?.content ?? "",
    enabledPluginIds,
  );
  const offerDismissed =
    !!previewOffer && dismissedOffers[activeId] === previewOffer.kind;

  // Drop previews whose tab was closed.
  useEffect(() => {
    setPreviews((prev) => {
      const live = new Set(tabs.map((t) => t.id));
      const keys = Object.keys(prev);
      if (keys.every((k) => live.has(k))) return prev;
      const next: Record<string, PreviewPayload> = {};
      for (const k of keys) if (live.has(k)) next[k] = prev[k];
      return next;
    });
  }, [tabs]);

  // IndexedDB may hold a larger session if localStorage was over quota last time
  useEffect(() => {
    if (loadSessionSync()) return;
    void loadSession().then((s) => {
      if (!s?.tabs.length) return;
      setTabs(s.tabs);
      setActiveId(
        s.tabs.some((t) => t.id === s.activeId) ? s.activeId : s.tabs[0].id,
      );
      setWordWrap(!!s.wordWrap);
      setFontSize(s.fontSize || 14);
    });
  }, []);

  // Debounced session snapshot (N++ “remember current session”)
  useEffect(() => {
    if (sessionTimer.current) window.clearTimeout(sessionTimer.current);
    sessionTimer.current = window.setTimeout(() => {
      const docs = tabs.filter((t) => !isDiffTab(t));
      if (!docs.length) return;
      void saveSession({
        activeId: docs.some((t) => t.id === activeId)
          ? activeId
          : docs[0].id,
        tabs: docs,
        wordWrap,
        fontSize,
      });
    }, 400);
    return () => {
      if (sessionTimer.current) window.clearTimeout(sessionTimer.current);
    };
  }, [tabs, activeId, wordWrap, fontSize]);

  useEffect(() => {
    const flush = () => {
      const docs = tabsRef.current.filter((t) => !isDiffTab(t));
      if (!docs.length) return;
      const aid = activeIdRef.current;
      void saveSession({
        activeId: docs.some((t) => t.id === aid) ? aid : docs[0].id,
        tabs: docs,
        wordWrap,
        fontSize,
      });
    };
    window.addEventListener("beforeunload", flush);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flush();
    });
    return () => window.removeEventListener("beforeunload", flush);
  }, [wordWrap, fontSize]);

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
    const base = [...DEFAULT_PLUGINS, EXAMPLE_PLUGIN, ...COMMUNITY_PLUGINS];
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

  const openUpdateCheck = useCallback(() => {
    void (async () => {
      setAboutOpen(false);
      setUpdateUi({
        open: true,
        status: "loading",
        notes: "",
        releaseUrl: LATEST_RELEASE_URL,
      });
      const remote = await fetchLatestReleaseNotes();
      if (!isTauri()) {
        setUpdateUi({
          open: true,
          status: "browser",
          latestVersion: remote.tag.replace(/^v/, ""),
          notes: remote.body,
          releaseUrl: remote.htmlUrl,
        });
        return;
      }
      const result = await checkForUpdate();
      if (result.kind === "error") {
        setUpdateUi({
          open: true,
          status: "error",
          notes: "",
          releaseUrl: remote.htmlUrl,
          error: result.message,
        });
        return;
      }
      if (result.kind === "available") {
        setUpdateUi({
          open: true,
          status: "available",
          latestVersion: result.version,
          notes: (result.notes ?? "").trim() || remote.body || WHATS_NEW,
          releaseUrl: remote.htmlUrl,
        });
        return;
      }
      setUpdateUi({
        open: true,
        status: "latest",
        latestVersion: remote.tag.replace(/^v/, ""),
        notes: remote.body || WHATS_NEW,
        releaseUrl: remote.htmlUrl,
      });
    })();
  }, []);

  // Desktop: quiet update check a few seconds after launch
  useEffect(() => {
    if (!isTauri()) return;
    const t = window.setTimeout(() => {
      void (async () => {
        const result = await checkForUpdate();
        if (result.kind !== "available") return;
        setUpdateUi({
          open: true,
          status: "available",
          latestVersion: result.version,
          notes: (result.notes ?? "").trim() || WHATS_NEW,
          releaseUrl: LATEST_RELEASE_URL,
        });
      })();
    }, 4000);
    return () => window.clearTimeout(t);
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

  const upsertDock = useCallback((payload: BottomDockPayload, owner: string) => {
    const panel: DockPanel = {
      id: payload.id,
      owner,
      title: payload.title,
      html: payload.html,
      height: payload.height ?? 180,
      allowScripts: !!payload.allowScripts,
    };
    setDocks((prev) => {
      const i = prev.findIndex((d) => d.id === panel.id);
      if (i < 0) return [...prev, panel];
      const next = prev.slice();
      next[i] = panel;
      return next;
    });
  }, []);

  // NOTE: must NOT depend on `tabs` — that re-ran on every keystroke and wiped
  // typing listeners (the Type Runner never moved). Read tabs via tabsRef.
  const wirePlugins = useCallback(() => {
    commandHandlers.current.clear();
    const enabled = new Set(enabledPluginIds);
    // Keep typing subscriptions of still-enabled plugins across rewires.
    for (const id of [...typingHandlers.current.keys()]) {
      if (!enabled.has(id)) typingHandlers.current.delete(id);
    }
    setDocks((prev) => prev.filter((d) => !d.owner || enabled.has(d.owner)));
    setCompanions((prev) =>
      prev.filter((c) => !c.owner || enabled.has(c.owner)),
    );

    const activeTab = () =>
      tabsRef.current.find((t) => t.id === activeIdRef.current);

    for (const plugin of allPlugins) {
      if (!enabled.has(plugin.id)) continue;
      const owner = plugin.id;
      const api = {
        id: plugin.id,
        notify,
        getActiveText: () =>
          editorRef.current?.getModel()?.getValue() ??
          activeTab()?.content ??
          "",
        getActiveFileName: () => activeTab()?.name ?? "",
        getActiveLanguage: () => activeTab()?.language ?? "normal",
        setActiveText: (text: string) => {
          if (!replaceEditorBuffer(editorRef.current, text, "plugin")) {
            updateActive({ content: text, dirty: true });
          }
        },
        insertText: (text: string) => {
          const ed = editorRef.current;
          if (!ed) {
            updateActive({
              content: (activeTab()?.content ?? "") + text,
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
        // Previews are per file: only visible on the tab that opened them.
        openPreview: (payload: PreviewPayload) => {
          const tabId = activeIdRef.current;
          const next: PreviewPayload =
            payload.mode === "markdown"
              ? {
                  title: payload.title,
                  html: buildMarkdownPreviewHtml(payload.html),
                  allowScripts: true,
                  mode: "markdown",
                }
              : payload;
          setPreviews((prev) => ({ ...prev, [tabId]: next }));
          setPreviewLayouts((prev) =>
            prev[tabId] ? prev : { ...prev, [tabId]: "split" },
          );
        },
        closePreview: () => {
          const tabId = activeIdRef.current;
          setPreviews((prev) => {
            if (!(tabId in prev)) return prev;
            const next = { ...prev };
            delete next[tabId];
            return next;
          });
          setPreviewLayouts((prev) => {
            if (!(tabId in prev)) return prev;
            const next = { ...prev };
            delete next[tabId];
            return next;
          });
        },
        openBottomDock: (payload: BottomDockPayload) =>
          upsertDock(payload, owner),
        updateBottomDock: (
          id: string,
          patch: Partial<Omit<BottomDockPayload, "id">>,
        ) => {
          setDocks((prev) =>
            prev.map((d) =>
              d.id === id
                ? {
                    ...d,
                    title: patch.title ?? d.title,
                    html: patch.html ?? d.html,
                    height: patch.height ?? d.height,
                    allowScripts:
                      patch.allowScripts !== undefined
                        ? patch.allowScripts
                        : d.allowScripts,
                  }
                : d,
            ),
          );
        },
        closeBottomDock: (id?: string) => {
          setDocks((prev) => (id ? prev.filter((d) => d.id !== id) : []));
        },
        openCompanion: (payload: {
          id: string;
          html: string;
          speech?: string;
          state?: Record<string, unknown>;
          width?: number;
          height?: number;
          allowMedia?: boolean;
        }) => {
          setCompanions((prev) => {
            const next: CompanionPanel = {
              id: payload.id,
              owner,
              html: payload.html,
              speech: payload.speech,
              state: payload.state,
              width: payload.width,
              height: payload.height,
              allowMedia: payload.allowMedia,
            };
            const i = prev.findIndex((c) => c.id === next.id);
            if (i < 0) return [...prev, next];
            const copy = prev.slice();
            copy[i] = next;
            return copy;
          });
        },
        updateCompanion: (
          id: string,
          patch: {
            html?: string;
            speech?: string;
            state?: Record<string, unknown>;
            width?: number;
            height?: number;
            allowMedia?: boolean;
          },
        ) => {
          setCompanions((prev) =>
            prev.map((c) =>
              c.id === id
                ? {
                    ...c,
                    html: patch.html ?? c.html,
                    width: patch.width ?? c.width,
                    height: patch.height ?? c.height,
                    allowMedia:
                      patch.allowMedia !== undefined
                        ? patch.allowMedia
                        : c.allowMedia,
                    speech:
                      patch.speech !== undefined ? patch.speech : c.speech,
                    state: patch.state ?? c.state,
                  }
                : c,
            ),
          );
        },
        closeCompanion: (id?: string) => {
          setCompanions((prev) => (id ? prev.filter((c) => c.id !== id) : []));
        },
        // One typing listener per plugin; calling again replaces the old one.
        onTyping: (handler: (ev: TypingEvent) => void) => {
          typingHandlers.current.set(owner, handler);
          return () => {
            if (typingHandlers.current.get(owner) === handler) {
              typingHandlers.current.delete(owner);
            }
          };
        },
        registerCommand: (id: string, handler: () => void | Promise<void>) => {
          commandHandlers.current.set(id, handler);
        },
      };
      const result = activatePlugin(plugin, api);
      if (!result.ok) notify(`Plugin ${plugin.id}: ${result.error}`);
    }
  }, [allPlugins, enabledPluginIds, notify, updateActive, upsertDock]);

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

  // Per-tab Monaco models hold undo/redo; dispose when a tab closes (N++ style).
  useEffect(() => {
    let cancelled = false;
    void loader.init().then((monaco) => {
      if (!cancelled) disposeClosedTabModels(monaco, tabs.map((t) => t.id));
    });
    return () => {
      cancelled = true;
    };
  }, [tabs]);

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

  const openPathList = async (paths: string[]) => {
    for (const path of paths) {
      try {
        const file = await readTextFile(path);
        const tab = createFromFile(file.name, file.path, file.content);
        setTabs((prev) => [...prev, tab]);
        setActiveId(tab.id);
      } catch (e) {
        notify(
          `Could not open ${path}: ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    }
  };

  // Desktop: files opened via OS "Open with" / double-click associations
  useEffect(() => {
    if (!isTauri()) return;
    let unlisten: (() => void) | undefined;
    void (async () => {
      try {
        const { invoke } = await import("@tauri-apps/api/core");
        const { listen } = await import("@tauri-apps/api/event");
        const pending = await invoke<string[]>("take_pending_files");
        if (pending?.length) await openPathList(pending);
        unlisten = await listen<string[]>("nppx-open-files", (ev) => {
          void openPathList(ev.payload ?? []);
        });
      } catch {
        /* older shell without command */
      }
    })();
    return () => unlisten?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exportActivePreviewPdf = (opts?: { allowEditorPrint?: boolean }) => {
    void (async () => {
      const preview = previews[activeIdRef.current];
      if (!preview) {
        if (opts?.allowEditorPrint) {
          window.print();
          return;
        }
        notify("Open an HTML, CSV, or Markdown preview first");
        return;
      }
      notify("Opening print dialog — choose Save as PDF");
      const result = await exportHtmlAsPdf(preview.html);
      if (result === "blocked" || result === "error") {
        notify("PDF export failed — try File → Export Preview as PDF again");
      }
    })();
  };

  const handleOpen = async () => {
    if (isTauri()) {
      const selected = await openDialog({
        multiple: false,
        filters: [...OPEN_FILE_FILTERS],
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
    input.accept = BROWSER_OPEN_ACCEPT;
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
    const content =
      editorRef.current?.getModel()?.getValue() ?? active.content;
    let path = active.path;
    if (isTauri()) {
      if (saveAs || !path) {
        const picked = await saveDialog({ defaultPath: active.name });
        if (!picked) return;
        path = picked;
      }
      await writeTextFile(path, content);
      const name = path.split(/[/\\]/).pop() ?? active.name;
      updateActive({ path, name, content, dirty: false });
      return;
    }
    const blob = new Blob([content], { type: "text/plain" });
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

  const findCtx = (): finder.FindCtx => ({
    ed: editorRef.current,
    tabs: tabsRef.current,
    activeId: activeIdRef.current,
    query,
    options: findOptions,
    range: findRange.current,
    goto: gotoHit,
  });

  const gotoHit = (tabId: string, index: number, length: number) => {
    if (tabId !== activeIdRef.current) {
      pendingGoto.current = { id: tabId, index, length };
      setActiveId(tabId);
      return;
    }
    revealOffset(index, length);
  };

  const revealOffset = (index: number, length: number) => {
    const ed = editorRef.current;
    const model = ed?.getModel();
    if (!ed || !model) return;
    const a = model.getPositionAt(index);
    const b = model.getPositionAt(index + length);
    const range = {
      startLineNumber: a.lineNumber,
      startColumn: a.column,
      endLineNumber: b.lineNumber,
      endColumn: b.column,
    };
    ed.setSelection(range);
    ed.revealRangeInCenter(range);
    ed.focus();
  };

  useEffect(() => {
    const g = pendingGoto.current;
    if (!g || g.id !== activeId) return;
    pendingGoto.current = null;
    const t = window.setTimeout(() => revealOffset(g.index, g.length), 80);
    return () => window.clearTimeout(t);
  }, [activeId]);

  const showOutcome = (o: finder.Outcome) => setFindStatus(o.message);

  const findNext = (reverse = false) => {
    if (!query) {
      setFindTab("find");
      setFindOpen(true);
      return;
    }
    showOutcome(finder.findNext(findCtx(), reverse ? !findOptions.backward : undefined));
  };

  const runFind = (a: FindActionName) => {
    const ctx = findCtx();
    switch (a) {
      case "findNext":
        return showOutcome(finder.findNext(ctx));
      case "count":
        return showOutcome(finder.count(ctx));
      case "findAllCurrent":
      case "findAllOpened": {
        const r = finder.findAll(ctx, a === "findAllOpened");
        if ("error" in r) return setFindStatus(r.error);
        setResults(r.results);
        return setFindStatus(`Find All: ${r.results.total} hit${r.results.total === 1 ? "" : "s"}`);
      }
      case "replace":
        return showOutcome(finder.replaceOne(ctx, replacement));
      case "replaceAll":
      case "replaceAllOpened":
        return showOutcome(
          finder.replaceAll(ctx, replacement, a === "replaceAllOpened", (id, content) =>
            setTabs((prev) =>
              prev.map((t) => (t.id === id ? { ...t, content, dirty: true } : t)),
            ),
          ),
        );
      case "markAll":
        return showOutcome(finder.markAll(ctx));
      case "clearMarks":
        finder.clearMarks();
        return setFindStatus("Marks cleared");
      case "copyMarked": {
        const text = finder.markedTextJoined();
        if (!text) return setFindStatus("Nothing is marked");
        void writeClipboardText(text);
        return setFindStatus("Marked text copied to clipboard");
      }
    }
  };

  const openFind = (tab: FindTab) => {
    const ed = editorRef.current;
    const model = ed?.getModel();
    const sel = ed?.getSelection();
    if (ed && model && sel && !sel.isEmpty() && sel.startLineNumber === sel.endLineNumber) {
      setQuery(model.getValueInRange(sel));
    }
    setFindTab(tab);
    setFindOpen(true);
  };

  const runPluginCommand = (_plugin: PluginPackage, commandId: string) => {
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
        cmds.push({ plugin, id: cmd.id, title: cmd.title });
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
    const src = model?.getValue() ?? active?.content ?? "";
    if (!replaceEditorBuffer(ed, fn(src), "xform")) {
      updateActive({ content: fn(src), dirty: true });
    }
  };

  const runCommand = useCallback(
    async (id: number) => {
      await dispatchCommand(id, {
        notify,
        editor: editorRef.current,
        getText: () =>
          editorRef.current?.getModel()?.getValue() ??
          tabs.find((t) => t.id === activeIdRef.current)?.content ??
          "",
        setText: (text, dirty = true) => {
          if (!replaceEditorBuffer(editorRef.current, text, "setText")) {
            updateActive({ content: text, dirty });
          } else if (!dirty) {
            updateActive({ dirty: false });
          }
        },
        transformSelectionOrDoc,
        newFile: handleNew,
        openFile: () => void handleOpen(),
        print: () => exportActivePreviewPdf({ allowEditorPrint: true }),
        exportPreviewPdf: () => exportActivePreviewPdf(),
        save: (saveAs) => void persist(!!saveAs),
        close: () => handleClose(activeIdRef.current),
        closeAll: () => {
          const blank = createUntitled();
          setTabs([blank]);
          setActiveId(blank.id);
        },
        exit: () => window.close(),
        find: () => openFind("find"),
        findNext: () => findNext(false),
        findPrev: () => findNext(true),
        replace: () => openFind("replace"),
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
            editorRef.current?.getModel()?.getValue() ??
            tabs.find((t) => t.id === activeIdRef.current)?.content ??
            "";
          const next = text.replace(/\r\n|\r|\n/g, eol);
          if (!replaceEditorBuffer(editorRef.current, next, "eol")) {
            updateActive({ content: next, dirty: true });
          }
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
            const src =
              editorRef.current?.getModel()?.getValue() ??
              tabs.find((t) => t.id === activeIdRef.current)?.content ??
              "";
            const next =
              kind === "json" ? formatJson(src, minify) : formatXml(src, minify);
            if (!replaceEditorBuffer(editorRef.current, next, "format")) {
              updateActive({ content: next, dirty: true });
            }
            updateActive({ language: kind === "json" ? "json" : "xml" });
            notify(minify ? `${kind.toUpperCase()} minified` : `${kind.toUpperCase()} formatted`);
          } catch (e) {
            notify(
              `${kind.toUpperCase()} format failed: ${e instanceof Error ? e.message : String(e)}`,
            );
          }
        },
        openDiffTabs: () => {
          const list = tabsRef.current.filter((t) => !isDiffTab(t));
          if (list.length < 2) {
            notify("Open at least two document tabs to compare");
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
          const tab = createDiffTab(
            `Diff: ${other.name} ← → ${cur.name}`,
            other.content,
            cur.content,
            monacoForLanguage(cur.language),
          );
          setTabs((prev) => [...prev, tab]);
          setActiveId(tab.id);
        },
        openDiffClipboard: () => {
          void (async () => {
            try {
              const clip = await navigator.clipboard.readText();
              const cur =
                tabsRef.current.find((t) => t.id === activeIdRef.current) ??
                tabsRef.current.find((t) => !isDiffTab(t));
              const tab = createDiffTab(
                "Diff: Clipboard ← → Active",
                clip,
                cur?.content ?? "",
                monacoForLanguage(cur?.language ?? "normal"),
              );
              setTabs((prev) => [...prev, tab]);
              setActiveId(tab.id);
            } catch {
              notify("Clipboard read failed — allow clipboard permission");
            }
          })();
        },
        exitDiff: () => {
          const cur = tabsRef.current.find((t) => t.id === activeIdRef.current);
          if (isDiffTab(cur)) handleClose(cur!.id);
        },
        toggleRememberSession: () => {
          const next = !isRememberSessionEnabled();
          setRememberSessionEnabled(next);
          if (next) {
            void saveSession({
              activeId: activeIdRef.current,
              tabs: tabsRef.current,
              wordWrap,
              fontSize,
            });
            notify("Session restore ON — tabs & unsaved edits kept for next launch");
          } else {
            notify("Session restore OFF");
          }
        },
        checkForUpdates: (interactive) => {
          if (interactive) openUpdateCheck();
        },
        showDownloadDesktop: () => {
          if (!isTauri()) {
            setWelcomeForceOpen(true);
            return;
          }
          void import("@tauri-apps/plugin-opener").then(({ openUrl }) =>
            openUrl(RELEASES_URL),
          );
        },
        showAbout: () => setAboutOpen(true),
        showFileTypesHelp: () => {
          window.alert(
            "npp-x file types\n\n" +
              "Desktop installs register npp-x for:\n" +
              "  • .txt / .text\n" +
              "  • .csv / .tsv\n" +
              "  • .html / .htm\n" +
              "  • .md / .markdown\n\n" +
              "To make npp-x the default opener:\n" +
              "  macOS — Get Info → Open with → npp-x → Change All…\n" +
              "  Windows — Settings → Apps → Default apps\n" +
              "  Linux — Right-click → Open With → npp-x\n\n" +
              "Then double-click those files to open them here — with HTML / CSV / Markdown preview + Export PDF.",
          );
        },
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
      openUpdateCheck,
      tabs,
      updateActive,
      macroBuffer,
      recording,
      savedMacros.length,
      transformSelectionOrDoc,
      wordWrap,
      fontSize,
    ],
  );

  useEffect(() => {
    // Capture phase: own Cmd/Ctrl shortcuts before Monaco/WebView can eat them
    // (WKWebView on macOS often breaks Monaco's built-in clipboard actions).
    const onKey = (e: KeyboardEvent) => {
      const binding = matchShortcut(e);
      if (!binding) return;
      e.preventDefault();
      e.stopPropagation();
      void runCommand(binding.id);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [runCommand]);

  return (
    <div className="npp-shell">
      <BrowserWelcomeDialog
        autoOpen={!isTauri()}
        forceOpen={welcomeForceOpen}
        onClose={() => setWelcomeForceOpen(false)}
      />
      <BrowserDownloadBanner visible={!isTauri()} />
      <BrowserSessionBanner visible={!isTauri()} />
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

      {findOpen ? (
        <FindDialog
          tab={findTab}
          onTab={setFindTab}
          query={query}
          replacement={replacement}
          options={findOptions}
          status={findStatus}
          hasSelection={() => {
            const ed = editorRef.current;
            const model = ed?.getModel();
            const sel = ed?.getSelection();
            if (!ed || !model || !sel || sel.isEmpty()) return false;
            findRange.current = [
              model.getOffsetAt({ lineNumber: sel.startLineNumber, column: sel.startColumn }),
              model.getOffsetAt({ lineNumber: sel.endLineNumber, column: sel.endColumn }),
            ];
            return true;
          }}
          onQuery={setQuery}
          onReplacement={setReplacement}
          onOptions={(patch) => setFindOptions((o) => ({ ...o, ...patch }))}
          onAction={runFind}
          onClose={() => {
            setFindOpen(false);
            editorRef.current?.focus();
          }}
        />
      ) : null}

      <div className="editor-pane">
        {isDiffTab(active) && active.view ? (
          <DiffPane
            original={active.view.original}
            modified={active.view.modified}
            language={active.view.language}
            theme={monacoThemeName}
            fontSize={fontSize}
            label={active.name}
            onExit={() => handleClose(active.id)}
          />
        ) : (
          <>
            {!activePreview && previewOffer && !offerDismissed ? (
              <PreviewOfferBar
                offer={previewOffer}
                onPreview={() => {
                  const plugin = allPlugins.find(
                    (p) => p.id === previewOffer.pluginId,
                  );
                  if (plugin) runPluginCommand(plugin, previewOffer.commandId);
                }}
                onDismiss={() =>
                  setDismissedOffers((prev) => ({
                    ...prev,
                    [activeId]: previewOffer.kind,
                  }))
                }
              />
            ) : null}
            <div
              className={
                "editor-split" +
                (activePreview
                  ? previewLayout === "full"
                    ? " is-full-preview"
                    : " is-split"
                  : "")
              }
            >
              {!(activePreview && previewLayout === "full") ? (
                <div className="editor-half">
                  <Editor
                    path={tabModelPath(active?.id ?? "none")}
                    keepCurrentModel
                    height="100%"
                    theme={monacoThemeName}
                    language={monacoForLanguage(active?.language ?? "normal")}
                    value={active?.content ?? ""}
                    onMount={onMount}
                    onChange={(value) => {
                      const text = value ?? "";
                      updateActive({ content: text, dirty: true });
                      if (typingHandlers.current.size) {
                        const ev = typingMeter.current.note(text.length);
                        for (const h of typingHandlers.current.values()) h(ev);
                      }
                    }}
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
                </div>
              ) : null}
              {activePreview ? (
                <PreviewPane
                  title={activePreview.title}
                  html={activePreview.html}
                  allowScripts={activePreview.allowScripts}
                  layout={previewLayout}
                  onLayout={(layout) =>
                    setPreviewLayouts((prev) => ({
                      ...prev,
                      [activeId]: layout,
                    }))
                  }
                  onRefresh={
                    activePreview.mode === "markdown"
                      ? () => {
                          const raw = active?.content ?? "";
                          setPreviews((prev) => ({
                            ...prev,
                            [activeId]: {
                              ...activePreview,
                              html: buildMarkdownPreviewHtml(raw),
                            },
                          }));
                        }
                      : undefined
                  }
                  onExportPdf={exportActivePreviewPdf}
                  onClose={() =>
                    setPreviews((prev) => {
                      const next = { ...prev };
                      delete next[activeId];
                      return next;
                    })
                  }
                />
              ) : null}
            </div>
          </>
        )}
      </div>

      <FindResults
        results={results}
        onGoto={gotoHit}
        onClose={() => setResults(null)}
      />

      <PluginDocks
        docks={docks}
        onClose={(id) => setDocks((prev) => prev.filter((d) => d.id !== id))}
      />

      <CompanionBubble
        companions={companions}
        onClose={(id) =>
          setCompanions((prev) => prev.filter((c) => c.id !== id))
        }
        onFocusEditor={() => editorRef.current?.focus()}
      />

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

      <AboutDialog
        open={aboutOpen}
        onClose={() => setAboutOpen(false)}
        onCheckUpdates={openUpdateCheck}
      />

      <UpdateDialog
        open={updateUi.open}
        status={updateUi.status}
        currentVersion={APP_VERSION}
        latestVersion={updateUi.latestVersion}
        notes={updateUi.notes}
        releaseUrl={updateUi.releaseUrl}
        error={updateUi.error}
        busy={updateUi.busy}
        onClose={() => setUpdateUi((u) => ({ ...u, open: false, busy: false }))}
        onOpenRelease={() => {
          void (async () => {
            if (isTauri()) {
              const { openUrl } = await import("@tauri-apps/plugin-opener");
              await openUrl(updateUi.releaseUrl);
            } else {
              window.open(updateUi.releaseUrl, "_blank");
            }
          })();
        }}
        onInstall={() => {
          void (async () => {
            setUpdateUi((u) => ({ ...u, busy: true }));
            notify("Downloading update…");
            const installed = await installAvailableUpdate();
            if (installed.kind === "error") {
              setUpdateUi((u) => ({
                ...u,
                busy: false,
                status: "error",
                error: installed.message,
              }));
              notify(`Update failed: ${installed.message}`);
            }
          })();
        }}
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
