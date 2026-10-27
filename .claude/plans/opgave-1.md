# Opgave 1: Tests, og del spillets logik op fra tegningen

## Goal
The game's rules can be tested without a browser, and the drawing can be swapped out later (Opgave 4 builds on this).
Today `src/components/GGame.tsx` mixes the rules (gravity, jump, spawning, collisions, score, the delivery ending),
the canvas drawing and the React UI. Move the rules into plain TypeScript with no React and no canvas, make drawing a
function of state + context, and keep the game looking and playing exactly as it does today. This is a refactor, not a
redesign.

## Decisions
- **`step` is pure:** `step(state, dtSeconds, input, rng = Math.random) => GameState` returns a new state and never
  mutates its argument (copy the obstacles array and the obstacle objects it changes). Reason: easy before/after tests;
  the state is tiny, so copying per frame costs nothing.
- **Randomness is injected:** every random choice (obstacle template, gap to next obstacle) uses the `rng` parameter.
  Tests pass a deterministic `rng`. Reason: predictable tests without mocking globals.
- **The engine owns the status:** `GameState.status` is `'ready' | 'running' | 'delivering' | 'over' | 'won'`, and
  `step` moves it between `running → over`, `running → delivering` and `delivering → won`. React reads it after each
  step and mirrors it into React state only when it changes. Reason: collisions and winning are testable directly.
- **Input:** `input` is `{ jump: boolean }`. `step` only applies a jump when status is `running` and the player is on
  the ground (same check as today's `jump()`). Starting a game is not done by `step`: the engine exports
  `newGame()` (status `'ready'`) and `startGame()` (a fresh state with status `'running'`). On a tap/key when not
  running and not delivering, the component calls `startGame()` and then applies a jump on the next step, so the first
  tap both starts and jumps, as today.
- **Files:** three files.
  - `src/game/engine.ts`: all game constants (`WIDTH`, `HEIGHT`, `GROUND_Y`, `PLAYER_*`, `GRAVITY`, `JUMP_VELOCITY`,
    speeds, `WIN_SCORE`, `SHOP_*`, `WALK_SPEED`, `OBSTACLES` with `minScore`), the types (`GameState`, `Obstacle`,
    `ObstacleKind`, `Status`, `GameInput`), `newGame`, `startGame`, `step`, and small exported helpers
    (`randomObstacle(score, rng)`, `collides(state)` or similar, `isOnGround(state)`).
  - `src/game/draw.ts`: `drawGame(ctx, state, playerImg)` plus the private `drawParcel`, `drawObstacle`, `drawShop`.
    It only draws: no state changes, no React. The caller sets up the canvas size and transform (or `drawGame` does,
    given the canvas; implementer's choice, as long as nothing visible changes).
  - `src/game/engine.test.ts`: the tests.
- **Stays in `GGame.tsx`:** the animation loop (`requestAnimationFrame`), the `dt` clamp to 0.05 s, the backing-store
  sizing for sharp fullscreen, loading the player image, high score read/save in `localStorage` (key unchanged:
  `ggame-highscore`), fullscreen handling, and all JSX/markup and copy (unchanged). Reason: those are timing,
  storage and UI, not game rules.
- **Behaviour is identical:** every number, formula and order of operations moves over unchanged (gravity before
  movement, score `floor(distance / 20)` capped at `WIN_SCORE`, spawn gap formula, hitbox `pad = 5` and cone inset 3,
  shop braking `max(min(speed, remaining*3), 60)`, walking at `WALK_SPEED`, `celebrateIn = 0.6`). The high score is
  updated at the same moments as today (on `over`, and when `delivering` starts).
- **Vitest:** add `vitest` as a dev dependency and a `"test": "vitest run"` script. Tests run in the default node
  environment (no jsdom). Import `describe/it/expect` from `vitest` explicitly so no global types are needed.
- **Workflow:** add a `bun run test` step to `.github/workflows/deploy.yml` before `bun run build`. Do not add lint
  there; that belongs to Opgave 0.

## Steps
1. `bun add -d vitest`; add `"test": "vitest run"` to `package.json`.
2. Create `src/game/engine.ts`: move constants, types, `OBSTACLES`, `randomObstacle` (now taking `rng`), `newGame`,
   and add `startGame` and `step`. Port the body of the current `tick` (everything except `draw()`, `setScore`,
   `setStatus`, `setHighScore`, `requestAnimationFrame`) into `step`, rewritten to return a new state. Apply
   `input.jump` at the start of `step` using today's on-ground check.
3. Create `src/game/draw.ts`: move `drawParcel`, `drawObstacle`, `drawShop` and the body of `draw()` (ground, dashes,
   shop, obstacles, player, carried/delivered parcel and tick mark) into `drawGame`.
4. Rewrite `src/components/GGame.tsx` to use them: game state in a ref, a pending-jump flag set by input, the loop
   calls `step` then `drawGame`, and syncs `score`/`status`/`highScore` React state when they change. Remove all
   physics, spawning and collision code from the component.
5. Write `src/game/engine.test.ts` (see Tests).
6. Add the test step to `.github/workflows/deploy.yml`.
7. Run `npm run lint`, `npm run build`, `npm run test`.

## Tests
In `src/game/engine.test.ts`, with a deterministic `rng` and small fixed `dt` (eg. 1/60) loops:
- A jump from the ground goes up and lands on the ground again (`y` back to `GROUND_Y - PLAYER_H`, `vy` 0).
- For each obstacle kind (`parcel`, `stack`, `row`, `cone`, low `envelope`): placing it overlapping a grounded player
  and stepping ends the game (`status === 'over'`).
- A high envelope (`lift: 44`) passes over a grounded player without ending the game.
- `randomObstacle(score, rng)` never returns a kind below its `minScore` (eg. no `cone` at 49, no `stack` at 99, no
  `row` at 149, no `envelope` at 199), and each kind can appear once its `minScore` is reached.
- Reaching `WIN_SCORE` switches status to `delivering`, and stepping on (with no jumps) ends in `won`.
- `step` does not mutate the state it is given.
- A jump input while in the air does nothing.

## Done when
- The tests cover the list in SPEC.md → checked by reading `engine.test.ts` and `npm run test` passing.
- `GGame.tsx` contains no physics or collision code → checked by reading it (no `GRAVITY`, `vy`, hitbox or spawn
  logic).
- No visible difference from the live site → checked by the user, side by side with
  https://khojgaardkroyer-stack.github.io/guloggartis/ in `npm run dev`, including fullscreen and a full run to the
  parcel shop.
- `npm run lint` and `npm run build` pass.

## Out of scope
- Any change to how the game looks or plays, including the player logo (Opgave 0) and design tokens (Opgave 2).
- Adding lint to the workflow (Opgave 0).
- 3D rendering or a meter counter (Opgave 4).
- Tests of the React component or of drawing.
