import { languageFromFilename } from "./languages";

export type DiffView = {
  type: "diff";
  original: string;
  modified: string;
  language: string;
};

export type DocumentTab = {
  id: string;
  name: string;
  path: string | null;
  content: string;
  language: string;
  dirty: boolean;
  encoding: string;
  /** Virtual side-by-side diff tab (not persisted in session). */
  view?: DiffView;
};

let counter = 1;

export function createUntitled(): DocumentTab {
  const n = counter++;
  return {
    id: crypto.randomUUID(),
    name: `new ${n}`,
    path: null,
    content: "",
    language: "normal",
    dirty: false,
    encoding: "UTF-8",
  };
}

/** Keep “new N” numbering ahead of restored session tabs. */
export function syncUntitledCounterFromTabs(tabs: DocumentTab[]) {
  let max = 0;
  for (const t of tabs) {
    const m = /^new (\d+)$/i.exec(t.name);
    if (m) max = Math.max(max, Number(m[1]));
  }
  if (max >= counter) counter = max + 1;
}

export function createFromFile(
  name: string,
  path: string,
  content: string,
): DocumentTab {
  return {
    id: crypto.randomUUID(),
    name,
    path,
    content,
    language: languageFromFilename(name),
    dirty: false,
    encoding: "UTF-8",
  };
}

/** Open a compare result as its own tab (switching files leaves it alone). */
export function createDiffTab(
  label: string,
  original: string,
  modified: string,
  language: string,
): DocumentTab {
  return {
    id: crypto.randomUUID(),
    name: label,
    path: null,
    content: "",
    language: "diff",
    dirty: false,
    encoding: "UTF-8",
    view: { type: "diff", original, modified, language },
  };
}

export function isDiffTab(tab: DocumentTab | undefined | null): boolean {
  return tab?.view?.type === "diff";
}
