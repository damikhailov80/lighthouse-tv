import { useEffect } from "react";

type Direction = "up" | "down" | "left" | "right";

const KEY_TO_DIRECTION: Record<string, Direction> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
};

// When a dialog overlay is open, navigation is confined to it so the remote
// cannot jump to the controls hidden behind the backdrop. Matched by data
// attribute: class names are hashed by CSS Modules and are not stable
// selectors. The last overlay wins if several are ever stacked.
function navRoot(): ParentNode {
  const overlays = document.querySelectorAll<HTMLElement>("[data-overlay]");
  return overlays[overlays.length - 1] ?? document;
}

// All visible, enabled elements that opt into D-pad navigation.
function navTargets(): HTMLElement[] {
  return Array.from(navRoot().querySelectorAll<HTMLElement>("[data-nav]")).filter(
    (element) => element.offsetParent !== null && !element.hasAttribute("disabled"),
  );
}

// Rows and bands are laid out edge to edge, so their members share a gap to the
// pixel; this only absorbs sub-pixel rounding.
const SAME_BAND_PX = 2;

// Picks the best element to move to in `direction`.
//
// Up and down move a band at a time: whatever sits closest ahead defines the
// band, and the element nearest the current column inside it wins. Anything
// further away is out of the running however well aligned it is — without that,
// a wide element in the row after next can beat every card in the next one, and
// a whole row gets skipped. Left and right stay on the current line, so the last
// card of a carousel stops there instead of handing focus to the row below.
function nextInDirection(current: HTMLElement, direction: Direction): HTMLElement | null {
  const from = current.getBoundingClientRect();
  const fromX = from.left + from.width / 2;
  const fromY = from.top + from.height / 2;
  const vertical = direction === "up" || direction === "down";

  // How far ahead a candidate lies (edge to edge) and how far off the current
  // column it is. For a horizontal move the two swap roles.
  const distances = (rect: DOMRect) => {
    if (direction === "up") return { ahead: from.top - rect.bottom, aside: rect.left + rect.width / 2 - fromX };
    if (direction === "down") return { ahead: rect.top - from.bottom, aside: rect.left + rect.width / 2 - fromX };
    if (direction === "left") return { ahead: from.left - rect.right, aside: rect.top + rect.height / 2 - fromY };
    return { ahead: rect.left - from.right, aside: rect.top + rect.height / 2 - fromY };
  };

  const candidates: { element: HTMLElement; ahead: number; aside: number }[] = [];

  for (const element of navTargets()) {
    if (element === current) continue;

    const rect = element.getBoundingClientRect();
    const dx = rect.left + rect.width / 2 - fromX;
    const dy = rect.top + rect.height / 2 - fromY;

    const inDirection =
      (direction === "up" && dy < -1) ||
      (direction === "down" && dy > 1) ||
      (direction === "left" && dx < -1) ||
      (direction === "right" && dx > 1);
    if (!inDirection) continue;

    if (!vertical && (rect.bottom <= from.top || rect.top >= from.bottom)) continue;

    const { ahead, aside } = distances(rect);
    // Overlapping elements report a negative gap; they are all equally "here".
    candidates.push({ element, ahead: Math.max(ahead, 0), aside: Math.abs(aside) });
  }

  if (candidates.length === 0) return null;

  const nearest = Math.min(...candidates.map((candidate) => candidate.ahead));
  const band = candidates.filter((candidate) => candidate.ahead <= nearest + SAME_BAND_PX);

  return band.reduce((best, candidate) => (candidate.aside < best.aside ? candidate : best)).element;
}

// Enables arrow-key / D-pad spatial navigation between [data-nav] elements.
// Enter / OK is left to the elements themselves (native button activation).
export function useSpatialNavigation() {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const direction = KEY_TO_DIRECTION[event.key];
      if (!direction) return;

      const active = document.activeElement;
      const inTextField =
        active instanceof HTMLElement &&
        (active.tagName === "INPUT" || active.tagName === "TEXTAREA");

      // Left/right inside a text field move the caret, not the focus.
      if (inTextField && (direction === "left" || direction === "right")) return;

      const current =
        active instanceof HTMLElement && active.hasAttribute("data-nav")
          ? active
          : navTargets()[0];
      if (!current) return;

      // Nothing was focused yet: land on the first target.
      if (current !== active) {
        event.preventDefault();
        current.focus();
        return;
      }

      const next = nextInDirection(current, direction);
      if (next) {
        event.preventDefault();
        next.focus({ preventScroll: true });
        // Keep the newly focused control on screen without jumping the page.
        next.scrollIntoView({ block: "nearest", inline: "nearest" });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}
