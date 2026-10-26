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

function isCommentKeyQBinding(s: ShortcutBinding): boolean {
  return (
    s.key === "KeyQ" &&
    s.ctrl &&
    (s.cmd === "IDM_EDIT_BLOCK_COMMENT" ||
      s.cmd === "IDM_EDIT_STREAM_COMMENT")
  );
}

/** First binding for a command id (for menu display). */
export function shortcutLabelFor(id: number): string | undefined {
  // macOS: Quit is ⌘Q (system convention); N++ Exit is Alt+F4 on Windows.
  if (isApplePlatform() && id === CMD.IDM_FILE_EXIT) {
    return "⌘Q";
  }
  const hit = SHORTCUTS.find((s) => s.id === id);
  if (!hit) return undefined;
  // Comment stays on physical Control+Q on Apple so ⌘Q can quit.
  if (isApplePlatform() && isCommentKeyQBinding(hit)) {
    const parts: string[] = ["⌃"];
    if (hit.shift) parts.push("⇧");
    parts.push("Q");
    return parts.join("");
  }
  return formatShortcut(hit);
}

export function matchShortcut(
  e: KeyboardEvent,
): ShortcutBinding | undefined {
  const apple = isApplePlatform();

  // macOS: ⌘Q always quits — never toggle comment (N++ maps Ctrl+Q → comment).
  if (
    apple &&
    e.metaKey &&
    !e.ctrlKey &&
    !e.altKey &&
    !e.shiftKey &&
    e.code === "KeyQ"
  ) {
    return {
      id: CMD.IDM_FILE_EXIT,
      cmd: "IDM_FILE_EXIT",
      key: "KeyQ",
      ctrl: true,
      alt: false,
      shift: false,
    };
  }

  // On Apple, N++ "Ctrl" bindings use ⌘ (meta). Plain Control is a different key.
  // Exception: comment on KeyQ uses ⌃ (Control) so it doesn't steal Quit.
  return SHORTCUTS.find((s) => {
    if (s.key !== e.code || s.alt !== e.altKey || s.shift !== e.shiftKey) {
      return false;
    }
    if (apple && isCommentKeyQBinding(s)) {
      return e.ctrlKey && !e.metaKey;
    }
    const primary = apple ? e.metaKey : e.ctrlKey;
    return s.ctrl === primary;
  });
}
