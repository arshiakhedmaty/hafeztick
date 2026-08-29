import { describe, expect, it } from "vitest";
import {
  materializeThrough,
  plannedEntriesFor,
  routineOccursOn,
  syncDay,
} from "./schedule";
import { makeData, makeEntry, makeRoutine, makeTask } from "./test-utils";

const SATURDAY = "2026-08-29";
const SUNDAY = "2026-08-30";

describe("routineOccursOn", () => {
  it("places daily routines on every day inside their window", () => {
    const routine = makeRoutine({ startDay: SATURDAY });
    expect(routineOccursOn(routine, SATURDAY)).toBe(true);
    expect(routineOccursOn(routine, "2026-08-28")).toBe(false); // before start
  });

  it("respects the chosen weekdays", () => {
    const routine = makeRoutine({ repeat: { kind: "weekdays", days: [0] } });
    expect(routineOccursOn(routine, SATURDAY)).toBe(true);
    expect(routineOccursOn(routine, SUNDAY)).toBe(false);
  });

  it("never schedules flexible routines on a specific day", () => {
    const routine = makeRoutine({
      repeat: { kind: "flexible", timesPerWeek: 3 },
    });
    expect(routineOccursOn(routine, SATURDAY)).toBe(false);
  });

  it("skips archived routines", () => {
    const routine = makeRoutine({ archivedAt: 1 });
    expect(routineOccursOn(routine, SATURDAY)).toBe(false);
  });
});

describe("plannedEntriesFor", () => {
  it("lists routines before tasks", () => {
    const data = {
      routines: [makeRoutine({ id: "rt", title: "روتین" })],
      tasks: [makeTask({ id: "tk", title: "کار", day: SATURDAY })],
    };

    const planned = plannedEntriesFor(data, SATURDAY);
    expect(planned.map((entry) => entry.sourceType)).toEqual(["routine", "task"]);
  });
});

describe("syncDay", () => {
  const data = {
    routines: [makeRoutine({ id: "rt" })],
    tasks: [] as ReturnType<typeof makeTask>[],
  };

  it("adds entries that the plan requires", () => {
    const entries = syncDay([], data, SATURDAY, SATURDAY);
    expect(entries).toHaveLength(1);
    expect(entries[0].sourceId).toBe("rt");
  });

  it("is idempotent", () => {
    const once = syncDay([], data, SATURDAY, SATURDAY);
    const twice = syncDay(once, data, SATURDAY, SATURDAY);
    expect(twice).toHaveLength(1);
  });

  it("keeps history even when the routine is gone", () => {
    const past = "2026-08-20";
    const existing = [
      makeEntry({
        day: past,
        sourceType: "routine",
        sourceId: "deleted",
        status: "done",
      }),
    ];

    const entries = syncDay(existing, { routines: [], tasks: [] }, past, SATURDAY);
    expect(entries).toHaveLength(1);
  });

  it("drops a pending entry whose source left today's plan", () => {
    const existing = [
      makeEntry({ day: SATURDAY, sourceType: "routine", sourceId: "rt" }),
    ];

    const entries = syncDay(
      existing,
      { routines: [], tasks: [] },
      SATURDAY,
      SATURDAY,
    );
    expect(entries).toHaveLength(0);
  });

  it("keeps an entry the user already ticked, even if the plan changed", () => {
    const existing = [
      makeEntry({
        day: SATURDAY,
        sourceType: "routine",
        sourceId: "rt",
        status: "done",
      }),
    ];

    const entries = syncDay(
      existing,
      { routines: [], tasks: [] },
      SATURDAY,
      SATURDAY,
    );
    expect(entries).toHaveLength(1);
  });
});

describe("materializeThrough", () => {
  it("fills in every day since the last materialised one", () => {
    const data = makeData({
      routines: [makeRoutine({ id: "rt", startDay: "2026-08-25" })],
      lastMaterializedDay: "2026-08-26",
    });

    const next = materializeThrough(data, SATURDAY);
    const days = new Set(next.entries.map((entry) => entry.day));

    expect(next.lastMaterializedDay).toBe(SATURDAY);
    expect([...days].sort()).toEqual([
      "2026-08-27",
      "2026-08-28",
      "2026-08-29",
    ]);
  });

  it("only materialises today on a first run", () => {
    const data = makeData({
      routines: [makeRoutine({ id: "rt", startDay: "2020-01-01" })],
      lastMaterializedDay: null,
    });

    const next = materializeThrough(data, SATURDAY);
    expect(next.entries).toHaveLength(1);
    expect(next.entries[0].day).toBe(SATURDAY);
  });

  it("does not backfill further than the cap", () => {
    const data = makeData({
      routines: [makeRoutine({ id: "rt", startDay: "2020-01-01" })],
      lastMaterializedDay: "2020-01-01",
    });

    const next = materializeThrough(data, SATURDAY);
    expect(next.entries.length).toBeLessThanOrEqual(121);
  });

  it("is idempotent when run twice on the same day", () => {
    const data = makeData({
      routines: [makeRoutine({ id: "rt", startDay: "2026-08-25" })],
      lastMaterializedDay: "2026-08-27",
    });

    const once = materializeThrough(data, SATURDAY);
    const twice = materializeThrough(once, SATURDAY);
    expect(twice.entries).toHaveLength(once.entries.length);
  });
});
