# Opgave 3: Routing og en mock-404-side med spillet

## Goal
SPA'en får mere end én side, og en forkert URL viser en 404-side i Gul&Gratis-stil, hvor man kan spille spillet.
Forsiden bliver på `/`, alle ukendte URL'er viser 404-siden, og det virker også, når man åbner eller genindlæser en
ukendt URL direkte på GitHub Pages (`/guloggartis/`).

## Decisions
- **Router: `react-router` v7 in declarative mode** (`BrowserRouter`, `Routes`, `Route`, `Outlet`, `Link`,
  `useLocation`). It is the router SPEC.md names. Add it as a normal dependency; the PR says why (SPEC asks for it).
- **Base path:** `<BrowserRouter basename={import.meta.env.BASE_URL}>`. `BASE_URL` is `/guloggartis/` from
  `vite.config.ts`; React Router accepts the trailing slash. Don't hardcode the path anywhere else.
- **Shared layout:** `src/components/Layout.tsx` holds what both pages share: the `<main>` with the yellow page
  background and padding, the fixed GG watermark, the Gul&Gratis logo link top right, an `<Outlet />` for the page,
  and `<Footer />` after `</main>`. Pages live in `src/pages/HomePage.tsx` and `src/pages/NotFoundPage.tsx`.
  `App.tsx` only declares the routes. Reason: one place for the frame, so new pages (Opgave 5's `/proev-det`) just
  add a route.
- **FAQ drawer only on the front page:** `<FaqDrawer>` moves into `HomePage`, not `Layout`. The real 404 on
  guloggratis.dk has only heading and text.
- **404 content, copied from https://www.guloggratis.dk/findes-ikke** (fetched 2026-10-27), in this order, centered,
  inside the same `max-w-2xl` column as the front page:
  1. `<h1>`: `<strong>404</strong> Den er væk væk`, styled like the front page's h1
     (`text-4xl font-bold sm:text-5xl`, centered).
  2. Playful line right under the heading, as a short paragraph (`text-lg font-semibold`):
     "Siden er væk, men måske kan du nå at levere pakken?"
  3. The game (`<GGame />`, the same component as the front page, unchanged), centered (`flex justify-center`).
     The user wants the game at the top of the page, right after the 404 heading and the line.
  4. The original text verbatim, `text-lg`: "Vi har allerede kigget i kælderen, garagen og loftsrummet, men denne
     side findes desværre ikke længere. Heldigvis bliver der lagt nye annoncer op hele tiden på GulogGratis."
     "GulogGratis" is a link to `https://www.guloggratis.dk/` like on the original, styled like the front page's
     inline link (`font-semibold text-text-link underline`), with `whitespace-nowrap`.
  5. A pill button "Tilbage til SikkerHandel" with a left-arrow Phosphor icon (`PiArrowLeft` from
     `react-icons/pi`), a React Router `<Link to="/">`, with exactly the classes of the front page's "Kom i gang"
     button. This is the required link back to `/`; the "GulogGratis" text link stays external as on the original.
- **Tab titles via React 19's built-in `<title>`:** each page renders its own `<title>`. Front page:
  "Hvad er SikkerHandel?" (as now). 404: "Siden findes ikke · SikkerHandel". Remove the static `<title>` from
  `index.html`, because React appends its hoisted `<title>` to `<head>` and the browser uses the first one in the
  document, so a static one would win. No new dependency.
- **`404.html` via a small Vite plugin in `vite.config.ts`:** a plugin `{ name: 'spa-404-fallback', apply: 'build',
  closeBundle() { ... } }` that copies `<outDir>/index.html` to `<outDir>/404.html` with `node:fs` `copyFileSync`
  (resolve the out dir from the resolved config via `configResolved`, don't hardcode `dist`). Works on Windows and
  in CI. No hash URLs.
- **Scroll to top on route change:** a `useEffect` in `Layout` on `useLocation().pathname` that calls
  `window.scrollTo(0, 0)`.
- **High score sharing:** already shared, because `GGame` reads and writes `localStorage` key `ggame-highscore`.
  Don't change `GGame.tsx`.
- **Design rules (Opgave 2):** only theme tokens and existing classes; no `-[#...]` colours and no new arbitrary
  sizes where a token exists.
- **No new tests.** Ground rules only require tests for Opgave 1, 5 and 6, and this task is routing and markup.

## Steps
1. Add the dependency: `bun add react-router` (updates `package.json` and `bun.lock`).
2. Create `src/components/Layout.tsx`: move the frame from `src/App.tsx` (the `<main>` with its classes, the
   watermark `<div>` with `gg-logo.svg`, the logo link with `gul-og-gratis-logo.png` and `GUL_OG_GRATIS_URL`), put
   `<Outlet />` where the page content goes, render `<Footer />` after `</main>`, and add the scroll-to-top effect.
3. Create `src/pages/HomePage.tsx`: the front page content from `App.tsx`. That's the `max-w-2xl` column with the
   header, sections and "Kom i gang", the game row, and `<FaqDrawer>`, plus `<title>Hvad er SikkerHandel?</title>`.
   The rendered page must look exactly as before.
4. Create `src/pages/NotFoundPage.tsx` with the 404 content and `<title>` from Decisions, in the same `max-w-2xl`
   column wrapper (`relative mx-auto max-w-2xl space-y-8`) and with centered text.
5. Rewrite `src/App.tsx` to only declare routes: a layout route with `<Layout />`, an index route with
   `<HomePage />`, and `path="*"` with `<NotFoundPage />`.
6. Wrap `<App />` in `src/main.tsx` with `<BrowserRouter basename={import.meta.env.BASE_URL}>`.
7. Remove the `<title>` line from `index.html`.
8. Add the `spa-404-fallback` plugin to `vite.config.ts`.
9. Run `bun run lint`, `bun run build` and `bun run test`, and check that `dist/404.html` exists and is identical
   to `dist/index.html`.
10. Run `bun run build` and `bun run preview`. Fetch `http://localhost:4173/guloggartis/` and
   `http://localhost:4173/guloggartis/findes-ikke`, check that both return the app shell, then stop the server.

Environment note for this machine: `git` and `bun` aren't on PATH in PowerShell. Prepend
`$env:LOCALAPPDATA\Programs\Git\cmd` and `$env:USERPROFILE\.bun\bin` to `$env:Path`. Use `bun run <script>`
instead of `npm run <script>`, because `npm` isn't installed.

## Tests
No new unit tests, see Decisions. Existing `bun run test` (engine and palette) must still pass.

## Done when
- `/guloggartis/` shows the front page as before. Check: the user compares it to the live site in `bun run dev`.
- `/guloggartis/findes-ikke` shows the 404 page in-app, and also when opened directly or reloaded on the deployed
  site. Check: the user opens it in dev, and after merge on https://khojgaardkroyer-stack.github.io/guloggartis/
  findes-ikke, both directly and with reload. The agent checks that `dist/404.html` equals `dist/index.html`.
- The game on the 404 page works and shares its high score with the front page. Check: the user plays on one page
  and sees the HI score on the other. The code check is that both use the same `GGame` component, unchanged.
- The tab title changes from page to page. Check: "Hvad er SikkerHandel?" on `/`, and "Siden findes ikke ·
  SikkerHandel" on the 404 page, including after clicking "Tilbage til SikkerHandel".
- `bun run lint`, `bun run build` and `bun run test` pass. The page works at 375 px and on desktop (user check).

## Out of scope
- Any other routes (`/proev-det` belongs to Opgave 5).
- Changes to `GGame.tsx` or the game itself.
- Hash URLs.
- Swapping the watermark or logos.
- A header or navigation menu beyond the existing logo link.
