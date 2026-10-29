# Opgave 5: "Prøv det selv": en handel trin for trin

## Goal
En gennemgang med spilelementer, hvor den besøgende spiller en SikkerHandel igennem som enten køber eller sælger,
fra første bud til bedømmelse. Ved hvert trin kan man se, hvor pengene er: hos køber, på den sikrede handelskonto,
hos sælger eller tilbage hos køber. Det er kernen i SikkerHandel.

## Decisions
- **One self-contained component** `src/components/walkthrough/Walkthrough.tsx` (default export `Walkthrough`, no
  props). All state lives inside it. It never sets the page title or URL, and it fills the width it gets
  (`w-full`). Reason: SPEC Besluttet.
- **Placement:** inline on the front page directly after the first text card "Sådan foregår en handel" (render
  `sections[0]`, then `<Walkthrough />`, then the remaining sections). Also on a new route `/proev-det`
  (`src/pages/TryItPage.tsx`) with `<title>Prøv det selv · SikkerHandel</title>`, a heading "Prøv det selv" and a
  short intro, then the same `<Walkthrough />` unchanged. No new buttons or links elsewhere (the user said no to
  a link from the quiz's end screen in this task).
- **Flow as data** in one file, `src/walkthrough/flow.ts`, with no React. Each step has: `id`, `title`,
  `money` (`'buyer' | 'escrow' | 'seller' | 'refunded'`), `progress` (`{ step, total }` for the bar), `actor`
  (`'buyer' | 'seller' | 'both' | null`; `both` means each role makes its own move, `null` means nobody does and
  both just press "Videre"), and per role (`buyer`, `seller`) the text and either `choices`
  (`{ label, next }[]`, shown when the visitor's role is the actor) or an `event` line plus a single `next`
  (shown when the other party acts, with a "Videre" button). End steps have no `next`. Components only render
  what the data says; no `if (step === ...)` logic spread over components. Reason: SPEC Besluttet.
- **Role choice first:** a start screen "Vil du prøve som køber eller sælger?" with two buttons "Køber"
  (`PiShoppingCart`) and "Sælger" (`PiStorefront`).
- **The other party acts "by itself"** as an event line (`PiChatCircleDots` icon, e.g. "Sælger har accepteret dit
  bud!") and a "Videre" button. No timers. Reason: the user's choice; works with keyboard and screen readers.
- **Step 5 (Godkendelse):**
  - As **buyer** there are three choices: "Godkend varen" → Udbetaling, "Afvis varen" → the return branch, and
    "Gør ingenting" → a short step "12 timer senere …" that explains it counts as an approval, then Udbetaling.
  - As **seller**, the visitor picks the buyer's reaction: "Hvad gør køber?" with "Køber er glad" → Udbetaling and
    "Køber afviser varen" → the return branch. Reason: the user's choice, so both paths are always reachable.
- **Return branch:** Retur (buyer buys a return label and sends the guitar back; the buyer acts) → Returtjek
  (seller checks the returned guitar; the seller acts, with the single choice "Alt er i orden"; the text mentions
  that the seller could report problems to Gul&Gratis) → Penge tilbage (end: money `refunded`). No "report a
  problem" path, because the content doesn't say what happens then. No rating after a return, because SPEC only
  lists rating in the normal flow.
- **The goods:** a used guitar for 800 kr. throughout.
- **Rating (step 7):** the visitor gives the other party 1–5 stars as a native radio group (styled stars,
  arrow keys work), then a "Giv bedømmelse" button; after that the other party's rating of the visitor appears:
  5 stars and a funny line (Content). It is just for fun; nothing is saved.
- **Game elements:** a progress bar "Trin n af N" and a money track with three boxes "Køber", "Handelskonto",
  "Sælger" and a coin (`PiCoin`) that moves between them with a ~400 ms CSS transform transition
  (`motion-reduce:transition-none`). For `refunded` the coin is back at "Køber" and the track says "Pengene er
  tilbage hos køber". No points and no countdown. Reason: the user's choice.
- **Progress numbers:** normal flow steps 1–7 of 7. "12 timer senere" counts as step 5 of 7. Return branch: Retur
  6 of 8, Returtjek 7 of 8, Penge tilbage 8 of 8. The end screen of the normal flow has no number.
- **Navigation:** "Et trin tilbage" (`PiArrowLeft`) and "Start forfra" (`PiArrowCounterClockwise`) are shown on
  every step after the role choice. "Et trin tilbage" pops a history stack kept in component state (so back from
  Udbetaling returns to the step you came from); from the first step it goes back to the role choice. "Start
  forfra" returns to the role choice. The end screens also offer "Prøv som sælger"/"Prøv som køber" (starts over
  in the other role).
- **No jumping:** the step area has a fixed minimum height (`min-h-[...]` from Tailwind's spacing scale, enough
  for the tallest step on a 375 px phone, so the card doesn't shrink between steps). When the step changes,
  focus moves to the new step's heading (`tabIndex={-1}`, `focus({ preventScroll: true })`). The step region is
  `aria-live="polite"`.
- **Look:** one white card like `TextSection` (`rounded-3xl bg-surface-white p-6 shadow-card-shadow sm:p-8`),
  heading "Prøv en handel selv", pill buttons in the existing style (`rounded-control-pill
  bg-button-tertiary-background ... shadow-card-shadow hover:bg-state-hover-neutral`). Only theme tokens and
  standard Tailwind utilities; no `-[#...]` colours. No new dependencies.
- **Everything is pretend:** nothing calls Gul&Gratis and nothing is collected.
- **Copy:** Danish, from Content, approved by the user. Facts follow `src/content.ts` only.

## Content
Card heading: "Prøv en handel selv". Start screen: "Vil du prøve som køber eller sælger? Vi handler med en brugt
guitar til 800 kr. Alt er på skrømt." Buttons "Køber", "Sælger".

Money track label under the boxes, per `money`: buyer "Pengene er hos køber.", escrow "Pengene står sikkert på
handelskontoen.", seller "Pengene er udbetalt til sælger.", refunded "Pengene er tilbage hos køber."

Steps (B = text as buyer, S = text as seller; the actor's choices or the other side's event):
1. **Bud** (actor both, money buyer). B: "Du har fundet en brugt guitar til 800 kr. Den har et par ridser, men
   spiller stadig 'Smoke on the Water' uden at klage." Choice "Byd 800 kr." → 2. S: "Du sælger din gamle guitar.
   En køber har budt 800 kr." Choice "Accepter buddet" → 2. (The buyer bids, the seller accepts; for the buyer,
   the seller's acceptance is the first sentence of step 2.)
2. **Betaling** (actor buyer, money escrow). B: "Sælger har accepteret dit bud! Du betaler 800 kr., og pengene
   går til den sikrede handelskonto, ikke direkte til sælger." Choice "Betal 800 kr." → 3. S event: "Køber har
   betalt. Pengene står på den sikrede handelskonto, så du ved, de er der, men du får dem først, når køber har
   godkendt guitaren." Videre → 3.
3. **Forsendelse** (actor seller, money escrow). S: "Du har fået en pakkelabel. Du har 6 dage til at indlevere
   pakken, så der er tid til at finde noget bobleplast." Choice "Indlever pakken" → 4. B event: "Sælger har fået en
   pakkelabel og har indleveret pakken." Videre → 4.
4. **Levering** (actor null, money escrow). B: "Pakken er kommet til den pakkeshop, der ligger tættest på din
   folkeregisteradresse." S: "Pakken er kommet frem til købers pakkeshop." Videre → 5 for both.
5. **Godkendelse** (actor buyer, money escrow). B: "Du har hentet guitaren. Du har 12 timer til at godkende eller
   afvise den." Choices "Godkend varen" → 6, "Afvis varen" → retur, "Gør ingenting" → 5b. S: "Køber har hentet
   guitaren og har 12 timer til at godkende eller afvise den. Hvad gør køber?" Choices "Køber er glad" → 6,
   "Køber afviser varen" → retur.
5b. **12 timer senere …** (actor null, money escrow, progress 5 of 7). B only: "Du gjorde ingenting i 12 timer.
   Det tæller som en godkendelse, så handlen fortsætter." Videre → 6.
6. **Udbetaling** (actor null, money seller). B: "Handlen er godkendt. Pengene bliver udbetalt til sælger, typisk
   første bankdag efter." S: "Køber har godkendt guitaren. Pengene bliver udbetalt til dig, typisk første bankdag
   efter." Videre → 7.
7. **Bedømmelse** (actor both, money seller). B: "Hvordan gik handlen med sælger?" S: "Hvordan gik handlen med
   køber?" Stars, then "Giv bedømmelse". Then the other party's rating, 5 stars: as buyer "Sælger gav dig 5
   stjerner: 'Hurtig betaling, og du spurgte ikke én gang, om den kan spille Wonderwall. Topkøber!'"; as seller
   "Køber gav dig 5 stjerner: 'Guitaren var pakket ind i så meget bobleplast, at jeg stadig pakker ud. Tak!'"
   Then the end screen.
End (normal): "Handlen er afsluttet 🎸" + "Pengene stod sikkert på handelskontoen, indtil guitaren var godkendt.
Det er SikkerHandel." Buttons "Start forfra", "Prøv som sælger"/"Prøv som køber".

Return branch:
- **Retur** (actor buyer, money escrow, 6 of 8). B: "Du afviste guitaren. Nu køber du en returlabel og sender den
  tilbage til sælger." Choice "Køb returlabel og send" → returtjek. S event: "Køber afviste guitaren og har sendt
  den retur med en returlabel." Videre → returtjek.
- **Returtjek** (actor seller, money escrow, 7 of 8). S: "Guitaren er kommet retur. Er der problemer, kan du melde
  dem til Gul&Gratis. Ser alt fint ud?" Choice "Alt er i orden" → penge-tilbage. B event: "Sælger har modtaget
  guitaren og har ikke meldt nogen problemer." Videre → penge-tilbage.
- **Penge tilbage** (end, money refunded, 8 of 8). B: "Du får pengene for guitaren tilbage. Ingen skade sket!" S:
  "Køber får pengene tilbage, og du har din guitar igen. Måske er den bare ikke til 'Smoke on the Water'
  alligevel." + "Pengene stod sikkert på handelskontoen hele vejen. Det er SikkerHandel." Buttons as the normal end.

The implementer may tune wording slightly for fit, but not the facts, and may not add steps or rules.

`/proev-det` page intro: "Spil en SikkerHandel igennem som køber eller sælger, og se hvor pengene er undervejs."

## Steps
1. `src/walkthrough/flow.ts`: types and the flow data from Content, plus pure helpers: `startStep()`,
   `viewFor(step, role)` (returns what to show: text, choices or event + next), and `isEnd(step)`.
2. `src/walkthrough/flow.test.ts`: the tests below.
3. `src/components/walkthrough/`: `Walkthrough.tsx` (state: role, current step id, history stack, rating), plus
   small parts as needed (`MoneyTrack.tsx`, `ProgressBar.tsx`, `StarRating.tsx`). Split only where it helps.
4. `src/pages/HomePage.tsx`: insert `<Walkthrough />` after the first section card.
5. `src/pages/TryItPage.tsx` and the route `proev-det` in `src/App.tsx`, before `*`.
6. Run `bun run lint`, `bun run build` and `bun run test`. Check that `grep -rn -- '-\[#' src` finds nothing. This
   project uses Bun; the `npm run` scripts in SPEC map to `bun run <script>`. Don't create `package-lock.json`.
   End commit messages with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Tests
In `src/walkthrough/flow.test.ts` (Vitest), over the data:
- Every `next` points to an existing step, and every step is reachable from the start for at least one role.
- For both roles, every path from the start (following every choice and every event) reaches an end step; no
  cycles.
- The normal path ends with money `seller`; the return path ends with money `refunded` (buyer gets the money
  back), for both roles.
- Money is never `seller` before the approval step, and it is `escrow` from Betaling until Udbetaling or the
  refund.
- For each role, the steps where that role acts (`actor` is the role or `both`) have choices; the others have an
  event or a plain Videre.
- The buyer's "Gør ingenting" leads to Udbetaling via the 12-hour step.
- `viewFor` returns choices for the actor and an event for the other role.

## Done when
- It works inline on the front page and is shown on `/proev-det` with no changes to the component. Check: the
  reviewer sees the same `<Walkthrough />` with no props in both places; the user opens both.
- Both roles can complete the normal flow and the return. Check: the path tests; the user plays all four.
- The visitor can start over and go one step back. Check: reviewer; the user.
- It works with only the keyboard and on a phone. Check: the user (Tab/Enter/arrow keys for stars, 375 px).
- The page doesn't jump between steps, and focus moves to the new step. Check: the user.
- `bun run lint`, `bun run build` and `bun run test` pass.

## Out of scope
- A link from the quiz's end screen (Opgave 7) to `/proev-det`.
- Points, a countdown, or saving anything.
- A "report a problem" path for the seller.
- Rating after a return.
- Calling Gul&Gratis or collecting any data.
