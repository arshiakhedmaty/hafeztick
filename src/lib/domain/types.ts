import type { DayKey } from "../date/day";

export type ID = string;

export type Priority = "low" | "normal" | "high";

/** Colour tokens available to categories; resolved to CSS vars in the UI. */
export type CategoryColor =
  | "teal"
  | "violet"
  | "amber"
  | "rose"
  | "sky"
  | "lime"
  | "coral"
  | "plum"
  | "slate";

/**
 * - pending : planned, no time logged yet
 * - done    : the user entered how long it took and confirmed it
 * - skipped : deliberately dropped; leaves the day's denominator entirely
 */
export type EntryStatus = "pending" | "done" | "skipped";

export type SourceType = "routine" | "task";

export interface Category {
  id: ID;
  name: string;
  color: CategoryColor;
  order: number;
}

/**
 * How a routine recurs.
 * - daily     : every day
 * - weekdays  : fixed days of the Persian week (0 = Saturday)
 * - flexible  : "n times a week", the user picks which days
 */
export type RepeatRule =
  | { kind: "daily" }
  | { kind: "weekdays"; days: number[] }
  | { kind: "flexible"; timesPerWeek: number };

export interface Routine {
  id: ID;
  title: string;
  note: string;
  categoryId: ID | null;
  priority: Priority;
  repeat: RepeatRule;
  startDay: DayKey;
  endDay: DayKey | null;
  archivedAt: number | null;
  createdAt: number;
  order: number;
}

/** A one-off task. `day === null` means it lives in the backlog. */
export interface Task {
  id: ID;
  title: string;
  note: string;
  categoryId: ID | null;
  priority: Priority;
  day: DayKey | null;
  createdAt: number;
  order: number;
}

/**
 * The unit the user logs time against, and the unit statistics are built on.
 *
 * Entries are materialised once, as each day arrives, and then frozen: editing
 * or deleting a routine never rewrites what was already planned in the past.
 * This is what makes "adherence to plan" an honest number.
 */
export interface Entry {
  id: ID;
  day: DayKey;
  sourceType: SourceType;
  sourceId: ID;
  /** Snapshot of the source at materialisation time. */
  title: string;
  categoryId: ID | null;
  priority: Priority;
  status: EntryStatus;
  /**
   * Minutes of real time the user reported spending on this item. This — not
   * the fact that a box is ticked — is what every progress number is built on.
   */
  minutes: number;
  doneAt: number | null;
  order: number;
  /** Which budget the *item* counts against: the day, or the week. */
  scope: "day" | "week";
}

export type ThemePreference = "system" | "light" | "dark";

export interface Settings {
  theme: ThemePreference;
  /** Default study target in minutes, used for any day without its own goal. */
  dailyGoalMinutes: number;
  /**
   * Per-weekday study targets in minutes, index 0 = Saturday.
   * `null` falls back to `dailyGoalMinutes`; `0` makes the day unscored.
   */
  weekdayGoalMinutes: (number | null)[];
  /** Share of the day's hour goal that makes it a successful day (0..1). */
  successThreshold: number;
  /** Weekdays exempt from breaking a streak (0 = Saturday). */
  restDays: number[];
  onboarded: boolean;
  /** When a backup was last downloaded, so the app can stop nagging. */
  lastExportAt: number | null;
  /** When the backup reminder was last dismissed. */
  backupRemindedAt: number | null;
}

export interface AppData {
  version: number;
  categories: Category[];
  routines: Routine[];
  tasks: Task[];
  entries: Entry[];
  settings: Settings;
  /** Last day for which entries were generated. */
  lastMaterializedDay: DayKey | null;
}

export const PRIORITY_LABEL: Record<Priority, string> = {
  low: "کم",
  normal: "معمولی",
  high: "مهم",
};

export const CATEGORY_COLORS: CategoryColor[] = [
  "teal",
  "violet",
  "amber",
  "rose",
  "sky",
  "lime",
  "coral",
  "plum",
  "slate",
];

/** Deterministic entry id, so materialising twice can never duplicate. */
export function entryId(day: DayKey, sourceType: SourceType, sourceId: ID): ID {
  return `${day}::${sourceType}:${sourceId}`;
}

export function isRoutineActiveOn(routine: Routine, day: DayKey): boolean {
  if (routine.archivedAt !== null) return false;
  if (day < routine.startDay) return false;
  if (routine.endDay !== null && day > routine.endDay) return false;
  return true;
}
