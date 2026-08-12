import type { Activity } from "./types";
import { doneToday, remainingRatio, statusOf } from "./status";
import { shuffleKey } from "./sections";

// How many cards the home-screen channel carries. A launcher row shows about
// this many before it has to be scrolled, so a longer list would only be
// offering things nobody sees.
export const RECOMMENDATION_COUNT = 5;

// The activities the home-screen channel offers: things it is time to do,
// picked at random rather than by rank, so the row is not the same three
// overdue chores staring back every morning.
//
// Random, but not fresh on every call — the channel is republished after every
// change to the list, and re-dealing there would make the launcher row jump
// under a viewer who has just marked something done. shuffleKey is seeded from
// the day, exactly like the dashboard's suggestions, so the set holds still
// until midnight while the cards in it stay honest about their state.
//
// "Time to do" means anything past green and not already finished today. That
// can be fewer than five — a well-kept list is mostly green — and a half-empty
// row on the home screen reads as a broken app rather than as good news, so
// short lists are topped up with whatever is closest to falling due. Sorting
// the top-up by remaining time also puts anything done today at the very back,
// where it belongs in a list of things to go and do.
export function recommendedActivities(
  activities: Activity[],
  now: Date = new Date(),
): Activity[] {
  const due = activities.filter(
    (activity) => statusOf(activity, now) !== "green" && !doneToday(activity, now),
  );
  const picked = [...due]
    .sort((a, b) => shuffleKey(a.id, now) - shuffleKey(b.id, now))
    .slice(0, RECOMMENDATION_COUNT);

  if (picked.length === RECOMMENDATION_COUNT) return picked;

  const taken = new Set(picked.map((activity) => activity.id));
  const filler = activities
    .filter((activity) => !taken.has(activity.id))
    .sort((a, b) => remainingRatio(a, now) - remainingRatio(b, now));

  return [...picked, ...filler].slice(0, RECOMMENDATION_COUNT);
}
