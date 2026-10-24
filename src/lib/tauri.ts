import { invoke } from "@tauri-apps/api/core";

export type FilePayload = {
  path: string;
  name: string;
  content: string;
};

export function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export async function readTextFile(path: string): Promise<FilePayload> {
  return invoke<FilePayload>("read_text_file", { path });
}

export async function writeTextFile(
  path: string,
  content: string,
): Promise<void> {
  return invoke("write_text_file", { path, content });
}
