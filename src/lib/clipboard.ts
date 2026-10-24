import type { IRange, editor as MonacoEditor } from "monaco-editor";
import { isTauri } from "./tauri";

async function writeText(text: string): Promise<void> {
  if (isTauri()) {
    const { writeText: write } = await import(
      "@tauri-apps/plugin-clipboard-manager"
    );
    await write(text);
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  }
}

async function readText(): Promise<string> {
  if (isTauri()) {
    const { readText: read } = await import(
      "@tauri-apps/plugin-clipboard-manager"
    );
    return (await read()) ?? "";
  }
  try {
    return await navigator.clipboard.readText();
  } catch {
    return "";
  }
}

/** Text for clipboard when selection is empty (Monaco emptySelectionClipboard). */
function textForClipboard(
  ed: MonacoEditor.IStandaloneCodeEditor,
): { text: string; range: IRange | null } {
  const model = ed.getModel();
  const sel = ed.getSelection();
  if (!model || !sel) return { text: "", range: null };

  if (!sel.isEmpty()) {
    return { text: model.getValueInRange(sel), range: sel };
  }

  const line = sel.startLineNumber;
  const lineLen = model.getLineMaxColumn(line);
  const eol = model.getEOL();
  return {
    text: model.getLineContent(line) + eol,
    range: {
      startLineNumber: line,
      startColumn: 1,
      endLineNumber: line,
      endColumn: lineLen,
    },
  };
}

export async function editorCopy(
  ed: MonacoEditor.IStandaloneCodeEditor | null,
): Promise<boolean> {
  if (!ed) return false;
  const { text } = textForClipboard(ed);
  if (!text) return false;
  await writeText(text);
  return true;
}

export async function editorCut(
  ed: MonacoEditor.IStandaloneCodeEditor | null,
): Promise<boolean> {
  if (!ed) return false;
  const { text, range } = textForClipboard(ed);
  if (!text || !range) return false;
  await writeText(text);
  ed.executeEdits("cut", [{ range, text: "", forceMoveMarkers: true }]);
  ed.focus();
  return true;
}

export async function editorPaste(
  ed: MonacoEditor.IStandaloneCodeEditor | null,
): Promise<boolean> {
  if (!ed) return false;
  const text = await readText();
  if (!text) return false;
  const sel = ed.getSelection();
  if (!sel) return false;
  ed.focus();
  ed.executeEdits("paste", [
    { range: sel, text, forceMoveMarkers: true },
  ]);
  // Move cursor to end of pasted text
  const model = ed.getModel();
  if (model) {
    const lines = text.split(/\r\n|\r|\n/);
    const last = lines[lines.length - 1] ?? "";
    const endLine = sel.startLineNumber + lines.length - 1;
    const endCol =
      lines.length === 1
        ? sel.startColumn + last.length
        : last.length + 1;
    ed.setPosition({ lineNumber: endLine, column: endCol });
  }
  return true;
}
