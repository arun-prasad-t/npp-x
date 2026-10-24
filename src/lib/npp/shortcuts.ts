import shortcutsJson from "./shortcuts.generated.json";
import labelsJson from "./labels.generated.json";
import idsJson from "./ids.generated.json";

export type ShortcutBinding = {
  id: number;
  cmd: string;
  key: string;
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
};

export const SHORTCUTS = shortcutsJson as ShortcutBinding[];
export const CMD = idsJson as Record<string, number>;
export const LABELS = labelsJson as Record<string, string>;

export function labelForCommand(id: number): string {
  return LABELS[String(id)] ?? `Command ${id}`;
}

/** Primary modifier in N++ bindings (`ctrl: true`) is Cmd on Apple, Ctrl elsewhere. */
export function isApplePlatform(): boolean {
  if (typeof navigator === "undefined") return false;
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
  const platform = nav.userAgentData?.platform ?? navigator.platform ?? "";
  return /mac|iphone|ipad|ipod/i.test(platform) || /Mac OS X/.test(navigator.userAgent);
}

export function formatShortcut(s: ShortcutBinding): string {
  const apple = isApplePlatform();
  const parts: string[] = [];
  // macOS: ⌃ Control vs ⌘ Command — N++ "Ctrl" maps to Command
  if (s.ctrl) parts.push(apple ? "⌘" : "Ctrl");
  if (s.alt) parts.push(apple ? "⌥" : "Alt");
  if (s.shift) parts.push(apple ? "⇧" : "Shift");
  const key = s.key
    .replace(/^Key/, "")
    .replace(/^Digit/, "")
    .replace(/^Arrow/, "")
    .replace("NumpadAdd", "+")
    .replace("NumpadSubtract", "-")
    .replace("equal", "=")
    .replace("minus", "-")
    .replace("slash", "/")
    .replace("backslash", "\\")
    .replace(" ", "Space");
  parts.push(key.length === 1 ? key.toUpperCase() : key);
  return apple ? parts.join("") : parts.join("+");
}

/** First binding for a command id (for menu display). */
export function shortcutLabelFor(id: number): string | undefined {
  const hit = SHORTCUTS.find((s) => s.id === id);
  return hit ? formatShortcut(hit) : undefined;
}

export function matchShortcut(
  e: KeyboardEvent,
): ShortcutBinding | undefined {
  const apple = isApplePlatform();
  // On Apple, N++ "Ctrl" bindings use ⌘ (meta). Plain Control is a different key.
  const primary = apple ? e.metaKey : e.ctrlKey;
  return SHORTCUTS.find(
    (s) =>
      s.key === e.code &&
      s.ctrl === primary &&
      s.alt === e.altKey &&
      s.shift === e.shiftKey,
  );
}
