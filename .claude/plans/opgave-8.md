# Opgave 8: Spillet folder sig ud fra G'et

## Goal
Spillet gemmer sig som et lille G, spillerens eget logo, og folder sig ud, når den besøgende trykker på det. Det
sker både på forsiden og på 404-siden. Et tryk på G'et folder spillet ud til "Tryk for at starte", og en luk-knap
folder det sammen igen. Hver side starter med G'et.

## Decisions
- **New wrapper `src/components/FoldableGame.tsx`.** It owns the `open` state and the animation. Closed, it renders
  the G button. Open, it renders `<GGame onClose={...} />`. `HomePage` and `NotFoundPage` render `<FoldableGame />`
  instead of `<GGame />`, in the same place and with the same alignment (front page: right-aligned from `sm`, 404:
  centered). Reason: `GGame` is already ~290 lines and shouldn't also own collapsing.
- **`GGame` gets one optional prop, `onClose?: () => void`.** When it is set, a close button (`PiX` from
  `react-icons/pi`, `aria-label`/`title` "Luk spillet") sits right after the fullscreen button. It uses the same
  classes as the fullscreen button (`rounded-control-pill bg-button-secondary-background p-2 ...`, icon `size-4`).
  Without `onClose`, `GGame` looks and behaves exactly as today.
- **Closed state, a large free-standing G:** a `<button type="button">` containing the player logo
  (`src/assets/g-player.svg` as an `<img alt="">`) at `size-16` (64 px), with no background, and next to it the
  text **"Hvorfor er der mon et G?"** as plain text (`text-lg font-semibold`, `text-text-primary`). The whole row
  (G + text) is the one button, with `aria-expanded={false}`, `aria-controls` pointing at the game, and an
  accessible name from its text. It has a visible focus ring (`focus-visible:outline-2
  focus-visible:outline-border-focus`, as the canvas has) and a subtle hover (eg. the G scales up slightly with
  `hover:scale-110 transition`, disabled with `motion-reduce`). No arbitrary values; only theme tokens.
- **Animation: the G grows into the card (FLIP).** On open, measure the G's rect before the switch. After the
  game card has mounted, measure the card's rect. Set the card's `transform` to translate+scale from the card's
  rect to the G's rect, with `transform-origin: top left` and opacity 0. On the next frame, transition to
  `transform: none` and opacity 1 over **400 ms** (`ease-out`). On close, run the reverse: the card shrinks into
  the G's position and fades out over 400 ms, then it unmounts and the G button shows again. Use only
  `transform` and `opacity` so it is smooth on mobile. When the open animation ends, clear the inline `transform`
  and `transition` completely, because a transformed ancestor would break `GGame`'s CSS fullscreen fallback
  (`position: fixed`).
- **Reduced motion:** if `window.matchMedia('(prefers-reduced-motion: reduce)').matches`, open and close switch
  instantly, with no transform and no opacity transition, and close unmounts immediately.
- **The press that opens the game is never a jump.** The game shows "Tryk for at starte" (status `ready`, as
  today). Space activates a button on keyup, and Enter on keydown, so neither reaches the canvas, and the canvas
  doesn't handle Enter. No `e.repeat` guard on the canvas: holding space or ArrowUp must keep jumping as before
  (SPEC: "tastatur ... virker som før").
- **Focus:** on open, focus moves to the game's canvas once it has mounted, with `preventScroll: true` so the page
  doesn't jump. On close, focus returns to the G button.
- **Closing mid-run:** `GGame`'s close handler does three things. If `status === 'running'`, it records the
  current score with the existing `recordHighScore`, as on a loss. It resets the game to `newGame()` with status
  `ready`, which stops the animation loop through the existing `status` effect. Then it calls `onClose()`. So the
  run stops right away, the high score is saved, and since `GGame` unmounts after the close animation, the next
  open is a fresh "Tryk for at starte". If the game was `delivering`, it also stops; the score was already saved
  when the status changed to `delivering`.
- **Closing in fullscreen:** the close button is visible in fullscreen too. Clicking it first leaves fullscreen
  (`document.exitFullscreen()` when native, otherwise `setIsFull(false)`), then runs the close handler. Fullscreen
  is closed before the fold-up animation starts: on the native path, call `setIsFull(false)` before `onClose` too,
  in both the resolve and reject callbacks, rather than relying on the `fullscreenchange` event having fired.
- **Fold-up target is measured at close time.** The close animation measures the card's rect and the G's
  position again when close starts, not the values from opening, so a resize or rotation while the game is open
  (eg. crossing `sm`, which moves the front page's game between centered and right-aligned) still folds into the
  right place. Measure where the G button will be, eg. with a hidden or zero-size placeholder that keeps the G's
  slot in the layout while the game is open, or by computing it from the wrapper's alignment.
- **The card is `inert` while closing.** During the 400 ms close phase the card gets the `inert` attribute, so no
  tap, key or button (canvas, fullscreen, close) can start a run or act on a card that is being transformed.
- **Not remembered:** `open` is plain React state starting at `false`; nothing goes in `localStorage`. The high
  score still uses the existing key `ggame-highscore`.
- **No changes to `src/game/`** (engine, draw, palette).
- **No new tests.** The Grundregler only require tests for Opgave 1, 5 and 6, and this task is UI state and
  animation with no pure logic worth extracting.

## Steps
1. `src/components/GGame.tsx`: add the optional `onClose` prop. Add the close button next to the fullscreen
   button, rendered only when `onClose` is set. Add a `close()` handler: exit fullscreen if active, record the
   high score if `running`, reset `game.current = newGame()`, `setScore(0)`, `setStatus('ready')`, then call
   `onClose`. Give the `<section>` an `id` prop (optional)
   so `aria-controls` can point at it, or forward an id from `FoldableGame`. Nothing else in `GGame` changes.
2. Create `src/components/FoldableGame.tsx`: the `open` state, the G button with its text, the FLIP open/close
   animation, the reduced-motion shortcut, and the focus moves (canvas on open via a ref or by querying the
   card's `canvas`, G button on close).
3. `src/pages/HomePage.tsx`: replace `<GGame />` with `<FoldableGame />` inside the existing
   `relative mt-12 flex justify-center sm:justify-end` wrapper.
4. `src/pages/NotFoundPage.tsx`: replace `<GGame />` with `<FoldableGame />` inside the existing
   `flex justify-center` wrapper.
5. Run `bun run lint`, `bun run build` and `bun run test`. Then check that `grep -rn -- '-\[#' src` finds nothing.

Environment note for this machine: `git` and `bun` aren't on PATH in PowerShell. Prepend
`$env:LOCALAPPDATA\Programs\Git\cmd` and `$env:USERPROFILE\.bun\bin` to `$env:Path`. Use `bun run <script>`
instead of `npm run <script>`, because `npm` isn't installed.

## Tests
No new unit tests, see Decisions. The existing `bun run test` (engine and palette) must still pass.

## Done when
- The front page and `/findes-ikke` show the G with "Hvorfor er der mon et G?" instead of the game, and pressing
  the G unfolds the game to "Tryk for at starte". Check: the user checks both pages in `bun run dev`, and the
  reviewer confirms that both pages render `FoldableGame`.
- It can be opened and closed with only the keyboard: Tab to the G, Enter or space opens it and focus lands on the
  canvas, Tab to the close button, Enter closes it and focus is back on the G. Check: the user does this, and the
  reviewer checks the focus calls in code.
- A run closed mid-way saves a new high score and starts over next time. Check: the user plays past the old HI,
  closes, reopens, and sees the new HI with "Tryk for at starte".
- With "reducer bevægelse" turned on there is no animation. Check: the user turns it on in the OS or with
  Chrome DevTools > Rendering > "Emulate CSS prefers-reduced-motion", and the reviewer checks the `matchMedia`
  branch.
- It works on a phone (375 px) and on desktop. That includes fullscreen (native and the CSS fallback) after
  opening, and touch to open and close. Check: the user tests both widths.
- `bun run lint`, `bun run build` and `bun run test` pass.

## Out of scope
- Changes to the game's rules, drawing or palette (`src/game/`).
- Remembering whether the game was open.
- Pausing a run and continuing it later.
- Any change to page layout beyond swapping `GGame` for `FoldableGame`.
