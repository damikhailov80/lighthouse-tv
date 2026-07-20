import type { ActivityImage } from "../domain/types";
import boardGames from "./board-games.jpg";
import callParents from "./call-parents.jpg";
import cycling from "./cycling.jpg";
import goToBeach from "./go-to-beach.jpg";
import meetingFriends from "./meeting-friends.jpg";
import reading from "./reading.jpg";
import visitGrandma from "./visit-grandma.jpg";
import walking from "./walking.jpg";
import watchingFilm from "./watching-film.jpg";

// The bundled illustration set. `label` is what the picker shows and what
// screen readers announce, so it describes the picture, not the activity.
export const ACTIVITY_IMAGES: { key: ActivityImage; label: string; src: string }[] = [
  { key: "walking", label: "A walk in the park", src: walking },
  { key: "cycling", label: "Cycling with friends", src: cycling },
  { key: "reading", label: "Reading in an armchair", src: reading },
  { key: "board-games", label: "A board game around the table", src: boardGames },
  { key: "meeting-friends", label: "Meeting friends outside", src: meetingFriends },
  { key: "watching-film", label: "Watching a film together", src: watchingFilm },
  { key: "call-parents", label: "A phone call with parents", src: callParents },
  { key: "go-to-beach", label: "A day at the beach", src: goToBeach },
  { key: "visit-grandma", label: "A visit to grandma", src: visitGrandma },
];

const BY_KEY = new Map(ACTIVITY_IMAGES.map((image) => [image.key, image]));

// Unknown keys (data written by a newer version, or a since-removed picture)
// resolve to undefined, and the card falls back to its plain layout.
export function activityImage(key: ActivityImage | undefined) {
  return key === undefined ? undefined : BY_KEY.get(key);
}
