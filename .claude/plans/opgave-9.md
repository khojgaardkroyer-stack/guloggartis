# Opgave 9: Easter egg i logoet

## Goal
Trykker den besøgende tre gange hurtigt på Gul&Gratis-logoet øverst til højre, skifter sidens baggrund til et
hemmeligt billede. Logoet linker ikke længere til guloggratis.dk. Det virker på alle sider, og det bliver ved, til
siden bliver genindlæst.

## Decisions
- **The image:** copy the user's image from
  `C:\Users\fxxx3137\AppData\Local\Temp\claude\c--Users-fxxx3137-Documents-GitHub-guloggartis\a99a6fb3-98ee-4a99-9ea2-38aaa4d63627\images\1.png`
  to `src/assets/easter-egg.png` unchanged (PNG, 390 × 292, ~100 kB). Import it like the other assets. It is
  low-res, so it will look soft when it covers a desktop screen. That's accepted, because it's an easter egg.
  Render it only once it is active, so the browser doesn't download it before.
- **Logo:** it stays exactly where and how it is now (`absolute top-4 right-4 sm:top-6 sm:right-6`, `h-4 sm:h-6`,
  `alt="Gul&Gratis"`). The `<a href>` wrapper is removed, so it is a plain `<img>` with an `onClick`.
  **Mouse and touch only:** the user chose not to make it keyboard-operable, so no button, no `tabIndex` and no
  role. No pointer cursor or other visual hint, so it stays a secret. If `oxlint` flags the click handler on an
  `<img>` (a11y rules), silence that one line with a disable comment that says the easter egg is
  pointer-only on purpose. Don't change the lint config.
- **Click counting:** keep the timestamps of recent clicks in a ref. On each click, drop timestamps older than
  **1000 ms** (`EASTER_EGG_WINDOW_MS`) and add the new one. When there are 3 (`EASTER_EGG_CLICKS`), activate.
  Slower clicks never add up to 3. Once active, further clicks do nothing.
- **State lives in `Layout`** (`src/components/Layout.tsx`) as plain `useState(false)`. `Layout` stays mounted
  across route changes, so the background stays when navigating between `/` and the 404 page, and a reload resets
  it. Nothing goes in `localStorage`.
- **Background:** when active, render a `fixed inset-0` layer inside `<main>`, in the same place and stacking
  order as the GG watermark. It is `aria-hidden` and `pointer-events-none`, and shows the image with inline
  `style={{ backgroundImage: \`url(${easterEgg})\` }}` plus `bg-cover bg-center`. The watermark is hidden while
  it is active. Footer and content are unchanged. The footer keeps its grey background, and the image is only
  behind the content above it. Text readability is not handled (SPEC says that's fine).
- **Fade:** the image layer fades from opacity 0 to 1 over about **500 ms** (`transition-opacity duration-500`,
  starting from 0 via Tailwind v4's `starting:opacity-0` or one `requestAnimationFrame`). With
  `prefers-reduced-motion` it appears instantly (`motion-reduce:transition-none`).
- **Cleanup:** remove the now unused `GUL_OG_GRATIS_URL` import from `Layout.tsx`. Keep the export in
  `src/content.ts`, which the pages still use.
- **No new tests.** The Grundregler only require tests for Opgave 1, 5 and 6.
- Only theme tokens and standard Tailwind utilities; no `-[#...]` colours.

## Steps
1. Copy the image to `src/assets/easter-egg.png`.
2. `src/components/Layout.tsx`:
   1. Replace the logo `<a>` with the bare `<img>` (same classes on a wrapper or the img so position and size are
      unchanged) and an `onClick` that runs the click counting.
   2. Add the `active` state, the two constants, the image layer with its fade, and hide the watermark when
      active.
3. Run `bun run lint`, `bun run build` and `bun run test`. Check that `grep -rn -- '-\[#' src` finds nothing.

Environment note for this machine: `git` and `bun` aren't on PATH. In Git Bash, run
`export PATH="$LOCALAPPDATA/Programs/Git/cmd:$USERPROFILE/.bun/bin:$PATH"` first, or in PowerShell prepend
`$env:LOCALAPPDATA\Programs\Git\cmd;$env:USERPROFILE\.bun\bin` to `$env:Path`. Use `bun run <script>`, because
`npm` isn't installed. End commit messages with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Tests
No new unit tests, see Decisions. The existing `bun run test` must still pass.

## Done when
- Three quick taps on the logo switch the background to the image, on both the front page and the 404 page. Check:
  the user in `bun run dev`. The reviewer checks that the logic is in `Layout`.
- One or two taps, or three slow ones, do nothing, and the logo doesn't navigate away. Check: the user, and the
  reviewer confirms no `href`/navigation remains on the logo.
- After a reload the background is yellow again. Check: the user.
- It works with touch on a phone (375 px) and with a mouse on desktop. Check: the user.
- `bun run lint`, `bun run build` and `bun run test` pass.

## Out of scope
- Keyboard activation.
- Turning it off again without reloading.
- Remembering it across reloads.
- Making text readable over the image.
- Changing the footer.
