import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, createEmptyData } from "./defaults";
import { exportData, importData, normalize } from "./repository";

/** A backup written by v1, when progress was still counted in ticks. */
const LEGACY = {
  version: 1,
  categories: [{ id: "cat_study", name: "درس", color: "violet", order: 0 }],
  routines: [],
  tasks: [],
  entries: [
    {
      id: "2026-08-29::task:tk1",
      day: "2026-08-29",
      sourceType: "task",
      sourceId: "tk1",
      title: "زبان",
      categoryId: "cat_study",
      priority: "normal",
      status: "done",
      doneAt: 1,
      order: 0,
      scope: "day",
    },
  ],
  settings: {
    theme: "dark",
    displayName: "آرشیا",
    dailyGoal: 0.8,
    restDays: [6],
    reduceMotion: false,
    onboarded: true,
  },
  lastMaterializedDay: "2026-08-29",
};

describe("normalize", () => {
  it("rejects storage that is not shaped like app data", () => {
    expect(normalize(null)).toBeNull();
    expect(normalize({ entries: "nope", categories: [] })).toBeNull();
  });

  it("carries the old daily goal over as the success threshold", () => {
    const data = normalize(LEGACY);
    expect(data?.settings.successThreshold).toBe(0.8);
  });

  it("starts the hour goal at the default, rather than inventing one", () => {
    const data = normalize(LEGACY);
    expect(data?.settings.dailyGoalMinutes).toBe(
      DEFAULT_SETTINGS.dailyGoalMinutes,
    );
    expect(data?.settings.weekdayGoalMinutes).toEqual([
      null,
      null,
      null,
      null,
      null,
      null,
      null,
    ]);
  });

  it("keeps the settings that still exist", () => {
    const data = normalize(LEGACY);
    expect(data?.settings.theme).toBe("dark");
    expect(data?.settings.restDays).toEqual([6]);
  });

  it("ignores settings the app no longer has", () => {
    // A backup written before displayName and reduceMotion were dropped must
    // still open; the extra keys simply have nowhere to land.
    const data = normalize(LEGACY);
    expect(data).not.toBeNull();
    expect("displayName" in (data?.settings ?? {})).toBe(false);
  });

  it("gives pre-v2 entries zero minutes instead of a made-up duration", () => {
    const data = normalize(LEGACY);
    expect(data?.entries[0].minutes).toBe(0);
    // The plan itself is history and survives untouched.
    expect(data?.entries[0].title).toBe("زبان");
  });

  it("clamps a hostile duration rather than trusting it", () => {
    const data = normalize({
      ...LEGACY,
      entries: [{ ...LEGACY.entries[0], minutes: 99_999 }],
    });
    expect(data?.entries[0].minutes).toBe(24 * 60);
  });

  it("repairs a malformed weekday goal array", () => {
    const data = normalize({
      ...LEGACY,
      settings: { ...LEGACY.settings, weekdayGoalMinutes: [360, "x", null] },
    });
    expect(data?.settings.weekdayGoalMinutes).toEqual([
      360,
      null,
      null,
      null,
      null,
      null,
      null,
    ]);
  });
});

describe("export and import", () => {
  it("round-trips current data", () => {
    const original = createEmptyData();
    const restored = importData(exportData(original));
    expect(restored?.settings).toEqual(original.settings);
    expect(restored?.categories).toEqual(original.categories);
  });

  it("returns null on invalid JSON instead of throwing", () => {
    expect(importData("{ not json")).toBeNull();
  });
});
