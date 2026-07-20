import { useEffect, useRef } from "react";
import type { Activity } from "../domain/types";
import { daysSinceLastDone, progressFraction, statusOf } from "../domain/status";
import { dueLabel, periodShort } from "../domain/format";
import buttons from "../styles/Button.module.css";
import status from "../styles/status.module.css";
import styles from "./ActivityDetail.module.css";

interface ActivityDetailProps {
  activity: Activity;
  onMarkDone: (id: string) => void;
  onEdit: (activity: Activity) => void;
  onBack: () => void;
}

// Full-screen page for a single activity. This is the only place the
// per-activity actions live, so the dashboard grid stays a flat list of cards.
export function ActivityDetail({ activity, onMarkDone, onEdit, onBack }: ActivityDetailProps) {
  // ActivityStatus values double as class names in status.module.css.
  const statusClass = status[statusOf(activity)];
  const progress = Math.round(progressFraction(activity) * 100);
  const sinceDone = daysSinceLastDone(activity);
  const firstAction = useRef<HTMLButtonElement>(null);

  // Land the D-pad on the primary action as soon as the page opens.
  useEffect(() => {
    firstAction.current?.focus();
  }, []);

  return (
    <div className={`${styles.detail} ${statusClass}`}>
      <header className={styles.header}>
        <button className={buttons.ghost} type="button" data-nav onClick={onBack}>
          Back
        </button>
      </header>

      <div className={styles.body}>
        <span className={styles.dot} aria-hidden="true" />
        <h1 className={styles.title}>{activity.title}</h1>

        <div className={styles.progress} aria-hidden="true">
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>

        <div className={styles.stats}>
          <span className={styles.due}>{dueLabel(activity)}</span>
          <span>{periodShort(activity)}</span>
          <span>{sinceDone === 0 ? "Done today" : `Done ${sinceDone}d ago`}</span>
        </div>

        <div className={styles.actions}>
          <button
            ref={firstAction}
            className={`${buttons.primary} ${styles.action}`}
            type="button"
            data-nav
            onClick={() => onMarkDone(activity.id)}
          >
            Mark as done
          </button>
          <button
            className={`${buttons.ghost} ${styles.action}`}
            type="button"
            data-nav
            onClick={() => onEdit(activity)}
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}
