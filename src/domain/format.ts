import type { Activity } from "./types";
import { daysUntilDue } from "./status";

// Compact remaining-time label: "Overdue" / "Due today" / "3d left".
export function dueLabel(activity: Activity, now: Date = new Date()): string {
  const days = daysUntilDue(activity, now);
  if (days < 0) return "Overdue";
  if (days === 0) return "Due today";
  return `${days}d left`;
}

// Compact period label: "daily" / "every 3d" / "weekly" / "every 2w" /
// "monthly" / "every 1.5mo".
export function periodShort(activity: Activity): string {
  const { every, unit } = activity;
  if (every === 1) {
    return unit === "day" ? "daily" : unit === "week" ? "weekly" : "monthly";
  }
  const suffix = unit === "day" ? "d" : unit === "week" ? "w" : "mo";
  return `every ${every}${suffix}`;
}
