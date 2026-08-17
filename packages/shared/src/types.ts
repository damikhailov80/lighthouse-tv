// Traffic-light status of an activity, from "plenty of time" to "overdue".
export type ActivityStatus = "green" | "yellow" | "orange" | "red";

// The unit a repeat period is expressed in. A runtime list and not only a type,
// because the API validates incoming values against it — the wire is the one
// place a TypeScript union guarantees nothing.
export const PERIOD_UNITS = ["day", "week", "month"] as const;
export type PeriodUnit = (typeof PERIOD_UNITS)[number];

// Illustration shown on an activity card. Stored as a key rather than a URL:
// the bundler hashes asset URLs on every build, so a stored URL would break
// after the next release, while a key stays valid. The key -> picture mapping
// is the client's business — see apps/web/src/assets/images.ts, and the copies
// sync-web.sh puts in the APK for the launcher.
export const ACTIVITY_IMAGE_KEYS = [
  "board-games",
  "call-parents",
  "cycling",
  "go-to-beach",
  "meeting-friends",
  "reading",
  "visit-grandma",
  "walking",
  "watching-film",
] as const;
export type ActivityImage = (typeof ACTIVITY_IMAGE_KEYS)[number];

// A recurring activity the user wants to keep up with.
export interface Activity {
  id: string;
  title: string;
  // How often it should be repeated, e.g. every = 2, unit = "week".
  every: number;
  unit: PeriodUnit;
  // ISO timestamp of the last time it was done.
  lastDoneAt: string;
  // Optional: activities created before images existed simply have no picture.
  image?: ActivityImage;
}
