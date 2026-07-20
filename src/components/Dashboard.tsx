import type { Activity } from "../domain/types";
import { heroOf, sectionsOf } from "../domain/sections";
import { ActivityRow } from "./ActivityRow";
import { Hero } from "./Hero";
import { Logo } from "./Logo";
import buttons from "../styles/Button.module.css";
import styles from "./Dashboard.module.css";

interface DashboardProps {
  activities: Activity[];
  onOpen: (activity: Activity) => void;
  onAdd: () => void;
  // The banner acts on its activity in place, without opening its page.
  onMarkDone: (id: string) => void;
  onEdit: (activity: Activity) => void;
}

export function Dashboard({
  activities,
  onOpen,
  onAdd,
  onMarkDone,
  onEdit,
}: DashboardProps) {
  // The banner features the most urgent activity, which also keeps its card in
  // the row below: a row heading should never lie about how many activities
  // have that status.
  const hero = heroOf(activities);
  const sections = sectionsOf(activities);

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <Logo className={styles.logo} />
          <h1 className={styles.title}>Lighthouse</h1>
        </div>
        <button className={buttons.primary} type="button" data-nav onClick={onAdd}>
          Add activity
        </button>
      </header>

      {hero && <Hero activity={hero} onMarkDone={onMarkDone} onEdit={onEdit} />}

      {sections.map((section) => (
        <ActivityRow
          key={section.id}
          title={section.title}
          activities={section.activities}
          onOpen={onOpen}
        />
      ))}
    </div>
  );
}
