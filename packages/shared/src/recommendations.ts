import type { Activity } from "./types.js";
import { doneToday, remainingRatio, statusOf } from "./status.js";
import { SUGGESTED_ROW, shuffleKey, type DayLayout } from "./sections.js";

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

// The single activity for the television's own "Play Next" row: whatever is
// next to do, drawn the same way everything else here is — at random, but
// seeded from the day, so the card holds still between one launch and the next.
//
// Anything already done today is passed over. The row asks "what next?", and
// something finished an hour ago is not an answer — so marking off the card
// that is standing there has to put a different one in its place, which is the
// whole job of this function.
//
// It looks in three places, and stops at the first that has anything:
//
//  1. The three the dashboard suggested this morning, read from the stored
//     layout rather than dealt again, so the two screens cannot offer different
//     things on the same day.
//  2. Everything else, in the same day-seeded order. The suggestions are a row
//     of three because three is what fits across a screen; the television's row
//     holds one at a time and can go on past them, and once all three are done
//     it does. Without this the row would empty out on an evening when the
//     viewer has been getting things done — the one evening it has something to
//     be pleased about.
//  3. The banner's activity, which the suggestions deliberately leave out — it
//     is already the largest thing on the dashboard, so offering it again
//     underneath would spend a suggestion on something that was never in doubt.
//     That argument is about one screen, and this is another: when the banner's
//     pick is the last thing left undone, naming it beats an empty row.
//
// Nothing left means nothing to show, and undefined takes the card down.
export function watchNextActivity(
  activities: Activity[],
  layout: DayLayout | null,
  heroId: string | null,
  now: Date = new Date(),
): Activity | undefined {
  const byId = new Map(activities.map((activity) => [activity.id, activity]));
  const suggested = layout?.rows.find((row) => row.id === SUGGESTED_ROW)?.activityIds ?? [];
  const pending = (activity: Activity) => !doneToday(activity, now);
  const inDayOrder = (a: Activity, b: Activity) => shuffleKey(a.id, now) - shuffleKey(b.id, now);

  const fromSuggestions = suggested
    .map((id) => byId.get(id))
    .filter((activity): activity is Activity => activity !== undefined)
    .filter(pending)
    .sort(inDayOrder)[0];
  if (fromSuggestions) return fromSuggestions;

  const beyondSuggestions = activities
    .filter(
      (activity) =>
        activity.id !== heroId && !suggested.includes(activity.id) && pending(activity),
    )
    .sort(inDayOrder)[0];
  if (beyondSuggestions) return beyondSuggestions;

  const hero = heroId === null ? undefined : byId.get(heroId);
  return hero !== undefined && pending(hero) ? hero : undefined;
}
