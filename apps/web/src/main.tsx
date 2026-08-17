import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles/global.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// The boot screen stays up for at least this long. The app is ready sooner than
// that, but a splash that flickers past reads as a glitch — a beat of "the app
// is starting" is what the screen is for.
const SPLASH_MIN_MS = 1000;

// Dismiss the boot screen from index.html once the dashboard has actually been
// painted: render() only queues the work, so we wait for the frame after the
// commit, then let the CSS fade run before taking the element out of the DOM.
// Only the TV app shows it — see the env check in index.html.
const splash = document.documentElement.dataset.env === "tv" && document.getElementById("splash");
if (splash) {
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      // performance.now() is time since the page started loading, which is
      // exactly how long the splash has been visible.
      setTimeout(() => {
        splash.addEventListener("transitionend", () => splash.remove(), { once: true });
        splash.classList.add("done");
      }, Math.max(0, SPLASH_MIN_MS - performance.now()));
    }),
  );
}
