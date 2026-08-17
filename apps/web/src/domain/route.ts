// Where the app currently is. Routes live in the URL hash, not the path: the
// app is served from file:// inside the Android WebView, where pushing a path
// would throw.
export type Route =
  | { kind: "dashboard" }
  | { kind: "detail"; id: string }
  // `id` is null for a brand-new activity.
  | { kind: "edit"; id: string | null };

export const DASHBOARD: Route = { kind: "dashboard" };

// The hash is the source of truth, so anything unrecognised — a typo, a link
// from an older version — resolves to the dashboard rather than a blank screen.
export function parseHash(hash: string): Route {
  const [section, id, sub, ...rest] = hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  if (section !== "activity" || !id || rest.length > 0) return DASHBOARD;
  if (id === "new") return sub === undefined ? { kind: "edit", id: null } : DASHBOARD;
  if (sub === undefined) return { kind: "detail", id };
  if (sub === "edit") return { kind: "edit", id };
  return DASHBOARD;
}

export function hashFor(route: Route): string {
  switch (route.kind) {
    case "detail":
      return `#/activity/${route.id}`;
    case "edit":
      return route.id === null ? "#/activity/new" : `#/activity/${route.id}/edit`;
    default:
      return "#/";
  }
}

// Navigation depth pushed into history: the dashboard is 0, an activity page
// is 1, the edit dialog on top of it is 2. The remote's BACK button walks this
// stack natively (MainActivity forwards it to WebView.goBack()).
export function depthOf(route: Route): number {
  switch (route.kind) {
    case "detail":
      return 1;
    case "edit":
      return 2;
    default:
      return 0;
  }
}

// The activity a route is about, if any. Both the detail page and the edit
// dialog of an existing activity point at one; the dashboard and "new" do not.
export function activityIdOf(route: Route): string | null {
  return route.kind === "dashboard" ? null : route.id;
}
