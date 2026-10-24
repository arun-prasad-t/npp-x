import { languageFromFilename } from "./languages";

export type DocumentTab = {
  id: string;
  name: string;
  path: string | null;
  content: string;
  language: string;
  dirty: boolean;
  encoding: string;
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
