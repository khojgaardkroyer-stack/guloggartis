# Opgave 4: Spillet bliver 3D efter 200 meter

## Goal
Spillet starter i 2D, som det er i dag. Efter 200 meter svinger kameraet om bag G'et, og løbet fortsætter i
3D uden at stoppe. I 3D er der tre baner: nogle forhindringer skal hoppes over, andre skal undgås ved at skifte bane
(piletaster, WASD, swipe eller tryk i siderne). Indtil skiftet er reglerne præcis som i dag. 3D-koden (Three.js)
indlæses først, når der er brug for den, og forsidens første JavaScript-indlæsning bliver ikke tungere.

**Afvigelse fra SPEC.md (godkendt):** Opgave 4's Besluttet siger, at spillets regler ikke ændrer sig, og at kun
tegningen ændrer sig. Brugeren har produktejerens OK til, at 3D får baner og nye forhindringer (2026-10-28). Det
skrives i PR'en. Alt andet i Besluttet gælder stadig.

## Decisions
- **Three.js directly, no `@react-three/fiber`.** Add `three` (current: `^0.186.1`) to `dependencies` and
  `@types/three` to `devDependencies`. Reason: smaller chunk, and it fits the pattern from Opgave 1 (a plain TS
  function draws the state); the game already has its own rAF loop.
- **The 2D rules are untouched; lanes are an engine mode switched on at the 3D switch.** `src/game/engine.ts`
  gets a lane mode (below), but until it is switched on, `step` behaves exactly as today: the existing tests in
  `src/game/engine.test.ts` stay unchanged and must pass, and the 2D game plays exactly as on `main`. Slow motion
  (below) only scales the `dt` passed to `step`. Lane mode is never on while the 2D view is shown.
- **Lane mode in the engine (deviation approved by the product owner):**
  - Three fixed lanes, `LANES = 3`, indices -1 (left), 0 (middle), 1 (right), `LANE_W` world units apart (eg. 40).
    `GameState` gets `lanes: boolean` (false in `newGame`/`startGame`), `lane` (target lane, starts at 0) and
    `laneX` (the G's actual sideways position in lane units, starts at 0). A pure function
    `enterLanes(state)` switches lane mode on; nothing else does.
  - `GameInput` becomes `{ jump: boolean; steer?: -1 | 1 }`. One `steer` = one lane left or right, clamped at the
    outer lanes. `laneX` glides to `lane` at a fixed speed so a lane change takes ~0.15 s (`LANE_CHANGE_SECONDS`).
    Steering works in the air too. Steering is ignored while lane mode is off and while `delivering`.
  - Obstacles get `lane: -1 | 0 | 1 | 'all'`. Everything spawned before lane mode is in lane 0 (the middle), and
    those obstacles stay there after the switch.
  - In lane mode, spawning uses the same timing, gap rule and `minScore` unlocks as today, plus two new
    `ObstacleKind`s that only spawn in lane mode and cannot be jumped over: `van` (a parcel van, eg. w 70, h 120)
    and `tower` (a tower of 5-6 parcels, eg. w 26, h 120). Their height is above the highest jump (~105), so the
    only way past is another lane. `row` spans all three lanes (`lane: 'all'`) and must be jumped. Every other
    kind (`parcel`, `stack`, `cone`, `envelope`) and `van`/`tower` get a random single lane. Pick the mix so van
    and tower together are roughly a third of spawns. Since obstacles keep the existing gap rule and a van/tower
    blocks only one lane, there is always a way past.
  - Collision in lane mode: the existing run-axis and height test (same padding) plus a sideways overlap test
    between the G's band around `laneX` and the obstacle's lane band (with similar padding, so brushing the edge
    of a neighbouring lane mid-change is forgiven a little). `'all'` overlaps every position. With lane mode off,
    `collides` is unchanged.
  - Delivering in lane mode: the shop sits across the middle of the track; when the run reaches `WIN_SCORE` the G
    steers itself back to lane 0 (`lane = 0`, `laneX` glides there) before walking to the door. Steering input is
    ignored from then on.
- **Meter counter: points become meters.** 1 point = 1 meter, the same number with a unit. The score line changes
  from `HI 00042 00123` to `HI 1240 m  123 m` (no zero padding). The invisible widest-case copy that fixes the
  box's width (see the comment in `GGame.tsx`) becomes `HI 0000 m 0000 m`, so the header still never re-wraps.
  The help text under the board becomes `Hop med mellemrum, pil op eller tryk. Vind ved 2000 m!` (still from
  `WIN_SCORE`). From the moment lane mode is on it changes to
  `Hop med mellemrum, pil op eller W. Skift bane med pilene, A/D, swipe eller tryk i siderne.`, and back to the
  2D text on a new run. The card may grow a line on a phone for that; that is fine.
- **Controls:** keyboard on the focused 2D canvas, as today: space, ArrowUp and `w`/`W` jump (in 2D too).
  ArrowLeft/`a`/`A` steers left and ArrowRight/`d`/`D` steers right, only when lane mode is on (otherwise they do
  nothing and are not `preventDefault`ed). Steering is one lane per keydown; ignore `e.repeat` for steering only
  (holding a jump key keeps jumping as before). Touch/mouse on the board: in lane mode, a horizontal swipe of at
  least 30 px (and more horizontal than vertical) steers that way; a tap in the outer 20 % of the board's width on
  the left or right steers that way; a tap in the middle 60 % or an upward swipe jumps. Decide the gesture on
  pointerup (start on pointerdown, with pointer capture), except that a tap in the middle jumps on pointerdown as
  today so jumps don't get slower. With lane mode off, every tap jumps on pointerdown exactly as today. A tap
  that starts a new run (ready/over/won) always just starts it, wherever it lands.
- **Switch constant:** `SWITCH_METERS = 200` as a named, exported constant (in `src/game/view3d.ts`, below).
  The switch starts in the first frame where `score >= SWITCH_METERS` during a run, once per run. Lane mode
  (`enterLanes`) is switched on when the swing ends, so steering and lane spawns start when the camera is behind
  the G; obstacles spawned during the swing are still in lane 0.
- **Swing:** an animated camera move of `SWING_SECONDS = 1.5` seconds, measured in real time (not slowed time).
  No text on the board during the swing.
- **Slow motion during the swing, gliding down and up.** While the camera swings, the `dt` passed to `step` is
  multiplied by a time scale that starts at 1, glides down to `SLOWMO_MIN = 0.3` in the middle of the swing and
  back up to 1 at the end, with a smooth curve (eg. `1 - (1 - 0.3) * sin(π·t)` for t = swing progress 0..1).
  Collisions still count during the swing; jumps still work. Put the curve in a pure function
  `swingTimeScale(t)`.
- **Look of the 3D world: minimal, in white.** The WebGL canvas is transparent, so the card's white shows as sky.
  The track is a long light-grey strip (`--color-surface-gray-light`) with a dark edge line
  (`--color-brand-gray-dark`, as the 2D ground line) and the 2D ground dashes (`--color-foundation-neutral-550`)
  as road stripes that scroll with `state.distance`. Fog fades into white (`--color-surface-white`), so
  obstacles fade in at the horizon instead of popping in at the spawn point (x = `WIDTH`). Only theme colours via
  `src/game/palette.ts`; no new colours. Add a `track: '--color-surface-gray-light'` entry to `PALETTE_VARS`.
- **New obstacles in 3D:** `van` as a simple low-poly parcel van (a cargo box plus a lower cab at the front,
  facing the G, in theme colours: eg. `white`/`shop` body with `ink` windows and wheels), `tower` as 5-6 stacked
  parcels in the parcel look, clearly taller than the jumpable `stack`. Both fit their engine box exactly.
- **Obstacles in 3D:** simple low-poly shapes with the same colours as 2D: parcels as cardboard boxes
  (`cardboard`, a `tape` stripe, `cardboardEdge` edges), `stack` as two boxes, `row` as three boxes in a row along
  the track, `cone` as a cone (`cone`) with a white band and a `coneBase` foot, `envelope` as a thin white box with
  a dark flap line and a red `seal`. The shop is a box in `shop` colour with a dark sign reading `PAKKESHOP`
  (canvas texture, `DM Sans` bold), a dark door and a `shopWindow` window. `MeshLambertMaterial` (or
  `MeshBasicMaterial` where flat is fine), a hemisphere light plus one directional light, no shadow maps.
- **Geometry follows the 2D boxes exactly.** Map game units 1:1 to world units. Game x (along the run) is the
  run axis in 3D, game height is world up (`GROUND_Y - y`), and the third axis is across the track. Each
  obstacle's mesh spans exactly `[o.x, o.x + o.w]` along the run axis and `[o.lift, o.lift + o.h]` in height
  (the cone fits inside the same box), centred on the track. The G's box spans
  `[state.px, state.px + PLAYER_W]` along the run and `[GROUND_Y - state.y - PLAYER_H, GROUND_Y - state.y]` in
  height. Sideways, each obstacle sits in its lane band (`'all'` spans the full track width, which is
  `LANES * LANE_W`) and the G sits at `laneX * LANE_W`, using the same sideways sizes as the engine's collision
  test. What touches in 3D is what collides in the engine. Put this mapping in pure functions in `view3d.ts` so
  it can be tested. Draw lane dividers as faint dashed lines on the track (`groundDash` colour).
- **The G in 3D: extruded, seen from behind.** Extrude the path from `src/assets/g-player.svg` (import it with
  `?raw` inside the 3D module so it lands in the 3D chunk) with `SVGLoader` from `three/addons` (part of the
  `three` package, no extra dependency), with the SVG's own yellow fill and a dark outline/edge colour from the
  SVG. Scale it to `PLAYER_W × PLAYER_H`. At the start of the swing it faces the camera side-on as in 2D; during
  the swing it turns 90° together with the camera, so in 3D it is seen from behind (mirrored), like a figure
  running away from us. A dark flat footprint on the track under the G, the size of its hitbox, helps judge
  jumps and distance (no shadow maps).
- **Camera:** at swing progress 0 the 3D view lines up with the 2D board (side view, same ground line and player
  position, a narrow-FOV perspective camera far away so it looks almost flat). At progress 1 it is a chase
  camera behind and a little above the G, low enough that a high envelope (`lift` 44) is visibly flying over a G
  on the ground, looking down the track so the track up to the spawn point is in view. Interpolate the pose with
  an ease-in-out curve over `SWING_SECONDS`, in a pure function `cameraPose(t)` in `view3d.ts`. The camera
  follows `state.px` (it moves along when the G walks to the shop door).
- **Handover from 2D to 3D:** the WebGL canvas sits exactly over the 2D canvas. When the swing starts, the 3D view
  (at progress 0, matching 2D) fades in over ~200 ms while the 2D canvas is still drawn under it; after that the
  2D canvas is no longer drawn. No abrupt cut.
- **Two canvases, input stays on the 2D canvas.** The 3D canvas is `absolute inset-0`, `pointer-events-none`,
  `aria-hidden`, inside the existing `relative` wrapper. The 2D canvas keeps focus, keyboard, pointer and its
  `aria-label`, so fullscreen, keyboard and touch work the same in 3D. The status messages (`Tryk for at
  starte`, `Av! ...`, `📦 Pakken er afleveret! ...`) are HTML over both canvases, so they work in 3D unchanged.
- **Code layout:**
  - `src/game/view3d.ts`: plain TS, **no `three` import** (so it is in the main chunk and tiny): `SWITCH_METERS`,
    `SWING_SECONDS`, `SLOWMO_MIN`, `swingTimeScale(t)`, `cameraPose(t)` (returns plain numbers), the mapping
    from game boxes to world boxes, and `can3D({ webgl, reducedMotion })`.
  - `src/game/three/scene.ts`: the only module that imports `three`. `createScene(canvas, palette)` returns
    `{ render(state, swing), resize(), dispose() }`, where `swing` is 0..1. It only draws; no game rules.
    Reuse geometries and materials per obstacle kind, and pool meshes (show/hide and reposition per frame)
    instead of creating meshes every frame.
  - `src/components/useScene3D.ts`: a hook GGame uses. It owns prefetching, the dynamic `import()`, creating the
    scene on the 3D canvas, resizing (`ResizeObserver` on the canvas, so fullscreen and rotation work), WebGL
    context loss, and disposing on unmount (eg. when Opgave 8's fold-up unmounts the game).
  - `GGame.tsx`: wires it in: view mode (`2d` / `swing` / `3d`) kept in a ref for the loop and mirrored in state
    only for what React renders, the time scale on `dt`, `enterLanes` at the end of the swing, steering input
    (`pendingSteer` ref, like `pendingJump`), the help text, and which canvas is drawn. Keep `GGame` lean; logic
    goes in the hook, `view3d.ts` and a small pure helper for touch gestures (eg. `src/game/gesture.ts`:
    `classifyGesture({ dx, dy, startX, width })` → `'jump' | 'left' | 'right'`).
- **Lazy loading and prefetch.** `src/game/three/scene.ts` is loaded only with `import()`. Prefetch starts when a
  run starts (status changes to `running`), only if 3D is possible (below), and only once per page load. The
  front page's initial JS must not contain three (no static import of `three` or `three/...` from anything in the
  main chunk).
- **When 3D isn't possible, the game stays 2D the whole time, without prefetching:** if the browser has no WebGL
  (test with a throwaway canvas, `getContext('webgl2') ?? getContext('webgl')`, checked once) or
  `prefers-reduced-motion: reduce` matches (checked when a run starts).
- **Slow network:** if the 3D chunk hasn't loaded when the run passes 200 m, the run stays in 2D and the swing
  starts as soon as it has loaded (if the run is still going). If loading fails, the game stays in 2D for the rest
  of the page visit; no error is shown.
- **WebGL context lost** mid-run: fall back to 2D for the rest of the mount (draw the 2D canvas again). If lane
  mode is already on, the run can't continue in 2D, so it ends as a loss (`status` `over`, high score saved as on
  a loss); otherwise the run goes on in 2D.
- **Losing and new runs:** when you lose in 3D, the frozen 3D scene stays with the `Av! Tryk for at prøve igen`
  message. A new run starts in 2D right away (score 0), as today. Closing the game (Opgave 8) or a new run resets
  the view to 2D.
- **Winning in 3D:** the delivery (shop rolls in, G walks to the door, parcel delivered with the green tick)
  plays in 3D from the chase camera, using the same state fields as 2D (`shopX`, `parcel`, `celebrateIn`). The
  carried parcel sits on top of the G.
- **Performance:** cap the renderer's pixel ratio at `min(devicePixelRatio, 2)`, `antialias: true`, no shadow
  maps, pooled meshes, one render per animation frame from the existing loop (no second rAF loop).
- **Fullscreen:** the 3D canvas follows the 2D canvas's size, so native and CSS fullscreen both work in 3D.

## Steps
1. `bun add three` and `bun add -d @types/three` (keep `bun.lock` in sync; the CI runs
   `bun install --frozen-lockfile`).
1a. `src/game/engine.ts`: lane mode as in Decisions (`LANES`, `LANE_W`, `LANE_CHANGE_SECONDS`, `lanes`/`lane`/
   `laneX` on `GameState`, `lane` on `Obstacle`, `steer` on `GameInput`, `enterLanes`, `van`/`tower`, lane-aware
   spawning, collision and delivery). Behaviour with lane mode off stays exactly the same. Update
   `src/game/draw.ts` only as far as types require (2D never shows lane mode). New tests in
   `src/game/lanes.test.ts`; don't edit the existing tests in `engine.test.ts` except to fix type errors from the
   new fields, if any.
1b. `src/game/gesture.ts` + `src/game/gesture.test.ts`.
2. `src/game/palette.ts`: add `track: '--color-surface-gray-light'` to `PALETTE_VARS`; update
   `src/game/palette.test.ts` if it lists the keys.
3. `src/game/view3d.ts`: constants and pure functions from Decisions (`SWITCH_METERS`, `SWING_SECONDS`,
   `SLOWMO_MIN`, `swingTimeScale`, `cameraPose`, the box mapping, `can3D`).
4. `src/game/view3d.test.ts`: tests listed under Tests.
5. `src/game/three/scene.ts`: `createScene(canvas, palette)` with track, lane dividers, fog, lights, obstacle
   pools (including `van` and `tower`), shop, the
   extruded G (from `../../assets/g-player.svg?raw` via `SVGLoader`), footprint, camera driven by
   `cameraPose(swing)` and the G's rotation driven by `swing`; `resize()` and `dispose()` (geometries, materials,
   textures, renderer).
6. `src/components/useScene3D.ts`: WebGL check, prefetch on run start, dynamic import, scene creation on the 3D
   canvas, `ResizeObserver`, `webglcontextlost` fallback, dispose on unmount.
7. `src/components/GGame.tsx`: the 3D canvas over the 2D one, view mode, swing timing in real time, `dt` scaled by
   `swingTimeScale` during the swing, `enterLanes` when the swing ends, 200 ms fade-in, stop drawing 2D once in
   3D, reset to 2D on a new run and on close; keyboard and touch controls, meter display and help text as in
   Decisions.
8. Run `npm run lint`, `npm run test`, `npm run build`. Check the build output: the main `index-*.js` chunk is
   about the same size as before (baseline below), `three` is in a separate chunk, and
   `grep -l WebGLRenderer dist/assets/index-*.js` finds nothing.
9. In the final report, give the main chunk size before and after (raw and gzip) and the 3D chunk's size.

Baseline from `main` before this task (`npm run build`): `dist/assets/index-D7J3ikC1.js 316.07 kB │ gzip:
102.99 kB`.

## Tests
In `src/game/lanes.test.ts`:
- With lane mode off, `steer` input does nothing and no `van`/`tower` ever spawns (run many steps with a seeded
  `rng`).
- `enterLanes` turns lane mode on with the G in lane 0; obstacles already on the track keep lane 0.
- Steering: one `steer` moves `lane` by one and `laneX` reaches it within `LANE_CHANGE_SECONDS` (+ a frame); it
  clamps at -1 and 1; steering works mid-jump.
- An obstacle in another lane doesn't collide; the same obstacle in the G's lane does.
- A `van` and a `tower` in the G's lane end the run even when the G jumps at the best moment; in another lane they
  don't.
- A `row` (`'all'`) collides in every lane unless jumped.
- In lane mode, spawns include `van`, `tower` and other kinds in all three lanes, and `row` is always `'all'`.
- On reaching `WIN_SCORE` in lane mode, the G returns to lane 0 and the delivery still ends in `won`; steering is
  ignored while delivering.

In `src/game/gesture.test.ts`: a tap in the middle is a jump; a tap in the outer 20 % is left/right; a horizontal
swipe of 30 px+ is left/right whatever the start; an upward swipe is a jump; a short or mostly vertical drag is not
a steer.

In `src/game/view3d.test.ts` (Vitest, no WebGL needed):
- `swingTimeScale`: 1 at t = 0 and t = 1, `SLOWMO_MIN` at t = 0.5, never below `SLOWMO_MIN` or above 1, and
  continuous (no jump between nearby t).
- `cameraPose`: t = 0 gives the side view and t = 1 the chase view; t is clamped to 0..1.
- The box mapping: for each obstacle kind from `OBSTACLES`, the world box's run-axis span and height span equal the
  2D box (`x..x+w`, `lift..lift+h`); the G's box matches `px..px+PLAYER_W` and its height from `y`; a high
  envelope's world box is entirely above a grounded G's world box, and a low envelope's overlaps it; sideways, an
  obstacle in another lane doesn't overlap the G's box and a `'all'` obstacle does, matching `collides`.
- `can3D`: false without WebGL, false with reduced motion, true otherwise.
- Existing engine and palette tests still pass unchanged (engine tests are not edited).

## Done when
- **A full run from 0 to `WIN_SCORE` works on desktop and phone, with the switch at 200 m.** Checked by the user
  in the browser (desktop and 375 px / a real phone): the swing at 200 m, slow motion, play in 3D, delivery at the
  shop, `Pakken er afleveret`. Implementer and reviewer check the code paths.
- **It runs smoothly (no visible stutter) on a mid-range phone.** Checked by the user on a real phone; the
  implementer keeps to the performance decisions (DPR cap, no shadow maps, pooled meshes, single loop).
- **The front page's first JavaScript load is about the same size as before.** Checked from `npm run build`
  output: main chunk before (316.07 kB / 102.99 kB gzip) and after, written in the PR; `three` only in a lazy
  chunk.
- Also from the task's decisions: the switch doesn't stutter (prefetch on run start), no abrupt cut (fade + swing),
  2D the whole time without WebGL or with reduced motion (user checks by toggling reduced motion), fullscreen,
  keyboard, touch and winning work in 3D (user checks), 3D collisions match the engine (tests + user plays).
- Lanes: in 3D the G changes lanes with arrows, A/D, swipe and taps in the outer 20 %; van and tower must be
  avoided, the row must be jumped, other obstacles can be jumped or avoided. Checked by tests and by the user
  playing on desktop and phone.
- `npm run lint`, `npm run test`, `npm run build` pass.

## Out of scope
- Any change to the 2D rules (before the switch) or to existing constants in `engine.ts`.
- Lanes, steering or the new obstacles in 2D.
- Text on the board during the swing.
- Switching back to 2D mid-run or a swing back to 2D on game over.
- New colours or tokens beyond reading existing theme variables.
- Sound, shadow maps, textures beyond the shop sign, or a debug shortcut to start at 200 m.
- Changes to `FoldableGame.tsx` (Opgave 8) beyond what the game needs to keep working inside it.
