import type { Activity, Today } from "@lighthouse/shared";

// The read cache. The API is the only place data lives now; this is what the
// screen draws while the first request is still in flight, and what it keeps
// drawing when the Wi-Fi drops. Losing all of it costs one round trip.
//
// The activities key keeps its name and version. Bumping a version means
// throwing the records away on purpose (see CLAUDE.md), and nothing is being
// thrown away here — the same key simply stops being the source of truth and
// becomes a copy of it.
const ACTIVITIES_KEY = "lighthouse.activities.v2";
const TODAY_KEY = "lighthouse.today.v1";

// Keys of superseded formats, deleted on load so an old dataset can never come
// back and the television does not carry it around forever. The banner's pick
// and the dashboard's rows are among them now: they are decided by the server,
// so that every screen in the house names the same activity, and a stale local
// copy could only ever disagree with it.
const LEGACY_KEYS = ["lighthouse.activities", "lighthouse.hero.v1", "lighthouse.layout.v1"];

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? null : (JSON.parse(raw) as T);
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // A full or disabled store costs the next launch its first frame and
    // nothing else. It must not take down a screen that is otherwise working.
  }
}

// Called once, before anything reads the cache.
export function dropLegacyKeys(): void {
  for (const key of LEGACY_KEYS) {
    try {
      localStorage.removeItem(key);
    } catch {
      // Same reasoning as write(): not worth a broken screen.
    }
  }
}

export function loadCachedActivities(): Activity[] | null {
  return read<Activity[]>(ACTIVITIES_KEY);
}

export function saveCachedActivities(activities: Activity[]): void {
  write(ACTIVITIES_KEY, activities);
}

export function loadCachedToday(): Today | null {
  return read<Today>(TODAY_KEY);
}

export function saveCachedToday(today: Today): void {
  write(TODAY_KEY, today);
}
