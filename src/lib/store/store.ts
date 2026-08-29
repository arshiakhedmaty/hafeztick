import { type DayKey, compareDays, todayKey } from "../date/day";
import { materializeThrough, syncDay } from "../domain/schedule";
import { entryId } from "../domain/types";
import type {
  AppData,
  Category,
  CategoryColor,
  Entry,
  EntryStatus,
  Priority,
  RepeatRule,
  Routine,
  Settings,
  Task,
} from "../domain/types";
import {
  type DataRepository,
  importData,
  localRepository,
} from "../storage/repository";
import { createEmptyData, sampleRoutines } from "../storage/defaults";
import { uid } from "../utils/id";

export interface TaskInput {
  title: string;
  day: DayKey | null;
  categoryId?: string | null;
  priority?: Priority;
  note?: string;
}

export interface RoutineInput {
  title: string;
  repeat: RepeatRule;
  categoryId?: string | null;
  priority?: Priority;
  note?: string;
  startDay?: DayKey;
}

export interface StoreSnapshot {
  data: AppData;
  today: DayKey;
  /** False until local storage has been read on the client. */
  ready: boolean;
}

/** Stable placeholder so server and first client render agree. */
const SERVER_SNAPSHOT: StoreSnapshot = Object.freeze({
  data: createEmptyData(),
  today: "1970-01-01",
  ready: false,
});

function upsertEntry(entries: Entry[], entry: Entry): Entry[] {
  const index = entries.findIndex((item) => item.id === entry.id);
  if (index === -1) return [...entries, entry];
  const next = entries.slice();
  next[index] = entry;
  return next;
}

/**
 * The application store.
 *
 * It lives outside React on purpose: the source of truth is local storage, an
 * external system, and React subscribes to it through useSyncExternalStore.
 * That keeps hydration honest (the server renders the empty snapshot, the
 * client swaps in real data) and keeps every mutation in one testable place.
 */
export class AppStore {
  private snapshot: StoreSnapshot = SERVER_SNAPSHOT;
  private listeners = new Set<() => void>();
  private hydrated = false;
  private clock: number | null = null;

  constructor(private readonly repository: DataRepository = localRepository) {}

  // --- React binding -------------------------------------------------------

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    this.hydrate();
    this.startClock();

    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) this.stopClock();
    };
  };

  getSnapshot = (): StoreSnapshot => this.snapshot;

  getServerSnapshot = (): StoreSnapshot => SERVER_SNAPSHOT;

  // --- Lifecycle -----------------------------------------------------------

  private emit(): void {
    for (const listener of this.listeners) listener();
  };

  private commit(data: AppData, today = this.snapshot.today): void {
    this.snapshot = { data, today, ready: true };
    this.repository.save(data);
    this.emit();
  }

  private update(fn: (previous: AppData) => AppData): void {
    this.commit(fn(this.snapshot.data));
  }

  private hydrate(): void {
    if (this.hydrated || typeof window === "undefined") return;
    this.hydrated = true;

    const today = todayKey();
    const stored = this.repository.load() ?? createEmptyData();
    this.commit(materializeThrough(stored, today), today);
  }

  /** Rolls the plan over at midnight without needing a reload. */
  private startClock(): void {
    if (this.clock !== null || typeof window === "undefined") return;

    const check = () => {
      const day = todayKey();
      if (day === this.snapshot.today) return;
      this.commit(materializeThrough(this.snapshot.data, day), day);
    };

    this.clock = window.setInterval(check, 60_000);
    document.addEventListener("visibilitychange", check);
    this.stopClockListener = () =>
      document.removeEventListener("visibilitychange", check);
  }

  private stopClockListener: (() => void) | null = null;

  private stopClock(): void {
    if (this.clock !== null) {
      window.clearInterval(this.clock);
      this.clock = null;
    }
    this.stopClockListener?.();
    this.stopClockListener = null;
  }

  /** Re-runs the plan for days that are still editable (today and later). */
  private resync(data: AppData): AppData {
    const today = this.snapshot.today;
    const futureDays = new Set(
      data.entries
        .map((entry) => entry.day)
        .filter((day) => compareDays(day, today) > 0),
    );

    let entries = data.entries;
    for (const day of [today, ...Array.from(futureDays).sort()]) {
      entries = syncDay(entries, data, day, today);
    }
    return { ...data, entries };
  }

  // --- Entries -------------------------------------------------------------

  setEntryStatus = (entry: Entry, status: EntryStatus): void => {
    this.update((previous) => ({
      ...previous,
      entries: upsertEntry(previous.entries, {
        ...entry,
        status,
        doneAt: status === "done" ? Date.now() : null,
      }),
    }));
  };

  toggleEntry = (entry: Entry): void => {
    this.setEntryStatus(entry, entry.status === "done" ? "pending" : "done");
  };

  /** Flexible routines are recorded only on the days they actually happen. */
  toggleFlexible = (routine: Routine, day: DayKey): void => {
    const id = entryId(day, "routine", routine.id);

    this.update((previous) => {
      const existing = previous.entries.find((item) => item.id === id);
      if (existing?.status === "done") {
        return {
          ...previous,
          entries: previous.entries.filter((item) => item.id !== id),
        };
      }
      return {
        ...previous,
        entries: upsertEntry(previous.entries, {
          id,
          day,
          sourceType: "routine",
          sourceId: routine.id,
          title: routine.title,
          categoryId: routine.categoryId,
          priority: routine.priority,
          status: "done",
          doneAt: Date.now(),
          order: routine.order,
          scope: "week",
        }),
      };
    });
  };

  // --- Tasks ---------------------------------------------------------------

  addTask = (input: TaskInput): Task => {
    const task: Task = {
      id: uid("tk"),
      title: input.title.trim(),
      note: input.note ?? "",
      categoryId: input.categoryId ?? null,
      priority: input.priority ?? "normal",
      day: input.day,
      createdAt: Date.now(),
      order: Date.now(),
    };

    this.update((previous) =>
      this.resync({ ...previous, tasks: [...previous.tasks, task] }),
    );
    return task;
  };

  updateTask = (id: string, patch: Partial<Omit<Task, "id">>): void => {
    this.update((previous) =>
      this.resync({
        ...previous,
        tasks: previous.tasks.map((task) =>
          task.id === id ? { ...task, ...patch } : task,
        ),
      }),
    );
  };

  moveTask = (id: string, day: DayKey | null): void => {
    const today = this.snapshot.today;
    this.update((previous) =>
      this.resync({
        ...previous,
        tasks: previous.tasks.map((task) =>
          task.id === id ? { ...task, day } : task,
        ),
        // The entry on the day it left goes away, unless that day is history.
        entries: previous.entries.filter(
          (entry) =>
            !(
              entry.sourceType === "task" &&
              entry.sourceId === id &&
              compareDays(entry.day, today) >= 0
            ),
        ),
      }),
    );
  };

  deleteTask = (id: string): void => {
    const today = this.snapshot.today;
    this.update((previous) => ({
      ...previous,
      tasks: previous.tasks.filter((task) => task.id !== id),
      entries: previous.entries.filter(
        (entry) =>
          !(
            entry.sourceType === "task" &&
            entry.sourceId === id &&
            compareDays(entry.day, today) >= 0
          ),
      ),
    }));
  };

  // --- Routines ------------------------------------------------------------

  addRoutine = (input: RoutineInput): Routine => {
    const routine: Routine = {
      id: uid("rt"),
      title: input.title.trim(),
      note: input.note ?? "",
      categoryId: input.categoryId ?? null,
      priority: input.priority ?? "normal",
      repeat: input.repeat,
      startDay: input.startDay ?? this.snapshot.today,
      endDay: null,
      archivedAt: null,
      createdAt: Date.now(),
      order: Date.now(),
    };

    this.update((previous) =>
      this.resync({ ...previous, routines: [...previous.routines, routine] }),
    );
    return routine;
  };

  updateRoutine = (id: string, patch: Partial<Omit<Routine, "id">>): void => {
    this.update((previous) =>
      this.resync({
        ...previous,
        routines: previous.routines.map((routine) =>
          routine.id === id ? { ...routine, ...patch } : routine,
        ),
      }),
    );
  };

  archiveRoutine = (id: string, archived: boolean): void => {
    this.updateRoutine(id, { archivedAt: archived ? Date.now() : null });
  };

  /** Deletes the routine but keeps what already happened. */
  deleteRoutine = (id: string): void => {
    const today = this.snapshot.today;
    this.update((previous) =>
      this.resync({
        ...previous,
        routines: previous.routines.filter((routine) => routine.id !== id),
        entries: previous.entries.filter(
          (entry) =>
            !(
              entry.sourceType === "routine" &&
              entry.sourceId === id &&
              compareDays(entry.day, today) >= 0
            ),
        ),
      }),
    );
  };

  // --- Categories ----------------------------------------------------------

  addCategory = (name: string, color: CategoryColor): void => {
    this.update((previous) => ({
      ...previous,
      categories: [
        ...previous.categories,
        {
          id: uid("cat"),
          name: name.trim(),
          color,
          order: previous.categories.length,
        },
      ],
    }));
  };

  updateCategory = (id: string, patch: Partial<Omit<Category, "id">>): void => {
    this.update((previous) => ({
      ...previous,
      categories: previous.categories.map((category) =>
        category.id === id ? { ...category, ...patch } : category,
      ),
    }));
  };

  deleteCategory = (id: string): void => {
    this.update((previous) => ({
      ...previous,
      categories: previous.categories.filter((category) => category.id !== id),
      routines: previous.routines.map((routine) =>
        routine.categoryId === id ? { ...routine, categoryId: null } : routine,
      ),
      tasks: previous.tasks.map((task) =>
        task.categoryId === id ? { ...task, categoryId: null } : task,
      ),
    }));
  };

  // --- Settings and data ---------------------------------------------------

  updateSettings = (patch: Partial<Settings>): void => {
    this.update((previous) => ({
      ...previous,
      settings: { ...previous.settings, ...patch },
    }));
  };

  loadSamplePlan = (): void => {
    this.update((previous) =>
      this.resync({
        ...previous,
        routines: [...previous.routines, ...sampleRoutines()],
        settings: { ...previous.settings, onboarded: true },
      }),
    );
  };

  replaceAll = (json: string): boolean => {
    const imported = importData(json);
    if (!imported) return false;
    this.commit(materializeThrough(imported, this.snapshot.today));
    return true;
  };

  resetAll = (): void => {
    this.repository.clear();
    this.commit(createEmptyData());
  };
}
