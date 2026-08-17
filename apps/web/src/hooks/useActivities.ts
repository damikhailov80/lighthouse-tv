import { useCallback, useEffect, useRef, useState } from "react";
import type { Activity, Today } from "@lighthouse/shared";
import { ApiError, api, type ActivityInput } from "../services/api";
import {
  dropLegacyKeys,
  loadCachedActivities,
  loadCachedToday,
  saveCachedActivities,
  saveCachedToday,
} from "../services/storage";

// How often the screen asks the server whether anything has changed. A
// television is left on the dashboard for a whole evening while someone marks
// something off on a phone in the next room, and it should not still be showing
// yesterday when they walk back in.
const REFRESH_MS = 60_000;

// The cache is read once, synchronously, before the first render. This is what
// keeps the six effects in App.tsx working as they always have: they are
// written to run once there are activities, and on a device that has been used
// before there are activities in the very first frame, exactly as when the list
// came out of localStorage.
function cached(): { activities: Activity[] | null; today: Today | null } {
  dropLegacyKeys();
  return { activities: loadCachedActivities(), today: loadCachedToday() };
}

export interface ActivitiesState {
  activities: Activity[];
  // The day's decision as the server made it: the banner's pick, the rows, and
  // the finished cards for the home screen.
  today: Today | null;
  // True once there is something to draw — from the cache, or from the first
  // answer, or from the first failure. Never stays false waiting for a server
  // that is not coming.
  loaded: boolean;
  // Set when the last exchange with the API failed. The screen carries on from
  // the cache; this is what lets it say so.
  error: ApiError | null;
  markDone: (id: string) => Promise<void>;
  save: (input: ActivityInput) => Promise<void>;
  remove: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

// The one way the UI reaches the data.
//
// There is no mutation queue: the API answers around the clock, so a write
// either goes through now or is worth reporting. What is kept is a read cache,
// because the first frame should not be empty and a moment of bad Wi-Fi should
// not blank a television.
export function useActivities(): ActivitiesState {
  const initial = useRef(cached()).current;
  const [activities, setActivities] = useState<Activity[]>(initial.activities ?? []);
  const [today, setToday] = useState<Today | null>(initial.today);
  const [loaded, setLoaded] = useState(initial.activities !== null);
  const [error, setError] = useState<ApiError | null>(null);
  // Guards against a slow answer landing after the component is gone, and
  // against the interval stacking requests on a server that is not responding.
  const alive = useRef(true);
  const inFlight = useRef(false);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  // Both are fetched together because they have to agree: the rows name
  // activities, and a set of rows read a moment before a deletion would leave
  // the dashboard with a heading over nothing.
  const refresh = useCallback(async (): Promise<void> => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const [nextActivities, nextToday] = await Promise.all([api.activities(), api.today()]);
      if (!alive.current) return;
      setActivities(nextActivities);
      setToday(nextToday);
      setError(null);
      saveCachedActivities(nextActivities);
      saveCachedToday(nextToday);
    } catch (cause) {
      if (!alive.current) return;
      setError(cause instanceof ApiError ? cause : new ApiError("Request failed"));
    } finally {
      inFlight.current = false;
      if (alive.current) setLoaded(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = setInterval(() => void refresh(), REFRESH_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  // Apply the server's answer for one activity straight away, so the card
  // recolours under the remote instead of a beat later, then reconcile in the
  // background — the day's rows and the home screen's cards are decided by the
  // server and cannot be worked out from a single record.
  const applyThenRefresh = useCallback(
    async (call: () => Promise<Activity | void>): Promise<void> => {
      try {
        const updated = await call();
        if (!alive.current) return;
        if (updated !== undefined) {
          setActivities((current) => {
            const next = current.some((activity) => activity.id === updated.id)
              ? current.map((activity) => (activity.id === updated.id ? updated : activity))
              : [...current, updated];
            saveCachedActivities(next);
            return next;
          });
        }
        setError(null);
      } catch (cause) {
        if (!alive.current) return;
        setError(cause instanceof ApiError ? cause : new ApiError("Request failed"));
        return;
      }
      await refresh();
    },
    [refresh],
  );

  const markDone = useCallback(
    (id: string) => applyThenRefresh(() => api.markDone(id, new Date().toISOString())),
    [applyThenRefresh],
  );

  const save = useCallback(
    (input: ActivityInput) => applyThenRefresh(() => api.save(input)),
    [applyThenRefresh],
  );

  const remove = useCallback(
    (id: string) =>
      applyThenRefresh(async () => {
        await api.remove(id);
        if (alive.current) {
          setActivities((current) => {
            const next = current.filter((activity) => activity.id !== id);
            saveCachedActivities(next);
            return next;
          });
        }
      }),
    [applyThenRefresh],
  );

  return { activities, today, loaded, error, markDone, save, remove, refresh };
}
