# Design tokens

The SPA's Tailwind theme (`@theme` in `src/index.css`) comes from Gul&Gratis' design manual in Figma:
[Gul&Gratis – Design System](https://www.figma.com/design/TlehhRhTUyA8APHgZ7VGs6/Gul-Gratis---Design-System?node-id=566-34751)
(fileKey `TlehhRhTUyA8APHgZ7VGs6`).

- **Names:** the Figma variable path with `/` replaced by `-`; Tailwind's namespace supplies the first segment. So
  `color/text/primary` becomes `--color-text-primary` (class `text-text-primary`), and `text/text-base/font-size`
  becomes `--text-base` (class `text-base`).
- **Values:** copied from the Figma variables, read with the Figma MCP server (`get_variable_defs` on frames and
  components, plus a read-only Plugin API script for the variables no frame on the documentation pages uses). Figma
  sizes are px; the theme uses rem at 16px, which is an exact conversion. Where a Figma variable is an alias, the
  table names the variable the SPA uses and the alias target in parentheses.
- **Only tokens the SPA uses** are in the theme. Tailwind's own defaults are still there; stage 2 switches the
  components over.

## Token table

### Colours: UI

| Tailwind token | Value | Figma variable | Used for |
| --- | --- | --- | --- |
| `--color-brand-yellow` | `#feef7b` | `color/brand/yellow` (→ `color/foundation/palette/yellow/500`) | Page background; the shop on the game canvas |
| `--color-text-primary` | `#2e2e2e` | `color/text/primary` (→ `color/foundation/neutral/900`) | Headings and body text everywhere |
| `--color-text-secondary` | `#777777` | `color/text/secondary` (→ `color/foundation/neutral/600`) | Game score and help text; footer links (as in the Figma footer) |
| `--color-text-link` | `#0060e6` | `color/text/link` (→ `color/foundation/palette/blue/900`) | Inline link "GulogGratis.dk" in the intro |
| `--color-text-green` | `#089855` | `color/text/green` (→ `color/foundation/palette/green/800`) | Game win message; canvas tick mark |
| `--color-icon-default` | `#2e2e2e` | `color/icon/default` (→ `color/foundation/neutral/900`) | Phosphor icons (section icons, FAQ, close, fullscreen, socials) |
| `--color-surface-white` | `#ffffff` | `color/surface/white` (→ `color/foundation/neutral/0`) | Section cards, FAQ drawer, game frame, message pill; canvas white (cone stripe, envelope, sign text) |
| `--color-surface-gray-light` | `#f4f4f4` | `color/surface/gray-light` (→ `color/foundation/neutral/100`) | Footer background (as in the Figma footer) |
| `--color-surface-yellow-light` | `#fcf6b1` | `color/surface/yellow-light` (→ `color/foundation/palette/yellow/300`) | Round icon backgrounds in sections and FAQ items |
| `--color-surface-overlay-gray` | `#dcdcdcb2` | `color/surface/overlay/gray` | Backdrop behind the FAQ drawer (the Figma modal overlay) |
| `--color-button-tertiary-background` | `#ffffff` | `color/button/tertiary/background` | White buttons: "Kom i gang", FAQ button, footer social icons |
| `--color-button-secondary-background` | `#f4f4f4` | `color/button/secondary/background` | Grey round buttons: fullscreen toggle, drawer close button |
| `--color-state-hover-neutral` | `#dcdcdc` | `color/state/hover/neutral` (→ `color/foundation/neutral/250`) | Hover on white and grey buttons |
| `--color-border-default` | `#e8e8e8` | `color/border/default` (→ `color/foundation/neutral/240`) | Drawer header border; footer top border |
| `--color-border-divider` | `#d0d4d7` | `color/border/divider` (→ `color/foundation/neutral/300`) | Lines between FAQ items |
| `--color-border-focus` | `#2e2e2e` | `color/border/focus` (→ `color/foundation/neutral/900`) | Focus outline on the game canvas |

### Colours: game canvas (`src/game/draw.ts`)

| Tailwind token | Value | Figma variable | Used for |
| --- | --- | --- | --- |
| `--color-brand-gray-dark` | `#2e2e2e` | `color/brand/gray-dark` (→ `color/foundation/neutral/900`) | Ground line, outlines, shop sign and door |
| `--color-brand-blue-light` | `#d7f1f6` | `color/brand/blue-light` (→ `color/foundation/palette/blue/100`) | Shop window |
| `--color-foundation-neutral-550` | `#969696` | `color/foundation/neutral/550` | Ground dashes |
| `--color-foundation-palette-yellow-700` | `#e8b53e` | `color/foundation/palette/yellow/700` | Parcel (cardboard) |
| `--color-foundation-palette-rust-500` | `#cc6119` | `color/foundation/palette/rust/500` | Parcel tape |
| `--color-foundation-palette-rust-900` | `#884111` | `color/foundation/palette/rust/900` | Parcel outline |
| `--color-foundation-palette-orange-700` | `#ff5f37` | `color/foundation/palette/orange/700` | Traffic cone |
| `--color-foundation-palette-rust-700` | `#a34d14` | `color/foundation/palette/rust/700` | Traffic cone base |
| `--color-foundation-palette-red-700` | `#e8262a` | `color/foundation/palette/red/700` | Envelope seal |

The canvas also uses `--color-brand-yellow` (shop, door knob), `--color-surface-white` and `--color-text-green` from
the UI table.

### Typography

Font: DM Sans (Regular 400, SemiBold 600, Bold 700), already loaded in `index.html` and set as `--font-sans`. Each size
token carries the line height of the Figma style at that size.

| Tailwind token | Value | Figma variable | Figma text styles at this size | Used for |
| --- | --- | --- | --- | --- |
| `--text-xs` / `--text-xs--line-height` | `0.75rem` (12) / `1rem` (16) | `text/text-xs/font-size` / `text/text-xs/line-height` | Body/XS - Regular, Body/XS - Semibold | Game title, score and help text (small view) |
| `--text-sm` / `--text-sm--line-height` | `0.875rem` (14) / `1.25rem` (20) | `text/text-sm/font-size` / `text/text-sm/line-height` | Body/SM - Regular, Body/SM - Semibold | Game title (small view), game help text (fullscreen) |
| `--text-base` / `--text-base--line-height` | `1rem` (16) / `1.5rem` (24) | `text/text-base/font-size` / `text/text-base/line-height` | Body/Base - Regular, Body/Base - Semibold | Buttons, game message, footer text and links, score (fullscreen) |
| `--text-lg` / `--text-lg--line-height` | `1.125rem` (18) / `1.75rem` (28) | `text/text-lg/font-size` / `text/text-lg/line-height` | Headline/LG - Regular, Headline/LG - Bold | Intro and section body text, FAQ questions and answers, footer column titles |
| `--text-xl` / `--text-xl--line-height` | `1.25rem` (20) / `1.75rem` (28) | `text/text-xl/font-size` / `text/text-xl/line-height` | Headline/XL - Regular, Headline/XL - Bold | Section icons, game title (fullscreen) |
| `--text-2xl` / `--text-2xl--line-height` | `1.5rem` (24) / `2rem` (32) | `text/text-2xl/font-size` / `text/text-2xl/line-height` | Headline/2XL - Regular, Headline/2XL - Bold | Section headings, FAQ drawer title, game message (fullscreen) |
| `--text-3xl` / `--text-3xl--line-height` | `1.875rem` (30) / `2.25rem` (36) | `text/text-3xl/font-size` / `text/text-3xl/line-height` | Display/3XL - Regular, Display/3XL - Bold | Game message (fullscreen, wide screens) |
| `--text-4xl` / `--text-4xl--line-height` | `2.25rem` (36) / `2.5rem` (40) | `text/text-4xl/font-size` / `text/text-4xl/line-height` | Display/4XL - Regular, Display/4XL - Bold | Page title on phones |
| `--text-5xl` / `--text-5xl--line-height` | `3rem` (48) / `3rem` (48) | `text/text-5xl/font-size` / `text/text-5xl/line-height` | Display/5XL - Regular, Display/5XL - Bold | Page title from `sm` up |
| `--font-weight-normal` | `400` | DM Sans Regular in the `… - Regular` styles | Body/Base - Regular etc. | Body text |
| `--font-weight-semibold` | `600` | DM Sans SemiBold in the `… - Semibold` styles | Body/Base - Semibold etc. | Buttons, links, FAQ questions, footer column titles, game message |
| `--font-weight-bold` | `700` | DM Sans Bold in the `… - Bold` styles | Display/5XL - Bold, Headline/2XL - Bold etc. | Page title, section headings, drawer title, game title |

### Spacing

| Tailwind token | Value | Figma variable | Used for |
| --- | --- | --- | --- |
| `--spacing-1` | `0.25rem` (4) | `spacing/1` | Game header gaps and padding; footer link gap |
| `--spacing-1-5` | `0.375rem` (6) | `spacing/1-5` | Score/fullscreen gap; footer link list gap |
| `--spacing-2` | `0.5rem` (8) | `spacing/2` | Icon-to-label gap in buttons; game header margins; footer social gap |
| `--spacing-2-5` | `0.625rem` (10) | `spacing/2-5` | Padding of round icon buttons (as in the Figma footer social icons) |
| `--spacing-3` | `0.75rem` (12) | `spacing/3` | Button padding (vertical); gaps between paragraphs and in headings |
| `--spacing-4` | `1rem` (16) | `spacing/4` | Page side padding; card padding (game); header gaps; logo height (phone) |
| `--spacing-5` | `1.25rem` (20) | `spacing/5` | FAQ button horizontal padding |
| `--spacing-6` | `1.5rem` (24) | `spacing/6` | Card padding (phone), drawer padding, button padding (horizontal), logo height (`sm`) |
| `--spacing-8` | `2rem` (32) | `spacing/8` | Space between sections; card padding (`sm`); FAQ +/× icon size; fullscreen button size |
| `--spacing-10` | `2.5rem` (40) | `spacing/10` | Section icon and close button size; footer column gap; footer social icon size |
| `--spacing-12` | `3rem` (48) | `spacing/12` | Space above the game; footer top padding |
| `--spacing-16` | `4rem` (64) | `spacing/16` | Page top padding (phone) |
| `--spacing-20` | `5rem` (80) | `spacing/20` | Page vertical padding (`sm`) |
| `--spacing-24` | `6rem` (96) | `spacing/24` | Page and footer bottom padding (room for the FAQ button) |

### Radius and shadow

| Tailwind token | Value | Figma variable or style | Used for |
| --- | --- | --- | --- |
| `--radius-xl` | `0.75rem` (12) | `radius/xl` | Game board (canvas) corners |
| `--radius-3xl` | `1.5rem` (24) | `radius/3xl` | Section cards, game frame |
| `--radius-full` | `9999px` | `radius/full` | Round icon backgrounds, message pill |
| `--radius-control-pill` | `9999px` | `radius/control/pill` (→ `radius/full`) | Buttons: "Kom i gang", FAQ, close, fullscreen, footer socials (as on the Figma Buttons page and footer) |
| `--shadow-card-shadow` | `0 1px 1px 0 #00000040` | Effect style `card-shadow` (drop shadow x 0, y 1, blur 1, spread 0, `#000000` at 25 %) | Section cards, game frame, white buttons, open FAQ drawer |

## Nearest-token substitutions

Where the SPA uses a value the manual has no token for, it gets the nearest token. These need the user's approval.
Colours were compared by RGB distance against every colour variable in the file; the runner-up is listed when it was
close.

### Yellow background

| Old value | Token | Figma variable | Note |
| --- | --- | --- | --- |
| `bg-[#F3C91D]` (page) and `#F3C91D` (canvas shop and door knob) | `--color-brand-yellow` `#feef7b` | `color/brand/yellow` | The manual has a brand yellow, so the plan says to use it. It is clearly paler than today's yellow. By RGB distance the nearest tokens to `#F3C91D` are `color/foundation/palette/orange/500` `#ffad1e` (30.5), `color/foundation/palette/yellow/700` `#e8b53e` (40.1) and `color/foundation/palette/yellow/600` `#faca48` (43.6); `#feef7b` is further away. **User decides.** |

### UI colours (Tailwind palette classes → manual)

| Old value | Where | Token | Figma variable |
| --- | --- | --- | --- |
| `text-gray-900` | Page text, buttons, links, footer | `--color-text-primary` | `color/text/primary` |
| `text-gray-800` | Intro paragraphs | `--color-text-primary` | `color/text/primary` |
| `text-gray-700` | Section body, FAQ answers, game message | `--color-text-primary` | `color/text/primary` |
| `text-gray-600` | Game score | `--color-text-secondary` | `color/text/secondary` |
| `text-gray-500` | Game help text | `--color-text-secondary` | `color/text/secondary` |
| `text-gray-900 underline` (inline link) | "GulogGratis.dk" in the intro | `--color-text-link` | `color/text/link` (the manual's link colour, blue) |
| `text-green-700` | Game win message | `--color-text-green` | `color/text/green` |
| `bg-white` | Cards, drawer, game frame | `--color-surface-white` | `color/surface/white` |
| `bg-white` | White buttons | `--color-button-tertiary-background` | `color/button/tertiary/background` |
| `bg-white` | Footer | `--color-surface-gray-light` | `color/surface/gray-light` (the Figma footer's background) |
| `bg-white/90` | Game message pill | `--color-surface-white` at 90 % opacity | `color/surface/white` |
| `hover:bg-gray-100` | White buttons | `--color-state-hover-neutral` | `color/state/hover/neutral` |
| `bg-gray-100` | Fullscreen toggle | `--color-button-secondary-background` | `color/button/secondary/background` |
| `bg-gray-100` | Footer social icons | `--color-button-tertiary-background` | `color/button/tertiary/background` (white on the grey footer, as in Figma) |
| `hover:bg-gray-200` | Fullscreen toggle, social icons | `--color-state-hover-neutral` | `color/state/hover/neutral` |
| `bg-red-100` | Drawer close button | `--color-button-secondary-background` | `color/button/secondary/background` (the Figma modal's close button) |
| `hover:bg-red-200` | Drawer close button | `--color-state-hover-neutral` | `color/state/hover/neutral` |
| `text-red-700` | Drawer close button | `--color-icon-default` | `color/icon/default` |
| `bg-yellow-100` | Section icons, FAQ +/× | `--color-surface-yellow-light` | `color/surface/yellow-light` |
| `bg-black/40` | Drawer backdrop | `--color-surface-overlay-gray` | `color/surface/overlay/gray` (the Figma modal overlay, light grey at 70 %, not dark) |
| `border-gray-200` | Drawer header border | `--color-border-default` | `color/border/default` |
| `divide-gray-200` | Lines between FAQ items | `--color-border-divider` | `color/border/divider` |
| `focus-visible:outline-gray-900` | Game canvas | `--color-border-focus` | `color/border/focus` |

### Canvas colours (`src/game/draw.ts`)

| Old value | Where | Token | Figma variable | RGB distance (runner-up) |
| --- | --- | --- | --- | --- |
| `#c8955c` | Parcel (cardboard) | `--color-foundation-palette-yellow-700` `#e8b53e` | `color/foundation/palette/yellow/700` | 54.3 (`yellow/600` `#faca48` 75.6). No brown in the manual; the parcel turns golden. |
| `#a8743f` | Parcel tape | `--color-foundation-palette-rust-500` `#cc6119` | `color/foundation/palette/rust/500` | 55.7 (`rust/700` `#a34d14` 58.3) |
| `#7a5229` | Parcel outline | `--color-foundation-palette-rust-900` `#884111` | `color/foundation/palette/rust/900` | 32.6 (`rust/700` 46.3) |
| `#f97316` | Traffic cone | `--color-foundation-palette-orange-700` `#ff5f37` | `color/foundation/palette/orange/700` | 39.1 (`orange/600` `#d68800` 46.4) |
| `#c2410c` | Traffic cone base | `--color-foundation-palette-rust-700` `#a34d14` | `color/foundation/palette/rust/700` | 34.2 (`rust/500` 36.0) |
| `#fff` | Cone stripe, envelope, sign text | `--color-surface-white` `#ffffff` | `color/surface/white` | 0 |
| `#2d2d2d` | Ground line, outlines, sign, door | `--color-brand-gray-dark` `#2e2e2e` | `color/brand/gray-dark` | 1.7 |
| `#ef4444` | Envelope seal | `--color-foundation-palette-red-700` `#e8262a` | `color/foundation/palette/red/700` | 40.3. **Not the nearest:** `orange/700` `#ff5f37` is 34.0, but it is also the cone's colour and is orange, not red. `red/500` `#ff421e` is 41.3. **User decides.** |
| `#F3C91D` | Shop wall, door knob | `--color-brand-yellow` `#feef7b` | `color/brand/yellow` | See "Yellow background". |
| `#e0f2fe` | Shop window | `--color-brand-blue-light` `#d7f1f6` | `color/brand/blue-light` | 12.1 (`blue/50` `#ecf9fb` 14.2) |
| `#9ca3af` | Ground dashes | `--color-foundation-neutral-550` `#969696` | `color/foundation/neutral/550` | 28.8 |
| `#15803d` | Delivery tick mark | `--color-text-green` `#089855` | `color/text/green` (→ `color/foundation/palette/green/800`) | 36.3 |

### Sizes, typography, radius and shadow

| Old value | Where | Token | Figma variable or style | Note |
| --- | --- | --- | --- | --- |
| `size-7` (28px) | Fullscreen toggle | `--spacing-8` (32) | `spacing/8` | No 28 in the manual; 24 (`spacing/6`) and 32 are equally near. 32 is the bigger tap target. |
| `size-9` (36px) | Footer social icons | `--spacing-10` (40) | `spacing/10` | No 36; 32 and 40 are equally near. The Figma footer's social icons are 40 (20 icon + `spacing/2-5` padding on each side). |
| `gap-1.5` (6px) | Footer social icons | `--spacing-2` (8) | `spacing/2` | `spacing/1-5` exists, but the Figma footer uses 8 between social icons. |
| `leading-relaxed` (1.625) | Section body, footer address | `--text-lg--line-height` (28) | `text/text-lg/line-height` | The manual sets one line height per size. |
| `leading-snug` (1.375) | FAQ answers | `--text-lg--line-height` (28) | `text/text-lg/line-height` | As above. |
| `font-medium` (500), not used today | Figma `Button/* - Medium` styles | `--font-weight-semibold` (600) | `Body/* - Semibold` | DM Sans 500 is not loaded and adding a weight is out of scope, so buttons stay SemiBold. |
| `shadow-sm` | Section cards, game frame | `--shadow-card-shadow` | `card-shadow` | The manual's only shadow style. |
| `shadow-lg` | "Kom i gang" and FAQ buttons | `--shadow-card-shadow` | `card-shadow` | Lighter than today. |
| `shadow-xl` | Open FAQ drawer | `--shadow-card-shadow` | `card-shadow` | Lighter than today. |
| `rounded-full` on buttons | All buttons | `--radius-control-pill` | `radius/control/pill` | Same value as `radius/full`; the manual uses the control role for buttons. |

### Left as they are (no token in the manual)

- `max-w-2xl`, `max-w-md`, `max-w-5xl` (Tailwind container widths): the manual has no layout-width variables.
- `max-w-[392px]` and `aspect-[360/150]`: measurements of the game itself.
- `w-[min(110vw,1100px)]`, `-rotate-12` and `opacity-[0.07]` on the background watermark: placement of the logo,
  not a colour or a size from the manual.
- `font-mono` on the game score: the manual has no monospace style. Stage 2 decides whether the score keeps it.
