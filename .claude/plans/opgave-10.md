# Opgave 10: 2D og 3D som hver sin spiltype

## Goal
Den besøgende vælger selv, om spillet skal køre i 2D eller 3D, i stedet for at det skifter til 3D efter 200 meter.
2D er 2D hele løbet; 3D er 3D fra 0 m med tre baner, styring og varevogne og tårne. Begge vindes ved `WIN_SCORE`
(2000), og hver har sin egen rekord.

## Decisions
- **No switch at 200 m.** Remove the 2D→3D switch during a run: `SWITCH_METERS`, `QUIET_FROM_METERS`,
  `QUIET_UNTIL_METERS`, `quietForSwitch` and the `quiet` window in the engine go, unless something else still
  needs them (then keep only what is used). A 2D run never calls `enterLanes`. Reason: SPEC Besluttet.
- **Mode is part of a run.** A run is started with a mode, `'2d' | '3d'`. A 3D run is in lane mode
  (`lanes: true`, middle lane) from 0 m, so lane-mode obstacles (vans and towers) can spawn from the start, exactly
  as they do today after the switch. Put this in the engine (eg. `startGame(mode)` or `startGame()` plus
  `enterLanes`) so it is testable without React. Obstacle unlocks by score (`minScore`) are unchanged.
- **3D intro:** a 3D run starts with the existing camera swing (`SWING_SECONDS` ≈ 1.5 s, side-on to behind) while
  the G stands still; then the run starts. Reuse the existing swing drawing; the swing's slow motion (`SLOWMO_MIN`,
  `swingTimeScale`) is no longer needed because the game isn't running during it. Reason: the user's choice.
- **Loading 3D:** start loading and building the 3D scene in the background as soon as the game's start screen is
  shown (`scene3d.prepare()` when `GGame` mounts or becomes visible, not on the first run). Never in the front
  page's first load: the `scene` chunk stays a lazy `import()`. If the visitor presses 3D before the scene is ready,
  that button shows "Henter 3D …" and is busy (`aria-busy`, not clickable twice), and the 3D run starts by itself
  as soon as the scene is ready. Reason: the user's choice.
- **Start screen buttons under the board:** two pill buttons under the canvas (above the help text), "2D · HI 123"
  and "3D · HI 45" (each with its own record, no zero padding on the button). Pressing one starts a run in that mode
  at once. On the board, instead of "Tryk for at starte", the message is "Vælg 2D eller 3D nedenfor". At the start
  screen, tapping the board or pressing Space/↑ on it does nothing. After a button press, focus moves to the canvas
  so Space/↑ jumps and ←/→ steers. Reason: the user's choice; SPEC says the buttons replace "Tryk for at starte".
- **After a run** (lost or won): the board message stays as today ("Av! Tryk for at prøve igen" / the win
  message), and one tap on the board or Space/↑ starts a new run in the same mode. Under the board there is then
  one button, "Skift til 3D" (after a 2D run) or "Skift til 2D" (after a 3D run), which starts a run in the other
  mode at once. The 3D-specific "Skift til 3D" button follows the same disabled and loading rules as the 3D
  start button. Reason: SPEC and the user's choice.
- **During a run** no mode buttons are shown under the board (only the help text).
- **3D unavailable:** if there is no WebGL, or the visitor has "reducer bevægelse" on, the 3D button (and "Skift
  til 3D") is disabled with a short reason shown next to/under it: "3D virker ikke i din browser." (no WebGL) or
  "3D er slået fra, fordi du har valgt mindre bevægelse." (reduced motion). 2D always works. If the WebGL context
  is lost during a 3D run, the run ends as lost ("over"), 3D is disabled from then on with "3D virker ikke i din
  browser.", and "Skift til 2D" is offered. Reason: SPEC; a lane run can't continue in the 2D drawing.
- **Records:** two keys in `localStorage`, `ggame-highscore-2d` and `ggame-highscore-3d`, read and written with the
  existing try/catch style. On first read, if `ggame-highscore-2d` is missing and the old `ggame-highscore` exists,
  its value becomes the 2D record (copy it over; leave the old key alone). The 3D record starts at 0. Reason: the
  user's choice, so nobody loses their record.
- **Score header:** during and after a run it shows the mode first: "2D HI 00123 00045" (same zero-padded format as
  today). On the start screen, before any run, it shows the 2D record as "2D HI 00123 00000".
- **Help text under the board:** keep the two existing texts in `GGame.tsx` unchanged and pick them by mode instead
  of by lane mode: a 2D run and the start screen show "Hop med mellemrum, pil op eller tryk. Vind ved 2000 m!"; a
  3D run (including its intro swing and its end screen) shows "Hop med mellemrum, pil op eller W. Skift bane med
  pilene, A/D, swipe eller tryk i siderne."
- **Everything else is unchanged:** fullscreen (the buttons are part of the game card, so they show in fullscreen
  too), keyboard, touch, the foldable G, the 404 page, the delivery ending in both modes.
- Only theme tokens and standard Tailwind utilities; no `-[#...]` colours. No new dependencies.

## Steps
1. `src/game/engine.ts` (and `src/game/view3d.ts`): add the run mode, start 3D runs in lane mode, and remove the
   switch and the quiet window as described.
2. Tests (see Tests).
3. `src/components/GGame.tsx` and `src/components/useScene3D.ts`: mode state, the buttons under the board, the
   "Skift til …" button, the 3D intro swing, prepare on mount/visible, loading and disabled states, lost context,
   the two records with the migration, the header and help texts.
4. Check that `FoldableGame` and `NotFoundPage` still work unchanged.
5. Run `bun run lint`, `bun run build` and `bun run test`. Check that `grep -rn -- '-\[#' src` finds nothing.
   Record the initial JS chunk size from `bun run build` (`dist/assets/index-*.js`) for the PR. Before this task it
   is 342.34 kB (gzip 111.40 kB); the lazy `scene-*.js` chunk is 607.45 kB (gzip 157.27 kB) and must stay a
   separate chunk. This project uses Bun; the `npm run` scripts in SPEC map to `bun run <script>`. Don't create
   `package-lock.json`. End commit messages with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Tests
In the existing engine tests (`src/game/*.test.ts`, Vitest):
- A 2D run never goes into lane mode, also past 200 m and up to the win.
- A 3D run is in lane mode from its first step, in the middle lane, and lane-mode obstacles can spawn from 0 m.
- Both modes can reach `WIN_SCORE` and end in `won` via `delivering`.
- No spawn pause around 200 m any more (the old quiet window is gone).
- The record helpers (pure functions, eg. in a small module): reading a mode's record, writing it only when higher,
  and the one-time migration of `ggame-highscore` to the 2D record; use a fake storage object, and a storage that
  throws.
Remove or rewrite tests that only covered the switch, the quiet window or the swing's slow motion.

## Done when
- A whole run from 0 to `WIN_SCORE` works in both modes on desktop and phone, with no switch at 200 m. Check: the
  engine tests; the user plays both modes in `bun run dev` and on a phone.
- The 2D and 3D records are saved and shown separately. Check: the record tests; the user.
- Without WebGL or with "reducer bevægelse", the 3D button is disabled with an explanation, and 2D can be played.
  Check: the user with the OS setting for reduced motion; the reviewer reads the code path for no WebGL.
- The front page's first JavaScript load is about as large as before (before: 342.34 kB / gzip 111.40 kB; after:
  from the build). Check: build output in the PR.
- `bun run lint`, `bun run build` and `bun run test` pass.

## Out of scope
- A third "classic" mode that switches at 200 m.
- A different win score per mode.
- New obstacles, new 3D graphics or changes to the game's rules beyond starting in lane mode.
- Remembering the last chosen mode across visits.
- Changes to the quiz, the walkthrough, the footer or the page layout.
