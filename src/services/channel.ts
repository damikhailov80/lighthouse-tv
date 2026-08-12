import type { Activity } from "../domain/types";
import { recommendedActivities } from "../domain/recommendations";
import { dueLabel, periodShort } from "../domain/format";

// One card in the home-screen channel, as the native side wants it: finished
// text, and an image key rather than a URL. Every decision about what to offer
// is taken here — Kotlin only copies the fields into the TV provider.
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

// Installed on window by MainActivity, and only there. Absent in a browser and
// absent in the screensaver's web view, which is read-only by design: a
// television nobody is watching should not be redealing the home screen.
declare global {
  interface Window {
    LighthouseChannel?: { publish(json: string): void };
  }
}

// Hands the current picks to the native side. The only place the bridge is
// touched, the way services/storage.ts is the only place localStorage is.
//
// Called on launch and after every change to the list. Silently does nothing
// when there is no bridge, and never throws: the channel is a convenience on
// another screen, and it must not be able to take the app down with it.
export function publishChannel(activities: Activity[], now: Date = new Date()): void {
  const bridge = window.LighthouseChannel;
  if (!bridge) return;

  const cards: ChannelCard[] = recommendedActivities(activities, now).map((activity) => ({
    id: activity.id,
    title: activity.title,
    subtitle: `${dueLabel(activity, now)} · ${periodShort(activity)}`,
    image: activity.image,
  }));

  try {
    bridge.publish(JSON.stringify({ cards }));
  } catch {
    // The channel is out of date until the next publish. Nothing else changes.
  }
}
