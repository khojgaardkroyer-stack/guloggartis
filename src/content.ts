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
