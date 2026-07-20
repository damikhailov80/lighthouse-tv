import type { Activity } from "../domain/types";
import { progressFraction, statusOf } from "../domain/status";
import { dueLabel, periodShort } from "../domain/format";

interface ActivityCardProps {
  activity: Activity;
  onOpen: (activity: Activity) => void;
}

// The whole card is a single D-pad target: its actions live on the detail
// page, so the remote never has to step through controls inside the grid.
export function ActivityCard({ activity, onOpen }: ActivityCardProps) {
  const status = statusOf(activity);
  const progress = Math.round(progressFraction(activity) * 100);

  return (
    <button
      className={`card status-${status}`}
      type="button"
      data-nav
      data-card-id={activity.id}
      onClick={() => onOpen(activity)}
    >
      <span className="card__top">
        <span className="card__dot" aria-hidden="true" />
      </span>

      <span className="card__title">{activity.title}</span>

      <span className="card__footer">
        <span className="card__progress" aria-hidden="true">
          <span className="card__progress-fill" style={{ width: `${progress}%` }} />
        </span>
        <span className="card__stats">
          <span className="card__due">{dueLabel(activity)}</span>
          <span className="card__period">{periodShort(activity)}</span>
        </span>
      </span>
    </button>
  );
}
