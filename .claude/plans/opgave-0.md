# Opgave 0: Opvarmning, oprydning og det rigtige logo

## Goal
A clean repo, a deploy that rejects code with lint errors, and a mini-game player that uses Gul&Gratis' real logo
(`src/assets/gg-narrow.svg`) instead of `src/assets/g-player.png`.

## Decisions
- **Wheels:** remove `numpy-2.5.4-…whl` and `potracer-0.0.4-….whl` from the repo with `git rm`, and add `*.whl` to
  `.gitignore`. Reason: SPEC (Besluttet).
- **Workflow:** add `bun run lint` to `.github/workflows/deploy.yml`, before the existing `bun run test` and
  `bun run build`, so the order is install → lint → test → build. A lint error then fails the build job, and
  `deploy` (which `needs: build`) does not run. Reason: SPEC; test was added by Opgave 1.
- **Player is one G**, not both. Reason: the user's choice; it keeps gameplay closest to today.
- **New asset `src/assets/g-player.svg`:** the exact `path` data from `gg-narrow.svg`, unchanged, with
  `viewBox="0 0 30 30"`, `width="30"`, `height="30"`. That shows only the left G. The shape is not redrawn or traced.
  Reason: SPEC says to crop the `viewBox` and keep the shape.
- **Colour:** fill `#F3C91D` (Gul&Gratis yellow) with a dark outline `stroke="#2d2d2d"`, about 1 px
  (`stroke-width="1"`, `stroke-linejoin="round"`), on the same path. Reason: the user wants the brand yellow; yellow
  on the white board is about 1.6:1 contrast, and an outline makes it clear without changing the shape. The outline may
  reach slightly past the 30 × 30 box; if it gets clipped, pad the `viewBox` by half the stroke width on every side
  (eg. `-0.5 -0.5 31 31`) and keep `width`/`height` matching that box, so the G stays square. Opgave 2 moves the colours
  onto tokens later.
- **Player box: 32 × 32** (`PLAYER_W = 32`, `PLAYER_H = 32` in `src/game/engine.ts`, was 30 × 35). Reason: the
  user's choice, between keeping today's width and today's height. Expected effect, from the numbers: a grounded
  player's padded top is y = 101, so a high envelope (bottom y = 84) still flies over, and a low envelope (bottom
  y = 116) must still be jumped. The hitbox `pad = 5` and the cone inset stay unless playing shows the game is unfair.
- **Carried parcel stays centred** over the player: in `src/game/draw.ts` the parcel's x offset becomes
  `(PLAYER_W - 16) / 2` (was a hard-coded `7` for width 30). Reason: otherwise it sits 1 px off-centre.
- **Delete `src/assets/g-player.png`**, and import the new SVG in `src/components/GGame.tsx` instead.
- **Sharpness:** the SVG is drawn with `drawImage` at the canvas scale. It must be sharp in normal view and fullscreen
  in Chrome, Safari and Firefox. Firefox needs explicit `width`/`height` on the `<svg>` (done above). If it looks
  blurry when scaled up in any browser, rasterise it once per canvas scale (draw the SVG onto an offscreen canvas at
  `PLAYER_W * scale` pixels and draw that), instead of changing the asset.
- **Watermark stays:** the background watermark `src/assets/gg-logo.svg` is not changed. Reason: the user's choice.
- **Tests:** the existing engine tests use `PLAYER_W`/`PLAYER_H` and must pass with 32 × 32 unchanged. No new tests
  are required; if a test has to change, explain why in the commit.

## Steps
1. `git rm` both `.whl` files; add `*.whl` to `.gitignore`.
2. Add a `- run: bun run lint` step to `.github/workflows/deploy.yml` right after `bun install --frozen-lockfile`.
3. Create `src/assets/g-player.svg` as described above.
4. In `src/components/GGame.tsx`, import `../assets/g-player.svg` instead of `../assets/g-player.png`; delete
   `src/assets/g-player.png`.
5. In `src/game/engine.ts` set `PLAYER_W = 32`, `PLAYER_H = 32`.
6. In `src/game/draw.ts` centre the carried parcel with `(PLAYER_W - 16) / 2`.
7. Check sharpness at fullscreen size; add the offscreen rasterising only if needed.
8. Run `bun run lint`, `bun run test`, `bun run build`.

## Tests
- `bun run test`: the existing engine tests (jump lands, each obstacle ends the game, high envelope flies over a
  grounded player, `minScore`, win) pass with the new box. Together they confirm the game is still fair and winnable.

## Done when
- No `.whl` file is tracked → `git ls-files '*.whl'` prints nothing.
- A push with a lint error fails the workflow and nothing is deployed → checked by reading `deploy.yml`: lint runs in
  the `build` job and `deploy` needs `build`. A live test push with a deliberate lint error is left to the user.
- The player is one G from the narrow logo, sharp in normal view and fullscreen in Chrome, Safari and Firefox →
  checked by the user in the three browsers.
- A full game can still be won, and high envelopes still fly over a grounded player → engine tests, plus the user
  plays a few rounds including a full run to the parcel shop.

## Out of scope
- Changing the background watermark.
- Design tokens or other colours (Opgave 2).
- Any other gameplay change: hitbox pad, speeds, obstacles.
