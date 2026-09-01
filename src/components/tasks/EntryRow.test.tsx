// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { todayKey } from "@/lib/date/day";
import { createEmptyData } from "@/lib/storage/defaults";
import { makeLogged } from "@/lib/domain/test-utils";
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
    fireEvent.click(screen.getByRole("button", { name: "ثبت" }));

    await vi.waitFor(() => {
      expect(repository.load()?.entries[0]).toMatchObject({
        minutes: 105,
        status: "done",
      });
    });
  });

  it("keeps a typed zero instead of snapping back to the old value", () => {
    const entry = makeLogged({ day: TODAY, sourceId: "study", minutes: 120 });
    renderApp(<EntryRow entry={entry} />, withEntry(entry));

    fireEvent.click(screen.getByRole("button", { name: "۲:۰۰" }));
    const hours = screen.getByLabelText("ساعت") as HTMLInputElement;
    fireEvent.change(hours, { target: { value: "0" } });

    expect(hours.value).toBe("0");
  });

  it("closes the field on Escape without recording anything", async () => {
    const entry = pending();
    const { repository } = renderApp(<EntryRow entry={entry} />, withEntry(entry));

    fireEvent.click(screen.getByRole("button", { name: /ثبت زمان/ }));
    fireEvent.keyDown(screen.getByLabelText("ساعت"), { key: "Escape" });

    expect(screen.queryByLabelText("ساعت")).toBeNull();
    expect(repository.load()?.entries[0].minutes ?? 0).toBe(0);
  });

  it("labels the checkbox with the time logged, not just the title", () => {
    const entry = makeLogged({ day: TODAY, sourceId: "study", minutes: 90, title: "مطالعه" });
    renderApp(<EntryRow entry={entry} />, withEntry(entry));

    expect(
      screen.getByRole("checkbox", { name: "مطالعه — ۱ ساعت ۳۰ دقیقه ثبت شده" }),
    ).toBeTruthy();
  });
});
