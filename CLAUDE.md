# Project conventions

These rules apply across the whole project.

- **Language of the codebase:** All interface/UI text and all code comments must be written in English.
- **Language of conversation:** When talking to the human operator, reply in the language the question was asked in.
- **Media files:** Never add new media files (images, audio, video, etc.) without an explicit request from the user.

# Styling

- **CSS Modules only.** Every component has a `ComponentName.module.css` next to it and imports it as `styles`. No BEM, no global class names, no utility frameworks, no inline `style` except for genuinely dynamic values (e.g. a progress bar width).
- **Class names** inside modules are short and local (`.title`, `.dot`, `.actions`) — the module already provides the namespace, so never prefix them with the block name.
- **Naming** is camelCase (`.progressFill`), so it can be read as `styles.progressFill`.
- **Sharing styles** happens through `composes: … from "…"`, not by repeating declarations. Cross-component styles live in `src/styles/`: `Button.module.css` (all controls), `status.module.css` (the traffic-light state modifiers).
- **Globals** are limited to `src/styles/global.css`: the reset, `body`, and the `[data-nav]:focus` ring — `[data-nav]` is a navigation contract shared by all components, so it stays global. It is imported once, in `main.tsx`.
- **Design tokens** live in `src/styles/tokens.css` and are the only place a literal colour, spacing, radius, font or duration may appear. Everything else references `var(--…)`. The palette is sampled from the illustrations in `/assets` — warm retro-flat: cream paper, mustard, forest green, terracotta, deep navy.
- **Status colours** are passed down as `--color-status`, set by a modifier class from `status.module.css` on the component root. Parts (dots, progress fills) just read that variable and never know which status they are showing.
- **JS must not select by class name** — CSS Modules hashes them. Use `data-*` attributes (`[data-nav]`, `[data-card-id]`) for anything the code needs to find.
