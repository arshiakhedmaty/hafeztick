import type { AppData } from "../domain/types";
import { DATA_VERSION, DEFAULT_SETTINGS, createEmptyData } from "./defaults";

/**
 * Everything the app needs from persistence.
 *
 * The UI never touches storage directly, so swapping the local adapter for a
 * synced backend later is a change in this folder only.
 */
export interface DataRepository {
  load(): AppData | null;
  save(data: AppData): void;
  clear(): void;
}

export const STORAGE_KEY = "hafeztick:data:v1";

/** Defensive normalisation: never let malformed storage crash the app. */
export function normalize(raw: unknown): AppData | null {
  if (!raw || typeof raw !== "object") return null;
  const input = raw as Partial<AppData>;
  const empty = createEmptyData();

  if (!Array.isArray(input.entries) || !Array.isArray(input.categories)) {
    return null;
  }

  return {
    version: DATA_VERSION,
    categories: input.categories.length ? input.categories : empty.categories,
    routines: Array.isArray(input.routines) ? input.routines : [],
    tasks: Array.isArray(input.tasks) ? input.tasks : [],
    entries: input.entries,
    settings: { ...DEFAULT_SETTINGS, ...(input.settings ?? {}) },
    lastMaterializedDay: input.lastMaterializedDay ?? null,
  };
}

function safeStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export const localRepository: DataRepository = {
  load() {
    const storage = safeStorage();
    if (!storage) return null;
    try {
      const raw = storage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return normalize(JSON.parse(raw));
    } catch {
      return null;
    }
  },

  save(data) {
    const storage = safeStorage();
    if (!storage) return;
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Quota or private-mode failure: the session keeps working in memory.
    }
  },

  clear() {
    safeStorage()?.removeItem(STORAGE_KEY);
  },
};

export function exportData(data: AppData): string {
  return JSON.stringify({ ...data, exportedAt: new Date().toISOString() }, null, 2);
}

export function importData(json: string): AppData | null {
  try {
    return normalize(JSON.parse(json));
  } catch {
    return null;
  }
}
