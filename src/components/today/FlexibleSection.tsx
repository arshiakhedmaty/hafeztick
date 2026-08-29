"use client";

import { cn } from "@/lib/utils/cn";
import { faNum } from "@/lib/utils/number";
import type { DayKey } from "@/lib/date/day";
import { flexibleForWeekOf, routineById } from "@/lib/domain/selectors";
import { useApp } from "@/lib/store/AppStore";
import { useToast } from "@/components/ui/Toast";
import { SectionTitle } from "@/components/ui/Card";
import { Checkbox } from "@/components/tasks/Checkbox";

/**
 * "n times a week" routines.
 *
 * They deliberately sit apart from the day's list: they are a weekly promise,
 * so not doing one today is not a miss, and the UI should not imply that.
 */
export function FlexibleSection({ day }: { day: DayKey }) {
  const { data, actions } = useApp();
  const toast = useToast();
  const items = flexibleForWeekOf(data, day);

  if (items.length === 0) return null;

  return (
    <section className="mb-5">
      <SectionTitle count={items.length}>سهم این هفته</SectionTitle>

      <div className="grid gap-2 sm:grid-cols-2">
        {items.map((item) => {
          const doneToday = item.doneDays.includes(day);
          const complete = item.done >= item.target;
          const routine = routineById(data, item.routineId);

          return (
            <div
              key={item.routineId}
              className={cn(
                "flex items-center gap-3 rounded-xl border bg-surface px-3 py-3 transition-colors",
                complete ? "border-accent/40" : "border-line",
              )}
            >
              <Checkbox
                checked={doneToday}
                tone={complete ? "accent" : "primary"}
                label={`${item.title} — ${doneToday ? "امروز انجام شده" : "امروز انجام نشده"}`}
                onToggle={() => {
                  if (!routine) return;
                  actions.toggleFlexible(routine, day);
                  if (!doneToday) {
                    toast({
                      message:
                        item.done + 1 >= item.target
                          ? `${item.title}: سهم این هفته کامل شد`
                          : `${item.title}: ${faNum(item.done + 1)} از ${faNum(item.target)}`,
                      icon: "check",
                    });
                  }
                }}
              />

              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] text-fg">{item.title}</p>
                <p className="hz-tnum mt-0.5 text-[11px] text-muted">
                  {faNum(item.done)} از {faNum(item.target)} بار این هفته
                </p>
              </div>

              <div className="flex shrink-0 gap-1" aria-hidden="true">
                {Array.from({ length: item.target }, (_, index) => (
                  <span
                    key={index}
                    className={cn(
                      "size-1.5 rounded-full transition-colors duration-300",
                      index < item.done
                        ? complete
                          ? "bg-accent"
                          : "bg-primary"
                        : "bg-line-strong",
                    )}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
