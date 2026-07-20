import { useEffect, useRef, useState } from "react";
import type { Activity } from "./domain/types";
import { loadActivities, saveActivities } from "./services/storage";
import { remainingRatio } from "./domain/status";
import { seedActivities } from "./domain/seed";
import { Dashboard } from "./components/Dashboard";
import { ActivityDetail } from "./components/ActivityDetail";
import { EditActivityDialog, type ActivityDraft } from "./components/EditActivityDialog";
import { useSpatialNavigation } from "./hooks/useSpatialNavigation";

// What the edit dialog is currently working on: an existing activity,
// a new one ("new"), or nothing (dialog closed).
type EditTarget = Activity | "new" | null;

// Navigation depth pushed into history: the dashboard is 0, an open activity
// page is 1, the edit dialog on top of it is 2. The remote's BACK button walks
// this stack natively (MainActivity forwards it to WebView.goBack()).
const DEPTH_DASHBOARD = 0;
const DEPTH_DETAIL = 1;
const DEPTH_DIALOG = 2;

export function App() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<EditTarget>(null);
  const didInitialFocus = useRef(false);
  // Card to restore focus to when coming back from an activity page.
  const lastOpenedId = useRef<string | null>(null);

  useSpatialNavigation();

  useEffect(() => {
    const stored = loadActivities();
    setActivities(stored.length > 0 ? stored : seedActivities());
  }, []);

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
    const handlePopState = (event: PopStateEvent) => {
      const depth: number = event.state?.depth ?? DEPTH_DASHBOARD;
      if (depth < DEPTH_DIALOG) setEditTarget(null);
      if (depth < DEPTH_DETAIL) setSelectedId(null);
    };

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

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Restore focus to the card we came from after returning to the dashboard.
  useEffect(() => {
    if (selectedId !== null || !lastOpenedId.current) return;
    const card = document.querySelector<HTMLElement>(
      `[data-card-id="${lastOpenedId.current}"]`,
    );
    lastOpenedId.current = null;
    card?.focus();
  }, [selectedId, activities]);

  const openDetail = (activity: Activity) => {
    lastOpenedId.current = activity.id;
    setSelectedId(activity.id);
    history.pushState({ depth: DEPTH_DETAIL }, "");
  };

  const openEdit = (target: Activity | "new") => {
    setEditTarget(target);
    history.pushState({ depth: DEPTH_DIALOG }, "");
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
            ? { ...activity, title: draft.title, every: draft.every, unit: draft.unit }
            : activity,
        ),
      );
    } else {
      const created: Activity = {
        id: crypto.randomUUID(),
        title: draft.title,
        every: draft.every,
        unit: draft.unit,
        lastDoneAt: new Date().toISOString(),
      };
      commit([...activities, created]);
    }
    history.back();
  };

  const deleteActivity = (id: string) => {
    commit(activities.filter((activity) => activity.id !== id));
    // Leave both the dialog and the now-gone activity's page behind.
    history.go(-DEPTH_DIALOG);
  };

  // Most urgent first (overdue at the top, greenest at the bottom).
  const sorted = [...activities].sort((a, b) => remainingRatio(a) - remainingRatio(b));
  const selected = activities.find((activity) => activity.id === selectedId) ?? null;

  return (
    <>
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
      {editTarget && (
        <EditActivityDialog
          target={editTarget}
          onSave={saveActivity}
          onDelete={deleteActivity}
          onClose={() => history.back()}
        />
      )}
    </>
  );
}
