import type { Activity } from "./types";

const daysAgo = (n: number): string =>
  new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();

// Sample activities used on first launch so the dashboard is never empty.
// Chosen to show off every period unit and several statuses at once, and to
// give each of the bundled illustrations a home.
export function seedActivities(): Activity[] {
  return [
    { id: "1", title: "Evening walk", every: 3, unit: "day", lastDoneAt: daysAgo(0), image: "walking" },
    { id: "2", title: "Go cycling", every: 1, unit: "week", lastDoneAt: daysAgo(4), image: "cycling" },
    { id: "3", title: "Read a book", every: 2, unit: "day", lastDoneAt: daysAgo(1), image: "reading" },
    { id: "4", title: "Board game night", every: 2, unit: "week", lastDoneAt: daysAgo(9), image: "board-games" },
    { id: "5", title: "Invite friends over", every: 2, unit: "week", lastDoneAt: daysAgo(12), image: "meeting-friends" },
    { id: "6", title: "Movie night", every: 1, unit: "month", lastDoneAt: daysAgo(50), image: "watching-film" },
  ];
}
