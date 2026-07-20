import type { Activity } from "../domain/types";
import { ActivityCard } from "./ActivityCard";
import styles from "./ActivityRow.module.css";

// Four normal cards already fill a 1280px screen and start to scroll, so the
// wide layout only takes over below that.
const WIDE_UP_TO = 3;

// The row of suggestions is an offer, not a report: it keeps the wide card
// whatever its length, so what the screen proposes always reads as the biggest
// thing under the banner.
const ALWAYS_WIDE = ["suggested"];

interface ActivityRowProps {
  // Identifies the row in the DOM, so returning from an activity page can put
  // the remote back on the seat it left rather than on the card's new home.
  id: string;
  title: string;
  activities: Activity[];
  onOpen: (activity: Activity) => void;
}

// One horizontal carousel: left/right walks the cards, up/down leaves the row.
// The track scrolls itself — the navigation hook calls scrollIntoView on the
// newly focused card, which is enough to keep it in view.
export function ActivityRow({ id, title, activities, onOpen }: ActivityRowProps) {
  // Three cards or fewer never reach the right edge at their normal width, so
  // they switch to the wide card and share the whole track between them.
  const wide = ALWAYS_WIDE.includes(id) || activities.length <= WIDE_UP_TO;

  return (
    <section data-row={id}>
      <h2 className={styles.title}>{title}</h2>
      <div className={styles.track}>
        {activities.map((activity) => (
          <ActivityCard key={activity.id} activity={activity} onOpen={onOpen} wide={wide} />
        ))}
      </div>
    </section>
  );
}
