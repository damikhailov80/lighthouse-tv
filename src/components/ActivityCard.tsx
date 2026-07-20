import type { Activity } from "../domain/types";
import { progressFraction, statusOf } from "../domain/status";
import { dueLabel, periodShort } from "../domain/format";
import { activityImage } from "../assets/images";
import status from "../styles/status.module.css";
import styles from "./ActivityCard.module.css";

interface ActivityCardProps {
  activity: Activity;
  onOpen: (activity: Activity) => void;
  // A row too short to fill the screen widens its cards; the extra width goes
  // to the illustration, which then keeps a 16:9 frame instead of a fixed one.
  wide?: boolean;
}

// The whole card is a single D-pad target: its actions live on the detail
// page, so the remote never has to step through controls inside the grid.
export function ActivityCard({ activity, onOpen, wide = false }: ActivityCardProps) {
  // ActivityStatus values double as class names in status.module.css.
  const statusClass = status[statusOf(activity)];
  const progress = Math.round(progressFraction(activity) * 100);
  const image = activityImage(activity.image);

  return (
    <button
      className={`${styles.card} ${statusClass}${wide ? ` ${styles.wide}` : ""}`}
      type="button"
      data-nav
      data-card-id={activity.id}
      onClick={() => onOpen(activity)}
    >
      {image && (
        <span className={styles.media}>
          {/* Decorative: the title right below already names the activity. */}
          <img className={styles.image} src={image.src} alt="" />
        </span>
      )}

      <span className={styles.content}>
        {image ? (
          <span className={styles.titleRow}>
            <span className={styles.title}>{activity.title}</span>
            <span className={styles.dot} aria-hidden="true" />
          </span>
        ) : (
          <>
            <span className={styles.top}>
              <span className={styles.dot} aria-hidden="true" />
            </span>
            <span className={styles.title}>{activity.title}</span>
          </>
        )}

        <span className={styles.footer}>
          <span className={styles.progress} aria-hidden="true">
            <span className={styles.progressFill} style={{ width: `${progress}%` }} />
          </span>
          <span className={styles.stats}>
            <span className={styles.due}>{dueLabel(activity)}</span>
            <span className={styles.period}>{periodShort(activity)}</span>
          </span>
        </span>
      </span>
    </button>
  );
}
