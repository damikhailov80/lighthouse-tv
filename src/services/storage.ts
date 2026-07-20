import type { Activity } from "../domain/types";

const STORAGE_KEY = "lighthouse.activities";

// Older versions stored a raw `intervalDays`. Convert those records to the
// period model ({ every, unit }) so existing data keeps working.
function normalize(raw: unknown): Activity {
  const value = raw as Activity & { intervalDays?: number };
  if (value.unit === undefined && typeof value.intervalDays === "number") {
    return {
      id: value.id,
      title: value.title,
      every: value.intervalDays,
      unit: "day",
      lastDoneAt: value.lastDoneAt,
    };
  }
  return value;
}

// Loads activities from localStorage. Returns an empty list if there is
// nothing stored yet or the stored value is corrupted.
export function loadActivities(): Activity[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return (JSON.parse(raw) as unknown[]).map(normalize);
  } catch {
    return [];
  }
}

export function saveActivities(activities: Activity[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
}
