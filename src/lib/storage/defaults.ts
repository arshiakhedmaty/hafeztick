import { todayKey } from "../date/day";
import { uid } from "../utils/id";
import type { AppData, Category, Routine, Settings } from "../domain/types";

/** v2 moved every progress number from tick counts to logged minutes. */
export const DATA_VERSION = 2;

/** Five hours a day, and seventy percent of it makes the day a success. */
export const DEFAULT_DAILY_GOAL_MINUTES = 300;

export const DEFAULT_SETTINGS: Settings = {
  theme: "system",
  dailyGoalMinutes: DEFAULT_DAILY_GOAL_MINUTES,
  weekdayGoalMinutes: [null, null, null, null, null, null, null],
  successThreshold: 0.7,
  restDays: [],
  onboarded: false,
};

export function defaultCategories(): Category[] {
  return [
    { id: "cat_work", name: "کار", color: "sky", order: 0 },
    { id: "cat_study", name: "درس و مطالعه", color: "violet", order: 1 },
    { id: "cat_health", name: "ورزش و سلامتی", color: "teal", order: 2 },
    { id: "cat_personal", name: "شخصی", color: "amber", order: 3 },
    { id: "cat_home", name: "خانه", color: "rose", order: 4 },
  ];
}

export function createEmptyData(): AppData {
  return {
    version: DATA_VERSION,
    categories: defaultCategories(),
    routines: [],
    tasks: [],
    entries: [],
    settings: { ...DEFAULT_SETTINGS },
    lastMaterializedDay: null,
  };
}

/** A small, opinionated starter plan offered on the empty state. */
export function sampleRoutines(): Routine[] {
  const startDay = todayKey();
  const base = {
    note: "",
    startDay,
    endDay: null,
    archivedAt: null,
    createdAt: Date.now(),
  };

  return [
    {
      ...base,
      id: uid("rt"),
      title: "مطالعه‌ی روزانه",
      categoryId: "cat_study",
      priority: "high",
      repeat: { kind: "daily" },
      order: 0,
    },
    {
      ...base,
      id: uid("rt"),
      title: "ورزش",
      categoryId: "cat_health",
      priority: "normal",
      repeat: { kind: "flexible", timesPerWeek: 3 },
      order: 1,
    },
    {
      ...base,
      id: uid("rt"),
      title: "مرور برنامه‌ی هفته",
      categoryId: "cat_personal",
      priority: "normal",
      repeat: { kind: "weekdays", days: [0] },
      order: 2,
    },
    {
      ...base,
      id: uid("rt"),
      title: "پیاده‌روی کوتاه",
      categoryId: "cat_health",
      priority: "low",
      repeat: { kind: "daily" },
      order: 3,
    },
  ];
}
