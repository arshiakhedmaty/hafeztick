import type { AppData, Settings } from "./types";

/**
 * When to ask for a backup.
 *
 * Everything this app knows lives in one browser's local storage. Clearing
 * site data, a reset phone, or a browser that decides to reclaim space takes
 * the lot — and unlike a synced product, nothing anywhere else has a copy. So
 * the app has to ask.
 *
 * It has to ask *well*, though, which mostly means rarely: a reminder shown
 * before there is anything worth losing teaches people to dismiss it, and one
 * that returns the next day teaches them to ignore it.
 */

const DAY = 24 * 60 * 60 * 1000;

/** Days of real logged time before a backup is worth the interruption. */
export const MEANINGFUL_DAYS = 14;
/** How stale a backup may get before asking again. */
export const STALE_AFTER_DAYS = 30;
/** How long a dismissal is respected. */
export const SNOOZE_DAYS = 7;

export interface BackupPrompt {
  due: boolean;
  /** Days of history at risk, for the message. */
  loggedDays: number;
  /** Days since the last backup, or null when there has never been one. */
  daysSinceExport: number | null;
}

/** Distinct days that carry logged time — what a loss would actually cost. */
export function loggedDayCount(data: Pick<AppData, "entries">): number {
  const days = new Set<string>();
  for (const entry of data.entries) {
    if ((entry.minutes ?? 0) > 0) days.add(entry.day);
  }
  return days.size;
}

export function backupPrompt(
  data: Pick<AppData, "entries"> & {
    settings: Pick<Settings, "lastExportAt" | "backupRemindedAt">;
  },
  now: number = Date.now(),
): BackupPrompt {
  const { lastExportAt, backupRemindedAt } = data.settings;
  const loggedDays = loggedDayCount(data);
  const daysSinceExport =
    lastExportAt === null ? null : Math.floor((now - lastExportAt) / DAY);

  const worthProtecting = loggedDays >= MEANINGFUL_DAYS;
  const stale =
    daysSinceExport === null || daysSinceExport >= STALE_AFTER_DAYS;
  const snoozed =
    backupRemindedAt !== null && now - backupRemindedAt < SNOOZE_DAYS * DAY;

  return {
    due: worthProtecting && stale && !snoozed,
    loggedDays,
    daysSinceExport,
  };
}
