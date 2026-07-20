import { useEffect, useRef, useState } from "react";
import type { Activity } from "./domain/types";
import { loadActivities, saveActivities } from "./services/storage";
import { remainingRatio } from "./domain/status";
import { seedActivities } from "./domain/seed";
import { Dashboard } from "./components/Dashboard";
import { ActivityDetail } from "./components/ActivityDetail";
import { EditActivityDialog, type ActivityDraft } from "./components/EditActivityDialog";
import { useSpatialNavigation } from "./hooks/useSpatialNavigation";
import { DASHBOARD, activityIdOf, depthOf, hashFor, parseHash, type Route } from "./domain/route";

// What the edit dialog is currently working on: an existing activity,
// a new one ("new"), or nothing (dialog closed).
type EditTarget = Activity | "new" | null;

export function App() {
  const [activities, setActivities] = useState<Activity[]>([]);
  // The URL drives the UI, so a hash typed into the address bar opens the same
  // screen the in-app navigation would.
  const [route, setRoute] = useState<Route>(() => parseHash(location.hash));
  const [loaded, setLoaded] = useState(false);
  const didInitialFocus = useRef(false);
  // Card to restore focus to when coming back from an activity page.
  const lastOpenedId = useRef<string | null>(null);

  useSpatialNavigation();

  useEffect(() => {
    const stored = loadActivities();
    setActivities(stored.length > 0 ? stored : seedActivities());
    setLoaded(true);

    // A deep link arrives as a single history entry, so BACK would leave the
    // app. Rebuild the stack underneath it: dashboard, then the activity page,
    // then the dialog — exactly what opening it by hand would have produced.
    const initial = parseHash(location.hash);
    history.replaceState({ depth: depthOf(DASHBOARD) }, "", hashFor(DASHBOARD));
    // An edit link for an existing activity also gets its page put underneath.
    if (initial.kind === "edit" && initial.id !== null) {
      const page: Route = { kind: "detail", id: initial.id };
      history.pushState({ depth: depthOf(page) }, "", hashFor(page));
    }
    if (initial.kind !== "dashboard") {
      history.pushState({ depth: depthOf(initial) }, "", hashFor(initial));
    }
    setRoute(initial);
  }, []);

  // Keep the URL honest about what is on screen. A link can name an activity
  // that no longer exists (deleted, or storage wiped by a version bump), and a
  // hand-typed hash can be unparseable — both land on the dashboard, so the
  // address bar has to say so too.
  useEffect(() => {
    if (!loaded) return;
    const id = activityIdOf(route);
    const known = id === null || activities.some((activity) => activity.id === id);
    const actual = known ? route : DASHBOARD;
    if (!known) setRoute(DASHBOARD);
    if (location.hash !== hashFor(actual)) {
      history.replaceState({ depth: depthOf(actual) }, "", hashFor(actual));
    }
  }, [loaded, route, activities]);

  // Give the D-pad a starting point by focusing the first card once the
  // dashboard has rendered its activities.
  useEffect(() => {
    if (didInitialFocus.current || activities.length === 0) return;
    didInitialFocus.current = true;
    // Matched by data attribute, not by class: class names are hashed by CSS
    // Modules and are not stable selectors.
    const start =
      document.querySelector<HTMLElement>("[data-card-id]") ??
      document.querySelector<HTMLElement>("[data-nav]");
    start?.focus();
  }, [activities]);

  // Single place where "go back" is interpreted, whether it came from the
  // remote's BACK button, Escape, or an on-screen Back/Cancel button (those
  // call history.back() so every route ends up here).
  useEffect(() => {
    // Re-read the URL instead of trusting the entry's state: an address-bar
    // edit creates an entry we never pushed and so carries no state of ours.
    const syncFromUrl = () => setRoute(parseHash(location.hash));

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" || event.key === "Backspace") {
        const active = document.activeElement;
        // Backspace must keep editing text instead of navigating back.
        if (
          event.key === "Backspace" &&
          active instanceof HTMLElement &&
          (active.tagName === "INPUT" || active.tagName === "TEXTAREA")
        ) {
          return;
        }
        event.preventDefault();
        history.back();
      }
    };

    window.addEventListener("popstate", syncFromUrl);
    window.addEventListener("hashchange", syncFromUrl);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("popstate", syncFromUrl);
      window.removeEventListener("hashchange", syncFromUrl);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Both screens are read off the route: editing an existing activity keeps its
  // page behind the dialog, while "new" opens on top of the dashboard.
  const selectedId = activityIdOf(route);
  const selected = activities.find((activity) => activity.id === selectedId) ?? null;
  const editTarget: EditTarget =
    route.kind !== "edit"
      ? null
      : route.id === null
        ? "new"
        : (activities.find((activity) => activity.id === route.id) ?? null);

  // Restore focus to the card we came from after returning to the dashboard.
  useEffect(() => {
    if (selectedId !== null || !lastOpenedId.current) return;
    const card = document.querySelector<HTMLElement>(
      `[data-card-id="${lastOpenedId.current}"]`,
    );
    lastOpenedId.current = null;
    card?.focus();
  }, [selectedId, activities]);

  // Every in-app navigation goes through here: state and URL move together.
  const navigate = (next: Route) => {
    setRoute(next);
    history.pushState({ depth: depthOf(next) }, "", hashFor(next));
  };

  const openDetail = (activity: Activity) => {
    lastOpenedId.current = activity.id;
    navigate({ kind: "detail", id: activity.id });
  };

  const openEdit = (target: Activity | "new") => {
    navigate({ kind: "edit", id: target === "new" ? null : target.id });
  };

  // Persist and update state in one place so storage never drifts from UI.
  const commit = (next: Activity[]) => {
    saveActivities(next);
    setActivities(next);
  };

  // Mark an activity done: reset its timer to now and return to the dashboard,
  // where the card is now green.
  const markDone = (id: string) => {
    commit(
      activities.map((activity) =>
        activity.id === id
          ? { ...activity, lastDoneAt: new Date().toISOString() }
          : activity,
      ),
    );
    history.back();
  };

  // Create a new activity or update an existing one from the dialog.
  const saveActivity = (draft: ActivityDraft) => {
    if (draft.id) {
      commit(
        activities.map((activity) =>
          activity.id === draft.id
            ? {
                ...activity,
                title: draft.title,
                every: draft.every,
                unit: draft.unit,
                image: draft.image,
              }
            : activity,
        ),
      );
    } else {
      const created: Activity = {
        id: crypto.randomUUID(),
        title: draft.title,
        every: draft.every,
        unit: draft.unit,
        image: draft.image,
        lastDoneAt: new Date().toISOString(),
      };
      commit([...activities, created]);
    }
    history.back();
  };

  const deleteActivity = (id: string) => {
    commit(activities.filter((activity) => activity.id !== id));
    // Leave both the dialog and the now-gone activity's page behind. Delete is
    // only offered for an existing activity, so both entries are always there.
    history.go(-depthOf({ kind: "edit", id }));
  };

  // Most urgent first (overdue at the top, greenest at the bottom).
  const sorted = [...activities].sort((a, b) => remainingRatio(a) - remainingRatio(b));

  return (
    <>
      {/* While the dialog is open the page behind it is inert: not focusable,
          not clickable and skipped by screen readers. */}
      <div inert={editTarget !== null}>
        {selected ? (
          <ActivityDetail
            activity={selected}
            onMarkDone={markDone}
            onEdit={openEdit}
            onBack={() => history.back()}
          />
        ) : (
          <Dashboard activities={sorted} onOpen={openDetail} onAdd={() => openEdit("new")} />
        )}
      </div>
      {editTarget && (
        <EditActivityDialog
          // Remount when the target changes: the form seeds its fields from
          // props once, so a reused instance would show the previous activity.
          key={editTarget === "new" ? "new" : editTarget.id}
          target={editTarget}
          onSave={saveActivity}
          onDelete={deleteActivity}
          onClose={() => history.back()}
        />
      )}
    </>
  );
}
