import type { Activity, DayLayout } from "@lighthouse/shared";

// One card as a home screen or a photo frame wants it: finished text, and an
// image key rather than a URL. Same shape the native side has always been
// handed — it moved here when the decision behind it moved to the server.
export interface ChannelCard {
  id: string;
  title: string;
  // "Overdue · weekly" — the two labels the cards in the app carry.
  subtitle: string;
  image?: string;
}

// Everything a screen needs to draw today, in one response.
//
// It exists so that a client with no keyboard and no reason to hold the whole
// domain — a photo frame whose entire content is the day's pick — can render
// from a single request. The dashboard uses the same answer, which is what
// makes the two agree.
export interface Today {
  // dayKey(), resolved in the household's timezone.
  day: string;
  // The banner's activity. Null only when there are no activities at all.
  hero: Activity | null;
  // The rows dealt this morning and held for the day.
  rows: DayLayout["rows"];
  // The launcher's row of five.
  cards: ChannelCard[];
  // The single card for the television's "Play Next".
  watchNext: ChannelCard | null;
}
