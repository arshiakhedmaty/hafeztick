"use client";

import { useMemo } from "react";
import { nextInsight } from "@/lib/domain/insight";
import { useApp } from "@/lib/store/AppStore";
import { BackupNotice } from "./BackupNotice";
import { InsightNotice } from "./InsightNotice";

/**
 * The page's single advisory slot.
 *
 * Two independent systems want to speak here — the behavioural one and the
 * backup reminder — and a stack of two banners above the day's work is how
 * both of them get ignored. So exactly one may appear.
 *
 * Insights win the tie because they are the perishable ones: a broken streak
 * is only worth naming for a few days, a strong week only while it is still
 * this week. The backup reminder is patient — it stands until it is answered,
 * so it loses nothing by waiting a day.
 */
export function Advisory() {
  const { data, today } = useApp();

  const insight = useMemo(() => nextInsight(data, today), [data, today]);

  if (insight) return <InsightNotice insight={insight} />;
  return <BackupNotice />;
}
