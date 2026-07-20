import type { Activity } from "../domain/types";
import { ActivityCard } from "./ActivityCard";
import styles from "./ActivityRow.module.css";

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
  return (
    <section data-row={id}>
      <h2 className={styles.title}>{title}</h2>
      <div className={styles.track}>
        {activities.map((activity) => (
          <ActivityCard key={activity.id} activity={activity} onOpen={onOpen} />
        ))}
      </div>
    </section>
  );
}
