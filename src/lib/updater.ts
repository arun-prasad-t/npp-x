import { isTauri } from "./tauri";

export type UpdateCheckResult =
  | { kind: "unavailable" }
  | { kind: "up-to-date" }
  | { kind: "available"; version: string; notes?: string }
  | { kind: "error"; message: string };

/** Silent check — used on startup. */
export async function checkForUpdate(): Promise<UpdateCheckResult> {
  if (!isTauri()) return { kind: "unavailable" };
  try {
    const { check } = await import("@tauri-apps/plugin-updater");
    const update = await check();
    if (!update) return { kind: "up-to-date" };
    return {
      kind: "available",
      version: update.version,
      notes: update.body ?? undefined,
    };
  } catch (e) {
    return {
      kind: "error",
      message: e instanceof Error ? e.message : String(e),
    };
  }
}

/** Download + install + relaunch when user confirms. */
export async function installAvailableUpdate(): Promise<UpdateCheckResult> {
  if (!isTauri()) return { kind: "unavailable" };
  try {
    const { check } = await import("@tauri-apps/plugin-updater");
    const { relaunch } = await import("@tauri-apps/plugin-process");
    const update = await check();
    if (!update) return { kind: "up-to-date" };
    await update.downloadAndInstall();
    await relaunch();
    return { kind: "available", version: update.version };
  } catch (e) {
    return {
      kind: "error",
      message: e instanceof Error ? e.message : String(e),
    };
  }
}
