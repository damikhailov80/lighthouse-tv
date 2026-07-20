import type { Activity, ActivityStatus } from "./types";
import { remainingRatio, statusOf } from "./status";

// One row of the dashboard carousel.
export interface ActivitySection {
  id: string;
  title: string;
  activities: Activity[];
}

// The rows, in the order they appear on screen. "Due soon" merges the two
// middle statuses: on a TV three rows are as many as fit, and the difference
// between "orange" and "yellow" is already carried by the card's own colour.
const GROUPS: { id: string; title: string; statuses: ActivityStatus[] }[] = [
  { id: "overdue", title: "Overdue", statuses: ["red"] },
  { id: "due-soon", title: "Due soon", statuses: ["orange", "yellow"] },
  { id: "on-track", title: "On track", statuses: ["green"] },
];

// A row with one or two cards in it is a heading paying for almost nothing and
// leaves most of the screen empty, so those activities are shown only in the
// "All activities" row at the bottom.
const MIN_ROW_SIZE = 3;

// Most urgent first (overdue at the front, greenest at the back).
function byUrgency(activities: Activity[], now: Date): Activity[] {
  return [...activities].sort((a, b) => remainingRatio(a, now) - remainingRatio(b, now));
}

// The calendar day, as a stable string. Everything picked "for today" — the
// suggestions and the banner — keys off it, so the picks hold still until
// midnight and then change together.
export function dayKey(now: Date = new Date()): string {
  return `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
}

// FNV-1a over the activity id, mixed with the day. Used instead of Math.random
// so the suggestions hold still: the dashboard is remounted every time an
// activity page is opened and closed, and a fresh shuffle would move the cards
// out from under the remote. They change once a day instead.
function shuffleKey(id: string, now: Date): number {
  let hash = 2166136261;
  for (const character of `${id}@${dayKey(now)}`) {
    hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  }
  return hash >>> 0;
}

// Three activities picked at random, so the screen has something to offer even
// when nothing is urgent enough to fill a status row.
function suggestionsOf(activities: Activity[], now: Date): Activity[] {
  return [...activities]
    .sort((a, b) => shuffleKey(a.id, now) - shuffleKey(b.id, now))
    .slice(0, MIN_ROW_SIZE);
}

// Builds the rows of the dashboard, top to bottom: the status rows that have
// enough cards to be worth a heading, then the daily suggestions, then
// everything. An activity may appear in several rows — the rows are ways of
// looking at the list, not a partition of it.
export function sectionsOf(
  activities: Activity[],
  now: Date = new Date(),
): ActivitySection[] {
  const sorted = byUrgency(activities, now);

  const sections = GROUPS.map(({ id, title, statuses }) => ({
    id,
    title,
    activities: sorted.filter((activity) => statuses.includes(statusOf(activity, now))),
  })).filter((section) => section.activities.length >= MIN_ROW_SIZE);

  const suggested = suggestionsOf(sorted, now);
  if (suggested.length >= MIN_ROW_SIZE) {
    sections.push({ id: "suggested", title: "Suggested for today", activities: suggested });
  }

  // Always last and never dropped: it is the only row guaranteed to hold every
  // activity, whatever the others decided to show.
  if (sorted.length > 0) {
    sections.push({ id: "all", title: "All activities", activities: sorted });
  }

  return sections;
}

// The activity featured in the banner. `pinnedId` is the pick already made for
// today: the banner is chosen once a day and then held, so marking it done
// turns it green in place instead of handing the screen to another activity
// mid-press. Without a pin — a new day, or a pinned activity that is gone — it
// falls back to the single most urgent one, ordered exactly like the rows so
// the two can never disagree.
export function heroOf(
  activities: Activity[],
  now: Date = new Date(),
  pinnedId: string | null = null,
): Activity | undefined {
  const pinned = activities.find((activity) => activity.id === pinnedId);
  return pinned ?? byUrgency(activities, now)[0];
}
