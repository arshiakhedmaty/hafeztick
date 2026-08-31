import type { DayKey } from "../date/day";
import { createEmptyData } from "../storage/defaults";
import type { GoalSettings } from "./goals";
import { type AppData, type Entry, type Routine, type Task, entryId } from "./types";

/** Builders used by the domain tests; not referenced by application code. */

export function makeEntry(overrides: Partial<Entry> & { day: DayKey }): Entry {
  const sourceId = overrides.sourceId ?? "src";
  const sourceType = overrides.sourceType ?? "task";
  return {
    id: entryId(overrides.day, sourceType, sourceId),
    sourceType,
    sourceId,
    title: "کار",
    categoryId: null,
    priority: "normal",
    status: "pending",
    minutes: 0,
    doneAt: null,
    order: 0,
    scope: "day",
    ...overrides,
  };
}

/**
 * A logged entry: the minutes are the point, and `status` follows from them
 * exactly as the store makes it follow.
 */
export function makeLogged(
  overrides: Partial<Entry> & { day: DayKey; minutes: number },
): Entry {
  return makeEntry({
    status: overrides.minutes > 0 ? "done" : "pending",
    doneAt: overrides.minutes > 0 ? 1 : null,
    ...overrides,
  });
}

/** Five hours every day, seventy percent of it makes the day a success. */
export function makeGoals(overrides: Partial<GoalSettings> = {}): GoalSettings {
  return {
    dailyGoalMinutes: 300,
    weekdayGoalMinutes: [null, null, null, null, null, null, null],
    successThreshold: 0.7,
    ...overrides,
  };
}

export function makeRoutine(overrides: Partial<Routine> = {}): Routine {
  return {
    id: "rt1",
    title: "روتین",
    note: "",
    categoryId: null,
    priority: "normal",
    repeat: { kind: "daily" },
    startDay: "2026-01-01",
    endDay: null,
    archivedAt: null,
    createdAt: 0,
    order: 0,
    ...overrides,
  };
}

export function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "tk1",
    title: "کار",
    note: "",
    categoryId: null,
    priority: "normal",
    day: null,
    createdAt: 0,
    order: 0,
    ...overrides,
  };
}

export function makeData(overrides: Partial<AppData> = {}): AppData {
  return { ...createEmptyData(), ...overrides };
}
