import { describe, expect, it } from "vitest";
import type { AppData } from "../domain/types";
import type { DataRepository } from "../storage/repository";
import { createEmptyData } from "../storage/defaults";
import { AppStore } from "./store";

/** An in-memory repository, so the store can be exercised without a browser. */
function memoryRepository(seed: AppData | null = null): DataRepository {
  let held = seed;
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

/** Subscribing is what hydrates the store, exactly as React does. */
function mounted(seed?: AppData): AppStore {
  const store = new AppStore(memoryRepository(seed ?? createEmptyData()));
  store.subscribe(() => {});
  return store;
}

describe("moveTasks", () => {
  it("moves every named task in one step", () => {
    const store = mounted();
    const a = store.addTask({ title: "اول", day: null });
    const b = store.addTask({ title: "دوم", day: null });
    const untouched = store.addTask({ title: "سوم", day: null });

    store.moveTasks([a.id, b.id], "2026-08-29");

    const tasks = store.getSnapshot().data.tasks;
    expect(tasks.find((t) => t.id === a.id)?.day).toBe("2026-08-29");
    expect(tasks.find((t) => t.id === b.id)?.day).toBe("2026-08-29");
    expect(tasks.find((t) => t.id === untouched.id)?.day).toBeNull();
  });

  it("is a single undo, not one per task", () => {
    const store = mounted();
    const a = store.addTask({ title: "اول", day: null });
    const b = store.addTask({ title: "دوم", day: null });

    store.moveTasks([a.id, b.id], "2026-08-29");
    expect(store.undo()).toBe(true);

    const tasks = store.getSnapshot().data.tasks;
    expect(tasks.every((t) => t.day === null)).toBe(true);
    expect(store.canUndo()).toBe(false);
  });

  it("does nothing, and stays undoable, on an empty list", () => {
    const store = mounted();
    const task = store.addTask({ title: "زبان", day: null });
    store.deleteTask(task.id);

    store.moveTasks([], "2026-08-29");

    // The delete is still the thing that would be undone.
    expect(store.canUndo()).toBe(true);
    store.undo();
    expect(store.getSnapshot().data.tasks).toHaveLength(1);
  });
});

describe("undo", () => {
  it("has nothing to undo before anything is deleted", () => {
    const store = mounted();
    expect(store.canUndo()).toBe(false);
    expect(store.undo()).toBe(false);
  });

  it("brings a deleted task back", () => {
    const store = mounted();
    const task = store.addTask({ title: "زبان", day: null });

    store.deleteTask(task.id);
    expect(store.getSnapshot().data.tasks).toHaveLength(0);

    expect(store.undo()).toBe(true);
    expect(store.getSnapshot().data.tasks.map((t) => t.title)).toEqual(["زبان"]);
  });

  it("brings a deleted routine back", () => {
    const store = mounted();
    const routine = store.addRoutine({ title: "مطالعه", repeat: { kind: "daily" } });

    store.deleteRoutine(routine.id);
    expect(store.getSnapshot().data.routines).toHaveLength(0);

    store.undo();
    expect(store.getSnapshot().data.routines.map((r) => r.title)).toEqual(["مطالعه"]);
  });

  it("restores a category *and* the items that pointed at it", () => {
    // This is the case that cannot be reconstructed from what is left:
    // deleting a category also clears it from every routine and task.
    const store = mounted();
    const category = store.getSnapshot().data.categories[0];
    const task = store.addTask({
      title: "پروژه",
      day: null,
      categoryId: category.id,
    });

    store.deleteCategory(category.id);
    expect(
      store.getSnapshot().data.tasks.find((t) => t.id === task.id)?.categoryId,
    ).toBeNull();

    store.undo();
    const restored = store.getSnapshot().data;
    expect(restored.categories.some((c) => c.id === category.id)).toBe(true);
    expect(restored.tasks.find((t) => t.id === task.id)?.categoryId).toBe(
      category.id,
    );
  });

  it("undoes a full reset", () => {
    const store = mounted();
    store.addTask({ title: "زبان", day: null });

    store.resetAll();
    expect(store.getSnapshot().data.tasks).toHaveLength(0);

    store.undo();
    expect(store.getSnapshot().data.tasks).toHaveLength(1);
  });

  it("goes back one step and no further", () => {
    const store = mounted();
    const first = store.addTask({ title: "اول", day: null });
    const second = store.addTask({ title: "دوم", day: null });

    store.deleteTask(first.id);
    store.deleteTask(second.id);

    expect(store.undo()).toBe(true);
    // The second delete is undone; the first stays deleted.
    expect(store.getSnapshot().data.tasks.map((t) => t.title)).toEqual(["دوم"]);
    expect(store.canUndo()).toBe(false);
    expect(store.undo()).toBe(false);
  });

  it("persists the restored state, not just the in-memory snapshot", () => {
    const repository = memoryRepository(createEmptyData());
    const store = new AppStore(repository);
    store.subscribe(() => {});

    const task = store.addTask({ title: "زبان", day: null });
    store.deleteTask(task.id);
    store.undo();

    expect(repository.load()?.tasks).toHaveLength(1);
  });
});
