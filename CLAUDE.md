# Project conventions

These rules apply across the whole project.

- **Language of the codebase:** All interface/UI text and all code comments must be written in English.
- **Language of conversation:** When talking to the human operator, reply in the language the question was asked in.
- **Media files:** Never add new media files (images, audio, video, etc.) without an explicit request from the user.

# Images

- `/assets` holds the **originals** (full-size PNG) and is not shipped. `src/assets` holds the **web copies** actually imported by the app — 720px-wide JPEG, generated with
  `sips -Z 720 -s format jpeg -s formatOptions 78 <src> --out src/assets/<name>.jpg`.
  Keep them small: `vite-plugin-singlefile` inlines every asset as base64 into one `index.html` for the Android WebView.
- Filenames are kebab-case and name the **subject** of the picture (`board-games.jpg`), not the activity that happens to use it.
- Activities store an image **key**, never a URL — the bundler hashes asset URLs on every build, so a URL saved to localStorage would break on the next release. The key → asset mapping lives in `src/assets/images.ts`; unknown keys resolve to `undefined` and the UI falls back to its plain layout.

# Stored data

- Activities live in localStorage under a **versioned key** (`lighthouse.activities.v2`). Bump the version when old records should be thrown away rather than migrated: the app then finds nothing, falls back to `seedActivities()`, and superseded keys listed in `LEGACY_KEYS` are deleted on load. Bumping wipes the user's real data — only do it on request.

# Styling

- **CSS Modules only.** Every component has a `ComponentName.module.css` next to it and imports it as `styles`. No BEM, no global class names, no utility frameworks, no inline `style` except for genuinely dynamic values (e.g. a progress bar width).
- **Class names** inside modules are short and local (`.title`, `.dot`, `.actions`) — the module already provides the namespace, so never prefix them with the block name.
- **Naming** is camelCase (`.progressFill`), so it can be read as `styles.progressFill`.
- **Sharing styles** happens through `composes: … from "…"`, not by repeating declarations. Cross-component styles live in `src/styles/`: `Button.module.css` (all controls), `status.module.css` (the traffic-light state modifiers).
- **Globals** are limited to `src/styles/global.css`: the reset, `body`, and the `[data-nav]:focus` ring — `[data-nav]` is a navigation contract shared by all components, so it stays global. It is imported once, in `main.tsx`.
- **Design tokens** live in `src/styles/tokens.css` and are the only place a literal colour, spacing, radius, font or duration may appear. Everything else references `var(--…)`. The palette is sampled from the illustrations in `/assets` — warm retro-flat: cream paper, mustard, forest green, terracotta, deep navy.
- **Status colours** are passed down as `--color-status`, set by a modifier class from `status.module.css` on the component root. Parts (dots, progress fills) just read that variable and never know which status they are showing.
- **JS must not select by class name** — CSS Modules hashes them. Use `data-*` attributes (`[data-nav]`, `[data-card-id]`) for anything the code needs to find.
