import { isPluginPackage, type PluginPackage } from "./plugins";
import { isThemePackage, type ThemePackage } from "./themes";

const THEMES_KEY = "nppx.installed.themes";
const PLUGINS_KEY = "nppx.installed.plugins";

export type InstallKind = "theme" | "plugin";

export type InstallResult =
  | { ok: true; kind: InstallKind; package: ThemePackage | PluginPackage }
  | { ok: false; error: string };

function loadJsonArray<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveJsonArray(key: string, value: unknown[]) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function listInstalledThemes(): ThemePackage[] {
  return loadJsonArray<ThemePackage>(THEMES_KEY).filter(isThemePackage);
}

export function listInstalledPlugins(): PluginPackage[] {
  return loadJsonArray<PluginPackage>(PLUGINS_KEY).filter(isPluginPackage);
}

export function saveInstalledTheme(pkg: ThemePackage) {
  const next = [
    pkg,
    ...listInstalledThemes().filter((t) => t.id !== pkg.id),
  ];
  saveJsonArray(THEMES_KEY, next);
}

export function saveInstalledPlugin(pkg: PluginPackage) {
  const next = [
    pkg,
    ...listInstalledPlugins().filter((p) => p.id !== pkg.id),
  ];
  saveJsonArray(PLUGINS_KEY, next);
}

export function removeInstalledTheme(id: string) {
  saveJsonArray(
    THEMES_KEY,
    listInstalledThemes().filter((t) => t.id !== id),
  );
}

export function removeInstalledPlugin(id: string) {
  saveJsonArray(
    PLUGINS_KEY,
    listInstalledPlugins().filter((p) => p.id !== id),
  );
}

/** Turn github.com/owner/repo[/tree/branch/path] into a raw JSON URL guess. */
export function resolvePackageUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) throw new Error("Empty URL");

  // Already raw or direct JSON
  if (
    trimmed.endsWith(".json") ||
    trimmed.includes("raw.githubusercontent.com")
  ) {
    return trimmed
      .replace("https://github.com/", "https://raw.githubusercontent.com/")
      .replace("/blob/", "/");
  }

  // github.com/owner/repo → assume theme.json or plugin.json at root (caller may retry)
  const gh = trimmed.match(
    /^https?:\/\/github\.com\/([^/]+)\/([^/#?]+)(?:\/(?:tree|blob)\/([^/]+)(?:\/(.*))?)?/,
  );
  if (gh) {
    const owner = gh[1];
    const repo = gh[2].replace(/\.git$/, "");
    const branch = gh[3] || "main";
    const path = gh[4] || "nppx.package.json";
    return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
  }

  return trimmed;
}

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Fetch failed (${res.status}) for ${url}`);
  }
  return res.json();
}

export async function installFromGitUrl(url: string): Promise<InstallResult> {
  const candidates = [resolvePackageUrl(url)];
  // Fallbacks when repo root package name differs
  if (url.includes("github.com") && !url.endsWith(".json")) {
    const base = candidates[0].replace(/\/[^/]+$/, "");
    candidates.push(
      `${base}/theme.json`,
      `${base}/plugin.json`,
      `${base}/nppx.theme.json`,
      `${base}/nppx.plugin.json`,
    );
  }

  let lastError = "Could not resolve package";
  for (const candidate of candidates) {
    try {
      const json = await fetchJson(candidate);
      const installed = installFromObject(json, candidate);
      if (installed.ok) return installed;
      lastError = installed.error;
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }
  }
  return { ok: false, error: lastError };
}

export function installFromObject(
  json: unknown,
  source?: string,
): InstallResult {
  if (isThemePackage(json)) {
    const pkg = { ...json, source: source ?? json.source };
    saveInstalledTheme(pkg);
    return { ok: true, kind: "theme", package: pkg };
  }
  if (isPluginPackage(json)) {
    const pkg = { ...json, source: source ?? json.source };
    saveInstalledPlugin(pkg);
    return { ok: true, kind: "plugin", package: pkg };
  }
  return {
    ok: false,
    error: 'JSON must use schema "npp-x.theme/1" or "npp-x.plugin/1"',
  };
}

export async function installFromFileText(
  text: string,
  sourceName: string,
): Promise<InstallResult> {
  try {
    const json = JSON.parse(text) as unknown;
    return installFromObject(json, sourceName);
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Invalid JSON",
    };
  }
}
