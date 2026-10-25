/**
 * Find engine modelled on Notepad++ 8.8.1's Find/Replace dialog (res id 1600,
 * recovered with REA — see docs/REA-RECONSTRUCTION.md).
 * Search modes: Normal / Extended (\n \r \t \0 \xHH \dNNN \oNNN \uHHHH) / Regex.
 */
export type SearchMode = "normal" | "extended" | "regex";

export type FindOptions = {
  mode: SearchMode;
  matchCase: boolean;
  wholeWord: boolean;
  wrap: boolean;
  backward: boolean;
  inSelection: boolean;
  /** Regex mode only: ". matches newline" */
  dotAll: boolean;
};

export const DEFAULT_FIND_OPTIONS: FindOptions = {
  mode: "normal",
  matchCase: false,
  wholeWord: false,
  wrap: true,
  backward: false,
  inSelection: false,
  dotAll: false,
};

export type Hit = { index: number; length: number; groups: string[] };

const SIMPLE: Record<string, string> = {
  n: "\n",
  r: "\r",
  t: "\t",
  "0": "\0",
  "\\": "\\",
};

/** Expand Extended-mode escapes. */
export function unescapeExtended(s: string): string {
  return s.replace(
    /\\(?:x([0-9a-fA-F]{2})|u([0-9a-fA-F]{4})|d(\d{3})|o([0-7]{3})|([nrt0\\]))/g,
    (_m, x, u, d, o, simple) => {
      if (x) return String.fromCharCode(parseInt(x, 16));
      if (u) return String.fromCharCode(parseInt(u, 16));
      if (d) return String.fromCharCode(parseInt(d, 10));
      if (o) return String.fromCharCode(parseInt(o, 8));
      return SIMPLE[simple] ?? _m;
    },
  );
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Returns a global RegExp, or an error message for an invalid pattern. */
export function buildRegex(
  query: string,
  o: FindOptions,
): { re: RegExp } | { error: string } {
  if (!query) return { error: "Empty search" };
  let src: string;
  if (o.mode === "regex") src = query;
  else src = escapeRe(o.mode === "extended" ? unescapeExtended(query) : query);
  if (o.wholeWord) src = `(?<![\\w\\u00C0-\\uFFFF])(?:${src})(?![\\w\\u00C0-\\uFFFF])`;
  const flags = "gm" + (o.matchCase ? "" : "i") + (o.dotAll ? "s" : "");
  try {
    return { re: new RegExp(src, flags) };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invalid regular expression" };
  }
}

/** All non-overlapping hits within [from, to) of text. */
export function findHits(
  text: string,
  re: RegExp,
  from = 0,
  to = text.length,
): Hit[] {
  const out: Hit[] = [];
  const slice = text.slice(0, to);
  re.lastIndex = from;
  let m: RegExpExecArray | null;
  while ((m = re.exec(slice))) {
    out.push({
      index: m.index,
      length: m[0].length,
      groups: m.slice(0) as string[],
    });
    if (m[0].length === 0) re.lastIndex++;
    if (out.length > 200000) break;
  }
  return out;
}

/** Replacement text for one hit (\1..\9 / $1..$9 in regex mode). */
export function expandReplacement(
  hit: Hit,
  repl: string,
  mode: SearchMode,
): string {
  if (mode === "normal") return repl;
  if (mode === "extended") return unescapeExtended(repl);
  return unescapeExtended(
    repl.replace(/\\([0-9])|\$([0-9])/g, (_m, a, b) => hit.groups[+(a ?? b)] ?? ""),
  );
}

export function lineCol(text: string, index: number): { line: number; col: number } {
  let line = 1;
  let last = -1;
  for (let i = text.indexOf("\n"); i !== -1 && i < index; i = text.indexOf("\n", i + 1)) {
    line++;
    last = i;
  }
  return { line, col: index - last };
}

export function lineText(text: string, index: number): string {
  const s = text.lastIndexOf("\n", index - 1) + 1;
  let e = text.indexOf("\n", index);
  if (e === -1) e = text.length;
  return text.slice(s, e).replace(/\r$/, "");
}

/** Next hit relative to a caret offset, optionally wrapping. */
export function pickHit(
  hits: Hit[],
  caret: number,
  backward: boolean,
  wrap: boolean,
): { hit: Hit; wrapped: boolean } | null {
  if (!hits.length) return null;
  if (backward) {
    for (let i = hits.length - 1; i >= 0; i--) {
      if (hits[i].index + hits[i].length <= caret) return { hit: hits[i], wrapped: false };
    }
    return wrap ? { hit: hits[hits.length - 1], wrapped: true } : null;
  }
  for (const h of hits) if (h.index >= caret) return { hit: h, wrapped: false };
  return wrap ? { hit: hits[0], wrapped: true } : null;
}
