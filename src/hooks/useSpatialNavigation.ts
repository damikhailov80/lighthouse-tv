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

// Picks the best element to move to in `direction`, scoring candidates by
// distance along the travel axis plus a penalty for drifting off-axis, so we
// prefer the element that is roughly "straight ahead".
function nextInDirection(current: HTMLElement, direction: Direction): HTMLElement | null {
  const from = current.getBoundingClientRect();
  const fromX = from.left + from.width / 2;
  const fromY = from.top + from.height / 2;
  const vertical = direction === "up" || direction === "down";

  let best: HTMLElement | null = null;
  let bestScore = Infinity;

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

    const along = vertical ? Math.abs(dy) : Math.abs(dx);
    const across = vertical ? Math.abs(dx) : Math.abs(dy);
    // Reject candidates that are steeply off to the side (> ~63deg), then
    // heavily penalise the remaining off-axis drift so the element straight
    // ahead always wins over a diagonal one.
    if (across > along * 2) continue;

    const score = along + across * 4;
    if (score < bestScore) {
      bestScore = score;
      best = element;
    }
  }

  return best;
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
