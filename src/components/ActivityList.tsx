import type { Activity } from "../domain/types";
import { ActivityCard } from "./ActivityCard";
import styles from "./ActivityList.module.css";

interface ActivityListProps {
  activities: Activity[];
  onOpen: (activity: Activity) => void;
}

export function ActivityList({ activities, onOpen }: ActivityListProps) {
  return (
    <div className={styles.list}>
      {activities.map((activity) => (
        <ActivityCard key={activity.id} activity={activity} onOpen={onOpen} />
      ))}
    </div>
  );
}
