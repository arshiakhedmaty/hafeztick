// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { addDays, todayKey } from "../date/day";
import type { AppData } from "../domain/types";
import { overdueEntries } from "../domain/selectors";
import { makeEntry } from "../domain/test-utils";
import type { DataRepository } from "../storage/repository";
import { createEmptyData } from "../storage/defaults";
import { AppStore } from "./store";

const TODAY = todayKey();
const YESTERDAY = addDays(TODAY, -1);

function memoryRepository(seed: AppData): DataRepository {
  let held: AppData | null = seed;
  return {
    load: () => held,
    save: (data) => {
      held = data;
    },
    clear: () => {
      held = null;
    },
  };
}

/**
 * What the app looks like the morning after a day that did not go to plan: a
 * task still dated yesterday, and the entry that day left behind.
 *
 * These run against a hydrated store — the store only learns what day it is
 * when it mounts in a browser, and every rule here is about the difference
 * between yesterday and today.
 */
function leftover(minutes = 0, status: "pending" | "done" = "pending") {
  const task = {
    id: "tk1",
    title: "زبان",
    note: "",
    categoryId: null,
    priority: "normal" as const,
    day: YESTERDAY,
    createdAt: 1,
    order: 1,
  };

  const store = new AppStore(
    memoryRepository({
      ...createEmptyData(),
      tasks: [task],
      entries: [makeEntry({ day: YESTERDAY, sourceId: task.id, minutes, status })],
      lastMaterializedDay: YESTERDAY,
    }),
  );
  store.subscribe(() => {});
  return { store, task };
}

describe("leftovers from earlier days", () => {
  it("is overdue until something is done about it", () => {
    const { store } = leftover();
    expect(overdueEntries(store.getSnapshot().data, TODAY)).toHaveLength(1);
  });

  it("stops being overdue once it is pulled into today", () => {
    const { store, task } = leftover();

    store.moveTask(task.id, TODAY);

    const data = store.getSnapshot().data;
    expect(data.tasks[0].day).toBe(TODAY);
    // The empty plan it left behind must not keep nagging from the past.
    expect(overdueEntries(data, TODAY)).toHaveLength(0);
  });

  it("stops being overdue once it is deleted", () => {
    const { store, task } = leftover();

    store.deleteTask(task.id);

    expect(overdueEntries(store.getSnapshot().data, TODAY)).toHaveLength(0);
  });

  it("keeps a past day that real time went into, even when the task goes", () => {
    const { store, task } = leftover(90, "done");

    store.deleteTask(task.id);

    // History is what the statistics are built on; deleting the task now does
    // not rewrite the afternoon it was worked on.
    const entries = store.getSnapshot().data.entries;
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ day: YESTERDAY, minutes: 90 });
  });
});
