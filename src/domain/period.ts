import type { PeriodUnit } from "./types";

// Approximate day-length of each unit. A month is treated as 30 days, which is
// precise enough for a status dashboard.
export const UNIT_DAYS: Record<PeriodUnit, number> = {
  day: 1,
  week: 7,
  month: 30,
};

// Converts a repeat period ("every N units") into a number of days.
export function intervalDays(every: number, unit: PeriodUnit): number {
  return every * UNIT_DAYS[unit];
}
