import type { Activity } from "../domain/types";
import { ActivityCard } from "./ActivityCard";

interface ActivityListProps {
  activities: Activity[];
  onOpen: (activity: Activity) => void;
}

export function ActivityList({ activities, onOpen }: ActivityListProps) {
  return (
    <div className="activity-list">
      {activities.map((activity) => (
        <ActivityCard key={activity.id} activity={activity} onOpen={onOpen} />
      ))}
    </div>
  );
}
