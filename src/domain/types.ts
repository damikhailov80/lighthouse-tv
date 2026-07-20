// Traffic-light status of an activity, from "plenty of time" to "overdue".
export type ActivityStatus = "green" | "yellow" | "orange" | "red";

// The unit a repeat period is expressed in.
export type PeriodUnit = "day" | "week" | "month";

// A recurring activity the user wants to keep up with.
export interface Activity {
  id: string;
  title: string;
  // How often it should be repeated, e.g. every = 2, unit = "week".
  every: number;
  unit: PeriodUnit;
  // ISO timestamp of the last time it was done.
  lastDoneAt: string;
}
