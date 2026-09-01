"use client";

import { faNum } from "@/lib/utils/number";
import { faDuration, faGoal } from "@/lib/utils/duration";
import type { Insight } from "@/lib/domain/insight";
import { useApp } from "@/lib/store/AppStore";
import { Button } from "@/components/ui/Button";
import { Notice } from "./Notice";

/**
 * Says the one thing worth saying, in the app's own voice: plain, specific,
 * and built out of the person's real numbers. No praise that isn't earned, no
 * advice that isn't actionable, and always a way to make it stop.
 */
export function InsightNotice({ insight }: { insight: Insight }) {
  const { actions } = useApp();
  const dismiss = () => actions.snoozeInsight(insight.kind);

  switch (insight.kind) {
    case "goal-too-high":
      return (
        <Notice
          icon="target"
          tone="turquoise"
          actions={
            <>
              <Button size="sm" variant="ghost" onClick={dismiss}>
                همین خوب است
              </Button>
              <Button
                size="sm"
                variant="outline"
                icon="target"
                onClick={() => actions.adoptSuggestedGoal(insight.suggestedMinutes)}
              >
                هدف {faGoal(insight.suggestedMinutes)}
              </Button>
            </>
          }
        >
          دو هفته است که به‌طور میانگین{" "}
          <b className="font-semibold text-fg">
            {faDuration(insight.averageMinutes, { short: true })}
          </b>{" "}
          در روز مطالعه می‌کنی، ولی هدفت {faGoal(insight.goalMinutes)} است.{" "}
          <span className="text-muted">
            هدفی که هیچ روز به آن نمی‌رسی، اندازه‌گیری نیست؛ قضاوت است.
          </span>
        </Notice>
      );

    case "streak-broken":
      return (
        <Notice
          icon="flame"
          tone="turquoise"
          actions={
            <Button size="sm" variant="outline" onClick={dismiss}>
              باشه
            </Button>
          }
        >
          <b className="font-semibold text-fg">
            {faNum(insight.lostStreak)} روز پیاپی
          </b>{" "}
          به هدفت رسیده بودی.{" "}
          <span className="text-muted">
            آن روزها هنوز سرِ جایشان است؛ امروز فقط روز اولِ زنجیره‌ی بعدی است.
          </span>
        </Notice>
      );

    case "milestone":
      return (
        <Notice
          icon="sparkle"
          actions={
            <Button
              size="sm"
              variant="outline"
              icon="check"
              onClick={() => actions.celebrateMilestone(insight.hours)}
            >
              دیدم
            </Button>
          }
        >
          <b className="font-semibold text-fg">
            {faNum(insight.hours)} ساعت مطالعه
          </b>{" "}
          در {faNum(insight.days)} روز ثبت کرده‌ای.{" "}
          <span className="text-muted">
            این دیگر یک روز خوب نیست؛ یک عادت است.
          </span>
        </Notice>
      );

    case "strong-week":
      return (
        <Notice
          icon="arrow-up"
          actions={
            <Button size="sm" variant="outline" onClick={dismiss}>
              باشه
            </Button>
          }
        >
          هفته‌ی گذشته{" "}
          <b className="font-semibold text-fg">
            {faDuration(insight.minutes, { short: true })}
          </b>{" "}
          مطالعه کردی، {faDuration(insight.minutes - insight.previousMinutes, { short: true })}{" "}
          بیشتر از هفته‌ی پیش از آن.{" "}
          <span className="text-muted">
            هر کاری آن هفته کردی، همان را دوباره بکن.
          </span>
        </Notice>
      );
  }
}
