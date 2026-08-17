import { useEffect, useRef, useState } from "react";
import { type Activity, type DayLayout, remainingRatio } from "@lighthouse/shared";
import { publishChannel } from "./services/channel";
import { Dashboard } from "./components/Dashboard";
import { ActivityDetail } from "./components/ActivityDetail";
import { EditActivityDialog, type ActivityDraft } from "./components/EditActivityDialog";
import { useActivities } from "./hooks/useActivities";
import { useSpatialNavigation } from "./hooks/useSpatialNavigation";
import { DASHBOARD, activityIdOf, depthOf, hashFor, parseHash, type Route } from "./domain/route";

// What the edit dialog is currently working on: an existing activity,
// a new one ("new"), or nothing (dialog closed).
type EditTarget = Activity | "new" | null;

// The card the remote is on, as a place on the dashboard: its row and its
// position in it. Read off the focused element rather than looked up by id —
// an activity has a card in several rows at once, and only the focused one is
// the seat being left. Matched by data attribute, not by class: class names are
// hashed by CSS Modules and are not stable selectors.
function focusedSeat(): { row: string; index: number } | null {
  const active = document.activeElement;
  const card =
    active instanceof HTMLElement ? active.closest<HTMLElement>("[data-card-id]") : null;
  const row = card?.closest<HTMLElement>("[data-row]");
  if (!card || !row?.dataset.row) return null;

  const cards = Array.from(row.querySelectorAll<HTMLElement>("[data-card-id]"));
  return { row: row.dataset.row, index: cards.indexOf(card) };
}

export function App() {
  const { activities, today, loaded, error, markDone, save, remove } = useActivities();
  // The URL drives the UI, so a hash typed into the address bar opens the same
  // screen the in-app navigation would.
  const [route, setRoute] = useState<Route>(() => parseHash(location.hash));
  // The day's decisions, as the server made them. They used to be taken here,
  // once a day, and kept in localStorage; they moved to the server so that the
  // television, the web and anything else in the house feature the same
  // activity rather than each dealing its own.
  const heroId = today?.hero?.id ?? null;
  const layout: DayLayout | null =
    today === null ? null : { day: today.day, rows: today.rows };
  const didInitialFocus = useRef(false);
  // Where the card we opened sat: which row, and how far along it. The seat is
  // remembered instead of the card itself because marking an activity done
  // moves its card to another row — following it there would scroll the
  // dashboard somewhere the remote never asked to go.
  const lastSeat = useRef<{ row: string; index: number } | null>(null);

  useSpatialNavigation();

  useEffect(() => {
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
  // that no longer exists — a card on the home screen outlives the activity it
  // was about, and another device may have deleted it since — and a hand-typed
  // hash can be unparseable. Both land on the dashboard, so the address bar has
  // to say so too.
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

  // Keep the home screen in step with the list. The cards arrive finished from
  // the server, so this is now only the moment they are handed across: whenever
  // a new answer replaces the old one, which is on launch, after every change to
  // an activity, and on the refresh timer — exactly the set of events the home
  // screen cares about, since a card offering something that was finished an
  // hour ago is the one thing a recommendation row must never do.
  useEffect(() => {
    if (!loaded) return;
    publishChannel(today);
  }, [loaded, today]);

  // Give the D-pad a starting point by focusing the banner once the dashboard
  // has rendered its activities — it already features the most urgent one.
  useEffect(() => {
    if (didInitialFocus.current || activities.length === 0) return;
    didInitialFocus.current = true;
    // Matched by data attribute, not by class: class names are hashed by CSS
    // Modules and are not stable selectors.
    // The banner's own button is skipped when its activity is already done: it
    // is disabled then, and a disabled element cannot take focus.
    const start =
      document.querySelector<HTMLElement>("[data-hero]:not([disabled])") ??
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

  // Back on the dashboard: sit the remote down where it got up from. The row
  // can have lost cards, or be gone entirely — marking the last overdue
  // activity done takes the whole "Overdue" heading with it — so fall back to
  // the closest seat still in that row, then to the banner, then to any card.
  useEffect(() => {
    if (selectedId !== null || !lastSeat.current) return;
    const { row, index } = lastSeat.current;
    lastSeat.current = null;

    const cards = document.querySelectorAll<HTMLElement>(
      `[data-row="${row}"] [data-card-id]`,
    );
    const target =
      cards[Math.min(index, cards.length - 1)] ??
      document.querySelector<HTMLElement>("[data-hero]:not([disabled])") ??
      document.querySelector<HTMLElement>("[data-card-id]");
    if (!target) return;

    // The dashboard is remounted at the top of the page, so focusing alone
    // would glide the whole way down under `scroll-behavior: smooth`. Put the
    // screen back in place first and instantly: nothing moved, as far as the
    // viewer is concerned.
    target.focus({ preventScroll: true });
    target.scrollIntoView({ behavior: "instant", block: "nearest", inline: "nearest" });
  }, [selectedId, activities]);

  // Every in-app navigation goes through here: state and URL move together.
  const navigate = (next: Route) => {
    setRoute(next);
    history.pushState({ depth: depthOf(next) }, "", hashFor(next));
  };

  const openDetail = (activity: Activity) => {
    lastSeat.current = focusedSeat();
    navigate({ kind: "detail", id: activity.id });
  };

  const openEdit = (target: Activity | "new") => {
    navigate({ kind: "edit", id: target === "new" ? null : target.id });
  };

  // Create a new activity or update an existing one from the dialog. The id is
  // generated here rather than by the server, which is what lets a request
  // retried after an unclear failure land on the row it already made.
  //
  // The screen is left before the request settles: waiting would hold the
  // dialog open on a spinner for a round trip, and the list the dashboard
  // renders is updated the moment the answer arrives either way.
  const saveActivity = (draft: ActivityDraft) => {
    void save({
      id: draft.id ?? crypto.randomUUID(),
      title: draft.title,
      every: draft.every,
      unit: draft.unit,
      image: draft.image,
    });
    history.back();
  };

  const deleteActivity = (id: string) => {
    void remove(id);
    // Leave both the dialog and the now-gone activity's page behind. Delete is
    // only offered for an existing activity, so both entries are always there.
    history.go(-depthOf({ kind: "edit", id }));
  };

  // Most urgent first (overdue at the top, greenest at the bottom).
  const sorted = [...activities].sort((a, b) => remainingRatio(a) - remainingRatio(b));

  // What to say when the screen has no cards to show. A dashboard that is
  // simply empty cannot tell "nothing added yet" from "the server is not
  // answering", and on a television those need different things done about
  // them. Once there are cached activities to draw, a failed refresh is left
  // unsaid: the list on screen is a few minutes old at worst.
  const notice =
    activities.length > 0
      ? undefined
      : !loaded
        ? "Loading…"
        : error === null
          ? undefined
          : error.isUnauthorized
            ? "This device is not allowed to read the list. Check its token."
            : "Cannot reach the server. Showing nothing until it answers.";

  return (
    <>
      {/* While the dialog is open the page behind it is inert: not focusable,
          not clickable and skipped by screen readers. */}
      <div inert={editTarget !== null}>
        {selected ? (
          <ActivityDetail
            activity={selected}
            onMarkDone={(id) => {
              void markDone(id);
              history.back();
            }}
            onEdit={openEdit}
            onBack={() => history.back()}
          />
        ) : (
          <Dashboard
            activities={sorted}
            heroId={heroId}
            layout={layout}
            notice={notice}
            onOpen={openDetail}
            onAdd={() => openEdit("new")}
            onMarkDone={(id) => void markDone(id)}
            onEdit={openEdit}
          />
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
