"use client";

import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/ui/Icon";

/**
 * The shell every advisory message shares.
 *
 * There is exactly one of these on the page at a time. Giving them all the
 * same frame is what makes that rule possible to enforce, and what stops a
 * message that matters from arriving in a shape the eye has learned to skip.
 *
 * The two tones follow the page's own rule: طلا marks something that went
 * well, فیروزه marks something waiting on a decision.
 */
export function Notice({
  icon,
  tone = "gold",
  children,
  actions,
}: {
  icon: IconName;
  tone?: "gold" | "turquoise";
  children: ReactNode;
  actions: ReactNode;
}) {
  const gold = tone === "gold";

  return (
    <section
      className={[
        "hz-rise mb-5 flex flex-wrap items-center justify-between gap-3 rounded-card border px-4 py-3",
        gold
          ? "border-accent/35 bg-accent-soft/50"
          : "border-primary/35 bg-primary-soft/60",
      ].join(" ")}
    >
      <p className="flex min-w-0 items-start gap-2 text-[13px] leading-relaxed text-fg-soft">
        <Icon
          name={icon}
          size="1.1em"
          className={`mt-0.5 shrink-0 ${gold ? "text-accent" : "text-primary"}`}
        />
        <span>{children}</span>
      </p>

      <div className="flex shrink-0 gap-1.5">{actions}</div>
    </section>
  );
}
