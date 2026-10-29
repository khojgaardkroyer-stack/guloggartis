/**
 * The "Prøv det selv" walkthrough as data: every step, what each role sees and where each choice
 * leads. Components only render what this file says. The facts follow src/content.ts.
 */

export type Role = 'buyer' | 'seller'

/** Where the money is: with the buyer, on the secured trade account, paid out, or refunded. */
export type Money = 'buyer' | 'escrow' | 'seller' | 'refunded'

/** Who makes a move on a step. `both` means each role makes its own move, `null` means nobody does. */
export type Actor = Role | 'both' | null

export type StepId =
  | 'bud'
  | 'betaling'
  | 'forsendelse'
  | 'levering'
  | 'godkendelse'
  | 'tolv-timer'
  | 'udbetaling'
  | 'bedoemmelse'
  | 'afsluttet'
  | 'retur'
  | 'returtjek'
  | 'penge-tilbage'

export type Choice = { label: string; next: StepId }

/** The other party's rating of the visitor, shown on the end screen. */
export type Review = { stars: number; text: string }

/**
 * What one role sees on a step. A role that acts has `choices` (and so does a seller at
 * Godkendelse, who picks the buyer's reaction). A role that doesn't has an
 * `event` (what the other party did) and a single `next`, or only `next` when nobody acts.
 * End steps have neither choices nor next.
 */
export type RoleContent = {
  text: string[]
  choices?: Choice[]
  event?: string
  next?: StepId
  review?: Review
}

export type Step = {
  id: StepId
  title: string
  money: Money
  /** Position for the progress bar; `null` shows no number. */
  progress: { step: number; total: number } | null
  actor: Actor
  /** The acting role gives the other party 1–5 stars before choosing. */
  rating?: boolean
  buyer?: RoleContent
  seller?: RoleContent
}

export const ROLE_LABEL: Record<Role, string> = { buyer: 'Køber', seller: 'Sælger' }

/** The other party, as written mid-sentence. */
export const OTHER_PARTY: Record<Role, string> = { buyer: 'sælger', seller: 'køber' }

export const MONEY_LABEL: Record<Money, string> = {
  buyer: 'Pengene er hos køber.',
  escrow: 'Pengene står sikkert på handelskontoen.',
  seller: 'Pengene er udbetalt til sælger.',
  refunded: 'Pengene er tilbage hos køber.',
}

export function starsLabel(stars: number): string {
  return stars === 1 ? '1 stjerne' : `${stars} stjerner`
}

const NORMAL = 7
const RETURN = 8

export const steps: Record<StepId, Step> = {
  bud: {
    id: 'bud',
    title: 'Bud',
    money: 'buyer',
    progress: { step: 1, total: NORMAL },
    actor: 'both',
    buyer: {
      text: [
        "Du har fundet en brugt guitar til 800 kr. Den har et par ridser, men spiller stadig 'Smoke on the Water' uden at klage.",
      ],
      choices: [{ label: 'Byd 800 kr.', next: 'betaling' }],
    },
    seller: {
      text: ['Du sælger din gamle guitar. En køber har budt 800 kr.'],
      choices: [{ label: 'Accepter buddet', next: 'betaling' }],
    },
  },
  betaling: {
    id: 'betaling',
    title: 'Betaling',
    money: 'escrow',
    progress: { step: 2, total: NORMAL },
    actor: 'buyer',
    buyer: {
      text: [
        'Sælger har accepteret dit bud! Du betaler 800 kr., og pengene går til den sikrede handelskonto, ikke direkte til sælger.',
      ],
      choices: [{ label: 'Betal 800 kr.', next: 'forsendelse' }],
    },
    seller: {
      text: [],
      event:
        'Køber har betalt. Pengene står på den sikrede handelskonto, så du ved, de er der, men du får dem først, når køber har godkendt guitaren.',
      next: 'forsendelse',
    },
  },
  forsendelse: {
    id: 'forsendelse',
    title: 'Forsendelse',
    money: 'escrow',
    progress: { step: 3, total: NORMAL },
    actor: 'seller',
    buyer: {
      text: [],
      event: 'Sælger har fået en pakkelabel og har indleveret pakken.',
      next: 'levering',
    },
    seller: {
      text: [
        'Du har fået en pakkelabel. Du har 6 dage til at indlevere pakken, så der er tid til at finde noget bobleplast.',
      ],
      choices: [{ label: 'Indlever pakken', next: 'levering' }],
    },
  },
  levering: {
    id: 'levering',
    title: 'Levering',
    money: 'escrow',
    progress: { step: 4, total: NORMAL },
    actor: null,
    buyer: {
      text: ['Pakken er kommet til den pakkeshop, der ligger tættest på din folkeregisteradresse.'],
      next: 'godkendelse',
    },
    seller: {
      text: ['Pakken er kommet frem til købers pakkeshop.'],
      next: 'godkendelse',
    },
  },
  godkendelse: {
    id: 'godkendelse',
    title: 'Godkendelse',
    money: 'escrow',
    progress: { step: 5, total: NORMAL },
    // Only the buyer acts, but a visiting seller picks the buyer's reaction so both paths are reachable.
    actor: 'buyer',
    buyer: {
      text: ['Du har hentet guitaren. Du har 12 timer til at godkende eller afvise den.'],
      choices: [
        { label: 'Godkend varen', next: 'udbetaling' },
        { label: 'Afvis varen', next: 'retur' },
        { label: 'Gør ingenting', next: 'tolv-timer' },
      ],
    },
    seller: {
      text: [
        'Køber har hentet guitaren og har 12 timer til at godkende eller afvise den. Hvad gør køber?',
      ],
      choices: [
        { label: 'Køber er glad', next: 'udbetaling' },
        { label: 'Køber afviser varen', next: 'retur' },
      ],
    },
  },
  'tolv-timer': {
    id: 'tolv-timer',
    title: '12 timer senere …',
    money: 'escrow',
    progress: { step: 5, total: NORMAL },
    actor: null,
    buyer: {
      text: ['Du gjorde ingenting i 12 timer. Det tæller som en godkendelse, så handlen fortsætter.'],
      next: 'udbetaling',
    },
  },
  udbetaling: {
    id: 'udbetaling',
    title: 'Udbetaling',
    money: 'seller',
    progress: { step: 6, total: NORMAL },
    actor: null,
    buyer: {
      text: ['Handlen er godkendt. Pengene bliver udbetalt til sælger, typisk første bankdag efter.'],
      next: 'bedoemmelse',
    },
    seller: {
      text: ['Køber har godkendt guitaren. Pengene bliver udbetalt til dig, typisk første bankdag efter.'],
      next: 'bedoemmelse',
    },
  },
  bedoemmelse: {
    id: 'bedoemmelse',
    title: 'Bedømmelse',
    money: 'seller',
    progress: { step: 7, total: NORMAL },
    actor: 'both',
    rating: true,
    buyer: {
      text: ['Hvordan gik handlen med sælger?'],
      choices: [{ label: 'Giv bedømmelse', next: 'afsluttet' }],
    },
    seller: {
      text: ['Hvordan gik handlen med køber?'],
      choices: [{ label: 'Giv bedømmelse', next: 'afsluttet' }],
    },
  },
  afsluttet: {
    id: 'afsluttet',
    title: 'Handlen er afsluttet 🎸',
    money: 'seller',
    progress: null,
    actor: null,
    buyer: {
      review: {
        stars: 5,
        text: "Sælger gav dig 5 stjerner: 'Hurtig betaling, og du spurgte ikke én gang, om den kan spille Wonderwall. Topkøber!'",
      },
      text: ['Pengene stod sikkert på handelskontoen, indtil guitaren var godkendt. Det er SikkerHandel.'],
    },
    seller: {
      review: {
        stars: 5,
        text: "Køber gav dig 5 stjerner: 'Guitaren var pakket ind i så meget bobleplast, at jeg stadig pakker ud. Tak!'",
      },
      text: ['Pengene stod sikkert på handelskontoen, indtil guitaren var godkendt. Det er SikkerHandel.'],
    },
  },
  retur: {
    id: 'retur',
    title: 'Retur',
    money: 'escrow',
    progress: { step: 6, total: RETURN },
    actor: 'buyer',
    buyer: {
      text: ['Du afviste guitaren. Nu køber du en returlabel og sender den tilbage til sælger.'],
      choices: [{ label: 'Køb returlabel og send', next: 'returtjek' }],
    },
    seller: {
      text: [],
      event: 'Køber afviste guitaren og har sendt den retur med en returlabel.',
      next: 'returtjek',
    },
  },
  returtjek: {
    id: 'returtjek',
    title: 'Returtjek',
    money: 'escrow',
    progress: { step: 7, total: RETURN },
    actor: 'seller',
    buyer: {
      text: [],
      event: 'Sælger har modtaget guitaren og har ikke meldt nogen problemer.',
      next: 'penge-tilbage',
    },
    seller: {
      text: ['Guitaren er kommet retur. Er der problemer, kan du melde dem til Gul&Gratis. Ser alt fint ud?'],
      choices: [{ label: 'Alt er i orden', next: 'penge-tilbage' }],
    },
  },
  'penge-tilbage': {
    id: 'penge-tilbage',
    title: 'Penge tilbage',
    money: 'refunded',
    progress: { step: 8, total: RETURN },
    actor: null,
    buyer: {
      text: [
        'Du får pengene for guitaren tilbage. Ingen skade sket!',
        'Pengene stod sikkert på handelskontoen hele vejen. Det er SikkerHandel.',
      ],
    },
    seller: {
      text: [
        "Køber får pengene tilbage, og du har din guitar igen. Måske er den bare ikke til 'Smoke on the Water' alligevel.",
        'Pengene stod sikkert på handelskontoen hele vejen. Det er SikkerHandel.',
      ],
    },
  },
}

export function startStep(): StepId {
  return 'bud'
}

export function isEnd(step: StepId): boolean {
  const { buyer, seller } = steps[step]
  return [buyer, seller].every((content) => !content || (!content.choices && !content.next))
}

/** What a role sees on a step: its choices, the other party's event, a plain "Videre" or the end. */
export type View =
  | { kind: 'choices'; text: string[]; choices: Choice[] }
  | { kind: 'event'; text: string[]; event: string; next: StepId }
  | { kind: 'continue'; text: string[]; next: StepId }
  | { kind: 'end'; text: string[]; review?: Review }

export function viewFor(step: StepId, role: Role): View {
  const content = steps[step][role]
  if (!content) throw new Error(`Step "${step}" has nothing for ${role}`)
  const { text } = content
  if (content.choices) return { kind: 'choices', text, choices: content.choices }
  if (content.next && content.event) return { kind: 'event', text, event: content.event, next: content.next }
  if (content.next) return { kind: 'continue', text, next: content.next }
  return { kind: 'end', text, review: content.review }
}

/** Every step a choice, event or "Videre" on this step can lead to, for one role. */
export function nextSteps(step: StepId, role: Role): StepId[] {
  const view = viewFor(step, role)
  if (view.kind === 'choices') return view.choices.map((choice) => choice.next)
  if (view.kind === 'end') return []
  return [view.next]
}
