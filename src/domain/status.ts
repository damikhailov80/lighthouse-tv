import type { Activity, ActivityStatus } from "./types";
import { intervalDays } from "./period";

const DAY_MS = 24 * 60 * 60 * 1000;

// Whole days until the activity is next due. Negative means overdue.
export function daysUntilDue(activity: Activity, now: Date = new Date()): number {
  const lastDone = new Date(activity.lastDoneAt).getTime();
  const dueAt = lastDone + intervalDays(activity.every, activity.unit) * DAY_MS;
  return Math.floor((dueAt - now.getTime()) / DAY_MS);
}

// Whole days that have passed since the activity was last done.
export function daysSinceLastDone(activity: Activity, now: Date = new Date()): number {
  const lastDone = new Date(activity.lastDoneAt).getTime();
  return Math.floor((now.getTime() - lastDone) / DAY_MS);
}

// How far through the current interval we are, from 0 (just done) to 1 (due
// or overdue). Drives the progress bar.
export function progressFraction(activity: Activity, now: Date = new Date()): number {
  const lastDone = new Date(activity.lastDoneAt).getTime();
  const total = intervalDays(activity.every, activity.unit) * DAY_MS;
  const elapsed = now.getTime() - lastDone;
  return Math.min(Math.max(elapsed / total, 0), 1);
}

// Remaining time as a fraction of the interval (negative once overdue). Lower
// means more urgent; used to sort the dashboard.
export function remainingRatio(activity: Activity, now: Date = new Date()): number {
  return daysUntilDue(activity, now) / intervalDays(activity.every, activity.unit);
}

// Maps remaining time to a traffic-light status.
//
// Thresholds are expressed as a fraction of the interval, so they scale
// naturally: "yellow" means the same relative urgency whether the interval is
// 3 days or 6 months, instead of being tied to an absolute day count.
export function statusOf(activity: Activity, now: Date = new Date()): ActivityStatus {
  const remaining = daysUntilDue(activity, now);
  if (remaining < 0) return "red";

  const ratio = remaining / intervalDays(activity.every, activity.unit);
  if (ratio > 0.5) return "green";
  if (ratio > 0.2) return "yellow";
  return "orange";
}
