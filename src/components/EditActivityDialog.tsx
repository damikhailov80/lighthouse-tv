import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Activity, ActivityImage, PeriodUnit } from "../domain/types";
import { ACTIVITY_IMAGES } from "../assets/images";
import buttons from "../styles/Button.module.css";
import styles from "./EditActivityDialog.module.css";

// Data returned when saving. `id` is absent for a brand-new activity.
export interface ActivityDraft {
  id?: string;
  title: string;
  every: number;
  unit: PeriodUnit;
  image?: ActivityImage;
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
  const [image, setImage] = useState<ActivityImage | undefined>(isNew ? undefined : target.image);

  const canSave = title.trim().length > 0 && every > 0;

  // Send focus back where it came from when the dialog closes, so the remote
  // resumes from the button that opened it instead of from nowhere.
  const openerRef = useRef(document.activeElement);
  useEffect(() => {
    const opener = openerRef.current;
    return () => {
      // The opener is gone after a delete; App then restores focus itself.
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, []);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!canSave) return;
    onSave({
      id: isNew ? undefined : target.id,
      title: title.trim(),
      every,
      unit,
      image,
    });
  };

  return (
    // Click on the backdrop closes; clicks inside the panel are stopped.
    // `data-overlay` is the navigation contract that confines the D-pad to the
    // dialog — see useSpatialNavigation.
    <div className={styles.overlay} data-overlay onClick={onClose}>
      <form
        className={styles.dialog}
        onClick={(event) => event.stopPropagation()}
        onSubmit={handleSubmit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-dialog-title"
      >
        <h2 className={styles.title} id="edit-dialog-title">
          {isNew ? "New activity" : "Edit activity"}
        </h2>

        <label className={styles.field}>
          <span className={styles.label}>Title</span>
          <input
            className={styles.input}
            type="text"
            data-nav
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="e.g. Play tennis"
            autoFocus
          />
        </label>

        <div className={styles.field}>
          <span className={styles.label}>Repeat every</span>
          <div className={styles.periodRow}>
            <input
              className={styles.count}
              type="number"
              data-nav
              min={1}
              step={0.5}
              value={every}
              onChange={(event) => setEvery(Number(event.target.value))}
            />
            <div className={styles.segmented}>
              {UNITS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  data-nav
                  className={unit === option.value ? styles.optionActive : styles.option}
                  aria-pressed={unit === option.value}
                  onClick={() => setUnit(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.field}>
          <span className={styles.label}>Illustration</span>
          <div className={styles.picker}>
            {ACTIVITY_IMAGES.map((option) => (
              <button
                key={option.key}
                type="button"
                data-nav
                className={image === option.key ? styles.tileSelected : styles.tile}
                aria-label={option.label}
                aria-pressed={image === option.key}
                onClick={() => setImage(option.key)}
              >
                <img className={styles.tileImage} src={option.src} alt="" />
              </button>
            ))}
          </div>
        </div>

        <div className={styles.actions}>
          {!isNew && (
            <button
              type="button"
              className={buttons.danger}
              data-nav
              onClick={() => onDelete(target.id)}
            >
              Delete
            </button>
          )}
          <button type="button" className={buttons.ghost} data-nav onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className={buttons.primary} data-nav disabled={!canSave}>
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
