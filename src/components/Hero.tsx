import type { Activity } from "../domain/types";
import { progressFraction, statusOf } from "../domain/status";
import { dueLabel, periodShort } from "../domain/format";
import { activityImage } from "../assets/images";
import buttons from "../styles/Button.module.css";
import status from "../styles/status.module.css";
import styles from "./Hero.module.css";

interface HeroProps {
  activity: Activity;
  onMarkDone: (id: string) => void;
  onEdit: (activity: Activity) => void;
}

// The banner at the top of the dashboard: the single most urgent activity, over
// a full-width still. Unlike a card it carries its own actions, so the most
// pressing thing on the list can be closed without opening its page — the two
// buttons are separate D-pad targets and the banner lights up around them.
export function Hero({ activity, onMarkDone, onEdit }: HeroProps) {
  // ActivityStatus values double as class names in status.module.css.
  const statusClass = status[statusOf(activity)];
  const progress = Math.round(progressFraction(activity) * 100);
  const image = activityImage(activity.image);

  return (
    <section className={`${styles.hero} ${statusClass}`}>
      {/* Decorative: the heading over it already names the activity. */}
      {image && <img className={styles.image} src={image.src} alt="" />}

      <div className={styles.content}>
        <div className={styles.titleRow}>
          <span className={styles.dot} aria-hidden="true" />
          <h2 className={styles.title}>{activity.title}</h2>
        </div>

        <p className={styles.stats}>
          <span className={styles.due}>{dueLabel(activity)}</span>
          <span className={styles.period}>{periodShort(activity)}</span>
        </p>

        <div className={styles.progress} aria-hidden="true">
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>

        <div className={styles.actions}>
          <button
            className={`${buttons.primary} ${styles.action}`}
            type="button"
            data-nav
            data-hero
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
    </section>
  );
}
