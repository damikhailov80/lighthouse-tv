import type { Today } from "@lighthouse/shared";

// Installed on window by MainActivity, and only there — absent in a browser,
// where there is no home screen to publish to.
declare global {
  interface Window {
    LighthouseChannel?: { publish(json: string): void };
  }
}

// Hands the day's picks to the native side: our own row of things it is time to
// do, and the one card for the television's "Play Next". The only place the
// bridge is touched, the way services/storage.ts is the only place localStorage
// is.
//
// The cards arrive finished, from GET /today. They used to be worked out here,
// which was the right place while the app was the only screen; now the same
// answer is served to the television, the web and anything else in the house,
// so it is decided once, on the server, and this only carries it across.
//
// Called on launch and after every change to the list. Silently does nothing
// when there is no bridge, and never throws: the home screen is a convenience on
// another screen, and it must not be able to take the app down with it.
export function publishChannel(today: Today | null): void {
  const bridge = window.LighthouseChannel;
  if (bridge === undefined || today === null) return;

  try {
    bridge.publish(JSON.stringify({ cards: today.cards, watchNext: today.watchNext }));
  } catch {
    // The home screen is out of date until the next publish. Nothing else
    // changes.
  }
}
