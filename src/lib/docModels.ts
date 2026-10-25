import type { editor as MonacoEditor } from "monaco-editor";

type MonacoLike = {
  editor: {
    getModels: () => Array<{
      uri: { scheme: string; authority: string; path: string };
      dispose: () => void;
    }>;
  };
};

/** Stable Monaco URI path for a document tab (undo stack lives on the model). */
export function tabModelPath(tabId: string): string {
  return `inmemory://tab/${tabId}`;
}

export function tabIdFromModelUri(uri: {
  scheme: string;
  authority: string;
  path: string;
}): string | null {
  if (uri.scheme !== "inmemory" || uri.authority !== "tab") return null;
  const id = uri.path.replace(/^\//, "");
  return id || null;
}

/** Drop models for tabs that are no longer open (N++ closes undo with the doc). */
export function disposeClosedTabModels(
  monaco: MonacoLike,
  openTabIds: Iterable<string>,
): void {
  const live = new Set(openTabIds);
  for (const model of monaco.editor.getModels()) {
    const id = tabIdFromModelUri(model.uri);
    if (id && !live.has(id)) model.dispose();
  }
}

/** Undoable full-buffer replace on the active editor model. */
export function replaceEditorBuffer(
  ed: MonacoEditor.IStandaloneCodeEditor | null,
  text: string,
  source = "nppx",
): boolean {
  const model = ed?.getModel();
  if (!ed || !model) return false;
  if (model.getValue() === text) return true;
  ed.pushUndoStop();
  ed.executeEdits(source, [
    { range: model.getFullModelRange(), text, forceMoveMarkers: true },
  ]);
  ed.pushUndoStop();
  return true;
}
