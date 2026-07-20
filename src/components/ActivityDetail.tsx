import { useEffect, useRef } from "react";
import type { Activity } from "../domain/types";
import { daysSinceLastDone, progressFraction, statusOf } from "../domain/status";
import { dueLabel, periodShort } from "../domain/format";

interface ActivityDetailProps {
  activity: Activity;
  onMarkDone: (id: string) => void;
  onEdit: (activity: Activity) => void;
  onBack: () => void;
}

// Full-screen page for a single activity. This is the only place the
// per-activity actions live, so the dashboard grid stays a flat list of cards.
export function ActivityDetail({ activity, onMarkDone, onEdit, onBack }: ActivityDetailProps) {
  const status = statusOf(activity);
  const progress = Math.round(progressFraction(activity) * 100);
  const sinceDone = daysSinceLastDone(activity);
  const firstAction = useRef<HTMLButtonElement>(null);

  // Land the D-pad on the primary action as soon as the page opens.
  useEffect(() => {
    firstAction.current?.focus();
  }, []);

  return (
    <div className={`detail status-${status}`}>
      <header className="detail__header">
        <button className="button button--ghost" type="button" data-nav onClick={onBack}>
          Back
        </button>
      </header>

      <div className="detail__body">
        <span className="detail__dot" aria-hidden="true" />
        <h1 className="detail__title">{activity.title}</h1>

        <div className="detail__progress" aria-hidden="true">
          <div className="detail__progress-fill" style={{ width: `${progress}%` }} />
        </div>

        <div className="detail__stats">
          <span className="detail__due">{dueLabel(activity)}</span>
          <span className="detail__period">{periodShort(activity)}</span>
          <span className="detail__since">
            {sinceDone === 0 ? "Done today" : `Done ${sinceDone}d ago`}
          </span>
        </div>

        <div className="detail__actions">
          <button
            ref={firstAction}
            className="button button--primary"
            type="button"
            data-nav
            onClick={() => onMarkDone(activity.id)}
          >
            Mark as done
          </button>
          <button
            className="button button--ghost"
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
