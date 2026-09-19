import { describe, expect, it } from "vitest";
import { addDays } from "../date/day";
import { createEmptyData } from "../storage/defaults";
import { dailyGreeting } from "./greeting";
import { makeEntry } from "./test-utils";
import { VERSES } from "./verses";
import type { AppData, Entry } from "./types";

const TODAY = "2026-09-16";

function withEntries(entries: Entry[]): AppData {
  return { ...createEmptyData(), entries };
}

/** The default goal is five hours, seventy percent of which is a good day. */
const GOAL = 300;

describe("dailyGreeting", () => {
  it("does not tease somebody who has not started yet", () => {
    const greeting = dailyGreeting(withEntries([]), TODAY);

    expect(greeting.tone).toBe("plain");
    expect(greeting.text).toContain("اول");
  });

  it("praises a day that is already won, before it is over", () => {
    const greeting = dailyGreeting(
      withEntries([makeEntry({ day: TODAY, minutes: GOAL })]),
      TODAY,
    );

    expect(greeting.tone).toBe("praise");
  });

  it("nudges after a blank yesterday", () => {
    const greeting = dailyGreeting(
      withEntries([
        makeEntry({ day: addDays(TODAY, -1), sourceId: "a", minutes: 0 }),
        makeEntry({ day: addDays(TODAY, -2), sourceId: "b", minutes: 200 }),
      ]),
      TODAY,
    );

    expect(greeting.tone).toBe("nudge");
    expect(greeting.text).toContain("دیروز");
  });

  it("notices a long absence rather than only yesterday", () => {
    const greeting = dailyGreeting(
      withEntries([makeEntry({ day: addDays(TODAY, -6), minutes: 120 })]),
      TODAY,
    );

    expect(greeting.tone).toBe("nudge");
  });

  it("praises a yesterday that met its goal", () => {
    const greeting = dailyGreeting(
      withEntries([makeEntry({ day: addDays(TODAY, -1), minutes: GOAL })]),
      TODAY,
    );

    expect(greeting.tone).toBe("praise");
  });

  it("says the same thing all day, and something else the next day", () => {
    const data = withEntries([
      makeEntry({ day: addDays(TODAY, -1), minutes: 60 }),
    ]);

    // Stable: re-rendering must not reshuffle the message under the reader.
    expect(dailyGreeting(data, TODAY).text).toBe(dailyGreeting(data, TODAY).text);

    const week = new Set(
      Array.from({ length: 7 }, (_, index) => {
        const day = addDays(TODAY, index);
        return dailyGreeting(
          withEntries([makeEntry({ day: addDays(day, -1), minutes: 60 })]),
          day,
        ).text;
      }),
    );
    expect(week.size).toBeGreaterThan(1);
  });

  it("ignores skipped items when reading yesterday", () => {
    const greeting = dailyGreeting(
      withEntries([
        makeEntry({
          day: addDays(TODAY, -1),
          minutes: 0,
          status: "skipped",
        }),
        makeEntry({ day: addDays(TODAY, -3), sourceId: "b", minutes: 90 }),
      ]),
      TODAY,
    );

    expect(greeting.tone).toBe("nudge");
  });
});

describe("the daily verse", () => {
  it("is fixed for a day and changes with it", () => {
    const data = withEntries([]);

    expect(dailyGreeting(data, TODAY).verse.text).toBe(
      dailyGreeting(data, TODAY).verse.text,
    );
    expect(dailyGreeting(data, TODAY).verse.text).not.toBe(
      dailyGreeting(data, addDays(TODAY, 1)).verse.text,
    );
  });

  it("works through the collection rather than favouring a few", () => {
    const data = withEntries([]);
    const seen = new Set(
      Array.from(
        { length: VERSES.length * 3 },
        (_, index) => dailyGreeting(data, addDays(TODAY, index)).verse.text,
      ),
    );

    // Hashing cannot promise every line, but a spread this narrow would mean
    // most of the eighty were unreachable.
    expect(seen.size).toBeGreaterThan(VERSES.length * 0.55);
  });

  it("keeps every line short enough to read at a glance", () => {
    for (const verse of VERSES) expect(verse.text.length).toBeLessThanOrEqual(90);
    expect(VERSES).toHaveLength(80);
  });
});
