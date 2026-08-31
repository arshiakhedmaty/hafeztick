import { describe, expect, it } from "vitest";
import {
  MEANINGFUL_DAYS,
  SNOOZE_DAYS,
  STALE_AFTER_DAYS,
  backupPrompt,
  loggedDayCount,
} from "./backup";
import { makeLogged } from "./test-utils";

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 7, 31);

/** `count` distinct days, each carrying an hour. */
function history(count: number) {
  return Array.from({ length: count }, (_, i) =>
    makeLogged({ day: `2026-06-${String(i + 1).padStart(2, "0")}`, minutes: 60 }),
  );
}

function subject(
  days: number,
  settings: { lastExportAt?: number | null; backupRemindedAt?: number | null } = {},
) {
  return {
    entries: history(days),
    settings: {
      lastExportAt: settings.lastExportAt ?? null,
      backupRemindedAt: settings.backupRemindedAt ?? null,
    },
  };
}

describe("loggedDayCount", () => {
  it("counts days, not entries", () => {
    const entries = [
      makeLogged({ day: "2026-08-29", sourceId: "a", minutes: 60 }),
      makeLogged({ day: "2026-08-29", sourceId: "b", minutes: 30 }),
      makeLogged({ day: "2026-08-30", sourceId: "c", minutes: 45 }),
    ];
    expect(loggedDayCount({ entries })).toBe(2);
  });

  it("ignores days that were planned but never logged", () => {
    const entries = [
      makeLogged({ day: "2026-08-29", minutes: 60 }),
      makeLogged({ day: "2026-08-30", minutes: 0 }),
    ];
    expect(loggedDayCount({ entries })).toBe(1);
  });
});

describe("backupPrompt", () => {
  it("stays quiet before there is anything worth losing", () => {
    expect(backupPrompt(subject(MEANINGFUL_DAYS - 1), NOW).due).toBe(false);
  });

  it("asks once enough history has built up and none was ever taken", () => {
    const prompt = backupPrompt(subject(MEANINGFUL_DAYS), NOW);
    expect(prompt.due).toBe(true);
    expect(prompt.loggedDays).toBe(MEANINGFUL_DAYS);
    expect(prompt.daysSinceExport).toBeNull();
  });

  it("stays quiet while a backup is still recent", () => {
    const recent = NOW - 3 * DAY;
    expect(backupPrompt(subject(30, { lastExportAt: recent }), NOW).due).toBe(
      false,
    );
  });

  it("asks again once the last backup has gone stale", () => {
    const old = NOW - STALE_AFTER_DAYS * DAY;
    const prompt = backupPrompt(subject(30, { lastExportAt: old }), NOW);
    expect(prompt.due).toBe(true);
    expect(prompt.daysSinceExport).toBe(STALE_AFTER_DAYS);
  });

  it("respects a dismissal", () => {
    const justNow = NOW - 1 * DAY;
    expect(
      backupPrompt(subject(30, { backupRemindedAt: justNow }), NOW).due,
    ).toBe(false);
  });

  it("comes back after the snooze runs out", () => {
    const stale = NOW - SNOOZE_DAYS * DAY;
    expect(backupPrompt(subject(30, { backupRemindedAt: stale }), NOW).due).toBe(
      true,
    );
  });

  it("taking a backup outranks a pending dismissal", () => {
    // markExported clears backupRemindedAt, so this is the state it leaves.
    expect(
      backupPrompt(
        subject(30, { lastExportAt: NOW, backupRemindedAt: null }),
        NOW,
      ).due,
    ).toBe(false);
  });
});
