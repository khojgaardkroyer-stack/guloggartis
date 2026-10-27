# SikkerHandel SPA: next steps

This is the work plan for the rest of the week. The tasks are in priority order: finish one before you start the next,
and open one pull request per task against `main`. If you run out of time, stopping after Task 4 is fine. Tasks 5–6
and the stretch list are bonus work.

Each task has a **goal**, **what is decided** (don't change these without asking), **what is up to you**, and
**done when** (the acceptance criteria we review against). Estimates are rough. If a task takes more than twice its
estimate, stop and ask.

## Ground rules

- All text visitors see stays in Danish and keeps the tone of the current page. Code, commits and PR titles are in
  English.
- `npm run lint` and `npm run build` pass on every PR.
- The page must work on a phone (375 px wide) as well as on desktop. Check both before you ask for review.
- Don't add a dependency when a few lines of code do the job. When you do add one, say why in the PR.
- Keep the page fast. The 3D library (Task 3) must not slow down the first load of the front page.

---

## Task 0: Warm-up and cleanup (½ hour)

**Goal:** a clean repo and a deploy that refuses broken code.

**Decided**

- Remove `numpy-2.5.4-…whl` (16 MB) and `potracer-0.0.4-….whl` from the repo, and add `*.whl` to `.gitignore`.
- In `.github/workflows/deploy.yml`, run `npm run lint` before `npm run build`.

**Done when**

- Neither `.whl` file is tracked any more (`git ls-files` doesn't list them).
- A push with a lint error fails the workflow and does not deploy.

---

## Task 1: Tests, and split the game's logic from its drawing (1 day)

**Goal:** the game's rules can be tested without a browser, and the drawing can be swapped out later. Task 3 depends
on this.

`src/components/GGame.tsx` currently mixes three things in one component: the game rules (gravity, jumping, spawning
obstacles, collisions, score), the canvas drawing, and the React UI around it.

**Decided**

- Add Vitest (`npm run test`), and run it in the deploy workflow next to lint.
- Move the game rules into plain TypeScript with no React and no canvas, e.g. `src/game/engine.ts`. One function
  advances the game by one time step, `step(state, dtSeconds, input) => state`, and the rest are small helpers.
- The canvas drawing becomes a function that takes the game state and a canvas context, and only draws.
- The game must look and play exactly as it does today. This task is a refactor, not a redesign.

**Up to you:** file names, how the state is shaped, and whether `step` mutates the state or returns a new one.

**Done when**

- Tests cover at least: a jump lands back on the ground, hitting each obstacle type ends the game, a high envelope
  passes over a player standing on the ground, new obstacle types only appear after their `minScore`, and the game is
  won at `WIN_SCORE`.
- `GGame.tsx` holds no physics or collision code.
- Side by side with the live site, nobody can tell the difference.

---

## Task 2: Routing and a mock 404 page with the game (1 day)

**Goal:** the SPA gets more than one page, and a wrong URL shows a Gul&Gratis-style 404 page where you can play the
game.

**Decided**

- Use React Router (or a router of similar size). The current page stays at `/`.
- Any unknown URL shows the 404 page.
- The site is served from `/guloggartis/` on GitHub Pages, so the router uses that as its base path (Vite exposes it
  as `import.meta.env.BASE_URL`).
- GitHub Pages doesn't know about client-side routes. Opening `https://khojgaardkroyer-stack.github.io/guloggartis/foo`
  directly, or refreshing it, gets GitHub's own 404 page unless we ship a `404.html`. Copy `dist/index.html` to
  `dist/404.html` as part of `npm run build`. Don't switch to hash URLs (`/#/foo`).
- The 404 page copies the layout of the real one on guloggratis.dk. Open any URL that doesn't exist there (e.g.
  `https://www.guloggratis.dk/findes-ikke`) and match its structure, heading, text and buttons. Keep the yellow
  background and header/footer of this SPA around it.
- The game appears on the 404 page as a playable element. It's the same component as on the front page, not a copy.
- The 404 page has a link back to `/`.

**Up to you:** where the game sits on the page, and a playful line that ties it in (e.g. "Siden er væk, men måske
kan du nå at levere pakken?").

**Done when**

- `/guloggartis/` shows the front page exactly as before.
- `/guloggartis/findes-ikke` shows the 404 page, both when you navigate there in the app and when you open the URL
  directly or refresh it on the deployed site.
- The game on the 404 page plays and keeps the same high score as the front page (they share `localStorage`).
- The browser tab title changes per page.

---

## Task 3: The game turns 3D after 200 metres (1½–2 days)

**Goal:** the game starts in 2D as it is today. After 200 metres the camera swings behind the G and the run continues
in 3D, without stopping.

**Decided**

- Add a metre counter to the HUD: **1 point = 1 metre**. The switch happens at 200 m. Put the 200 in a named
  constant so it's easy to tune.
- The game rules from Task 1 don't change. The run stays the same "lane": same jumps, same obstacles and same
  collisions. Only the drawing changes. Collisions in 3D must match what the 2D rules decide, or the game will feel
  unfair.
- Use Three.js, directly or through `@react-three/fiber`.
- Load the 3D code only when it's needed (`import()` / `React.lazy`). Start loading it in the background once the
  player is running, so the switch doesn't stall at 200 m. The front page's first load must not include it (check
  the chunk sizes in `npm run build`).
- The switch is an animated camera move of roughly 1–2 seconds. The game keeps running during it, or pauses briefly
  and visibly, but never cuts abruptly.
- If the browser can't do WebGL, or the visitor has turned on "reduce motion", the game stays in 2D the whole time.
- Fullscreen, keyboard, touch and the win sequence (delivering the parcel to the parcel shop) still work in 3D.

**Up to you:** how the 3D world looks. Simple low-poly boxes for parcels, a cone for the cone, and the G as a flat
sprite or an extruded shape are all fine. It should look like Gul&Gratis: yellow, playful, clean.

**Done when**

- A full run from 0 to `WIN_SCORE` works on desktop and on a phone, with the switch at 200 m.
- It runs smoothly (no visible stutter) on a mid-range phone.
- The front page's initial JavaScript is about the same size as before the task (say what it was before and after
  in the PR).

---

## Task 4: "Prøv det selv": a step-by-step trade walkthrough (1½–2 days)

**Goal:** a gamified walkthrough where the visitor plays out a SikkerHandel trade, as either the buyer or the seller,
from first bid to rating.

**Decided**

- Its own route, e.g. `/proev-det`, with a clear call to action from the front page.
- The visitor first picks a role: **køber** or **sælger**.
- The steps follow the real flow as described in `src/content.ts`. Don't invent steps or rules that the content
  doesn't describe. The happy path:
  1. **Bud:** the buyer bids on an item; the seller accepts.
  2. **Betaling:** the buyer pays; the money goes to the secure trade account, not to the seller.
  3. **Forsendelse:** the seller gets a shipping label and has 6 days to hand in the parcel.
  4. **Levering:** the parcel arrives at the parcel shop closest to the buyer's registered address.
  5. **Godkendelse:** the buyer has 12 hours after pickup to approve or reject. Doing nothing counts as approval.
  6. **Udbetaling:** the money is paid out to the seller, typically the next bank day.
  7. **Bedømmelse:** buyer and seller rate each other.
- One branch: at step 5 the buyer can **reject** the item. Then the buyer buys a return label and sends the item back,
  the seller can report problems, and if there are none, the buyer gets the money back.
- As seller, the visitor's choices are the seller's (accept the bid, ship the parcel); the buyer's actions happen
  automatically, and vice versa.
- Show where the money is at every step (buyer → trade account → seller or back to the buyer). This is the core
  message of SikkerHandel.
- Model the flow as data (steps, choices and the next step for each choice) in one file, not as nested `if`s spread
  across components. Test the flow (every path ends, and the reject branch returns the money to the buyer).
- Everything is pretend. Nothing calls Gul&Gratis, and no real data is collected.

**Up to you:** the visual style, animations, how "game-like" it feels (points, a progress bar, a timer for the
12 hours) and the copy. A little humour is welcome.

**Done when**

- Both roles can complete both the happy path and the reject path.
- The visitor can restart, and can go back one step.
- It works with keyboard only, and on a phone.

---

## Task 5: Fee calculator (½ day)

**Goal:** the visitor enters a price and sees what the buyer pays and what the seller receives.

**Decided**

- Each side's fee is `price × percentage / 100 + flat rate`, rounded to whole øre. The buyer and the seller each have
  their own percentage and flat rate.
- Rates (filled in by the product owner before you start):

  | | Percentage | Flat rate |
  | --- | --- | --- |
  | Buyer | _TBD_ | _TBD_ kr |
  | Seller | _TBD_ | _TBD_ kr |
  | Shipping (from) | | _TBD_ kr |

- Keep the rates in one constant so they're easy to update. Calculate in øre (integers), and format as kroner only
  when displaying.
- The result shows: item price, buyer's fee, shipping, **total the buyer pays**, seller's fee, and **what the seller
  receives**.
- Include a short note that the prices are an example and that the trade page on guloggratis.dk shows the exact
  amount.

**Done when**

- The calculation has tests, including rounding and a price of 0.
- It handles empty input, letters and negative numbers without breaking.

---

## Task 6: Spot the scam, a quiz (1 day)

**Goal:** show why SikkerHandel exists. The visitor sees 5–6 made-up listings or chat messages and has to spot the
warning signs.

**Decided**

- Examples of warning signs: "send me the money on MobilePay first", a link that leads outside Gul&Gratis, "my cousin
  will pick it up", a price far too good to be true, pressure to decide quickly.
- Mix in at least one message that is fine, so it's not just "click everything".
- After each answer, explain in one or two sentences why, and how SikkerHandel protects you.
- All names, items and messages are clearly made up. Don't use real users or screenshots from the site.

**Done when**

- A full round can be played, ending with a score and a link to the walkthrough (Task 4).

---

## Stretch (pick whatever you like)

- **Accessibility and Lighthouse:** run Lighthouse on mobile and get every page to 90+ on Performance and
  Accessibility. Check the contrast of grey text on yellow, and that every page works by keyboard.
- **Share your score:** when you win or lose, create an image of the result and share it with the phone's share sheet
  (`navigator.share`); fall back to downloading the image.
- **English version:** a language switch (DA/EN). `src/content.ts` already holds the text in one place.
- **Ready to drop into guloggratis.dk:** make the game one self-contained component that only needs React and
  Tailwind, with no imports from the rest of this SPA, and write a short README section on how to embed it. This is
  how it could end up on the real 404 page.
- **End-to-end tests:** Playwright tests that every route loads, the 404 page shows the game, and the walkthrough can
  be finished as buyer and as seller.
- **Code style like the main Gul&Gratis repo:** add Prettier with tabs, no semicolons, single quotes and a 120
  character line limit, and replace the bracket colours (`bg-[#F3C91D]`) with named colours in the Tailwind theme.
  Do this in its own PR, because the diff touches every file.
