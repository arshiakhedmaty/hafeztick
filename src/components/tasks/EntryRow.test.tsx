// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { todayKey } from "@/lib/date/day";
import { createEmptyData } from "@/lib/storage/defaults";
import { makeEntry, makeLogged } from "@/lib/domain/test-utils";
import type { Entry } from "@/lib/domain/types";
import { renderApp } from "@/test/render";
import { EntryRow } from "./EntryRow";

const TODAY = todayKey();

function withEntry(entry: Entry) {
  const data = createEmptyData();
  return { ...data, entries: [entry], lastMaterializedDay: TODAY };
}

/** The unlogged item a person opens the app to. */
function pending(): Entry {
  return makeLogged({ day: TODAY, sourceId: "study", minutes: 0, title: "مطالعه" });
}

/** An item worked on earlier today and deliberately left open. */
function inProgress(minutes: number): Entry {
  return makeEntry({
    day: TODAY,
    sourceId: "study",
    title: "زبان",
    minutes,
    status: "pending",
    doneAt: null,
  });
}

describe("<EntryRow>", () => {
  it("invites a duration rather than a tick", () => {
    renderApp(<EntryRow entry={pending()} />, withEntry(pending()));

    expect(screen.getByRole("button", { name: /ثبت زمان/ })).toBeTruthy();
    // Nothing on an unlogged row records anything by itself.
    expect(screen.queryByLabelText("ساعت")).toBeNull();
  });

  it("records the hours and minutes that were typed", async () => {
    const entry = pending();
    const { repository } = renderApp(<EntryRow entry={entry} />, withEntry(entry));

    fireEvent.click(screen.getByRole("button", { name: /ثبت زمان/ }));
    fireEvent.change(screen.getByLabelText("ساعت"), { target: { value: "1" } });
    fireEvent.change(screen.getByLabelText("دقیقه"), { target: { value: "45" } });
    fireEvent.click(screen.getByRole("button", { name: "افزودن" }));

    await vi.waitFor(() => {
      expect(repository.load()?.entries[0]).toMatchObject({ minutes: 105 });
    });
  });

  it("adds a second session to the total instead of replacing it", async () => {
    const entry = inProgress(30);
    const { repository } = renderApp(<EntryRow entry={entry} />, withEntry(entry));

    // The chip showing the running total is also the way to add to it.
    fireEvent.click(screen.getByRole("button", { name: "۰:۳۰" }));
    fireEvent.change(screen.getByLabelText("دقیقه"), { target: { value: "45" } });
    fireEvent.click(screen.getByRole("button", { name: "افزودن" }));

    await vi.waitFor(() => {
      expect(repository.load()?.entries[0].minutes).toBe(75);
    });
  });

  it("leaves an item open when time is logged against it", async () => {
    const entry = pending();
    const { repository } = renderApp(<EntryRow entry={entry} />, withEntry(entry));

    fireEvent.click(screen.getByRole("button", { name: /ثبت زمان/ }));
    fireEvent.change(screen.getByLabelText("دقیقه"), { target: { value: "20" } });
    fireEvent.click(screen.getByRole("button", { name: "افزودن" }));

    await vi.waitFor(() => {
      // Time spent is not a claim of being finished.
      expect(repository.load()?.entries[0].status).toBe("pending");
    });
  });

  it("finishes an item only when the tick is pressed, keeping its hours", async () => {
    const entry = inProgress(75);
    const { repository } = renderApp(<EntryRow entry={entry} />, withEntry(entry));

    fireEvent.click(screen.getByRole("checkbox"));

    await vi.waitFor(() => {
      expect(repository.load()?.entries[0]).toMatchObject({
        status: "done",
        minutes: 75,
      });
    });
  });

  it("corrects the running total from the menu without touching the tick", async () => {
    const entry = inProgress(120);
    const { repository } = renderApp(<EntryRow entry={entry} />, withEntry(entry));

    fireEvent.click(screen.getByRole("button", { name: "گزینه‌های بیشتر" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "اصلاح مجموع زمان" }));

    const hours = screen.getByLabelText("ساعت") as HTMLInputElement;
    // Typing over an hour value must not snap back to the previous number.
    fireEvent.change(hours, { target: { value: "0" } });
    expect(hours.value).toBe("0");

    fireEvent.change(screen.getByLabelText("دقیقه"), { target: { value: "90" } });
    fireEvent.click(screen.getByRole("button", { name: "ثبت" }));

    await vi.waitFor(() => {
      expect(repository.load()?.entries[0]).toMatchObject({
        minutes: 90,
        status: "pending",
      });
    });
  });

  it("closes the field on Escape without recording anything", async () => {
    const entry = pending();
    const { repository } = renderApp(<EntryRow entry={entry} />, withEntry(entry));

    fireEvent.click(screen.getByRole("button", { name: /ثبت زمان/ }));
    fireEvent.keyDown(screen.getByLabelText("ساعت"), { key: "Escape" });

    expect(screen.queryByLabelText("ساعت")).toBeNull();
    expect(repository.load()?.entries[0].minutes ?? 0).toBe(0);
  });

  it("labels the checkbox with the time logged and whether it is settled", () => {
    const entry = inProgress(90);
    renderApp(<EntryRow entry={entry} />, withEntry(entry));

    expect(
      screen.getByRole("checkbox", {
        name: "زبان — ۱ ساعت ۳۰ دقیقه ثبت شده، هنوز باز است",
      }),
    ).toBeTruthy();
  });
});
