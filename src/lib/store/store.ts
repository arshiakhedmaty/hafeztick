import { type DayKey, compareDays, todayKey } from "../date/day";
import type { InsightKind } from "../domain/insight";
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
import { clampMinutes } from "../utils/duration";
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

  /**
   * The state as it was before the last destructive action.
   *
   * Deleting a routine, a task or a category cannot be reconstructed from
   * what is left — removing a category also clears it from every routine and
   * task that used it — so the only honest undo is the whole previous state.
   * It is small JSON, and holding exactly one step keeps the promise easy to
   * describe: the last delete can be taken back, nothing older.
   */
  private undoable: AppData | null = null;

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

  /**
   * How long a change may sit in memory before it reaches storage.
   *
   * Serialising the whole store and handing it to localStorage is synchronous
   * and grows with history — around 16ms for two years of use on a desktop,
   * several times that on a phone. Paying it inside every keystroke made
   * typing a goal visibly lag, so it moves off the interaction path: the
   * snapshot updates and renders immediately, and the write follows.
   */
  private static readonly SAVE_DELAY = 250;

  private pendingSave: number | null = null;
  private unsaved: AppData | null = null;
  private flushListener: (() => void) | null = null;

  private commit(data: AppData, today = this.snapshot.today): void {
    this.snapshot = { data, today, ready: true };
    this.scheduleSave(data);
    this.emit();
  }

  private scheduleSave(data: AppData): void {
    this.unsaved = data;

    if (typeof window === "undefined") {
      this.flushSave();
      return;
    }

    // Anything that can end the page flushes first, so the debounce window can
    // never be the reason a change is lost.
    if (!this.flushListener) {
      this.flushListener = () => this.flushSave();
      window.addEventListener("pagehide", this.flushListener);
      document.addEventListener("visibilitychange", this.flushListener);
    }

    if (this.pendingSave !== null) window.clearTimeout(this.pendingSave);
    this.pendingSave = window.setTimeout(
      () => this.flushSave(),
      AppStore.SAVE_DELAY,
    );
  }

  /** Writes whatever is outstanding, immediately. */
  flushSave = (): void => {
    if (this.pendingSave !== null && typeof window !== "undefined") {
      window.clearTimeout(this.pendingSave);
    }
    this.pendingSave = null;

    const data = this.unsaved;
    if (!data) return;
    this.unsaved = null;
    this.repository.save(data);
  };

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

    this.flushSave();
    if (this.flushListener) {
      window.removeEventListener("pagehide", this.flushListener);
      document.removeEventListener("visibilitychange", this.flushListener);
      this.flushListener = null;
    }
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

  /**
   * Records how long an item actually took.
   *
   * This is the only way progress enters the app. There is no timer to start
   * and no timer to forget to stop: the user measures the time however they
   * like, and the app is the ledger. Logging zero minutes is the same as
   * clearing the item, so undo needs no separate concept.
   */
  logEntry = (entry: Entry, minutes: number): void => {
    const safe = clampMinutes(minutes);

    this.update((previous) => ({
      ...previous,
      entries: upsertEntry(previous.entries, {
        ...entry,
        minutes: safe,
        status: safe > 0 ? "done" : "pending",
        doneAt: safe > 0 ? (entry.doneAt ?? Date.now()) : null,
      }),
    }));
  };

  /** Back to "planned, nothing logged". */
  clearEntry = (entry: Entry): void => {
    this.logEntry(entry, 0);
  };

  setEntryStatus = (entry: Entry, status: EntryStatus): void => {
    this.update((previous) => ({
      ...previous,
      entries: upsertEntry(previous.entries, {
        ...entry,
        status,
        // Skipping releases the item; any time on it goes with it.
        minutes: status === "done" ? entry.minutes : 0,
        doneAt: status === "done" ? (entry.doneAt ?? Date.now()) : null,
      }),
    }));
  };

  /** Flexible routines are recorded only on the days they actually happen. */
  logFlexible = (routine: Routine, day: DayKey, minutes: number): void => {
    const id = entryId(day, "routine", routine.id);
    const safe = clampMinutes(minutes);

    this.update((previous) => {
      if (safe === 0) {
        return {
          ...previous,
          entries: previous.entries.filter((item) => item.id !== id),
        };
      }

      const existing = previous.entries.find((item) => item.id === id);
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
          minutes: safe,
          doneAt: existing?.doneAt ?? Date.now(),
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

  /**
   * Moves several tasks at once — the "sweep everything overdue into today"
   * button. Doing it as one commit rather than one per task means a single
   * write, a single render, and a single thing to undo: a bulk action the
   * user cannot take back is worse than no bulk action.
   */
  moveTasks = (ids: string[], day: DayKey | null): void => {
    if (ids.length === 0) return;
    const today = this.snapshot.today;
    const moving = new Set(ids);

    this.remember();
    this.update((previous) =>
      this.resync({
        ...previous,
        tasks: previous.tasks.map((task) =>
          moving.has(task.id) ? { ...task, day } : task,
        ),
        entries: previous.entries.filter(
          (entry) =>
            !(
              entry.sourceType === "task" &&
              moving.has(entry.sourceId) &&
              compareDays(entry.day, today) >= 0
            ),
        ),
      }),
    );
  };

  deleteTask = (id: string): void => {
    const today = this.snapshot.today;
    this.remember();
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
    this.remember();
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
    this.remember();
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

  /** Records that a backup was taken, which is what stops the reminder. */
  markExported = (): void => {
    this.updateSettings({ lastExportAt: Date.now(), backupRemindedAt: null });
  };

  /** Puts the backup reminder away for a while without taking one. */
  snoozeBackupReminder = (): void => {
    this.updateSettings({ backupRemindedAt: Date.now() });
  };

  /** Dismisses one kind of advisory message; it stays away for a fortnight. */
  snoozeInsight = (kind: InsightKind): void => {
    this.updateSettings({
      insightSnoozedAt: {
        ...this.snapshot.data.settings.insightSnoozedAt,
        [kind]: Date.now(),
      },
    });
  };

  /**
   * Records a milestone as seen. Unlike the other messages this is permanent:
   * a hundred hours is only reached once, and being congratulated for it twice
   * cheapens it.
   */
  celebrateMilestone = (hours: number): void => {
    this.updateSettings({
      celebratedHours: Math.max(hours, this.snapshot.data.settings.celebratedHours),
    });
  };

  /**
   * Takes the app's own suggestion for a reachable daily goal, and clears the
   * message with it — the suggestion has been acted on, not dismissed.
   */
  adoptSuggestedGoal = (minutes: number): void => {
    this.updateSettings({
      dailyGoalMinutes: clampMinutes(minutes),
      insightSnoozedAt: {
        ...this.snapshot.data.settings.insightSnoozedAt,
        "goal-too-high": Date.now(),
      },
    });
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
    this.remember();
    // A queued write of the old data would otherwise land after the clear.
    if (this.pendingSave !== null && typeof window !== "undefined") {
      window.clearTimeout(this.pendingSave);
    }
    this.pendingSave = null;
    this.unsaved = null;
    this.repository.clear();
    this.commit(createEmptyData());
  };

  // --- Undo ----------------------------------------------------------------

  private remember(): void {
    this.undoable = this.snapshot.data;
  }

  /** True when the last destructive action can still be taken back. */
  canUndo = (): boolean => this.undoable !== null;

  /**
   * Restores the state from before the last delete. One step only: undoing
   * clears the record, so it can never walk further back than the user was
   * told it would.
   */
  undo = (): boolean => {
    const previous = this.undoable;
    if (!previous) return false;
    this.undoable = null;
    this.commit(previous);
    return true;
  };
}
