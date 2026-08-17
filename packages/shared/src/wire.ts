import type { Activity } from "./types.js";
import type { DayLayout } from "./sections.js";

// What the API answers with, described once for everything that speaks to it:
// the API, the web app, the television, and whatever renders an activity next.

// One card as a home screen or a photo frame wants it: finished text, and an
// image key rather than a URL — the launcher runs in another process and looks
// the key up in its own copy of the pictures.
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
// from a single request. The dashboard reads the same answer, which is what
// makes the two agree.
export interface Today {
  // dayKey(), resolved in the household's timezone. The server decides it, so
  // devices in the same house cannot disagree about what day it is.
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
