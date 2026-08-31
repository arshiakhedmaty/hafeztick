import type { AppData, Entry, Settings } from "../domain/types";
import { clampMinutes } from "../utils/duration";
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

/** Shape of the pre-v2 settings, kept only so old backups still open. */
interface LegacySettings {
  /** Was a 0..1 share of the day's *items*; it is now the success threshold. */
  dailyGoal?: number;
}

/**
 * Migrates settings written before hours existed.
 *
 * The old `dailyGoal` meant "this share of today's checklist"; the same number
 * is still the honest answer to "this share of today's hours", so it carries
 * over as the success threshold. The hour goal itself has no ancestor in the
 * old data, so it starts at the default rather than being invented.
 */
function normalizeSettings(raw: unknown): Settings {
  const input = (raw ?? {}) as Partial<Settings> & LegacySettings;

  const weekday = Array.isArray(input.weekdayGoalMinutes)
    ? Array.from({ length: 7 }, (_, index) => {
        const value = input.weekdayGoalMinutes?.[index];
        return typeof value === "number" && Number.isFinite(value)
          ? clampMinutes(value)
          : null;
      })
    : [...DEFAULT_SETTINGS.weekdayGoalMinutes];

  const threshold =
    typeof input.successThreshold === "number"
      ? input.successThreshold
      : typeof input.dailyGoal === "number"
        ? input.dailyGoal
        : DEFAULT_SETTINGS.successThreshold;

  // Built field by field rather than spread, so a setting the app has since
  // dropped cannot ride back in from an old backup and be persisted forever.
  return {
    theme: input.theme ?? DEFAULT_SETTINGS.theme,
    dailyGoalMinutes:
      typeof input.dailyGoalMinutes === "number"
        ? clampMinutes(input.dailyGoalMinutes)
        : DEFAULT_SETTINGS.dailyGoalMinutes,
    weekdayGoalMinutes: weekday,
    successThreshold: Math.min(1, Math.max(0.1, threshold)),
    restDays: Array.isArray(input.restDays) ? input.restDays : [],
    onboarded: input.onboarded ?? DEFAULT_SETTINGS.onboarded,
  };
}

/**
 * Entries written before v2 recorded only that something was ticked, never how
 * long it took. Rather than invent a duration for them, they come back with
 * zero minutes: the history of *what was planned* survives, the hours simply
 * start accumulating from here.
 */
function normalizeEntry(entry: Entry): Entry {
  const minutes =
    typeof entry.minutes === "number" ? clampMinutes(entry.minutes) : 0;
  return {
    ...entry,
    minutes,
    scope: entry.scope === "week" ? "week" : "day",
  };
}

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
    entries: input.entries.map(normalizeEntry),
    settings: normalizeSettings(input.settings),
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
