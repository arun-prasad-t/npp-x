export type ThemePackage = {
  schema: "npp-x.theme/1";
  id: string;
  name: string;
  author?: string;
  version: string;
  description?: string;
  source?: string;
  chrome: Record<string, string>;
  monaco: {
    base: "vs" | "vs-dark" | "hc-black" | "hc-light";
    inherit?: boolean;
    rules?: Array<{
      token: string;
      foreground?: string;
      background?: string;
      fontStyle?: string;
    }>;
    colors?: Record<string, string>;
  };
};

export const BUILTIN_THEMES: ThemePackage[] = [
  {
    schema: "npp-x.theme/1",
    id: "npp-2026",
    name: "npp-x 2026",
    author: "npp-x",
    version: "1.0.0",
    description: "Dense slate IDE chrome with run-green accent (ui-ux-pro-max).",
    chrome: {
      "--npp-chrome": "#0f172a",
      "--npp-chrome-2": "#0b1220",
      "--npp-border": "#334155",
      "--npp-text": "#f8fafc",
      "--npp-accent": "#22c55e",
      "--npp-accent-deep": "#86efac",
      "--npp-tab": "#1e293b",
      "--npp-tab-active": "#273449",
      "--npp-status": "#0b1220",
      "--npp-menu-bg": "#1e293b",
      "--npp-find": "#152033",
      "--npp-shadow": "0 16px 40px rgba(0, 0, 0, 0.45)",
      "color-scheme": "dark",
    },
    monaco: {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "64748b" },
        { token: "string", foreground: "86efac" },
        { token: "keyword", foreground: "4ade80" },
      ],
      colors: {
        "editor.background": "#0f172a",
        "editor.foreground": "#f8fafc",
        "editorLineNumber.foreground": "#64748b",
        "editorCursor.foreground": "#22c55e",
        "editor.selectionBackground": "#22c55e33",
        "editor.lineHighlightBackground": "#1e293b",
      },
    },
  },
  {
    schema: "npp-x.theme/1",
    id: "npp-classic",
    name: "N++ Classic",
    author: "npp-x",
    version: "1.1.0",
    description: "Daylight slate chrome with Notepad++ green accents.",
    chrome: {
      "--npp-chrome": "#f1f5f9",
      "--npp-chrome-2": "#e2e8f0",
      "--npp-border": "#cbd5e1",
      "--npp-text": "#0f172a",
      "--npp-accent": "#16a34a",
      "--npp-accent-deep": "#14532d",
      "--npp-tab": "#e2e8f0",
      "--npp-tab-active": "#ffffff",
      "--npp-status": "#e2e8f0",
      "--npp-menu-bg": "#ffffff",
      "--npp-find": "#f8fafc",
      "--npp-shadow": "0 10px 28px rgba(15, 23, 42, 0.1)",
      "color-scheme": "light",
    },
    monaco: {
      base: "vs",
      inherit: true,
      colors: {
        "editor.background": "#ffffff",
        "editor.lineHighlightBackground": "#f0fdf4",
        "editor.selectionBackground": "#16a34a33",
      },
    },
  },
  {
    schema: "npp-x.theme/1",
    id: "npp-midnight",
    name: "N++ Midnight",
    author: "npp-x",
    version: "1.1.0",
    description: "Forest-dark chrome for late sessions.",
    chrome: {
      "--npp-chrome": "#111814",
      "--npp-chrome-2": "#0c100d",
      "--npp-border": "#2a342c",
      "--npp-text": "#e7ecdf",
      "--npp-accent": "#4ade80",
      "--npp-accent-deep": "#bbf7d0",
      "--npp-tab": "#1a221c",
      "--npp-tab-active": "#243028",
      "--npp-status": "#0c100d",
      "--npp-menu-bg": "#1a221c",
      "--npp-find": "#152018",
      "--npp-shadow": "0 12px 32px rgba(0, 0, 0, 0.45)",
      "color-scheme": "dark",
    },
    monaco: {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "6a9955" },
        { token: "string", foreground: "ce9178" },
        { token: "keyword", foreground: "a8d08d" },
      ],
      colors: {
        "editor.background": "#111814",
        "editor.foreground": "#e7ecdf",
        "editorLineNumber.foreground": "#6b7464",
        "editor.selectionBackground": "#3f6d1a66",
      },
    },
  },
  {
    schema: "npp-x.theme/1",
    id: "obsidian-ink",
    name: "Obsidian Ink",
    author: "npp-x",
    version: "1.1.0",
    description: "High-contrast slate with lime caret energy.",
    chrome: {
      "--npp-chrome": "#0f1115",
      "--npp-chrome-2": "#0a0c10",
      "--npp-border": "#262b36",
      "--npp-text": "#e8ecf4",
      "--npp-accent": "#9ae66e",
      "--npp-accent-deep": "#c8f5a3",
      "--npp-tab": "#161a22",
      "--npp-tab-active": "#1c2230",
      "--npp-status": "#0c0e13",
      "--npp-menu-bg": "#161a22",
      "--npp-find": "#12161e",
      "--npp-shadow": "0 16px 40px rgba(0, 0, 0, 0.55)",
      "color-scheme": "dark",
    },
    monaco: {
      base: "vs-dark",
      inherit: true,
      rules: [{ token: "keyword", foreground: "9ae66e" }],
      colors: {
        "editor.background": "#0f1115",
        "editorCursor.foreground": "#9ae66e",
        "editor.selectionBackground": "#9ae66e33",
      },
    },
  },
  {
    schema: "npp-x.theme/1",
    id: "paper-dawn",
    name: "Paper Dawn",
    author: "npp-x",
    version: "1.1.0",
    description: "Clean daylight paper with sharp ink.",
    chrome: {
      "--npp-chrome": "#f8fafc",
      "--npp-chrome-2": "#e2e8f0",
      "--npp-border": "#cbd5e1",
      "--npp-text": "#0f172a",
      "--npp-accent": "#15803d",
      "--npp-accent-deep": "#14532d",
      "--npp-tab": "#eef2f7",
      "--npp-tab-active": "#ffffff",
      "--npp-status": "#e2e8f0",
      "--npp-menu-bg": "#ffffff",
      "--npp-find": "#f1f5f9",
      "--npp-shadow": "0 10px 28px rgba(15, 23, 42, 0.1)",
      "color-scheme": "light",
    },
    monaco: {
      base: "vs",
      inherit: true,
      colors: {
        "editor.background": "#ffffff",
        "editor.lineHighlightBackground": "#f0fdf4",
      },
    },
  },
];

export function isThemePackage(value: unknown): value is ThemePackage {
  if (!value || typeof value !== "object") return false;
  const t = value as ThemePackage;
  return (
    t.schema === "npp-x.theme/1" &&
    typeof t.id === "string" &&
    typeof t.name === "string" &&
    typeof t.version === "string" &&
    !!t.chrome &&
    !!t.monaco?.base
  );
}

export function applyChromeTheme(theme: ThemePackage) {
  const root = document.documentElement;
  Object.entries(theme.chrome).forEach(([key, value]) => {
    if (key === "color-scheme") {
      root.style.colorScheme = value;
      root.classList.toggle("dark", value === "dark");
      root.classList.toggle("light", value === "light");
      return;
    }
    root.style.setProperty(key, value);
  });
}
