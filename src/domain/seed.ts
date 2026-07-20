import type { Activity } from "./types";

const daysAgo = (n: number): string =>
  new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();

// Sample activities used on first launch so the dashboard is never empty.
// Chosen to show off every period unit and several statuses at once.
export function seedActivities(): Activity[] {
  return [
    { id: "1", title: "Water the plants", every: 3, unit: "day", lastDoneAt: daysAgo(0) },
    { id: "2", title: "Play tennis", every: 1, unit: "week", lastDoneAt: daysAgo(4) },
    { id: "3", title: "Invite friends over", every: 2, unit: "week", lastDoneAt: daysAgo(12) },
    { id: "4", title: "Deep clean the house", every: 1.5, unit: "month", lastDoneAt: daysAgo(50) },
    { id: "5", title: "Board game night", every: 3, unit: "day", lastDoneAt: daysAgo(1) },
    { id: "6", title: "Dentist checkup", every: 6, unit: "month", lastDoneAt: daysAgo(30) },
  ];
}
