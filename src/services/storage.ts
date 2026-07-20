import type { Activity } from "../domain/types";

// Bumped when stored records are no longer worth keeping. Reading a new key
// makes the app fall back to the seed, which is how the illustrated activities
// replace the ones saved before pictures existed.
const STORAGE_KEY = "lighthouse.activities.v2";

// Keys of superseded formats. They are deleted on load so an old dataset can
// never come back, and so the TV does not carry them around forever.
const LEGACY_KEYS = ["lighthouse.activities"];

// Loads activities from localStorage. Returns an empty list if there is
// nothing stored yet or the stored value is corrupted.
export function loadActivities(): Activity[] {
  for (const key of LEGACY_KEYS) localStorage.removeItem(key);

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Activity[];
  } catch {
    return [];
  }
}

export function saveActivities(activities: Activity[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
}
