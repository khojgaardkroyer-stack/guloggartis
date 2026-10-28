# Opgave 7: Spot svindlen, en quiz

## Goal
Vis, hvorfor SikkerHandel findes. Den besøgende ser 6 opdigtede annoncer og chatbeskeder én ad gangen, afgør for
hver, om den er svindel eller i orden, og får efter hvert svar en kort forklaring på hvorfor, og hvordan
SikkerHandel beskytter dig. Runden slutter med en score.

## Decisions
- **Own page, own route:** the quiz lives on `/spot-svindlen` (`src/pages/QuizPage.tsx`), inside the existing
  `Layout`, so it gets the logo, background and footer. Page `<title>`: `Spot svindlen · SikkerHandel` (same
  pattern as the 404 page). Reason: the user's choice; keeps the front page short and the quiz shareable by link.
- **Entry point:** a second white pill button next to "Kom i gang" on the front page: a react-router `<Link>` to
  `/spot-svindlen` with the label "Spot svindlen" and `PiShieldWarning` as its icon, styled exactly like "Kom i gang"
  (same classes). Reason: the user chose a button over a card.
- **Answering:** two buttons under each item, "Svindel" (`PiFlag`) and "I orden" (`PiCheckCircle`). The first click
  locks the answer; the buttons are then disabled. Reason: the user's choice; easy on a phone.
- **A pool of 12 items, 6 per round:** 8 scams and 4 fine items, mixing chat messages and ads (exact copy under
  Content below). Each round draws **4 scams and 2 fine items** at random from the pool, then shuffles those 6, so
  a round is still 6 long as SPEC says, but "Spil igen" gives new items. Items 1–4 cover all five warning signs
  from SPEC (item 4 combines "too good to be true" and pressure); items 7–10 add more scam types. Reason: the
  user asked for more questions and chose a larger pool over a longer round.
  Each item has a short situation line above it ("Du sælger din sofa.") so the visitor knows whose side they are on.
- **Ads show an icon, not a picture:** a Phosphor icon for the item in a grey box (`bg-surface-gray-light`),
  title, price, place and description. No image files. Reason: the user's choice; nothing from the real site, and
  it looks clearly made up.
- **Chat messages:** a bubble with the sender's made-up username above it, left-aligned, on `bg-surface-gray-light`.
  Links inside messages are plain text styled like a link (`text-text-link underline`), never real `<a>` elements,
  so nothing can be clicked through.
- **After each answer (before moving on):**
  - A result line: "Rigtigt!" or "Ikke helt." followed by "Det var svindel." or "Den var i orden." The icon next
    to it carries the colour (`text-text-green` with `PiCheckCircle` for right, `text-foundation-palette-red-700`
    with `PiXCircle` for wrong); the text stays `text-text-primary`, because neither colour has enough contrast for
    body text on white.
  - The warning sign in the item is highlighted with `<mark>` (`bg-surface-yellow-light`, no other colour change).
    Fine items have nothing highlighted. The warning sign is stored as an exact substring of the item text, and a
    test checks that it is one.
  - The explanation (1–2 sentences, from Content).
  - A "Næste" button (`PiArrowRight`), or "Se dit resultat" after the last item. The visitor moves on themselves.
  - The result block is in an `aria-live="polite"` region, and focus moves to the "Næste" button when it appears,
    so keyboard and screen reader users land on the feedback.
- **Progress:** "Besked 2 af 6" above the item. No progress bar.
- **Draw and order are new every round** (`drawRound(items, rng)`: shuffle the scams and the fine items with
  Fisher–Yates, take 4 and 2, then shuffle the 6), including on "Spil igen". Reason: the user's choice, so a
  second round isn't just memory.
- **End screen:** "<n> af 6 rigtige" as the heading, one of three texts by score, a common line about SikkerHandel,
  and two buttons: "Spil igen" (`PiArrowCounterClockwise`, reshuffles and starts over) and "Tilbage til forsiden"
  (`PiArrowLeft`, `<Link to="/">`). No link to Opgave 5 now, because it isn't done; Opgave 5 adds its own button
  when it is built.
- **Code layout:**
  - `src/quiz/items.ts`: the item data and types. Item = `{ id, situation, kind: 'chat' | 'ad', isScam,
    warning?: string, explanation }`, plus `sender`/`text` for chats and `icon`/`title`/`price`/`place`/
    `description` for ads. `warning` is the exact substring to highlight (in `text` for chats, in `description`
    or `title` for ads; say which with a field `warningIn: 'text' | 'title' | 'description'`).
  - `src/quiz/quiz.ts`: pure logic, no React: `shuffle(items, rng)`, `isCorrect(item, answer)`,
    `scoreOf(answers)`, `resultText(score, total)` returning the tier text, `drawRound(items, rng)` returning the
    round's 6 items, and `splitOnWarning(text, warning)`
    returning `[before, warning, after]` for the highlight.
  - `src/quiz/quiz.test.ts`: tests for the above.
  - `src/components/quiz/QuizItem.tsx` (renders a chat or an ad, with optional highlight) and
    `src/pages/QuizPage.tsx` (state and flow). Split further only if a file gets hard to read.
  - State in `QuizPage` with `useState`: the shuffled order, the current index, and the answers given so far.
    Nothing in `localStorage`; a reload starts a new round.
- **Layout:** the same column as the front page (`mx-auto max-w-2xl`), the item and its feedback in one white
  card (`rounded-3xl bg-surface-white p-6 shadow-card-shadow sm:p-8`, like `TextSection`). The two answer buttons
  sit side by side and fill the card's width on a 375 px phone. Buttons use the same pill style as "Kom i gang".
- **Only theme tokens** and standard Tailwind utilities; no `-[#...]` colours. No new dependencies.
- **Copy:** Danish, from Content below, approved by the user. All names, goods and messages are made up.

## Content
Situation line, then the item, then whether it is a scam, the warning sign (highlighted) and the explanation.

1. **Chat, scam.** Situation: "Du vil købe en mountainbike." Sender: "Lars_88". Text: "Hej! Cyklen er din for
   300 kr. Send pengene på MobilePay først, så sender jeg den i morgen." Warning: "Send pengene på MobilePay
   først". Explanation: "Betaler du uden om Gul&Gratis, er pengene væk, hvis cyklen aldrig kommer. Med
   SikkerHandel står pengene på en sikret handelskonto, indtil du har godkendt varen."
2. **Chat, scam.** Situation: "Du sælger din sofa." Sender: "Sofie_K_92". Text: "Jeg vil gerne købe sofaen!
   Udfyld lige dine kortoplysninger på gulgratis-udbetaling.net, så får du pengene med det samme." Warning:
   "gulgratis-udbetaling.net". Explanation: "Linket fører væk fra Gul&Gratis, og det er sådan, svindlere stjæler
   kortoplysninger. Med SikkerHandel foregår både betaling og udbetaling inde på Gul&Gratis."
3. **Chat, scam.** Situation: "Du sælger din PlayStation." Sender: "Mikkel.D". Text: "Fedt! Jeg er ude at rejse,
   så min fætter henter den i aften. Jeg overfører pengene, når han har den." Warning: "min fætter henter den".
   Explanation: "Når en anden henter varen, og pengene først kommer bagefter, kan du ende uden både vare og penge.
   Med SikkerHandel sender du først varen, når køber har betalt til den sikrede handelskonto."
4. **Ad, scam.** Situation: "Du leder efter en ny telefon." Icon: `PiDeviceMobile`. Title: "iPhone 16 Pro,
   256 GB, som ny". Price: "900 kr.". Place: "Odense". Description: "Skal væk i dag! Fem andre er interesserede,
   så den første, der betaler, får den." Warning (in description): "Skal væk i dag! Fem andre er interesserede".
   Explanation: "En næsten ny iPhone til 900 kr. er for god til at være sand, og presset skal få dig til at
   handle, før du når at tænke. Med SikkerHandel betaler du aldrig direkte til sælger, og pengene udbetales først,
   når du har godkendt varen."
5. **Ad, fine.** Situation: "Du leder efter en cykel til dit barn." Icon: `PiBicycle`. Title: "Børnecykel,
   16 tommer". Price: "350 kr.". Place: "Vejle". Description: "Brugt i to somre og har lidt ridser på skærmen.
   Sendes gerne med SikkerHandel." Explanation: "Alt ser fint ud: en realistisk pris, en ærlig beskrivelse, og
   sælger vil gerne bruge SikkerHandel."
6. **Chat, fine.** Situation: "Du sælger dit gulvtæppe." Sender: "Anne_strikker". Text: "Hej! Er tæppet stadig
   til salg? Jeg køber det gerne med SikkerHandel, så kan du sende det, når jeg har betalt." Explanation: "Her er
   intet at være bange for. Køber vil bruge SikkerHandel, så pengene står sikkert, indtil hun har fået tæppet."

7. **Chat, scam.** Situation: "Du sælger din cykelhjelm." Sender: "Peter_H". Text: "Ups, jeg kom til at betale
   2.500 kr. i stedet for 250 kr. Kan du overføre de 2.250 kr. tilbage på MobilePay?" Warning: "overføre de
   2.250 kr. tilbage". Explanation: "Der er ingen overbetaling. Svindleren håber, at du sender dine egne penge.
   Med SikkerHandel får du udbetalt præcis det, varen koster, og du skal aldrig sende penge tilbage."
8. **Chat, scam.** Situation: "Du sælger dit brætspil." Sender: "Jonas_77". Text: "Jeg har sendt dig en sms med
   en kode. Send mig lige koden, så jeg kan bekræfte betalingen." Warning: "Send mig lige koden". Explanation:
   "Koden er kun til dig, og med den kan svindleren komme ind på din konto. Med SikkerHandel skal du aldrig give en
   kode til køber, og betalingen bekræftes inde på Gul&Gratis."
9. **Chat, scam.** Situation: "Du vil købe en jakke." Sender: "Camilla_B". Text: "Skriv dit nummer, så tager vi
   resten på WhatsApp. Det er nemmere." Warning: "tager vi resten på WhatsApp". Explanation: "Flytter I handlen
   væk fra Gul&Gratis, mister du beskyttelsen. Med SikkerHandel foregår både chat og betaling på Gul&Gratis, så
   pengene står sikkert, indtil du har fået jakken."
10. **Ad, scam.** Situation: "Du leder efter et fjernsyn." Icon: a Phosphor TV icon (`PiTelevisionSimple` or
    `PiTelevision`, whichever exists in `react-icons/pi`). Title: "Smart-tv, 65 tommer, ny i æsken". Price:
    "1.200 kr.". Place: "Aalborg". Description: "Betaling kun via bankoverførsel. Jeg sender fra Spanien."
    Warning (in description): "Betaling kun via bankoverførsel". Explanation: "Kræver sælger bankoverførsel, kan
    du ikke få pengene tilbage, hvis tv'et aldrig kommer. Med SikkerHandel står pengene på en sikret
    handelskonto, indtil du har godkendt varen."
11. **Ad, fine.** Situation: "Du leder efter en lænestol." Icon: `PiArmchair`. Title: "Lænestol i velour". Price:
    "600 kr.". Place: "Aarhus". Description: "Lidt slidt på armlænene. Kan sendes med SikkerHandel eller hentes."
    Explanation: "Alt ser fint ud: en rimelig pris, en ærlig beskrivelse af slid, og sælger tilbyder SikkerHandel."
12. **Chat, fine.** Situation: "Du sælger dine løbesko." Sender: "Bo_Hansen". Text: "Har du et billede af
    sålerne? Hvis de ser fine ud, køber jeg dem gerne med SikkerHandel." Explanation: "Helt i orden. Køber stiller
    et fornuftigt spørgsmål og vil handle med SikkerHandel, så du først sender, når pengene står sikkert."

End screen texts by score (out of 6):
- 6: "Perfekt! Du spottede det hele."
- 4–5: "Flot! Du har godt øje for svindel."
- 0–3: "Svindlere kan være svære at gennemskue, men nu kender du tegnene."
- Always after it: "Uanset hvad står pengene med SikkerHandel på en sikret handelskonto, indtil varen er modtaget
  og godkendt."

Page header on `/spot-svindlen`: heading "Spot svindlen", intro "Her er seks beskeder og annoncer. Nogle af dem er
svindel, andre er helt i orden. Kan du se forskel?" Above the items, small text: "Alle navne, varer og beskeder er
opdigtede."

## Steps
1. `src/quiz/items.ts`: types and the 6 items from Content.
2. `src/quiz/quiz.ts`: `shuffle`, `isCorrect`, `scoreOf`, `resultText`, `splitOnWarning`.
3. `src/quiz/quiz.test.ts`: the tests below.
4. `src/components/quiz/QuizItem.tsx`: chat and ad rendering, situation line, optional `<mark>` highlight via
   `splitOnWarning`.
5. `src/pages/QuizPage.tsx`: header, progress, the card with item, answer buttons, feedback and "Næste", and the
   end screen. Focus handling and `aria-live` as in Decisions.
6. `src/App.tsx`: add `<Route path="spot-svindlen" element={<QuizPage />} />` before the `*` route.
7. `src/pages/HomePage.tsx`: add the "Spot svindlen" `<Link>` next to "Kom i gang".
8. Run `bun run lint`, `bun run build` and `bun run test`. Check that `grep -rn -- '-\[#' src` finds nothing.
   (This machine uses Bun; `npm` scripts in SPEC map to `bun run <script>`. Don't create `package-lock.json`.)
   End commit messages with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Tests
In `src/quiz/quiz.test.ts` (Vitest):
- `shuffle` returns the same items in a new order for a given `rng`, never loses or duplicates one, and doesn't
  mutate its input.
- `isCorrect`: "Svindel" is right for scams and wrong for fine items, and vice versa.
- `scoreOf` counts correct answers.
- `resultText` returns the right tier text for 6, 5, 4, 3 and 0 out of 6.
- `splitOnWarning` splits around the warning, and returns the whole text unsplit when there is no warning.
- Data checks over `items`: there are 12, exactly 4 are fine, ids are unique, every scam has a `warning` that is
  an exact substring of the field named by `warningIn`, and no fine item has a `warning`.
- `drawRound` returns 6 distinct items from the pool, exactly 4 scams and 2 fine, for several `rng` values
  (including 0 and just under 1), and doesn't mutate its input.

## Done when
- A whole round can be played and ends with a score. Check: the reviewer reads the flow; the user plays a round in
  `bun run dev` on `/spot-svindlen`.
- Every SPEC warning sign appears in the pool (MobilePay first, link away from Gul&Gratis, "min fætter henter
  den", price too good to be true, pressure to decide fast), and every round has 6 items with 2 fine ones. Check:
  the reviewer against Content; the data and `drawRound` tests.
- Each answer is followed by a 1–2 sentence explanation that says why and how SikkerHandel protects you. Check:
  reviewer against Content.
- All names, goods and messages are made up; no real users or screenshots. Check: reviewer.
- The Opgave 5 prompt is left out, because Opgave 5 isn't done. Check: reviewer.
- Works on a 375 px phone and on desktop, and with the keyboard. Check: the user.
- `bun run lint`, `bun run build` and `bun run test` pass.

## Out of scope
- A link or prompt to Opgave 5's walkthrough.
- Saving scores or a high score list.
- Real images of goods.
- Clicking on the warning sign itself (the user chose Svindel/I orden).
- An overview of all answers on the end screen.
- Changes to the game, the footer or the 404 page.
