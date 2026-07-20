import { useState, type FormEvent } from "react";
import type { Activity, PeriodUnit } from "../domain/types";

// Data returned when saving. `id` is absent for a brand-new activity.
export interface ActivityDraft {
  id?: string;
  title: string;
  every: number;
  unit: PeriodUnit;
}

interface EditActivityDialogProps {
  // The activity being edited, or "new" when creating one.
  target: Activity | "new";
  onSave: (draft: ActivityDraft) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const UNITS: { value: PeriodUnit; label: string }[] = [
  { value: "day", label: "Days" },
  { value: "week", label: "Weeks" },
  { value: "month", label: "Months" },
];

export function EditActivityDialog({ target, onSave, onDelete, onClose }: EditActivityDialogProps) {
  const isNew = target === "new";
  const [title, setTitle] = useState(isNew ? "" : target.title);
  const [every, setEvery] = useState(isNew ? 1 : target.every);
  const [unit, setUnit] = useState<PeriodUnit>(isNew ? "week" : target.unit);

  const canSave = title.trim().length > 0 && every > 0;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!canSave) return;
    onSave({
      id: isNew ? undefined : target.id,
      title: title.trim(),
      every,
      unit,
    });
  };

  return (
    // Click on the backdrop closes; clicks inside the panel are stopped.
    <div className="overlay" onClick={onClose}>
      <form className="dialog" onClick={(event) => event.stopPropagation()} onSubmit={handleSubmit}>
        <h2 className="dialog__title">{isNew ? "New activity" : "Edit activity"}</h2>

        <label className="field">
          <span className="field__label">Title</span>
          <input
            className="field__input"
            type="text"
            data-nav
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="e.g. Play tennis"
            autoFocus
          />
        </label>

        <div className="field">
          <span className="field__label">Repeat every</span>
          <div className="period-row">
            <input
              className="field__input period-row__count"
              type="number"
              data-nav
              min={1}
              step={0.5}
              value={every}
              onChange={(event) => setEvery(Number(event.target.value))}
            />
            <div className="segmented">
              {UNITS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  data-nav
                  className={`segmented__option${unit === option.value ? " is-active" : ""}`}
                  aria-pressed={unit === option.value}
                  onClick={() => setUnit(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="dialog__actions">
          {!isNew && (
            <button
              type="button"
              className="button button--danger"
              data-nav
              onClick={() => onDelete(target.id)}
            >
              Delete
            </button>
          )}
          <button type="button" className="button button--ghost" data-nav onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="button button--primary" data-nav disabled={!canSave}>
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
