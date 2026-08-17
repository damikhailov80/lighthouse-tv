// Traffic-light status of an activity, from "plenty of time" to "overdue".
export type ActivityStatus = "green" | "yellow" | "orange" | "red";

// The unit a repeat period is expressed in.
export type PeriodUnit = "day" | "week" | "month";

// Illustration shown on an activity card. Stored as a key rather than a URL:
// the bundler hashes asset URLs on every build, so a stored URL would break
// after the next release, while a key stays valid. See src/assets/images.ts.
export type ActivityImage =
  | "board-games"
  | "call-parents"
  | "cycling"
  | "go-to-beach"
  | "meeting-friends"
  | "reading"
  | "visit-grandma"
  | "walking"
  | "watching-film";

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
