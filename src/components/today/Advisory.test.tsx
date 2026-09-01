// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { addDays, todayKey } from "@/lib/date/day";
import { createEmptyData } from "@/lib/storage/defaults";
import { MILESTONES } from "@/lib/domain/insight";
import { makeLogged } from "@/lib/domain/test-utils";
import type { AppData, Settings } from "@/lib/domain/types";
import { renderApp } from "@/test/render";
import { Advisory } from "./Advisory";

const TODAY = todayKey();

/** `count` days of `minutes` each, ending yesterday. */
function history(
  count: number,
  minutes: number,
  settings: Partial<Settings> = {},
): AppData {
  const data = createEmptyData();
  return {
    ...data,
    entries: Array.from({ length: count }, (_, i) =>
      makeLogged({ day: addDays(TODAY, -(count - i)), sourceId: `s${i}`, minutes }),
    ),
    settings: {
      ...data.settings,
      // Milestones fire off raw accumulated hours; silencing them keeps each
      // test about the one thing it is testing.
      celebratedHours: MILESTONES[MILESTONES.length - 1],
      ...settings,
    },
  };
}

describe("<Advisory>", () => {
  it("stays silent when the goal fits and the backup is fresh", () => {
    const { container } = renderApp(
      <Advisory />,
      history(20, 300, { lastExportAt: Date.now() }),
    );
    // The toast provider's live region is always mounted; nothing else is.
    expect(container.querySelector("section")).toBeNull();
  });

  it("offers a reachable goal when the current one is out of reach", () => {
    renderApp(<Advisory />, history(20, 100, { lastExportAt: Date.now() }));
    expect(screen.getByText(/هدفت/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "هدف ۲ ساعت" })).toBeTruthy();
  });

  it("falls back to the backup reminder when no insight applies", () => {
    const { container } = renderApp(<Advisory />, history(20, 300));
    expect(container.textContent).toContain("پشتیبان");
  });

  it("never shows two messages at once", () => {
    // Both an insight and the backup prompt qualify for this history.
    const { container } = renderApp(<Advisory />, history(20, 100));
    expect(container.querySelectorAll("section")).toHaveLength(1);
    expect(container.textContent).not.toContain("پشتیبان");
  });

  it("retires a milestone permanently once it has been seen", async () => {
    const { repository } = renderApp(
      <Advisory />,
      history(30, 300, { lastExportAt: Date.now(), celebratedHours: 0 }),
    );

    expect(screen.getByText(/۱۰۰ ساعت مطالعه/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "دیدم" }));

    await vi.waitFor(() => {
      expect(repository.load()?.settings.celebratedHours).toBe(100);
    });
  });

  it("acts on the suggestion rather than only dismissing it", async () => {
    const { repository } = renderApp(
      <Advisory />,
      history(20, 100, { lastExportAt: Date.now() }),
    );

    fireEvent.click(screen.getByRole("button", { name: "هدف ۲ ساعت" }));

    // The message goes away because it has been answered, not hidden.
    expect(screen.queryByText(/هدفت/)).toBeNull();

    // Persistence is debounced off the interaction path, so wait for the write.
    await vi.waitFor(() => {
      const saved = repository.load();
      expect(saved?.settings.dailyGoalMinutes).toBe(120);
      expect(saved?.settings.insightSnoozedAt["goal-too-high"]).toBeGreaterThan(0);
    });
  });
});
