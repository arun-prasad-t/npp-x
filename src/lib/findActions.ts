import type { editor as MonacoEditor } from "monaco-editor";
import type { DocumentTab } from "./documents";
import {
  buildRegex,
  expandReplacement,
  findHits,
  lineCol,
  lineText,
  pickHit,
  type FindOptions,
  type Hit,
} from "./findEngine";

type Ed = MonacoEditor.IStandaloneCodeEditor | null;

export type FindCtx = {
  ed: Ed;
  tabs: DocumentTab[];
  activeId: string;
  query: string;
  options: FindOptions;
  /** Locked selection (offsets) for "In selection". */
  range: [number, number] | null;
  goto: (tabId: string, index: number, length: number) => void;
};

export type ResultLine = {
  index: number;
  length: number;
  line: number;
  col: number;
  text: string;
};
export type ResultGroup = { tabId: string; name: string; lines: ResultLine[] };
export type ResultSet = {
  query: string;
  total: number;
  scope: "current" | "all";
  groups: ResultGroup[];
};

function activeText(ctx: FindCtx): string {
  return (
    ctx.ed?.getModel()?.getValue() ??
    ctx.tabs.find((t) => t.id === ctx.activeId)?.content ??
    ""
  );
}

function compile(ctx: FindCtx): { re: RegExp } | { error: string } {
  return buildRegex(ctx.query, ctx.options);
}

function bounds(ctx: FindCtx, text: string): [number, number] {
  return ctx.options.inSelection && ctx.range ? ctx.range : [0, text.length];
}

export type Outcome = { ok: boolean; message: string };

export function findNext(ctx: FindCtx, backwardOverride?: boolean): Outcome {
  const c = compile(ctx);
  if ("error" in c) return { ok: false, message: c.error };
  const { ed } = ctx;
  const model = ed?.getModel();
  if (!ed || !model) return { ok: false, message: "No editor" };
  const text = model.getValue();
  const [from, to] = bounds(ctx, text);
  const hits = findHits(text, c.re, from, to);
  const backward = backwardOverride ?? ctx.options.backward;
  const sel = ed.getSelection();
  const caret = sel
    ? model.getOffsetAt(
        backward
          ? { lineNumber: sel.startLineNumber, column: sel.startColumn }
          : { lineNumber: sel.endLineNumber, column: sel.endColumn },
      )
    : 0;
  const pick = pickHit(hits, caret, backward, ctx.options.wrap);
  if (!pick) return { ok: false, message: "Can't find the text" };
  select(ed, pick.hit);
  return {
    ok: true,
    message: pick.wrapped ? "Find: reached the end — wrapped around" : "",
  };
}

function select(ed: NonNullable<Ed>, h: Pick<Hit, "index" | "length">) {
  const model = ed.getModel();
  if (!model) return;
  const a = model.getPositionAt(h.index);
  const b = model.getPositionAt(h.index + h.length);
  ed.setSelection({
    startLineNumber: a.lineNumber,
    startColumn: a.column,
    endLineNumber: b.lineNumber,
    endColumn: b.column,
  });
  ed.revealRangeInCenterIfOutsideViewport(ed.getSelection()!);
}

export function count(ctx: FindCtx): Outcome {
  const c = compile(ctx);
  if ("error" in c) return { ok: false, message: c.error };
  const text = activeText(ctx);
  const [from, to] = bounds(ctx, text);
  const n = findHits(text, c.re, from, to).length;
  return { ok: true, message: `Count: ${n} match${n === 1 ? "" : "es"}` };
}

export function findAll(
  ctx: FindCtx,
  allDocs: boolean,
): { error: string } | { results: ResultSet } {
  const c = compile(ctx);
  if ("error" in c) return c;
  const docs = (allDocs ? ctx.tabs : ctx.tabs.filter((t) => t.id === ctx.activeId)).filter(
    (t) => t.view?.type !== "diff",
  );
  const groups: ResultGroup[] = [];
  let total = 0;
  for (const t of docs) {
    const isActive = t.id === ctx.activeId;
    const text = isActive ? activeText(ctx) : t.content;
    const [from, to] = isActive ? bounds(ctx, text) : [0, text.length];
    const hits = findHits(text, c.re, from, to);
    if (!hits.length) continue;
    total += hits.length;
    groups.push({
      tabId: t.id,
      name: t.name,
      lines: hits.map((h) => {
        const lc = lineCol(text, h.index);
        return {
          index: h.index,
          length: h.length,
          line: lc.line,
          col: lc.col,
          text: lineText(text, h.index),
        };
      }),
    });
  }
  return { results: { query: ctx.query, total, scope: allDocs ? "all" : "current", groups } };
}

export function replaceOne(ctx: FindCtx, repl: string): Outcome {
  const c = compile(ctx);
  if ("error" in c) return { ok: false, message: c.error };
  const { ed } = ctx;
  const model = ed?.getModel();
  const sel = ed?.getSelection();
  if (!ed || !model || !sel) return { ok: false, message: "No editor" };
  const text = model.getValue();
  const s = model.getOffsetAt({ lineNumber: sel.startLineNumber, column: sel.startColumn });
  const e = model.getOffsetAt({ lineNumber: sel.endLineNumber, column: sel.endColumn });
  const hit = findHits(text, c.re).find((h) => h.index === s && h.index + h.length === e);
  if (hit) {
    ed.pushUndoStop();
    ed.executeEdits("replace", [
      {
        range: sel,
        text: expandReplacement(hit, repl, ctx.options.mode),
        forceMoveMarkers: true,
      },
    ]);
    ed.pushUndoStop();
  }
  // Replace consumes the match then advances — same as N++.
  const next = findNext({ ...ctx, range: null, options: { ...ctx.options, inSelection: false } }, false);
  return hit ? { ok: true, message: next.ok ? "" : "Replaced — no more matches" } : next;
}

function rewrite(
  text: string,
  re: RegExp,
  repl: string,
  o: FindOptions,
  from: number,
  to: number,
): { out: string; n: number } {
  const hits = findHits(text, re, from, to);
  let out = "";
  let last = 0;
  for (const h of hits) {
    out += text.slice(last, h.index) + expandReplacement(h, repl, o.mode);
    last = h.index + h.length;
  }
  return { out: out + text.slice(last), n: hits.length };
}

/** Replace All in the active editor (one undo step) and optionally every tab. */
export function replaceAll(
  ctx: FindCtx,
  repl: string,
  allDocs: boolean,
  setTabContent: (id: string, content: string) => void,
): Outcome {
  const c = compile(ctx);
  if ("error" in c) return { ok: false, message: c.error };
  let total = 0;
  let files = 0;
  const { ed } = ctx;
  const model = ed?.getModel();
  if (ed && model) {
    const text = model.getValue();
    const [from, to] = bounds(ctx, text);
    const hits = findHits(text, c.re, from, to);
    if (hits.length) {
      total += hits.length;
      files++;
      ed.pushUndoStop();
      ed.executeEdits(
        "replaceAll",
        hits
          .slice()
          .reverse()
          .map((h) => {
            const a = model.getPositionAt(h.index);
            const b = model.getPositionAt(h.index + h.length);
            return {
              range: {
                startLineNumber: a.lineNumber,
                startColumn: a.column,
                endLineNumber: b.lineNumber,
                endColumn: b.column,
              },
              text: expandReplacement(h, repl, ctx.options.mode),
              forceMoveMarkers: true,
            };
          }),
      );
      ed.pushUndoStop();
    }
  }
  if (allDocs) {
    for (const t of ctx.tabs) {
      if (t.id === ctx.activeId) continue;
      const { out, n } = rewrite(t.content, c.re, repl, ctx.options, 0, t.content.length);
      if (n) {
        total += n;
        files++;
        setTabContent(t.id, out);
      }
    }
  }
  return {
    ok: total > 0,
    message: total
      ? `Replace All: ${total} occurrence${total === 1 ? "" : "s"} replaced${allDocs ? ` in ${files} file${files === 1 ? "" : "s"}` : ""}`
      : "Replace All: no occurrences were found",
  };
}

// ---- Marks (N++ "Mark All" / "Clear all marks" / "Copy Marked Text") ----
let marks: MonacoEditor.IEditorDecorationsCollection | null = null;
let markedText: string[] = [];

export function clearMarks(): void {
  marks?.clear();
  marks = null;
  markedText = [];
}

export function markAll(ctx: FindCtx): Outcome {
  const c = compile(ctx);
  if ("error" in c) return { ok: false, message: c.error };
  const { ed } = ctx;
  const model = ed?.getModel();
  if (!ed || !model) return { ok: false, message: "No editor" };
  clearMarks();
  const text = model.getValue();
  const [from, to] = bounds(ctx, text);
  const hits = findHits(text, c.re, from, to).filter((h) => h.length > 0);
  markedText = hits.map((h) => text.slice(h.index, h.index + h.length));
  marks = ed.createDecorationsCollection(
    hits.map((h) => {
      const a = model.getPositionAt(h.index);
      const b = model.getPositionAt(h.index + h.length);
      return {
        range: {
          startLineNumber: a.lineNumber,
          startColumn: a.column,
          endLineNumber: b.lineNumber,
          endColumn: b.column,
        },
        options: { inlineClassName: "nppx-mark", stickiness: 1 },
      };
    }),
  );
  return { ok: true, message: `Mark: ${hits.length} match${hits.length === 1 ? "" : "es"} marked` };
}

export function markedTextJoined(): string {
  return markedText.join("\n");
}
