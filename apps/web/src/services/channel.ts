import {
  type Activity,
  type DayLayout,
  recommendedActivities,
  watchNextActivity,
  dueLabel,
  periodShort,
} from "@lighthouse/shared";

// One card on the home screen, as the native side wants it: finished text, and
// an image key rather than a URL. Every decision about what to offer is taken
// here — Kotlin only copies the fields into the TV provider. The same shape
// serves both rows: our channel of things it is time to do, and Watch Next.
export interface ChannelCard {
  // The activity this card is about. Doubles as the deep-link target and as the
  // key the native side diffs on, so a republish updates the row that is
  // already there instead of replacing the whole channel.
  id: string;
  title: string;
  // "Overdue · weekly" — the same two labels the cards in the app carry.
  subtitle: string;
  // The ActivityImage key. The launcher runs in another process and cannot read
  // the base64 inlined in this bundle, so the illustrations are also copied into
  // the APK's resources at build time and looked up there by name.
  image?: string;
}

// Installed on window by MainActivity, and only there — absent in a browser,
// where there is no home screen to publish to.
declare global {
  interface Window {
    LighthouseChannel?: { publish(json: string): void };
  }
}

function cardFor(activity: Activity, now: Date): ChannelCard {
  return {
    id: activity.id,
    title: activity.title,
    subtitle: `${dueLabel(activity, now)} · ${periodShort(activity)}`,
    image: activity.image,
  };
}

// Hands the current picks to the native side: our own row of things it is time
// to do, and the one card for the television's "Play Next". The only place the
// bridge is touched, the way services/storage.ts is the only place localStorage
// is.
//
// Called on launch and after every change to the list. Silently does nothing
// when there is no bridge, and never throws: the home screen is a convenience
// on another screen, and it must not be able to take the app down with it.
//
// `layout` and `heroId` are the day's decisions as the dashboard made them —
// the Watch Next card starts from the suggestions in one and steps around the
// other, so that the two screens name the same thing.
export function publishChannel(
  activities: Activity[],
  layout: DayLayout | null,
  heroId: string | null,
  now: Date = new Date(),
): void {
  const bridge = window.LighthouseChannel;
  if (!bridge) return;

  const cards = recommendedActivities(activities, now).map((activity) => cardFor(activity, now));
  const next = watchNextActivity(activities, layout, heroId, now);

  try {
    bridge.publish(
      JSON.stringify({ cards, watchNext: next ? cardFor(next, now) : null }),
    );
  } catch {
    // The home screen is out of date until the next publish. Nothing else
    // changes.
  }
}
