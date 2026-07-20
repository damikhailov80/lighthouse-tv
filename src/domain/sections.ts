import type { Activity, ActivityStatus } from "./types";
import { doneToday, remainingRatio, statusOf } from "./status";

// One row of the dashboard carousel.
export interface ActivitySection {
  id: string;
  title: string;
  activities: Activity[];
}

// The rows as they were decided this morning: a heading and the activities that
// belong to it, by id. Frozen for the day, because a dashboard that rearranges
// itself under the remote is worse than one that is slightly out of date —
// marking an activity done should turn its card green where it stands, not make
// it jump to another row and take its heading down with it. Tomorrow the rows
// are dealt again.
export interface DayLayout {
  day: string;
  rows: { id: string; title: string; activityIds: string[] }[];
}

// The status rows, in the order they appear on screen. "Due soon" merges the two
// middle statuses: on a TV a handful of rows are as many as fit, and the
// difference between "orange" and "yellow" is already carried by the card's own
// colour. There is no row for "green": an activity with plenty of time left is
// not something the screen has to bring up, and it is still in "All activities".
const GROUPS: { id: string; title: string; statuses: ActivityStatus[] }[] = [
  { id: "overdue", title: "Overdue", statuses: ["red"] },
  { id: "due-soon", title: "Due soon", statuses: ["orange", "yellow"] },
];

// How many cards a row needs before it earns a heading of its own. A row that
// does not fill the width of the screen leaves a heading standing over empty
// space, and four normal cards are exactly what fills it.
const MIN_ROW_SIZE = 4;

// How many activities are suggested for the day. They are shown as wide cards,
// already fill the screen three across — so the suggestions are exempt from
// MIN_ROW_SIZE, like "All activities" but for the opposite reason.
const SUGGESTION_COUNT = 3;

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

// Three activities picked at random, so the screen always has something to
// offer even when nothing is urgent enough to fill a status row.
//
// The banner's activity is never one of them: it is already the largest thing on
// the screen, and repeating it directly underneath spends a suggestion on
// something that was never in doubt. That is the one hard rule — everything else
// gives way to filling the row. What has been done today is held back, because
// it belongs in "Done today" rather than in an offer to go and do it, but on a
// short list it is taken anyway: three cards of anything beat two cards and a
// gap, and a finished activity shown again is only ever a mild repetition.
function suggestionsOf(activities: Activity[], now: Date, heroId?: string): Activity[] {
  const candidates = activities
    .filter((activity) => activity.id !== heroId)
    .sort((a, b) => shuffleKey(a.id, now) - shuffleKey(b.id, now));

  const pending = candidates.filter((activity) => !doneToday(activity, now));
  const done = candidates.filter((activity) => doneToday(activity, now));

  return [...pending, ...done].slice(0, SUGGESTION_COUNT);
}

// Decides the day's rows: what to do today, what is late, what is about to be.
// Called once a day; after that the result is stored and handed to sectionsOf,
// so pressing "done" changes a card's colour and nothing else.
// `heroId` is the banner's pick for the day, kept out of the suggestions;
// resolved through heroOf so that passing nothing still excludes the activity
// the banner is going to fall back to.
export function layoutOf(
  activities: Activity[],
  now: Date = new Date(),
  heroId: string | null = null,
): DayLayout {
  const sorted = byUrgency(activities, now);
  const hero = heroOf(activities, now, heroId);
  const rows: DayLayout["rows"] = [];

  const add = (id: string, title: string, rowActivities: Activity[]) => {
    rows.push({ id, title, activityIds: rowActivities.map((activity) => activity.id) });
  };

  // A status row that does not fill the width is a heading paying for almost
  // nothing, so short ones are dropped; the activities in them are still
  // reachable in "All activities". Applied here and only here: a row that opened
  // the day above the threshold stays open all day, however many of its
  // activities get done.
  const addIfFull = (id: string, title: string, rowActivities: Activity[]) => {
    if (rowActivities.length >= MIN_ROW_SIZE) {
      add(id, title, rowActivities);
    }
  };

  // First under the banner: the one row that answers "what now?" rather than
  // reporting on the state of the list. It is always shown when it has anything
  // to offer — its wide cards fill the screen on their own.
  const suggestions = suggestionsOf(sorted, now, hero?.id);
  if (suggestions.length > 0) {
    add("suggested", "Suggested for today", suggestions);
  }

  for (const { id, title, statuses } of GROUPS) {
    addIfFull(id, title, sorted.filter((activity) => statuses.includes(statusOf(activity, now))));
  }

  return { day: dayKey(now), rows };
}

// Builds the rows of the dashboard, top to bottom: the day's frozen rows, then
// everything, then what has been finished today. An activity may appear in
// several rows — the rows are ways of looking at the list, not a partition of it.
export function sectionsOf(
  activities: Activity[],
  layout: DayLayout,
  now: Date = new Date(),
): ActivitySection[] {
  const byId = new Map(activities.map((activity) => [activity.id, activity]));
  const sorted = byUrgency(activities, now);

  // Deleted activities are the one thing that can still empty a frozen row, and
  // a heading over nothing is worth dropping.
  const sections: ActivitySection[] = layout.rows
    .map(({ id, title, activityIds }) => ({
      id,
      title,
      activities: activityIds
        .map((activityId) => byId.get(activityId))
        .filter((activity): activity is Activity => activity !== undefined),
    }))
    .filter((section) => section.activities.length > 0);

  // Not frozen, and never dropped: it is the only row guaranteed to hold every
  // activity — including the ones added since the layout was dealt — whatever
  // the others decided to show.
  if (sorted.length > 0) {
    sections.push({ id: "all", title: "All activities", activities: sorted });
  }

  // The one row that has to answer to the present, and the only one cards are
  // ever added to: it exists to fill up as the day is worked through, so it is
  // recomputed rather than frozen. It only ever grows, so the row appears the
  // moment it can fill the width and then stays. Right at the bottom,
  // since nothing in it is asking to be done.
  const done = sorted.filter((activity) => doneToday(activity, now));
  if (done.length >= MIN_ROW_SIZE) {
    sections.push({ id: "done-today", title: "Done today", activities: done });
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
