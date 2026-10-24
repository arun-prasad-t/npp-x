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
