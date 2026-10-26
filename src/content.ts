export type Step = {
  emoji: string
  text: string
}

export const happyPath: Step[] = [
  { emoji: '💌', text: 'Køber byder på en vare' },
  { emoji: '🙌🏽', text: 'Sælger accepterer købers bud' },
  { emoji: '🔐', text: 'Køber betaler. Pengene indbetales til en sikret handelskonto' },
  { emoji: '🚚', text: 'Sælger får en pakkelabel til at sende varerne' },
  { emoji: '📲', text: 'Når varerne er fremme, skal køber godkende varerne på Gul&Gratis' },
  {
    emoji: '✅',
    text: 'Hvis køber godkender varerne, bliver pengene udbetalt til sælger og handlen er afsluttet',
  },
]

export const rejectedPath: Step[] = [
  {
    emoji: '⬅️',
    text: 'Køber bliver bedt om at købe en returlabel, som bruges til at returnere varerne',
  },
  {
    emoji: '📲',
    text: 'Når varerne er returneret, kan sælger rapportere evt. problemer til Gul&Gratis',
  },
  { emoji: '✅', text: 'Hvis ingen problemer rapporteres, returneres pengene for varen til køber' },
]

export const facts: Step[] = [
  {
    emoji: '💰',
    text: 'Når du handler via SikkerHandel, bliver pengene først frigivet til sælger, når køber har modtaget varen og er tilfreds.',
  },
  {
    emoji: '📦',
    text: 'Pakken leveres til den pakkeshop, der ligger tættest på din folkeregisteradresse.',
  },
  {
    emoji: '🔎',
    text: 'Hvis pakken ikke dukker op, kan du efterlyse den hos den relevante fragtleverandør (DAO eller PostNord).',
  },
  {
    emoji: '🏦',
    text: 'Udbetalinger sker som hovedregel alle hverdage, typisk første bankdag efter handlen er afsluttet.',
  },
]

export type Faq = {
  question: string
  answer: string[]
}

export const faqs: Faq[] = [
  {
    question: 'Hvad sker der, hvis jeg som køber ikke afhenter varen?',
    answer: [
      'Pakken ligger klar til dig i pakkeshoppen i en periode. Hvis du ikke når at afhente den, inden den bliver sendt retur, bliver handelsbeløbet udbetalt til sælger. Husk derfor at hente din pakke i god tid.',
    ],
  },
  {
    question: 'Hvordan returnerer jeg en vare?',
    answer: [
      'Du skal afvise varen inden for 12 timer, fra du har modtaget den. Når du har afvist varen, køber du en fragtlabel på Gul&Gratis og sender varen retur til sælger.',
    ],
  },
  {
    question: 'Hvad sker der, hvis jeg ikke godkender varen?',
    answer: [
      'Du har 12 timer, efter du har afhentet varen i pakkeshoppen, til at godkende eller afvise den. Gør du ingen af delene inden deadline, regnes det som en godkendelse, og handelsbeløbet bliver udbetalt til sælger.',
    ],
  },
  {
    question: 'Varen er ikke som beskrevet. Hvad gør jeg?',
    answer: [
      'Afvis varen og angiv årsagen, inden deadline udløber. Send derefter varen retur til sælger.',
    ],
  },
  {
    question: 'Hvem skal betale for fragten ved afvisning af en vare?',
    answer: [
      'Når køber afviser en vare, er det køber, der betaler for fragten, når varen sendes retur.',
    ],
  },
  {
    question: 'Hvem dækker skader under transport?',
    answer: [
      'Skader, der opstår under transporten, er dækket af Gul&Gratis’ fragt- og forsikringspartnere.',
    ],
  },
  {
    question: 'Hvornår får jeg mine penge udbetalt?',
    answer: [
      'Vi laver som hovedregel udbetalinger alle hverdage. Pengene fra en handel bliver derfor typisk sat til udbetaling første bankdag, efter handlen er afsluttet.',
    ],
  },
  {
    question: 'Hvor bliver min pakke leveret?',
    answer: [
      'Din pakke bliver leveret til den pakkeshop, der ligger tættest på din folkeregisteradresse. Adressen henter vi fra CPR-registeret, så du behøver ikke selv at vælge pakkeshop.',
    ],
  },
  {
    question: 'Hvordan efterlyser jeg min pakke?',
    answer: [
      'Levering med DAO: Hvis din pakke ikke er blevet scannet inden for de seneste 48 timer, bør du efterlyse den hos DAO. Kontakt DAO på kundeservice@dao.as eller telefon 72 33 08 50, og husk at oplyse pakkens indhold og pakkenummer, så DAO kan lede efter den.',
      'DAO har op til 10 hverdage til at søge efter pakken, men finder den ofte tidligere. Bliver pakken ikke fundet efter 10 hverdage, får køber og sælger efterfølgende deres handelsbeløb tilbage minus køber-/sælgerbeskyttelsen.',
      'Levering med PostNord: Hvis der er gået mere end tre hverdage siden sidste opdatering, skal du starte en chat i din PostNord-app, hvor du kan efterlyse pakken.',
    ],
  },
  {
    question: 'Hvornår modtager jeg mine varer?',
    answer: [
      'Sælger har 6 dage til at indlevere pakken til forsendelse. Har du spørgsmål om levering og forsendelse, er det sælger, du skal kontakte.',
    ],
  },
  {
    question: 'Hvorfor skal jeg oplyse mit CPR-nummer?',
    answer: [
      'Gul&Gratis bruger Safepay som betalingsserviceleverandør. Safepay er omfattet af hvidvaskloven, og derfor skal dit CPR-nummer oplyses som en del af kontrollen af, hvem du er (KYC – kend din kunde).',
    ],
  },
]
