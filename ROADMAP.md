# Lighthouse — roadmap & progress

Home dashboard for **Android TV**: a big-screen list of recurring activities with a
traffic-light status (🟢 → 🟡 → 🟠 → 🔴). Controlled with the TV remote (D-pad + OK).
Local storage only, no backend.

Architecture: **all logic and state live in React**; Android is a thin fullscreen
WebView shell that loads the built React app from its `assets`.

## Conventions (see CLAUDE.md)
- All UI text and code comments in **English**.
- Talk to the operator in the language they used.
- No new media files (fonts, images, audio, video) without explicit sign-off.

## Decisions locked in
- Repeat period is modelled as **`every` (number) + `unit` (day/week/month)**, not a raw
  day count. `src/domain/period.ts` converts it to days (day=1, week=7, month=30).
  Shown as "Once a week" / "Once every 3 days" / "Once every 1.5 months". Legacy
  `intervalDays` records are migrated on load in `storage.ts`.
- Status is a pure function of `(activity, now)`; thresholds are a **fraction of the
  interval** (`>0.5` green, `>0.2` yellow, else orange; overdue = red) so they scale
  across a 3-day and a 6-month period alike.
- Vite `base: "./"` (relative asset paths) — required so the build loads from
  `file://android_asset/...` in phase 2.
- Header font: **fallback serif stack kept** (`Cooper Black → Georgia → serif`); no
  bundled font file (would be a new asset). Visual style matches the cream/terracotta
  mockup.
- UI language: **English** (mockup was Russian; we intentionally kept English).

## Current state — Phase 1 (React MVP) ✅ COMPLETE
Works in the browser, verified end-to-end with Playwright (real arrow/OK key presses
+ screenshots).

- **1.1** Scaffold + domain core (`src/domain/`, `src/services/storage.ts`)
- **1.2** Dashboard UI (`Dashboard`, `ActivityList`, `ActivityCard`), cream/terracotta
  TV style. Each card has a status-coloured **progress bar** + a compact
  `<time-left> · <period>` line; cards are **sorted by urgency** (overdue first).
- **1.3** Add / edit / delete via `EditActivityDialog`; Mark-as-done resets the timer;
  everything persisted to `localStorage`
- **1.4** D-pad spatial navigation (`src/hooks/useSpatialNavigation.ts`): arrow keys
  move focus by screen geometry, OK activates the focused control, focus ring visible,
  nav scoped to the dialog when open

### Project layout
```
src/
  main.tsx, App.tsx, index.css
  domain/    types.ts, status.ts, format.ts, seed.ts
  services/  storage.ts
  hooks/     useSpatialNavigation.ts
  components/ Dashboard.tsx, ActivityList.tsx, ActivityCard.tsx, EditActivityDialog.tsx
```

### Run it
```
npm install
npm run dev       # http://localhost:5173
npm run build     # tsc --noEmit && vite build  -> dist/
npm run preview   # serve the production build
```

### Known quirk / possible follow-up
- Vertical D-pad nav behaves as **two lanes** (Edit row on top, Mark-as-done row on
  bottom). Every control is reachable; horizontal nav is clean. If a more conventional
  feel is wanted, alternative is: **one focus target per card + long-press OK to edit**.

---

## Phase 2: Android WebView shell ✅ BUILT (install on TV pending)
Installable debug APK is produced and verified: the single-file web build renders from
`file://` with no console errors (same Chromium engine as the TV WebView).

- Project in `android/` — Kotlin, `applicationId com.lighthouse.tv`, label "Lighthouse",
  minSdk 24 / targetSdk 34 / compileSdk 36, no third-party deps.
- `android/app/src/main/java/com/lighthouse/tv/MainActivity.kt` — single
  `android.app.Activity` with a fullscreen `WebView` (JS + DOM storage on), immersive
  system bars, BACK walks web history. Loads `file:///android_asset/www/index.html`.
- Manifest: `LAUNCHER` + `LEANBACK_LAUNCHER`, landscape, touchscreen not required.
- Icon + TV banner are **vector XML** (no binary assets).
- Web is inlined into one `index.html` via **vite-plugin-singlefile** so `file://` needs
  no cross-origin fetches. `android/sync-web.sh` builds the web app and copies it into
  `app/src/main/assets/www/`.

### Everyday workflow (npm scripts)

Four single-purpose commands, plus one that chains them:

| Command | What it does |
|---|---|
| `npm run tv:build` | **Build** — compile the web app, copy it into Android assets, build the APK |
| `npm run tv:connect` | **Connect** — `adb connect` to the TV (override IP: `TV_IP=192.168.1.50 npm run tv:connect`) |
| `npm run tv:upload` | **Upload** — install/replace the APK on the connected TV |
| `npm run tv:run` | **Run** — launch the app on the TV |
| **`npm run tv:deploy`** | **All together: build → upload → run** |

Helpers:

| Command | What it does |
|---|---|
| `npm run dev` | Web dev server at http://localhost:5173 |
| `npm run tv:devices` | List adb devices — confirm the TV shows as `device` |
| `npm run tv:logs` | Live logcat filtered to WebView JS errors and crashes |

Typical loop: `tv:connect` once per session, then change code → `npm run tv:deploy`.
(The Gradle wrapper picks up `java` from PATH; JDK 17 is required.)

### First-time TV setup (adb over Wi-Fi)
1. TV: Settings → About → click **Build** 7x to unlock Developer options; enable
   **USB debugging** *and* **Network debugging / ADB over network**.
2. `npm run tv:connect` — then **accept the "Allow debugging" dialog on the TV**
   (tick "Always allow from this computer").
   - `Connection refused` → network debugging is off on the TV (port 5555 not open).
   - `failed to authenticate` → the trust dialog was not accepted; on the TV use
     Developer options → *Revoke USB debugging authorizations*, then `adb kill-server`
     and reconnect.
   - Android 11+ / Google TV uses **Wireless debugging** with a pairing code and a
     *random* port: `adb pair <ip>:<pair-port>` first, then connect to the *other*
     port shown on the Wireless debugging screen.
3. `npm run tv:deploy`.

## Gotchas learned on real hardware

**The TV WebView viewport is not 1920px.** Android TV reports a CSS viewport of roughly
960px (density 2.0). With a `minmax(340px, 1fr)` grid that collapsed to two columns,
cards ballooned, and the "Mark as done" button fell below the bottom edge, which also
made D-pad navigation feel stuck at the bottom.

Fix (both halves are required):
- `index.html` declares a **fixed** `<meta name="viewport" content="width=1280">`.
- `MainActivity` sets `useWideViewPort = true` and `loadWithOverviewMode = true`, which
  makes the WebView honour that width and scale the page to fill the panel.

Result: the page always lays out at exactly 1280x720 — the size the design is tuned
for — and is scaled up (~1.5x on a 1080p TV), so text gets bigger, not smaller.
**Therefore: design and test the web app at 1280x720**, and keep the whole grid inside
that box with no scrolling.

Open question for later: keep localStorage, or move persistence Android-side?
(localStorage in the WebView is fine for MVP.)

## Later — Phase 3: Android TV polish (NOT STARTED)
- Immersive fullscreen (hide system bars).
- Confirm D-pad focus + OK map correctly to the WebView (KEYCODE_DPAD_* → arrows,
  DPAD_CENTER → Enter).
- Larger UI tuning for 10-foot viewing if needed.
- Optional: autostart on TV boot (BOOT_COMPLETED receiver).

## How to resume
Open this repo, read `CLAUDE.md` + this file, run `npm run dev` to see the MVP, then
start Phase 2. Task list also tracked in the Claude session.
