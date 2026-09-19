"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils/cn";
import type { DayKey } from "@/lib/date/day";
import { dailyGreeting } from "@/lib/domain/greeting";
import { useApp } from "@/lib/store/AppStore";
import { Icon } from "@/components/ui/Icon";

/**
 * A line of company, right where the day gets written.
 *
 * It sits directly above the input because that is the moment it is for: the
 * half-second between opening the app and deciding whether to bother. It is one
 * line, never a card — anything bigger competes with the work instead of
 * introducing it — and it only ever speaks about today and yesterday.
 *
 * Only shown for today. Looking back at last Tuesday to be told to get on with
 * it would be absurd.
 */
export function DailyNote({ day, today }: { day: DayKey; today: DayKey }) {
  const { data } = useApp();

  const greeting = useMemo(
    () => (day === today ? dailyGreeting(data, today) : null),
    [data, day, today],
  );

  if (!greeting) return null;

  return (
    <div className="hz-fade mb-3 border-s-2 border-line ps-3">
      <p
        className={cn(
          "flex items-start gap-2 text-[13px] leading-relaxed",
          greeting.tone === "praise" ? "text-accent" : "text-muted",
        )}
      >
        <Icon
          name={greeting.tone === "praise" ? "sparkle" : "sun"}
          size="1.05em"
          className="mt-[0.2em] shrink-0"
        />
        {greeting.text}
      </p>

      {/* The couplet sits under the remark, quieter than it. One is about
          today; the other has been true for eight hundred years. */}
      <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted/85">
        {greeting.verse.text}
        {greeting.verse.by && (
          <span className="text-muted/70"> — {greeting.verse.by}</span>
        )}
      </p>
    </div>
  );
}
