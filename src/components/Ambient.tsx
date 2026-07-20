import { useEffect, useState } from "react";
import { loadActivities, loadDayLayout, loadHeroPick } from "../services/storage";
import { seedActivities } from "../domain/seed";
import { dayKey, heroOf, layoutOf } from "../domain/sections";
import { dueLabel, periodShort } from "../domain/format";
import { doneToday, statusOf } from "../domain/status";
import { activityImage } from "../assets/images";
import { Logo } from "./Logo";
import status from "../styles/status.module.css";
import styles from "./Ambient.module.css";

// How often the screen looks at the clock and at storage again. Long enough to
// cost nothing on a TV that may sit here all evening, short enough that the
// minute on the clock is never visibly wrong and that midnight — a new day, a
// new pick — arrives on its own.
const REFRESH_MS = 20_000;

// How many other activities the screen mentions under the main one.
const ALSO_COUNT = 2;

// The screensaver: the day's activity, alone on an idle screen.
//
// Read-only by design. It shows the pick the dashboard already made and never
// makes one itself: a decision taken by a television nobody is watching would
// then be the one waiting in the morning. Without a pick for today — the app
// has not been opened yet — it falls back to the same most-urgent activity the
// banner would fall back to, and leaves storage alone.
export function Ambient() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), REFRESH_MS);
    return () => clearInterval(timer);
  }, []);

  // Re-read on every tick rather than once: the dashboard may have been used
  // between two idle periods, and the WebView behind the screensaver is the
  // same app with the same storage.
  const stored = loadActivities();
  const activities = stored.length > 0 ? stored : seedActivities();

  const today = dayKey(now);
  const pick = loadHeroPick();
  const hero = heroOf(activities, now, pick?.day === today ? pick.id : null);

  // The rows the dashboard dealt this morning, so the two screens name the same
  // suggestions; dealt on the spot when there are none for today.
  const layout = loadDayLayout();
  const rows =
    layout?.day === today ? layout.rows : layoutOf(activities, now, hero?.id ?? null).rows;
  const byId = new Map(activities.map((activity) => [activity.id, activity]));
  const also = (rows.find((row) => row.id === "suggested")?.activityIds ?? [])
    .filter((id) => id !== hero?.id)
    .map((id) => byId.get(id)?.title)
    .filter((title): title is string => title !== undefined)
    .slice(0, ALSO_COUNT);

  const image = activityImage(hero?.image);
  // ActivityStatus values double as class names in status.module.css.
  const statusClass = hero ? status[statusOf(hero, now)] : "";
  // Locale fixed rather than taken from the device: every other string on the
  // screen is English, and a half-translated line reads as a bug.
  const time = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const date = now.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className={`${styles.ambient} ${statusClass}`}>
      {/* Decorative: the activity is named right next to it. */}
      {image && <img className={styles.image} src={image.src} alt="" />}

      <div className={styles.frame}>
        <div className={styles.clock}>
          <span className={styles.time}>{time}</span>
          <span className={styles.date}>{date}</span>
        </div>

        <div className={styles.content}>
          <div className={styles.brand}>
            <Logo className={styles.logo} />
            <span className={styles.wordmark}>Lighthouse</span>
          </div>

          {hero ? (
            <>
              <p className={styles.kicker}>Suggested for today</p>
              <h1 className={styles.title}>
                <span className={styles.dot} aria-hidden="true" />
                {hero.title}
              </h1>
              <p className={styles.stats}>
                {doneToday(hero, now) ? (
                  <span className={styles.done}>✓ Done today</span>
                ) : (
                  <span className={styles.due}>{dueLabel(hero, now)}</span>
                )}
                <span className={styles.period}>{periodShort(hero)}</span>
              </p>
              {also.length > 0 && <p className={styles.also}>Also today: {also.join(" · ")}</p>}
            </>
          ) : (
            <p className={styles.kicker}>No activities yet</p>
          )}

          {/* Not a control — nothing here takes focus. The screensaver cannot be
              navigated, so the one thing it can do has to be said in words.
              AmbientDream turns OK into "open the app" and every other button
              into "leave", which is what a screensaver is expected to do. */}
          <p className={styles.hint}>
            <span className={styles.key}>OK</span> to open
          </p>
        </div>
      </div>
    </div>
  );
}
