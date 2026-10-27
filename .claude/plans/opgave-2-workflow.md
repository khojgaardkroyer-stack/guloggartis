# Opgave 2: workflow log

Notes from the implementer for the PR's workflow note. The user edits this into the PR description.

## Stage 1: tokens

### Figma tool calls that worked

1. `create_session` with the fileKey `TlehhRhTUyA8APHgZ7VGs6`. Every later call passes its `sessionId`.
2. `get_variable_defs` on concrete frames, not pages:
   - Colour: `6121:234920` (slide 1) and `6128:1155` (slide 2) gave the brand colours.
   - Typography: `571:31508`, `572:34991`, `572:35108` and `7837:24286` (the four "Typography" frames) gave every text
     style and its size and line-height variables.
3. `get_metadata` on each page id to find the component sets, then `get_variable_defs` on them: buttons `6268:942`,
   footer `3362:40694` and `994:20204`, modal `6557:2830` and its overlay `7451:7908`, cards `242:10722` and
   `6079:232222`, tags `6206:96803`, pills `6206:96759`, callouts `6206:142526`, toasts `7368:4591`, dividers
   `6188:488488`, navbar `908:41965`. This is how the role tokens (`color/button/*`, `color/state/hover/*`,
   `color/border/*`, `radius/control/*`) turned up.
4. `search_design_system` with `variable` queries (yellow, neutral, radius, spacing, red) and a `style` query
   (shadow). It returns names only, no values, but it showed that `color/brand/yellow` and the `card-shadow` effect
   style exist even though no documentation frame uses them.
5. A read-only `use_figma` script (after loading the `figma-use` skill) that walks the local variable collections and
   resolves values and aliases for the colour, radius, spacing and text variables, and reads the `card-shadow`
   effect. This gave the values that `get_variable_defs` could not: `color/brand/yellow`, the full neutral and
   palette ramps (needed for the nearest-colour mapping of the canvas), every `radius/*`, and the shadow.
6. `get_design_context` on the desktop footer `994:20204` (after loading the `figma-design-to-code` skill), to see
   how the social icons are built (20px icon + `spacing/2-5` padding = 40px) and which tokens the footer uses.

### What didn't work, or needed care

- `get_variable_defs` on a page id answers "nothing selected" (known from planning); a frame id works.
- `get_variable_defs` only returns variables that the node actually uses, so a variable that exists but sits on no
  documentation frame (eg. `color/brand/yellow`) never shows up that way. `search_design_system` finds the name; the
  Plugin API script finds the value.
- `get_metadata` on the Buttons page is too large for one response (93k characters). It was saved to a file and
  filtered with PowerShell for the top-level sections.
- The footer's generated code has a fallback mismatch: `text-[length:var(--text\/text-sm\/font-size,16px)]` names
  `text-sm` (14) with a 16px fallback. The variable is the source of truth, not the fallback.
- The manual's buttons use DM Sans Medium (500), which `index.html` does not load. Not fixed: adding a weight is out
  of scope, so buttons map to SemiBold (listed in `docs/design-tokens.md`).
- Tailwind v4 normally only emits the CSS variables that a class uses. The canvas will read colours with
  `getComputedStyle`, so the theme block is `@theme static` to emit all of them.

### Decisions made by hand

- Nearest colours for the canvas were picked by RGB distance against every colour variable in the file (a small
  script in the scratchpad, not in the repo). One exception: the envelope seal `#ef4444` maps to
  `palette/red/700`, although `palette/orange/700` is numerically nearer, because orange is already the cone's
  colour. Flagged for the user.
- The page yellow follows the plan: the manual's brand yellow `#feef7b`, which is paler than today's `#F3C91D`.
  The numerically nearest yellows are listed for the user.
- Sizes 28px and 36px have no token; both sit exactly between two tokens. 28 → 32 (bigger tap target), 36 → 40
  (matches the Figma footer's social icons).

## Token check (between the stages)

- The user compared `docs/design-tokens.md` with Figma and approved every row and substitution except the yellow.
- Yellow: the user chose exactly `#e8bb3e`, which is not a Figma variable (nearest: `color/foundation/palette/yellow/700`
  `#e8b53e`). It went into the theme as `--color-page-background` with a "NOT from Figma" comment, and is marked
  "Not from Figma" in the table. It needs the product owner's OK; the PR must say so. `--color-brand-yellow` was
  removed because nothing else used it.

## Stage 2: UI

### Figma tool calls that worked

1. `create_session` again for the stage (read-only work), then `get_design_context` after loading the
   `figma-design-to-code` skill through `get_figma_skill` (`skill://figma/figma-design-to-code/SKILL.md`).
2. `get_design_context` on single component variants, not on component sets or sections:
   - Modal `6557:2830`: header `Headline/2XL - Bold`, close button `button-icon` = `color/button/secondary/background`,
     `spacing/2` padding, 16px icon, `radius/control/pill`. The FAQ drawer's header and close button follow it.
   - Buttons: `get_metadata` on the set `6268:942` lists every variant by name (`Size=L, Variant=Secondary, ...`); then
     `get_design_context` on `6268:1089` (L) and `6268:1047` (M). Size L = `spacing/5` × `spacing/2-5` padding,
     `text-lg`, 8px icon gap, 32px icons. "Kom i gang" and the FAQ button use it.
   - Footer `994:20204`: column titles `Body/Base - Semibold`, links 16px regular underlined in `color/text/secondary`
     with `spacing/1` between them, address in `text/text-sm`.
   - Cards `242:10722`: these are product cards (image, price, labels), not content cards, so the section cards stay
     built from tokens.
3. `get_design_context` on the Dividers section `6188:488488` only returned sparse metadata; the linear divider
   `114:16785` is an SVG line with no colour variable in the output, so the FAQ list keeps
   `color/border/divider` from stage 1.

### What the AI got wrong, or needed care

- The generated code is a reference, not code to paste: every value is an arbitrary class with a fallback
  (`px-[var(--spacing\/5,20px)]`). Each was translated by hand to the theme's class (`px-5`).
- Tailwind v4 resolves `p-2.5` with its own `--spacing` multiplier, not with the theme token `--spacing-2-5`. Same
  pixels, but not the token. The classes are written `p-2-5`, `py-2-5`, `gap-1-5`, and the built CSS was checked
  (`.py-2-5{padding-block:var(--spacing-2-5)}`).
- The modal and footer code use `font-medium` (`Button/* - Medium`); DM Sans 500 isn't loaded, so SemiBold as decided
  at the token check.
- The footer fallback mismatch from stage 1 again (`text-sm` with a 16px fallback). The variable wins: address in 14px.
- A test that read `src/index.css?raw` to check the palette's variable names returned an empty string under Vitest
  (CSS is stubbed in tests) and `node:fs` has no types in this project, so that check was dropped. The palette test
  covers reading and the fallback.

### Decisions made by hand

- Canvas colours: `src/game/palette.ts` maps each canvas role (ink, cardboard, cone, shop, ...) to a theme variable.
  `GGame.tsx` reads them once on mount with `getComputedStyle(document.documentElement)`; a missing variable falls
  back to `black` so the canvas never draws invisibly.
- The game score lost `font-mono` (no monospace style in the manual); `tabular-nums` keeps the digits steady.
- The drawer close button went from 40 to 32 px, as the Figma modal's close button.
- Section icons: handshake, arrow-U-up-left (return) and magnifying glass from Phosphor. The FAQ "+/×" is one
  `PiPlus` that rotates 45° when open, as before with the text "+".
- The table's "Used for" columns were updated to what stage 2 actually uses; no token was added or changed.
