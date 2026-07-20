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

// Remaining time as a fraction of the interval: 1 the moment it is done, 0 when
// it falls due, negative once overdue. Lower means more urgent; used to sort the
// dashboard and to pick the status colour.
//
// Deliberately not built on daysUntilDue: whole days thrown away by rounding
// are most of the interval on a short one. An activity done every two days is
// exactly half spent the second its "1 day left" is counted, which read as
// yellow the moment it had just been finished.
export function remainingRatio(activity: Activity, now: Date = new Date()): number {
  const lastDone = new Date(activity.lastDoneAt).getTime();
  const total = intervalDays(activity.every, activity.unit) * DAY_MS;
  return (lastDone + total - now.getTime()) / total;
}

// Was the activity already done today? Not a status of its own — a daily
// activity is green in the morning and orange by the evening either way — but
// it is what an offer to mark it done has to check, so the button is not still
// standing there after the job is finished.
export function doneToday(activity: Activity, now: Date = new Date()): boolean {
  return new Date(activity.lastDoneAt).toDateString() === now.toDateString();
}

// Maps remaining time to a traffic-light status.
//
// Thresholds are expressed as a fraction of the interval, so they scale
// naturally: "yellow" means the same relative urgency whether the interval is
// 3 days or 6 months, instead of being tied to an absolute day count.
export function statusOf(activity: Activity, now: Date = new Date()): ActivityStatus {
  const ratio = remainingRatio(activity, now);
  if (ratio < 0) return "red";
  if (ratio > 0.5) return "green";
  if (ratio > 0.2) return "yellow";
  return "orange";
}
