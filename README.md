# Lighthouse

A home dashboard for **Android TV**: a big-screen list of recurring activities with a
traffic-light status (🟢 → 🟡 → 🟠 → 🔴), driven by the TV remote (D-pad + OK). It answers
one question from across the room — *what has been left too long?*

Local storage only, no backend.

All logic and state live in **React**; Android is a thin fullscreen WebView shell that
loads the built app from its `assets`. Conventions for the code itself — CSS Modules,
design tokens, image keys, storage versioning — are in [CLAUDE.md](CLAUDE.md).

## Screens

- **Dashboard** — a banner with the day's activity, then one carousel per status.
  The banner's pick and the rows are dealt once a day and then held: marking something
  done turns its card green where it stands instead of rearranging the screen.
- **Activity page** — details, mark as done, edit.
- **Screensaver** — the same bundle on the `#/ambient` route, shown when the TV goes
  idle. See below.
- **Home-screen channel** — a row of five cards in the TV launcher, outside the app
  entirely. See below.

## Develop

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # tsc --noEmit && vite build -> dist/
npm run preview   # serve the production build
```

The screensaver is a route, so it is debuggable without a television:
**http://localhost:5173/#/ambient**.

**Design and test at 1280x720** — see "The TV viewport is not 1920px" below.

## Deploy to the TV

| Command | What it does |
|---|---|
| `npm run tv:build` | Compile the web app, copy it into Android assets, build the APK |
| `npm run tv:connect` | `adb connect` to the TV (override: `TV_IP=192.168.1.50 npm run tv:connect`) |
| `npm run tv:upload` | Install/replace the APK on the connected TV |
| `npm run tv:run` | Launch the app on the TV |
| **`npm run tv:deploy`** | All of it: connect → build → upload → run |

Helpers: `npm run tv:devices` (confirm the TV shows as `device`), `npm run tv:logs`
(logcat filtered to WebView JS errors and crashes).

Typical loop: `tv:connect` once per session, then change code → `npm run tv:deploy`.
The Gradle wrapper picks up `java` from PATH; **JDK 17** is required.

### First-time setup (adb over Wi-Fi)

1. On the TV: Settings → About → click **Build** 7×, then enable **USB debugging**
   *and* **Network debugging / ADB over network**.
2. `npm run tv:connect`, then **accept the "Allow debugging" dialog on the TV**
   (tick "Always allow from this computer").
   - `Connection refused` → network debugging is off (port 5555 not open).
   - `failed to authenticate` → the trust dialog was not accepted. On the TV use
     Developer options → *Revoke USB debugging authorizations*, then `adb kill-server`
     and reconnect.
   - Android 11+ / Google TV uses **Wireless debugging**, with a pairing code and a
     *random* port: `adb pair <ip>:<pair-port>` first, then connect to the *other* port
     shown on the Wireless debugging screen.
3. `npm run tv:deploy`.

## The screensaver

Android TV has no home-screen widgets, so an idle screen is where the day's activity can
be shown without anyone pressing anything. It is a `DreamService` (`AmbientDream.kt`)
hosting the same web bundle on `#/ambient` — one app means one WebView data directory,
so it reads the very same `localStorage` the dashboard writes, with nothing mirrored to
the native side. It is read-only: it shows the pick the dashboard already made rather
than making one of its own.

Enable it after installing the APK — on the TV: **Settings → Device preferences →
Screen saver**, pick **"Lighthouse — today"**, and set when it starts.

Google TV replaces that screen with its own Ambient mode and may not offer third-party
screensavers at all. Then set it over adb:

```bash
adb shell settings put secure screensaver_components com.lighthouse.tv/.AmbientDream
adb shell settings put secure screensaver_enabled 1
adb shell settings put secure screensaver_activate_on_sleep 1
```

Start it immediately instead of waiting for the TV to go idle:

```bash
adb shell am start -n com.android.systemui/.Somnambulator
```

**OK opens the dashboard**; any other button just leaves the screensaver, which is what a
screensaver is expected to do. That is the only reason the dream is declared interactive
— a non-interactive one is dismissed by the system before it ever sees the press — and
every event is handled in `AmbientDream`, so none of them reaches the page.

Until the app has been opened once on that TV there is nothing in storage, so the
screensaver shows the seeded activities.

## The home-screen channel

**"Lighthouse: Time to do"** — a row of five cards in the Google TV launcher, so the
answer is on the screen the television starts on rather than one app-launch away.
Selecting a card opens that activity's page, where *Mark as done* is the next press.

The five are picked at random from what is actually **time to do**: anything past green
and not already finished today. The draw is seeded from the day (`shuffleKey`, the same
one the dashboard's suggestions use), so the row holds still until midnight instead of
rearranging itself under a viewer who has just marked something done. A short list —
most of the activities green — is topped up with whatever is closest to falling due,
because a half-empty row on the home screen reads as a broken app rather than as good
news. Being a *random* draw among the due ones, it is not a ranking: two overdue
activities can both lose the toss to something with three days left.

It is republished **on launch and after every change** to an activity, and the rows are
matched by activity id and updated in place — republishing is not a wipe, so the row
never blinks or loses the place of someone standing in it.

Three things about how it is wired:

- **`localStorage` cannot be read by the launcher**, which is a separate process. So the
  dashboard's web view — and only that one, never the screensaver's — is given a
  `ChannelBridge` JavaScript interface, and hands over cards it has already decided on
  and written the labels for. Kotlin only copies them into the TV provider.
- **The illustrations go into the APK a second time.** The launcher cannot read the
  base64 the single-file build inlines either, so `sync-web.sh` copies `src/assets/*.jpg`
  into `res/drawable-nodpi/img_*.jpg` and the cards point at `android.resource://` URIs.
  Those copies are generated and gitignored; the originals stay the only copy in git.
- **The viewer decides whether the row appears.** `TvContract.requestChannelBrowsable`
  raises the question once, the first time the channel has cards in it, and the answer is
  remembered so no one is asked twice. Until then the channel exists but is not browsable,
  and can be switched on by hand in the launcher's *Customise channels*.

Preview channels are API 26; the app runs from 24, so on an older television all of this
is a no-op — there is no home screen that could show it.

**It is only refreshed while the app is running.** An activity that falls overdue
overnight says so the next time the app is opened, not at midnight. Fixing that means a
`JobScheduler` job waking up to republish on its own, which is not built.

Written entirely through the platform `android.media.tv.TvContract`, so `androidx.tvprovider`
is not a dependency. Because the provider scopes every read to the owning package,
`adb shell content query --uri content://android.media.tv/channel` shows **nothing** even
when the channel is there — the shell is not us. Look at the launcher instead.

## Layout

```
src/
  main.tsx            picks the mode: #/ambient -> Ambient, everything else -> App
  App.tsx             routing, history, persistence, the day's picks
  domain/             types, period, status, format, sections (the day's rows), route,
                      recommendations (the channel's picks), seed
  services/storage.ts the only place localStorage is touched
  services/channel.ts the only place the native bridge is touched
  hooks/              useSpatialNavigation (D-pad)
  components/         Dashboard, Hero, ActivityRow, ActivityCard, ActivityDetail,
                      EditActivityDialog, Ambient, Logo
  assets/             web copies of the illustrations + the key -> asset map
  styles/             tokens.css, global.css, shared Button/status modules
android/
  app/src/main/java/com/lighthouse/tv/
    MainActivity.kt   fullscreen WebView, immersive bars, BACK walks web history,
                      lighthouse://activity/<id> deep links
    AmbientDream.kt   the screensaver
    AppWebView.kt     the WebView both of them are built from
    ChannelBridge.kt  the one crossing from the web layer to the native side
    RecommendationChannel.kt  the home-screen row, written to the TV provider
  sync-web.sh         build the web app into app/src/main/assets/www/, and copy the
                      illustrations into res/drawable-nodpi/ for the channel
```

Android project: Kotlin, `applicationId com.lighthouse.tv`, minSdk 24 / targetSdk 34 /
compileSdk 36, **no third-party dependencies**. Icon and TV banner are vector XML; the
only binaries in the APK are the illustrations, and they are there twice — inlined in the
web bundle for the app, and as resources for the launcher, which cannot read the first
copy.

## Decisions worth knowing

- **The web build is a single file.** `vite-plugin-singlefile` inlines all JS, CSS and
  images into one `index.html`, because `file://` blocks cross-origin fetches in the
  WebView. It is also why illustrations are kept small (720px JPEG) and why a second
  entry point would mean a second copy of everything.
- **The repeat period is `every` + `unit`** (day/week/month), not a raw day count;
  `src/domain/period.ts` converts it to days. Shown as "daily" / "every 3d" / "weekly".
- **Status is a pure function of `(activity, now)`**, and its thresholds are a *fraction
  of the interval* (`>0.5` green, `>0.2` yellow, else orange; overdue is red), so they
  mean the same thing on a 3-day and a 6-month period.
- **The day's picks are frozen** (`lighthouse.hero.v1`, `lighthouse.layout.v1`). They are
  decisions about the screen, not about the data — losing them costs a reshuffle. The
  home-screen channel holds still the same way, but stores nothing: its draw is seeded
  from the day, so it can simply be recomputed.
- **The header font is a fallback serif stack** (Cooper Black → Georgia → serif). No font
  file is bundled: that would be a new binary asset, which needs sign-off.
- **UI language is English**, deliberately, although the original mockup was Russian.

## Gotchas learned on real hardware

**The TV WebView viewport is not 1920px.** Android TV reports a CSS viewport of roughly
960px (density 2.0), which collapsed the card grid and pushed "Mark as done" off the
bottom edge — which in turn made D-pad navigation feel stuck.

Both halves of the fix are required:

- `index.html` declares a **fixed** `<meta name="viewport" content="width=1280">`.
- `AppWebView.kt` sets `useWideViewPort = true` and `loadWithOverviewMode = true`, which
  makes the WebView honour that width and scale the page to fill the panel.

The page then always lays out at exactly 1280x720 and is scaled up (~1.5× on a 1080p TV),
so text gets *bigger*, not smaller. **Design and test at 1280x720**, and keep the screen
inside that box.

**A WebView paints white until its first frame.** Everything in the launch is therefore
set to the same colour (`@color/night` = `--color-bg-top`): the window, the system
splash, the WebView background and the boot screen inlined in `index.html`.

## Possible next steps

- Autostart on TV boot (`BOOT_COMPLETED` receiver), or the `HOME` category so the TV
  starts straight into the dashboard.
- Refreshing the home-screen channel while the app is closed (a `JobScheduler` job), so
  something falling overdue overnight says so before anyone opens the app.
- Server-side storage for activities, so a phone and the TV share one list. Would need
  `updatedAt`, soft deletes (`deletedAt`) and `max(lastDoneAt)` as the merge rule, plus a
  device-code sign-in — there is no keyboard on a remote.
