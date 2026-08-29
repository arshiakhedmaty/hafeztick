import type { DayKey } from "../date/day";
import { createEmptyData } from "../storage/defaults";
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
    doneAt: null,
    order: 0,
    scope: "day",
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
