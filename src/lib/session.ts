/**
 * N++-style session restore: all open tabs (including unsaved edits)
 * come back on next launch. Uses localStorage + IndexedDB fallback for large sessions.
 */

import {
  createUntitled,
  syncUntitledCounterFromTabs,
  type DocumentTab,
} from "./documents";

const SESSION_KEY = "nppx.session.v1";
const PREF_KEY = "nppx.session.remember";
const IDB_NAME = "nppx";
const IDB_STORE = "session";

export type EditorSession = {
  version: 1;
  savedAt: number;
  activeId: string;
  wordWrap: boolean;
  fontSize: number;
  tabs: DocumentTab[];
};

export function isRememberSessionEnabled(): boolean {
  const raw = localStorage.getItem(PREF_KEY);
  return raw === null ? true : raw === "1";
}

export function setRememberSessionEnabled(on: boolean) {
  localStorage.setItem(PREF_KEY, on ? "1" : "0");
  if (!on) {
    localStorage.removeItem(SESSION_KEY);
    void idbClear();
  }
}

export function loadSessionSync(): EditorSession | null {
  if (!isRememberSessionEnabled()) return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as EditorSession;
    if (data?.version !== 1 || !Array.isArray(data.tabs) || !data.tabs.length) {
      return null;
    }
    syncUntitledCounterFromTabs(data.tabs);
    return data;
  } catch {
    return null;
  }
}

export async function loadSession(): Promise<EditorSession | null> {
  const sync = loadSessionSync();
  if (sync) return sync;
  if (!isRememberSessionEnabled()) return null;
  try {
    const data = await idbGet();
    if (data?.version !== 1 || !Array.isArray(data.tabs) || !data.tabs.length) {
      return null;
    }
    syncUntitledCounterFromTabs(data.tabs);
    return data;
  } catch {
    return null;
  }
}

export function initialTabsFromSession(): {
  tabs: DocumentTab[];
  activeId: string;
  wordWrap: boolean;
  fontSize: number;
} {
  const s = loadSessionSync();
  if (s) {
    return {
      tabs: s.tabs,
      activeId: s.tabs.some((t) => t.id === s.activeId)
        ? s.activeId
        : s.tabs[0].id,
      wordWrap: !!s.wordWrap,
      fontSize: s.fontSize || 14,
    };
  }
  const tab = createUntitled();
  return { tabs: [tab], activeId: tab.id, wordWrap: false, fontSize: 14 };
}

export async function saveSession(session: Omit<EditorSession, "version" | "savedAt">) {
  if (!isRememberSessionEnabled()) return;
  const payload: EditorSession = {
    version: 1,
    savedAt: Date.now(),
    ...session,
  };
  const json = JSON.stringify(payload);
  try {
    localStorage.setItem(SESSION_KEY, json);
  } catch {
    // Quota — fall back to IndexedDB only
    localStorage.removeItem(SESSION_KEY);
  }
  try {
    await idbSet(payload);
  } catch {
    /* ignore */
  }
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(data: EditorSession) {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.objectStore(IDB_STORE).put(data, "current");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

async function idbGet(): Promise<EditorSession | null> {
  const db = await openDb();
  const data = await new Promise<EditorSession | null>((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readonly");
    const req = tx.objectStore(IDB_STORE).get("current");
    req.onsuccess = () => resolve((req.result as EditorSession) ?? null);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return data;
}

async function idbClear() {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readwrite");
      tx.objectStore(IDB_STORE).delete("current");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    /* ignore */
  }
}
