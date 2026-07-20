import type { Activity } from "../domain/types";
import { progressFraction, statusOf } from "../domain/status";
import { dueLabel, periodShort } from "../domain/format";
import status from "../styles/status.module.css";
import styles from "./ActivityCard.module.css";

interface ActivityCardProps {
  activity: Activity;
  onOpen: (activity: Activity) => void;
}

// The whole card is a single D-pad target: its actions live on the detail
// page, so the remote never has to step through controls inside the grid.
export function ActivityCard({ activity, onOpen }: ActivityCardProps) {
  // ActivityStatus values double as class names in status.module.css.
  const statusClass = status[statusOf(activity)];
  const progress = Math.round(progressFraction(activity) * 100);

  return (
    <button
      className={`${styles.card} ${statusClass}`}
      type="button"
      data-nav
      data-card-id={activity.id}
      onClick={() => onOpen(activity)}
    >
      <span className={styles.top}>
        <span className={styles.dot} aria-hidden="true" />
      </span>

      <span className={styles.title}>{activity.title}</span>

      <span className={styles.footer}>
        <span className={styles.progress} aria-hidden="true">
          <span className={styles.progressFill} style={{ width: `${progress}%` }} />
        </span>
        <span className={styles.stats}>
          <span className={styles.due}>{dueLabel(activity)}</span>
          <span className={styles.period}>{periodShort(activity)}</span>
        </span>
      </span>
    </button>
  );
}
