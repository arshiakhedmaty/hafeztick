import { WEEKDAY_NAMES } from "../date/jalali";
import { faNum } from "../utils/number";
import type { RepeatRule } from "./types";

/** Human description of a recurrence rule, e.g. «شنبه، دوشنبه». */
export function repeatLabel(rule: RepeatRule): string {
  switch (rule.kind) {
    case "daily":
      return "هر روز";
    case "weekdays": {
      if (rule.days.length === 7) return "هر روز";
      if (rule.days.length === 0) return "بدون روز";
      return rule.days
        .slice()
        .sort((a, b) => a - b)
        .map((day) => WEEKDAY_NAMES[day])
        .join("، ");
    }
    case "flexible":
      return `${faNum(rule.timesPerWeek)} بار در هفته`;
  }
}
