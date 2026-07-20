import type { Activity } from "../domain/types";
import { heroOf, layoutOf, sectionsOf, type DayLayout } from "../domain/sections";
import { ActivityRow } from "./ActivityRow";
import { Hero } from "./Hero";
import { Logo } from "./Logo";
import buttons from "../styles/Button.module.css";
import styles from "./Dashboard.module.css";

interface DashboardProps {
  activities: Activity[];
  // The activity picked for today's banner; null falls back to the most urgent.
  heroId: string | null;
  // The rows dealt for today; null falls back to dealing them on the spot.
  layout: DayLayout | null;
  onOpen: (activity: Activity) => void;
  onAdd: () => void;
  // The banner acts on its activity in place, without opening its page.
  onMarkDone: (id: string) => void;
  onEdit: (activity: Activity) => void;
}

export function Dashboard({
  activities,
  heroId,
  layout,
  onOpen,
  onAdd,
  onMarkDone,
  onEdit,
}: DashboardProps) {
  // The banner's activity also keeps its card in the row below: a row heading
  // should never lie about how many activities have that status.
  const hero = heroOf(activities, undefined, heroId);
  // The layout arrives an effect later than the first render; dealing a throwaway
  // one here keeps that frame from flashing a dashboard with no rows.
  const sections = sectionsOf(activities, layout ?? layoutOf(activities, undefined, heroId));

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

      {sections.map((section, index) => (
        <ActivityRow
          key={section.id}
          id={section.id}
          title={section.title}
          activities={section.activities}
          // Second, fourth, … so the first row carries straight on from the
          // banner and the zebra starts one step down.
          banded={index % 2 === 1}
          onOpen={onOpen}
        />
      ))}
    </div>
  );
}
