import type { Activity } from "../domain/types";
import { ActivityList } from "./ActivityList";
import buttons from "../styles/Button.module.css";
import styles from "./Dashboard.module.css";

interface DashboardProps {
  activities: Activity[];
  onOpen: (activity: Activity) => void;
  onAdd: () => void;
}

export function Dashboard({ activities, onOpen, onAdd }: DashboardProps) {
  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.logo} aria-hidden="true" />
          <h1 className={styles.title}>Lighthouse</h1>
        </div>
        <button className={buttons.primary} type="button" data-nav onClick={onAdd}>
          Add activity
        </button>
      </header>

      <ActivityList activities={activities} onOpen={onOpen} />
    </div>
  );
}
