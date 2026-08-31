import { type DayKey, compareDays, weekDays } from "../date/day";
import { plannedEntriesFor } from "./schedule";
import {
  type DayScore,
  type FlexibleProgress,
  flexibleProgressForWeek,
  scoreDay,
} from "./scoring";
import type { AppData, Category, Entry, Routine, Task } from "./types";

function byOrder(a: Entry, b: Entry): number {
  if (a.sourceType !== b.sourceType) return a.sourceType === "routine" ? -1 : 1;
  return a.order - b.order;
}

/**
 * Entries to display for a day.
 *
 * Past and present days read straight from stored history. Future days are
 * projected from the current plan without writing anything — the plan only
 * becomes history when the day arrives, or when the user touches an item.
 */
export function entriesForDay(
  data: AppData,
  day: DayKey,
  today: DayKey,
): Entry[] {
  const stored = data.entries.filter((entry) => entry.day === day);

  if (compareDays(day, today) <= 0) {
    return [...stored].sort(byOrder);
  }

  const storedById = new Map(stored.map((entry) => [entry.id, entry]));
  const merged = plannedEntriesFor(data, day).map(
    (planned) => storedById.get(planned.id) ?? planned,
  );
  const mergedIds = new Set(merged.map((entry) => entry.id));
  for (const entry of stored) {
    if (!mergedIds.has(entry.id)) merged.push(entry);
  }

  return merged.sort(byOrder);
}

export function dayScoreFor(
  data: AppData,
  day: DayKey,
  today: DayKey,
): DayScore {
  return scoreDay(day, entriesForDay(data, day, today), data.settings);
}

/** Weekly progress of flexible routines for the week containing `day`. */
export function flexibleForWeekOf(data: AppData, day: DayKey): FlexibleProgress[] {
  return flexibleProgressForWeek(data.routines, data.entries, weekDays(day));
}

export function categoryById(
  data: Pick<AppData, "categories">,
  id: string | null,
): Category | null {
  if (!id) return null;
  return data.categories.find((category) => category.id === id) ?? null;
}

export function routineById(data: AppData, id: string): Routine | null {
  return data.routines.find((routine) => routine.id === id) ?? null;
}

export function taskById(data: AppData, id: string): Task | null {
  return data.tasks.find((task) => task.id === id) ?? null;
}

/** Undated tasks, newest first — the "someday" bucket. */
export function backlogTasks(data: AppData): Task[] {
  return data.tasks
    .filter((task) => task.day === null)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function activeRoutines(data: AppData): Routine[] {
  return data.routines
    .filter((routine) => routine.archivedAt === null)
    .sort((a, b) => a.order - b.order);
}

export function archivedRoutines(data: AppData): Routine[] {
  return data.routines
    .filter((routine) => routine.archivedAt !== null)
    .sort((a, b) => (b.archivedAt ?? 0) - (a.archivedAt ?? 0));
}

/** Tasks that were planned for an earlier day and never finished. */
export function overdueEntries(data: AppData, today: DayKey): Entry[] {
  return data.entries
    .filter(
      (entry) =>
        entry.sourceType === "task" &&
        entry.status === "pending" &&
        compareDays(entry.day, today) < 0,
    )
    .sort((a, b) => compareDays(a.day, b.day));
}
