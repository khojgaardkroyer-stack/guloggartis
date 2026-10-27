# SikkerHandel SPA: næste skridt

Det her er opgaverne for resten af ugen. Du vælger selv rækkefølgen og behøver ikke nå det hele. Den eneste faste
afhængighed er, at Opgave 4 kræver Opgave 1. Lav én pull request pr. opgave mod `main`.

**Forslag til rækkefølge:** tag dem i nummerrækkefølge og ekstraopgaverne til sidst. Opgave 0 er hurtig at komme i
gang med. Opgave 2 tidligt betyder, at det, du bygger i de andre opgaver, er i det rigtige design fra start i stedet
for at skulle laves om bagefter.

Hver opgave har et **mål**, **hvad der er besluttet** (lav det ikke om uden at spørge), **hvad der er op til dig** og
**færdig når** (de kriterier, vi gennemgår din PR ud fra). Sidder du fast, så spørg hellere tidligt end sent.

Hver opgave har en **status** lige under overskriften: `Ikke startet`, `I gang` eller `Færdig`. Med Claude Code kan
du løse en opgave med `/spec <nr>`. Den sætter opgaven til `I gang`, spørger dig om alle valg, der ikke er truffet,
og skriver en plan. Derefter implementerer én agent planen, og en anden reviewer den, indtil du godkender. Til sidst
sætter den opgaven til `Færdig` og laver PR'en. Skriver du en beskrivelse i stedet for et nummer (fx
`/spec en highscore-liste til spillet`), spørger den dig ud om idéen og tilføjer den som en ny opgave i samme format.

## Grundregler

- Al tekst, som besøgende ser, er på dansk og holder tonen fra den nuværende side. Kode, commits og PR-titler er på
  engelsk.
- `npm run lint` og `npm run build` skal køre uden fejl på hver PR.
- Siden skal virke på en telefon (375 px bred) og på desktop. Tjek begge, før du beder om review.
- Tilføj ikke en afhængighed, hvis et par linjer kode kan klare det. Når du tilføjer en, så skriv hvorfor i PR'en.
- Opgave 1, 5 og 6 har tests. Den første af dem, du laver, sætter Vitest op (`npm run test`) og kører det i
  deploy-workflowet sammen med lint.
- Når Opgave 2 er lavet, bruger al ny UI tokens og komponenter fra designmanualen.
- Hold siden hurtig. 3D-biblioteket (Opgave 4) må ikke gøre forsidens første indlæsning langsommere.

---

## Opgave 0: Opvarmning, oprydning og det rigtige logo

**Status:** Færdig

**Mål:** et rent repo, en deploy, der afviser kode med fejl, og et spil med Gul&Gratis' rigtige logo.

**Besluttet**

- Fjern `numpy-2.5.4-…whl` (16 MB) og `potracer-0.0.4-….whl` fra repoet, og tilføj `*.whl` til `.gitignore`.
- Kør `npm run lint` før `npm run build` i `.github/workflows/deploy.yml`.
- Spilleren i minispillet bruger det forkerte logo. Skift `src/assets/g-player.png` ud med det smalle logo,
  `src/assets/gg-narrow.svg` (to G'er side om side), som vi har lagt ind fra hovedrepoet, eller med kun det ene G fra
  det. Slet `g-player.png`.
- Brug formen fra SVG-filen, som den er; tegn eller trace den ikke om. Til ét G kan du beskære `viewBox` til
  `0 0 30 30` og sætte `width` til `30`. Farven må gerne ændres, så logoet står tydeligt på baggrunden.
- Spillerens kasse får samme forhold som det logo, du vælger (2:1 med to G'er, kvadratisk med ét), i stedet for de
  nuværende 30 × 35. Kollisionerne følger kassen, så spil et par runder og justér, så spillet stadig føles fair og kan
  vindes.

**Op til dig:** om spilleren er begge G'er eller kun ét. Vi foreslår også at skifte baggrundens vandmærke
(`src/assets/gg-logo.svg`, en hjemmelavet tracing af logoet) ud med `gg-narrow.svg`, så hele siden bruger det rigtige
logo.

**Færdig når**

- Ingen af `.whl`-filerne er tracket længere (`git ls-files` viser dem ikke).
- Et push med en lint-fejl får workflowet til at fejle, og siden bliver ikke deployet.
- Spilleren er det smalle GG-logo eller ét G fra det, skarpt både i normal visning og i fuld skærm, i Chrome,
  Safari og Firefox.
- Et helt spil kan stadig vindes, og høje konvolutter flyver stadig over en spiller, der står på jorden.

---

## Opgave 1: Tests, og del spillets logik op fra tegningen

**Status:** Færdig

**Mål:** spillets regler kan testes uden en browser, og tegningen kan skiftes ud senere. Opgave 4 bygger på det her.

`src/components/GGame.tsx` blander i dag tre ting i én komponent: spillets regler (tyngdekraft, hop, nye
forhindringer, kollisioner, point), tegningen på canvas og React-UI'en omkring det.

**Besluttet**

- Flyt spillets regler over i ren TypeScript uden React og uden canvas, fx `src/game/engine.ts`. Én funktion rykker
  spillet ét tidsskridt frem, `step(state, dtSeconds, input) => state`, og resten er små hjælpefunktioner.
- Canvas-tegningen bliver en funktion, der tager spillets tilstand og en canvas-kontekst og kun tegner.
- Spillet skal se ud og spille præcis som i dag. Opgaven er en refaktorering, ikke et redesign.

**Op til dig:** filnavne, hvordan tilstanden er bygget op, og om `step` ændrer tilstanden eller returnerer en ny.

**Færdig når**

- Testene dækker mindst: et hop lander på jorden igen, et sammenstød med hver type forhindring slutter spillet, en
  høj konvolut flyver over en spiller, der står på jorden, nye typer forhindringer dukker først op efter deres
  `minScore`, og spillet er vundet ved `WIN_SCORE`.
- `GGame.tsx` indeholder ingen kode til fysik eller kollisioner.
- Side om side med den live side kan ingen se forskel.

---

## Opgave 2: Følg Gul&Gratis' designmanual med Figma i Claude Code

**Status:** I gang

**Mål:** SPA'en ligner en del af guloggratis.dk i stedet for sin egen ting. Du lærer også at give et AI-værktøj et
designsystem at arbejde ud fra, i stedet for at lade det gætte.

**Besluttet**

- Facit er Gul&Gratis' designmanual i Figma: _link følger_. Spørg efter adgang, hvis du ikke kan åbne den.
- Forbind Claude Code til Figmas MCP-server: `claude mcp add --transport http figma https://mcp.figma.com/mcp`, kør
  derefter `/mcp` i Claude Code, og log ind med din Figma-konto. Figma begrænser brugen af MCP på gratis pladser og
  pladser, der kun kan se filer, så spørg, hvis du rammer en grænse, i stedet for at finde en vej udenom.
- Start med design-tokens: farver, typografi, afstande, hjørneradius og skygger. De skal i Tailwind-temaet (`@theme` i
  `src/index.css`) og hedde det samme som styles i Figma. Derefter må ingen komponent bruge en farve i firkantede
  parenteser som `bg-[#F3C91D]`, eller en størrelse i firkantede parenteser, hvor manualen har en token. Spillets mål
  som `aspect-[360/150]` er fine.
- Opdatér derefter al UI, der findes i SPA'en på det tidspunkt, efter manualen: overskrifter, brødtekst, links,
  knapper, FAQ-skuffen, footeren og rammen og pointvisningen omkring spillet. Hvor manualen har en komponent, så brug
  den. Hvor den ikke har, så byg ud fra tokens; find ikke på nye farver eller størrelser.
- Hvis manualen angiver en skrifttype eller et ikonsæt, så brug det. Spørg, før du tilføjer en skrifttype, der ikke er
  gratis at bruge på nettet.
- Logoerne, også spillerens logo fra Opgave 0, forbliver, som de er.
- Tjek selv det, AI'en laver, op mod Figma. Hver værdi i temaet skal komme fra en navngiven style i Figma, ikke fra en
  værdi, værktøjet har gættet eller rundet af.

**Op til dig:** hvordan du arbejder med Claude og Figma: hvad du beder om, i hvilken rækkefølge, og hvad du gør i
hånden.

**Færdig når**

- `grep -rn -- '-\[#' src` finder ingenting (ingen farver er hardcodet længere).
- PR'en har før/efter-skærmbilleder på desktop og telefon og en tabel, der parrer hver token i temaet med dens style i
  Figma.
- PR-beskrivelsen har en kort note om arbejdsgangen: hvilke prompts der virkede, hvad AI'en tog fejl af, og hvad du
  rettede i hånden. Noten er lige så vigtig som koden; vi bruger den i teamet.

---

## Opgave 3: Routing og en mock-404-side med spillet

**Status:** Ikke startet

**Mål:** SPA'en får mere end én side, og en forkert URL viser en 404-side i Gul&Gratis-stil, hvor man kan spille
spillet.

**Besluttet**

- Brug React Router (eller en router i samme størrelse). Den nuværende side bliver på `/`.
- Alle ukendte URL'er viser 404-siden.
- Siden ligger på `/guloggartis/` på GitHub Pages, så routeren bruger det som base path (Vite stiller det til rådighed
  som `import.meta.env.BASE_URL`).
- GitHub Pages kender ikke til routes på klientsiden. Åbner man
  `https://khojgaardkroyer-stack.github.io/guloggartis/foo` direkte eller genindlæser den, får man GitHubs egen
  404-side, medmindre vi leverer en `404.html`. Kopiér `dist/index.html` til `dist/404.html` som en del af
  `npm run build`. Skift ikke til hash-URL'er (`/#/foo`).
- 404-siden kopierer layoutet fra den rigtige på guloggratis.dk. Åbn en URL, der ikke findes der (fx
  `https://www.guloggratis.dk/findes-ikke`), og match dens opbygning, overskrift, tekst og knapper. Behold den gule
  baggrund og SPA'ens header og footer omkring den.
- Spillet er med på 404-siden og kan spilles. Det er den samme komponent som på forsiden, ikke en kopi.
- 404-siden har et link tilbage til `/`.

**Op til dig:** hvor spillet står på siden, og en legende linje, der binder det sammen (fx "Siden er væk, men måske
kan du nå at levere pakken?").

**Færdig når**

- `/guloggartis/` viser forsiden som før.
- `/guloggartis/findes-ikke` viser 404-siden, både når man navigerer dertil i appen, og når man åbner URL'en direkte
  eller genindlæser den på den deployede side.
- Spillet på 404-siden virker og deler highscore med forsiden (de deler `localStorage`).
- Fanens titel i browseren skifter fra side til side.

---

## Opgave 4: Spillet bliver 3D efter 200 meter

**Status:** Ikke startet

**Mål:** spillet starter i 2D, som det er i dag. Efter 200 meter svinger kameraet om bag G'et, og løbet fortsætter i
3D uden at stoppe.

**Kræver:** Opgave 1.

**Besluttet**

- Tilføj en metertæller til pointvisningen: **1 point = 1 meter**. Skiftet sker ved 200 m. Læg de 200 i en navngiven
  konstant, så den er nem at justere.
- Spillets regler fra Opgave 1 ændrer sig ikke. Løbet foregår stadig på samme "bane": samme hop, samme forhindringer
  og samme kollisioner. Kun tegningen ændrer sig. Kollisioner i 3D skal stemme med det, 2D-reglerne bestemmer, ellers
  føles spillet uretfærdigt.
- Brug Three.js, direkte eller gennem `@react-three/fiber`.
- Indlæs først 3D-koden, når der er brug for den (`import()` / `React.lazy`). Begynd at hente den i baggrunden, når
  spilleren løber, så skiftet ikke hakker ved 200 m. Forsidens første indlæsning må ikke indeholde den (tjek
  chunk-størrelserne i `npm run build`).
- Skiftet er en animeret kamerabevægelse på ca. 1–2 sekunder. Spillet kører videre imens eller holder en kort, synlig
  pause, men klipper aldrig brat.
- Hvis browseren ikke kan WebGL, eller den besøgende har slået "reducer bevægelse" til, bliver spillet i 2D hele
  tiden.
- Fuld skærm, tastatur, touch og afslutningen, når man vinder (pakken bliver leveret til pakkeshoppen), virker stadig
  i 3D.

**Op til dig:** hvordan 3D-verdenen ser ud. Simple low-poly-kasser til pakker, en kegle til keglen, og G'et som en
flad sprite eller en ekstruderet form er alt sammen fint. Brug farverne fra designmanualen (Opgave 2).

**Færdig når**

- Et helt løb fra 0 til `WIN_SCORE` virker på desktop og telefon, med skiftet ved 200 m.
- Det kører glat (ingen synlig hakken) på en mellemklassetelefon.
- Forsidens første JavaScript-indlæsning er omtrent lige så stor som før opgaven (skriv størrelsen før og efter i
  PR'en).

---

## Opgave 5: "Prøv det selv": en handel trin for trin

**Status:** Ikke startet

**Mål:** en gennemgang med spilelementer, hvor den besøgende spiller en SikkerHandel igennem som enten køber eller
sælger, fra første bud til bedømmelse.

**Besluttet**

- Byg den som én selvstændig komponent, der kan stå inline på en side og lige så nemt på sin egen side. Den ved
  ikke, hvor den er placeret: al tilstand ligger i komponenten, den ændrer ikke sidens titel eller URL, og den fylder
  den bredde, den får.
- Den står inline på forsiden, fx efter afsnittet "Sådan foregår en handel".
- Når man skifter trin, må siden ikke hoppe: komponenten holder nogenlunde sin højde, og fokus flytter til det nye
  trin uden at scrolle siden væk.
- Den besøgende vælger først en rolle: **køber** eller **sælger**.
- Trinene følger det rigtige forløb, som det er beskrevet i `src/content.ts`. Find ikke på trin eller regler, som
  teksten ikke beskriver. Det almindelige forløb:
  1. **Bud:** køber byder på en vare; sælger accepterer.
  2. **Betaling:** køber betaler; pengene går til den sikrede handelskonto, ikke til sælger.
  3. **Forsendelse:** sælger får en pakkelabel og har 6 dage til at indlevere pakken.
  4. **Levering:** pakken kommer til den pakkeshop, der ligger tættest på købers folkeregisteradresse.
  5. **Godkendelse:** køber har 12 timer efter afhentning til at godkende eller afvise. Gør køber ingenting, tæller
     det som en godkendelse.
  6. **Udbetaling:** pengene bliver udbetalt til sælger, typisk første bankdag efter.
  7. **Bedømmelse:** køber og sælger bedømmer hinanden.
- Én forgrening: ved trin 5 kan køber **afvise** varen. Så køber køber en returlabel og sender varen tilbage, sælger
  kan melde problemer, og er der ingen, får køber pengene tilbage.
- Som sælger træffer den besøgende sælgers valg (acceptere buddet, sende pakken); købers handlinger sker af sig selv,
  og omvendt.
- Vis ved hvert trin, hvor pengene er (køber → handelskonto → sælger eller tilbage til køber). Det er kernen i
  SikkerHandel.
- Beskriv forløbet som data (trin, valg og næste trin for hvert valg) i én fil, ikke som indlejrede `if`'er spredt ud
  over komponenterne. Test forløbet (hver vej når en afslutning, og afvisningen giver køber pengene tilbage).
- Alt er på skrømt. Intet kalder Gul&Gratis, og der bliver ikke indsamlet rigtige data.

**Op til dig:** layout og animationer inden for designmanualen, hvor meget det føles som et spil (point, en
fremdriftsbjælke, en nedtælling for de 12 timer) og teksterne. Lidt humor er velkommen.

**Færdig når**

- Den virker inline på forsiden. Er routing (Opgave 3) lavet, vises den også på `/proev-det` uden ændringer i
  komponenten.
- Begge roller kan gennemføre både det almindelige forløb og afvisningen.
- Den besøgende kan starte forfra og gå ét trin tilbage.
- Det virker med kun tastatur og på en telefon.

---

## Opgave 6: Gebyrberegner

**Status:** Ikke startet

**Mål:** den besøgende indtaster en pris og ser, hvad køber betaler, og hvad sælger får.

**Besluttet**

- Gebyret for hver part er `pris × procent / 100 + fast beløb`, rundet til hele øre. Køber og sælger har hver deres
  procentsats og faste beløb.
- Satser (udfyldes af produktejeren, før du starter):

  | | Procent | Fast beløb |
  | --- | --- | --- |
  | Køber | _følger_ | _følger_ kr |
  | Sælger | _følger_ | _følger_ kr |
  | Fragt (fra) | | _følger_ kr |

- Hold satserne i én konstant, så de er nemme at opdatere. Regn i øre (heltal), og formatér først som kroner, når
  beløbet vises.
- Resultatet viser: varens pris, købers gebyr, fragt, **hvad køber betaler i alt**, sælgers gebyr og **hvad sælger
  får udbetalt**.
- Tilføj en kort note om, at priserne er et eksempel, og at handelssiden på guloggratis.dk viser det præcise beløb.

**Færdig når**

- Beregningen har tests, også af afrunding og en pris på 0.
- Den håndterer tomt felt, bogstaver og negative tal uden at gå i stykker.

---

## Opgave 7: Spot svindlen, en quiz

**Status:** Ikke startet

**Mål:** vis, hvorfor SikkerHandel findes. Den besøgende ser 5–6 opdigtede annoncer eller chatbeskeder og skal finde
advarselstegnene.

**Besluttet**

- Eksempler på advarselstegn: "send pengene på MobilePay først", et link, der fører væk fra Gul&Gratis, "min fætter
  henter den", en pris, der er alt for god til at være sand, og pres for at beslutte sig hurtigt.
- Bland mindst én besked ind, der er helt i orden, så det ikke bare handler om at klikke på alt.
- Forklar efter hvert svar i en eller to sætninger hvorfor, og hvordan SikkerHandel beskytter dig.
- Alle navne, varer og beskeder er tydeligt opdigtede. Brug ikke rigtige brugere eller skærmbilleder fra sitet.

**Færdig når**

- En hel runde kan spilles og slutter med en score og, hvis Opgave 5 er lavet, en opfordring til at prøve
  gennemgangen.

---

## Ekstraopgaver (vælg dem, du har lyst til)

- **Tilgængelighed og Lighthouse:** kør Lighthouse på mobil, og få alle sider op på 90+ i Performance og
  Accessibility. Tjek kontrasten på grå tekst på gul baggrund, og at alle sider kan bruges med tastatur.
- **Del din score:** når man vinder eller taber, laves der et billede af resultatet, som kan deles via telefonens
  delemenu (`navigator.share`); ellers kan billedet downloades.
- **Engelsk version:** et sprogvalg (DA/EN). `src/content.ts` samler allerede teksten ét sted.
- **Klar til guloggratis.dk:** gør spillet til én selvstændig komponent, der kun kræver React og Tailwind, uden
  imports fra resten af SPA'en, og skriv et kort afsnit i README om, hvordan man indlejrer det. Sådan kan det ende på
  den rigtige 404-side.
- **End-to-end-tests:** Playwright-tests af, at alle routes indlæses, at 404-siden viser spillet, og at gennemgangen
  kan gennemføres som køber og som sælger.
- **Kodestil som i Gul&Gratis' hovedrepo:** tilføj Prettier med tabs, ingen semikoloner, enkelte anførselstegn og en
  linjelængde på 120 tegn. Gør det i sin egen PR, fordi ændringen rører alle filer.
