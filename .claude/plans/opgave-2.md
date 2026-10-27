# Opgave 2: Følg Gul&Gratis' designmanual med Figma i Claude Code

## Goal
The SPA looks like part of guloggratis.dk instead of its own thing. Design tokens (colours, typography, spacing,
radius, shadows) come from Gul&Gratis' design manual in Figma into the Tailwind theme, under the same names as in
Figma. All UI in the SPA is then updated to the manual. The team also learns how to give an AI tool a design system to
work from instead of letting it guess; the PR's workflow note is as important as the code.

## Decisions
- **Source of truth:** the Figma file "Gul&Gratis – Design System",
  https://www.figma.com/design/TlehhRhTUyA8APHgZ7VGs6/Gul-Gratis---Design-System?node-id=566-34751
  (fileKey `TlehhRhTUyA8APHgZ7VGs6`). Relevant pages: `🅰️ Typography` (566:34845), `🔰 Color` (566:34759),
  `🧩 Icons - Phosphor` (6025:142295), and the component pages `Buttons ✅` (2459:84615), `Navbars & Footers ✅`
  (6026:96991), `Modals ✅` (6069:150229), `Cards ✅` (6069:323513), `Tags & Labels & Pills ✅` (2438:84309),
  `Toasts & Callouts ✅` (6069:161814), `Dividers ✅` (6088:76558).
- **Figma access:** through the Figma MCP server connected in claude.ai (the `mcp__claude_ai_Figma__*` tools). Start
  with `create_session` for the fileKey. `get_variable_defs` works on a concrete frame id (eg. 572:35108 or
  6121:234920), not on a page id; if it answers "nothing selected", try a child frame, and if it still fails, stop and
  ask the user to select the layer in Figma. If Figma limits usage on the user's seat, stop and report it; don't work
  around it. Reason: SPEC.
- **Token names:** the Figma variable path with `/` replaced by `-`, where Tailwind's namespace supplies the first
  segment. Examples: `color/text/primary` → `--color-text-primary` (class `text-text-primary`);
  `color/brand/gray-dark` → `--color-brand-gray-dark`; `text/text-base/font-size` → `--text-base`, and
  `text/text-base/line-height` → `--text-base--line-height`. Spacing, radius and shadow variables follow the same
  rule into `--spacing-*`, `--radius-*`, `--shadow-*`. Every token has a comment with its exact Figma path. Reason:
  the user's choice; names stay traceable 1:1 and the classes read naturally.
- **Only the tokens the SPA uses** go into `@theme` in `src/index.css`. Reason: the user's choice; a small theme that
  can be checked against Figma line by line.
- **Every value comes from a named variable or style in Figma**, copied exactly. Never a value guessed, rounded or
  read off a screenshot. If the manual has no token for something the page needs, use the nearest token and list that
  mapping in the token table for the user to approve; never invent a colour or size.
- **Typography:** the manual uses DM Sans (Regular 400, SemiBold 600, Bold 700), which is already loaded from Google
  Fonts in `index.html`. No new font. The styles (eg. `Display/3XL - Bold`, `Headline/2XL - Regular`,
  `Body/Base - Regular`) map to Tailwind's `text-*` size tokens plus `font-*` weights.
- **Yellow:** the page background today is `#F3C91D`. The manual's palette has `color/foundation/palette/yellow/500`
  `#feef7b`, and may have a brand yellow. Use the manual's brand yellow if there is one, otherwise the nearest yellow
  token, and call out the change in the token table. The user decides at the token check.
- **Token table:** `docs/design-tokens.md` holds a table with one row per token: Tailwind token, value, exact Figma
  variable or style name, and where it's used. The PR copies or links it. Reason: the user's choice; it stays as a
  reference for later tasks.
- **Canvas colours follow the manual too:** `src/game/draw.ts` reads its colours from the theme's CSS custom properties
  (`getComputedStyle(document.documentElement).getPropertyValue('--color-…')`), read once when the game mounts and
  passed into drawing, not per frame. Colours with no matching token get the nearest token, eg. the cardboard brown
  `#c8955c` and the cone orange `#f97316`. Every canvas colour mapping is a row in the token table, and the user
  approves it there. Reason: the user's choice.
- **Icons: Phosphor** through `react-icons/pi` (already a dependency; no new one). It replaces emojis used as icons in
  the UI: the "Kom i gang" button, the section icons (`section.emoji` in `src/content.ts` and `TextSection`), the FAQ
  button and FAQ +/× controls, the fullscreen toggle, and the footer's social icons (`react-icons/fa6` → Phosphor's
  `*Logo` icons). The 📦 in the game's win message stays: it is text, not an icon. Reason: the user's choice; SPEC
  says to use the manual's icon set.
- **Components:** where the manual has a component (button, footer, modal/drawer, card, pill, divider), build ours to
  match it with `get_design_context` on that component. Where it doesn't, build from tokens.
- **No arbitrary values where a token exists:** no `bg-[#…]`, and no `[…]` size where the manual has a token.
  Measurements of the game itself (`aspect-[360/150]`, the board's max width) are fine. `grep -rn -- '-\[#' src`
  must print nothing.
- **Logos stay as they are:** `gul-og-gratis-logo.png`, the watermark `gg-logo.svg`, and the game player
  `g-player.svg` from Opgave 0 (if Opgave 0 is merged first; otherwise the current player). Don't recolour them.
- **Two stages with a user check between:**
  1. Tokens: `@theme`, `docs/design-tokens.md`, including the canvas-colour and nearest-token mappings. Then stop.
  2. After the user has compared the table with Figma and approved it: update all UI and the canvas colours.
  Reason: the user's chosen workflow (tokens first, user checks, then UI).
- **Workflow note:** the implementer keeps a log in `.claude/plans/opgave-2-workflow.md`: which Figma tool calls and
  prompts worked, what the AI got wrong, and what was fixed by hand. The user edits it into the PR's workflow note.
- **Screenshots:** before/after on desktop and phone are taken by the user. "Before" comes from the live site or
  `main`, before this branch is merged.

## Steps
Stage 1: tokens
1. `create_session` for the Figma file. Read the variables and styles on the Color and Typography pages, and the
   spacing, radius and shadow variables used by the components listed above (`get_variable_defs`, and
   `get_design_context` on component nodes).
2. List every colour, font size, weight, spacing, radius and shadow the SPA uses today: `src/App.tsx`,
   `src/components/*.tsx`, `src/game/draw.ts`.
3. Map each one to a Figma token, either exact or nearest. Add the tokens to `@theme` in `src/index.css` with the
   Figma path as a comment.
4. Write `docs/design-tokens.md`: the token table, then a separate section listing every nearest-token substitution
   (old value → token), including all canvas colours and the yellow background.
5. Start `.claude/plans/opgave-2-workflow.md`. Commit. Stop and report the table for the user's check.

Stage 2: UI (only after the user has approved the token table)
6. Update `src/App.tsx`, `TextSection`, `FaqDrawer`, `Footer` and the frame and score display in `GGame.tsx` to the
   manual's components and tokens: headings, body text, links, buttons, the FAQ drawer, the footer, the game frame.
7. Replace icon emojis and `react-icons/fa6`/`md` icons with Phosphor (`react-icons/pi`). Remove the `emoji` field
   from `src/content.ts` if nothing uses it any more, and map each section to a Phosphor icon instead.
8. `src/game/draw.ts`: take a colour palette object read from the CSS variables, created in `GGame.tsx` when the game
   mounts.
9. Remove every `-[#` and every arbitrary size that has a token. Check with `grep -rn -- '-\[#' src`.
10. Finish the workflow log. Run `bun run lint`, `bun run test`, `bun run build`.

## Tests
- No new logic to test. The engine tests must still pass. If the colour palette for `draw.ts` gets a helper with
  logic, eg. a fallback when a variable is missing, add a small test for it.

## Done when
- `grep -rn -- '-\[#' src` finds nothing → run it.
- Each value in `@theme` comes from a named Figma variable or style → checked by the user against
  `docs/design-tokens.md` at the stage-1 check, and by review.
- The PR has before/after screenshots on desktop and phone → user.
- The PR has a table pairing each theme token with its Figma style → `docs/design-tokens.md`, linked or copied.
- The PR has the workflow note → user, from `.claude/plans/opgave-2-workflow.md`.
- The page works at 375 px and on desktop → user.
- `bun run lint`, `bun run test`, `bun run build` pass.

## Out of scope
- New pages, routes or features.
- Changing logos (including the game player) or the game's rules.
- Tokens the SPA doesn't use.
- Adding fonts or dependencies.
