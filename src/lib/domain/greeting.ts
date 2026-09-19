import { type DayKey, addDays, diffDays, weekdayIndex } from "../date/day";
import { type GoalSettings, goalMinutesFor, successMinutesFor } from "./goals";
import type { AppData, Entry } from "./types";

/**
 * The line that greets you above the day's input.
 *
 * Separate from the advisory slot on purpose. That one is rare, serious and
 * acts on the app — it moves a goal, it resets a streak. This one says
 * something every single day and changes nothing: it is the difference between
 * a ledger and a companion. Yesterday is the only day it comments on, because
 * a remark about last Tuesday is not banter, it is nagging.
 *
 * Tone is mixed on purpose too. Praise alone stops registering — an app that
 * congratulates you for a blank day is one you stop believing — so a quiet day
 * gets teased. The teasing is aimed at the day, never at the person, and never
 * at a beginner who has nothing to be teased about yet.
 */
export interface Greeting {
  text: string;
  /** Drives the colour: earned praise is gold, a nudge is plain. */
  tone: "praise" | "nudge" | "plain";
}

interface Situation {
  kind: string;
  tone: Greeting["tone"];
  lines: string[];
}

/**
 * Stable within a day, different the next.
 *
 * A message that reshuffled on every render would read as noise, and one keyed
 * to the pool's length alone would repeat on a cycle you could feel. Hashing
 * the date gives both: fixed all day, unpredictable across days.
 */
function pick(lines: string[], day: DayKey, salt: number): string {
  let hash = salt;
  for (const char of day) hash = (hash * 31 + char.charCodeAt(0)) % 100_000;
  return lines[hash % lines.length];
}

function minutesOn(entries: Entry[], day: DayKey): number {
  return entries
    .filter((entry) => entry.day === day && entry.status !== "skipped")
    .reduce((sum, entry) => sum + Math.max(0, entry.minutes ?? 0), 0);
}

/** Days before today that carry any recorded time — how much history exists. */
function loggedDays(entries: Entry[], today: DayKey): number {
  const days = new Set<DayKey>();
  for (const entry of entries) {
    if (entry.minutes > 0 && diffDays(entry.day, today) < 0) days.add(entry.day);
  }
  return days.size;
}

/** How many days back the last recorded time was; null when there is none. */
function daysSinceLast(entries: Entry[], today: DayKey): number | null {
  let best: number | null = null;
  for (const entry of entries) {
    const delta = diffDays(entry.day, today);
    if (entry.minutes > 0 && delta < 0 && (best === null || -delta < best)) {
      best = -delta;
    }
  }
  return best;
}

function situationFor(
  data: Pick<AppData, "entries" | "settings">,
  today: DayKey,
): Situation {
  const settings = data.settings as GoalSettings;
  const entries = data.entries;

  const history = loggedDays(entries, today);
  const yesterday = addDays(today, -1);
  const yesterdayMinutes = minutesOn(entries, yesterday);
  const yesterdayGoal = goalMinutesFor(settings, yesterday);
  const yesterdaySuccess = successMinutesFor(settings, yesterday);
  const todayMinutes = minutesOn(entries, today);
  const gap = daysSinceLast(entries, today);
  const isFriday = weekdayIndex(today) === 6;

  // Nothing has happened yet: there is no record to be encouraging *about*,
  // and teasing someone on their first day is just rude.
  if (history === 0 && todayMinutes === 0) {
    return {
      kind: "first",
      tone: "plain",
      lines: [
        "امروز روز اول دفترت است. یک کار بنویس و زمانش را ثبت کن.",
        "هنوز چیزی ثبت نشده. اولین ساعت از هزار ساعت، همین امروز است.",
        "دفتر خالی است و این خوب است — یعنی همه‌چیز از حالا شروع می‌شود.",
      ],
    };
  }

  // Today is already won. Say so now, not at midnight when nobody is looking.
  if (todayMinutes > 0 && todayMinutes >= yesterdaySuccess) {
    return {
      kind: "today-strong",
      tone: "praise",
      lines: [
        "امروز را همین حالا بردی. باقی‌اش اضافه‌کاری است.",
        "کار امروز درآمد. هرچه از اینجا ثبت کنی، سود خالص است.",
        "به هدف امروز رسیدی. حالا با خیال راحت ادامه بده.",
      ],
    };
  }

  if (gap !== null && gap >= 4) {
    return {
      kind: "long-gap",
      tone: "nudge",
      lines: [
        "چند روزی غیبت داشتی. دفتر جایی نرفته، همین‌جا منتظرت بود.",
        "برگشتی! بقیه‌ی روزها را ول کن، امروز را بنویس.",
        "فاصله افتاد، ولی زنجیره از همین امروز دوباره ساخته می‌شود.",
        "خب، تعطیلات تمام شد؟ یک کار بنویس تا راه بیفتیم.",
      ],
    };
  }

  if (yesterdayMinutes === 0) {
    return {
      kind: "blank-yesterday",
      tone: "nudge",
      lines: [
        "دیروز صفحه‌اش سفید ماند. امروز جبرانش کن.",
        "دیروز هیچ ساعتی ثبت نشد — بگذار امروز شبیه دیروز نباشد.",
        "دیروز استراحت بود دیگر، نه؟ باشد. امروز نوبت کار است.",
        "دفتر دیروز خالی است و کمی دلخور به نظر می‌رسد.",
      ],
    };
  }

  if (yesterdayGoal > 0 && yesterdayMinutes >= yesterdayGoal) {
    return {
      kind: "beat-goal",
      tone: "praise",
      lines: [
        "دیروز کامل زدی به هدف. امروز هم همان آدم باش.",
        "دیروز عالی بود. ببینیم امروز هم می‌توانی یا شانسی بود.",
        "هدف دیروز را رد کردی — این را آدم‌ها یک بار در ماه می‌توانند، تو دیروز کردی.",
      ],
    };
  }

  if (yesterdayMinutes >= yesterdaySuccess) {
    return {
      kind: "good-yesterday",
      tone: "praise",
      lines: [
        "دیروز روز موفقی بود. دوتا پشت سر هم قشنگ‌تر است.",
        "دیروز خوب پیش رفت. امروز فقط تکرارش کن.",
        "دیروز از پسش برآمدی. امروز هم بعید نیست.",
      ],
    };
  }

  if (isFriday) {
    return {
      kind: "friday",
      tone: "plain",
      lines: [
        "جمعه است. حتی نیم ساعت هم هفته را کامل می‌کند.",
        "جمعه‌ها کم‌توقع باش، ولی صفر نه.",
      ],
    };
  }

  return {
    kind: "short-yesterday",
    tone: "plain",
    lines: [
      "دیروز کم بود، ولی صفر نبود. امروز کمی بیشتر.",
      "دیروز شروعش کردی، امروز جدی‌ترش کن.",
      "کم‌کم جمع می‌شود. امروز یک ساعت بیشتر از دیروز.",
      "ساعت‌ها را روزها می‌سازند، نه یک روز. امروز هم بنویس.",
    ],
  };
}

/** The message for `today`, or null on a day the app should keep quiet. */
export function dailyGreeting(
  data: Pick<AppData, "entries" | "settings">,
  today: DayKey,
): Greeting {
  const situation = situationFor(data, today);
  return {
    text: pick(situation.lines, today, situation.kind.length),
    tone: situation.tone,
  };
}
