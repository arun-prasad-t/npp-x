export type PluginCommand = {
  id: string;
  title: string;
};

export type PluginPackage = {
  schema: "npp-x.plugin/1";
  id: string;
  name: string;
  author?: string;
  version: string;
  description?: string;
  source?: string;
  /** Inline JS using `nppx` host API. Prefer this for git/raw installs. */
  code?: string;
  contributes?: {
    commands?: PluginCommand[];
    menus?: { tools?: string[] };
  };
};

export type PreviewPayload = {
  title: string;
  html: string;
};

export type BottomDockPayload = {
  /** Stable id so plugins can update/close their own panel. */
  id: string;
  title: string;
  html: string;
  /** CSS height in px (default 180). */
  height?: number;
  /** Needed for YouTube embeds; prefer false. */
  allowScripts?: boolean;
};

export type TypingEvent = {
  cps: number;
  delta: number;
  idleMs: number;
};

export type PluginHostApi = {
  id: string;
  notify: (message: string) => void;
  getActiveText: () => string;
  getActiveFileName: () => string;
  getActiveLanguage: () => string;
  setActiveText: (text: string) => void;
  insertText: (text: string) => void;
  /** Sandboxed HTML preview pane (optional plugins: HTML design, CSV tables, …). */
  openPreview: (payload: PreviewPayload) => void;
  closePreview: () => void;
  /** Bottom companion panel while editing (YouTube, Type Runner, …). */
  openBottomDock: (payload: BottomDockPayload) => void;
  updateBottomDock: (
    id: string,
    patch: Partial<Omit<BottomDockPayload, "id">>,
  ) => void;
  closeBottomDock: (id?: string) => void;
  /** Fires on editor edits; return unsubscribe. Cleared when plugins rewire. */
  onTyping: (handler: (ev: TypingEvent) => void) => () => void;
  registerCommand: (id: string, handler: () => void | Promise<void>) => void;
};

export type InstalledPlugin = PluginPackage & {
  enabled: boolean;
};

export function isPluginPackage(value: unknown): value is PluginPackage {
  if (!value || typeof value !== "object") return false;
  const p = value as PluginPackage;
  return (
    p.schema === "npp-x.plugin/1" &&
    typeof p.id === "string" &&
    typeof p.name === "string" &&
    typeof p.version === "string"
  );
}

export const EXAMPLE_PLUGIN: PluginPackage = {
  schema: "npp-x.plugin/1",
  id: "nppx.hello",
  name: "Hello npp-x",
  author: "npp-x",
  version: "1.0.0",
  description: "Demo plugin: insert a greeting and toast.",
  contributes: {
    commands: [{ id: "nppx.hello.greet", title: "Insert Greeting" }],
    menus: { tools: ["nppx.hello.greet"] },
  },
  code: `
nppx.registerCommand("nppx.hello.greet", () => {
  nppx.insertText("// Hello from an npp-x plugin\\n");
  nppx.notify("Hello plugin ran");
});
`,
};

/** Run plugin code against a restricted host API. */
export function activatePlugin(
  plugin: PluginPackage,
  api: PluginHostApi,
): { ok: true } | { ok: false; error: string } {
  if (!plugin.code?.trim()) {
    return { ok: false, error: "Plugin has no code field" };
  }
  try {
    // eslint-disable-next-line no-new-func
    const runner = new Function("nppx", plugin.code);
    runner(api);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
