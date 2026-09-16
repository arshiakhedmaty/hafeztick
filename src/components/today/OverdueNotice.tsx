"use client";

import { useState } from "react";
import { faNum } from "@/lib/utils/number";
import { formatDay } from "@/lib/date/day";
import type { DayKey } from "@/lib/date/day";
import type { Entry } from "@/lib/domain/types";
import { useApp } from "@/lib/store/AppStore";
import { useToast } from "@/components/ui/Toast";
import { Button, IconButton } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

/**
 * Tasks that were planned for an earlier day and never finished.
 *
 * The bar used to offer one all-or-nothing button, which is the wrong shape for
 * what a week of leftovers actually is: some of it you still intend to do, and
 * some of it you have quietly decided against. So it opens, and each item can be
 * pulled into today or dropped on its own.
 */
export function OverdueNotice({
  entries,
  today,
}: {
  entries: Entry[];
  today: DayKey;
}) {
  const { actions } = useApp();
  const toast = useToast();
  const [open, setOpen] = useState(false);

  if (entries.length === 0) return null;

  const moveAll = () => {
    actions.moveTasks(
      entries.map((entry) => entry.sourceId),
      today,
    );
    toast({
      message: `${faNum(entries.length)} کار به امروز منتقل شد`,
      icon: "calendar",
      action: { label: "برگرداندن", onClick: () => actions.undo() },
    });
  };

  return (
    <div className="hz-rise mb-5 rounded-card border border-accent/35 bg-accent-soft/60 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className="flex min-w-0 items-center gap-2 text-start text-[13px] text-fg-soft transition-colors hover:text-fg"
        >
          <Icon name="clock" size="1.1em" className="shrink-0 text-accent" />
          <span className="min-w-0">
            {faNum(entries.length)} کار از روزهای گذشته باز مانده است.
          </span>
          <Icon
            name={open ? "chevron-start" : "chevron-end"}
            size="0.9em"
            className="shrink-0 text-muted"
          />
        </button>

        <Button size="sm" variant="outline" onClick={moveAll}>
          انتقال همه به امروز
        </Button>
      </div>

      {open && (
        <ul className="hz-rise mt-3 space-y-1 border-t border-accent/25 pt-2.5">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="flex items-center gap-2 rounded-lg px-1 py-1 transition-colors hover:bg-surface/50"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] text-fg-soft">{entry.title}</p>
                <p className="text-[11px] text-muted">
                  {formatDay(entry.day, { withWeekday: true })}
                </p>
              </div>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  actions.moveTask(entry.sourceId, today);
                  toast({
                    message: `«${entry.title}» به امروز آمد`,
                    icon: "calendar",
                  });
                }}
              >
                امروز
              </Button>

              <IconButton
                icon="trash"
                label={`حذف ${entry.title}`}
                size="sm"
                variant="ghost"
                onClick={() => {
                  actions.deleteTask(entry.sourceId);
                  toast({
                    message: "کار حذف شد",
                    icon: "trash",
                    action: { label: "برگرداندن", onClick: () => actions.undo() },
                  });
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
