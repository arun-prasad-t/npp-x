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
    id: "npp-classic",
    name: "N++ Classic",
    author: "npp-x",
    version: "1.0.0",
    description: "Warm chrome with Notepad++ green accents.",
    chrome: {
      "--npp-chrome": "#ece9e0",
      "--npp-chrome-2": "#d9d6cb",
      "--npp-border": "#b7b3a6",
      "--npp-text": "#1f1f1c",
      "--npp-accent": "#5f9a2f",
      "--npp-accent-deep": "#3f6d1a",
      "--npp-tab": "#f7f5ee",
      "--npp-tab-active": "#ffffff",
      "--npp-status": "#e4e1d6",
      "--npp-menu-bg": "#ffffff",
      "--npp-find": "#f3f0e6",
      "--npp-shadow": "0 8px 24px rgba(40, 45, 30, 0.12)",
      "color-scheme": "light",
    },
    monaco: { base: "vs", inherit: true, rules: [], colors: {} },
  },
  {
    schema: "npp-x.theme/1",
    id: "npp-midnight",
    name: "N++ Midnight",
    author: "npp-x",
    version: "1.0.0",
    description: "Forest-dark chrome for late sessions.",
    chrome: {
      "--npp-chrome": "#1a1d19",
      "--npp-chrome-2": "#121510",
      "--npp-border": "#2f362c",
      "--npp-text": "#e7ecdf",
      "--npp-accent": "#8bc34a",
      "--npp-accent-deep": "#c5e1a5",
      "--npp-tab": "#22271f",
      "--npp-tab-active": "#2b3228",
      "--npp-status": "#151814",
      "--npp-menu-bg": "#22271f",
      "--npp-find": "#1e231c",
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
        "editor.background": "#1a1d19",
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
    version: "1.0.0",
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
    version: "1.0.0",
    description: "Clean daylight paper with sharp ink.",
    chrome: {
      "--npp-chrome": "#f3f5f8",
      "--npp-chrome-2": "#e5e9ef",
      "--npp-border": "#c9d0da",
      "--npp-text": "#152033",
      "--npp-accent": "#2f7d32",
      "--npp-accent-deep": "#1b5e20",
      "--npp-tab": "#eef2f7",
      "--npp-tab-active": "#ffffff",
      "--npp-status": "#e8edf3",
      "--npp-menu-bg": "#ffffff",
      "--npp-find": "#eef3f8",
      "--npp-shadow": "0 10px 28px rgba(21, 32, 51, 0.1)",
      "color-scheme": "light",
    },
    monaco: {
      base: "vs",
      inherit: true,
      colors: {
        "editor.background": "#ffffff",
        "editor.lineHighlightBackground": "#f0f5eb",
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
      return;
    }
    root.style.setProperty(key, value);
  });
}
