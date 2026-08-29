import { type DayKey, addDays, compareDays, weekdayIndex } from "../date/day";
import {
  type AppData,
  type Entry,
  type Routine,
  type Task,
  entryId,
  isRoutineActiveOn,
} from "./types";

/** Never backfill more than this when the app has been closed for a while. */
export const MAX_BACKFILL_DAYS = 120;

export function isFlexible(routine: Routine): boolean {
  return routine.repeat.kind === "flexible";
}

/** Does a fixed-schedule routine land on this day? Flexible ones never do. */
export function routineOccursOn(routine: Routine, day: DayKey): boolean {
  if (!isRoutineActiveOn(routine, day)) return false;
  switch (routine.repeat.kind) {
    case "daily":
      return true;
    case "weekdays":
      return routine.repeat.days.includes(weekdayIndex(day));
    case "flexible":
      return false;
  }
}

export function entryFromRoutine(
  routine: Routine,
  day: DayKey,
  order: number,
  scope: "day" | "week" = "day",
): Entry {
  return {
    id: entryId(day, "routine", routine.id),
    day,
    sourceType: "routine",
    sourceId: routine.id,
    title: routine.title,
    categoryId: routine.categoryId,
    priority: routine.priority,
    status: "pending",
    doneAt: null,
    order,
    scope,
  };
}

export function entryFromTask(task: Task, day: DayKey, order: number): Entry {
  return {
    id: entryId(day, "task", task.id),
    day,
    sourceType: "task",
    sourceId: task.id,
    title: task.title,
    categoryId: task.categoryId,
    priority: task.priority,
    status: "pending",
    doneAt: null,
    order,
    scope: "day",
  };
}

/** The entries a day *should* contain according to the current plan. */
export function plannedEntriesFor(
  data: Pick<AppData, "routines" | "tasks">,
  day: DayKey,
): Entry[] {
  const out: Entry[] = [];
  let order = 0;

  for (const routine of [...data.routines].sort((a, b) => a.order - b.order)) {
    if (routineOccursOn(routine, day)) {
      out.push(entryFromRoutine(routine, day, order));
      order += 1;
    }
  }

  for (const task of [...data.tasks].sort((a, b) => a.order - b.order)) {
    if (task.day === day) {
      out.push(entryFromTask(task, day, order));
      order += 1;
    }
  }

  return out;
}

/**
 * Reconciles stored entries for a single day against the current plan.
 *
 * Past days are append-only: nothing is removed, because the plan of a day
 * that has already happened is history. For today and future days the plan is
 * still editable, so entries whose source disappeared are dropped — unless the
 * user already acted on them.
 */
export function syncDay(
  entries: Entry[],
  data: Pick<AppData, "routines" | "tasks">,
  day: DayKey,
  today: DayKey,
): Entry[] {
  const planned = plannedEntriesFor(data, day);
  const plannedById = new Map(planned.map((e) => [e.id, e]));
  const existing = entries.filter((e) => e.day === day);
  const existingById = new Map(existing.map((e) => [e.id, e]));
  const isPast = compareDays(day, today) < 0;

  const kept: Entry[] = [];

  for (const entry of existing) {
    const stillPlanned = plannedById.get(entry.id);
    if (stillPlanned) {
      // Refresh the snapshot of an untouched, still-editable item.
      kept.push(
        entry.status === "pending" && !isPast
          ? { ...entry, ...stillPlanned, status: entry.status, doneAt: entry.doneAt }
          : entry,
      );
    } else if (isPast || entry.status !== "pending" || entry.scope === "week") {
      kept.push(entry);
    }
  }

  for (const entry of planned) {
    if (!existingById.has(entry.id)) kept.push(entry);
  }

  const others = entries.filter((e) => e.day !== day);
  return [...others, ...kept];
}

/**
 * Generates the plan for every day between the last materialised day and
 * `today`, so days the user never opened still count as missed rather than
 * silently vanishing from the statistics.
 */
export function materializeThrough(data: AppData, today: DayKey): AppData {
  const firstUnmaterialized = data.lastMaterializedDay
    ? addDays(data.lastMaterializedDay, 1)
    : today;

  const earliestAllowed = addDays(today, -MAX_BACKFILL_DAYS);
  let cursor =
    compareDays(firstUnmaterialized, earliestAllowed) < 0
      ? earliestAllowed
      : firstUnmaterialized;

  if (compareDays(cursor, today) > 0) {
    return data.lastMaterializedDay === today
      ? data
      : { ...data, lastMaterializedDay: today };
  }

  let entries = data.entries;
  let guard = 0;
  while (compareDays(cursor, today) <= 0 && guard <= MAX_BACKFILL_DAYS + 1) {
    entries = syncDay(entries, data, cursor, today);
    cursor = addDays(cursor, 1);
    guard += 1;
  }

  return { ...data, entries, lastMaterializedDay: today };
}
