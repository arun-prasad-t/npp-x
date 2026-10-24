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

export function formatShortcut(s: ShortcutBinding): string {
  const parts: string[] = [];
  if (s.ctrl) parts.push("Ctrl");
  if (s.alt) parts.push("Alt");
  if (s.shift) parts.push("Shift");
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
  return parts.join("+");
}

/** First binding for a command id (for menu display). */
export function shortcutLabelFor(id: number): string | undefined {
  const hit = SHORTCUTS.find((s) => s.id === id);
  return hit ? formatShortcut(hit) : undefined;
}

export function matchShortcut(
  e: KeyboardEvent,
): ShortcutBinding | undefined {
  const ctrl = e.ctrlKey || e.metaKey;
  return SHORTCUTS.find(
    (s) =>
      s.key === e.code &&
      s.ctrl === ctrl &&
      s.alt === e.altKey &&
      s.shift === e.shiftKey,
  );
}
