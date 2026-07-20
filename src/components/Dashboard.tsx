import type { Activity } from "../domain/types";
import { ActivityList } from "./ActivityList";

interface DashboardProps {
  activities: Activity[];
  onOpen: (activity: Activity) => void;
  onAdd: () => void;
}

export function Dashboard({ activities, onOpen, onAdd }: DashboardProps) {
  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <div className="dashboard__brand">
          <span className="dashboard__logo" aria-hidden="true" />
          <h1 className="dashboard__title">Lighthouse</h1>
        </div>
        <button className="button button--primary" type="button" data-nav onClick={onAdd}>
          Add activity
        </button>
      </header>

      <ActivityList activities={activities} onOpen={onOpen} />
    </div>
  );
}
