import type { IconType } from 'react-icons'
import { PiBicycle, PiDeviceMobile } from 'react-icons/pi'

type ItemBase = {
  id: string
  /** Short line above the item telling the visitor whose side they are on */
  situation: string
  isScam: boolean
  /** Exact substring of the field named by `warningIn` to highlight after answering. Scams only. */
  warning?: string
  warningIn?: 'text' | 'title' | 'description'
  /** 1–2 sentences: why, and how SikkerHandel protects you */
  explanation: string
}

export type ChatItem = ItemBase & {
  kind: 'chat'
  sender: string
  text: string
}

export type AdItem = ItemBase & {
  kind: 'ad'
  icon: IconType
  title: string
  price: string
  place: string
  description: string
}

export type QuizItem = ChatItem | AdItem

/** All names, goods and messages are made up. */
export const items: QuizItem[] = [
  {
    id: 'mobilepay-first',
    kind: 'chat',
    situation: 'Du vil købe en mountainbike.',
    sender: 'Lars_88',
    text: 'Hej! Cyklen er din for 300 kr. Send pengene på MobilePay først, så sender jeg den i morgen.',
    isScam: true,
    warning: 'Send pengene på MobilePay først',
    warningIn: 'text',
    explanation:
      'Betaler du uden om Gul&Gratis, er pengene væk, hvis cyklen aldrig kommer. Med SikkerHandel står pengene på en sikret handelskonto, indtil du har godkendt varen.',
  },
  {
    id: 'phishing-link',
    kind: 'chat',
    situation: 'Du sælger din sofa.',
    sender: 'Sofie_K_92',
    text: 'Jeg vil gerne købe sofaen! Udfyld lige dine kortoplysninger på gulgratis-udbetaling.net, så får du pengene med det samme.',
    isScam: true,
    warning: 'gulgratis-udbetaling.net',
    warningIn: 'text',
    explanation:
      'Linket fører væk fra Gul&Gratis, og det er sådan, svindlere stjæler kortoplysninger. Med SikkerHandel foregår både betaling og udbetaling inde på Gul&Gratis.',
  },
  {
    id: 'cousin-pickup',
    kind: 'chat',
    situation: 'Du sælger din PlayStation.',
    sender: 'Mikkel.D',
    text: 'Fedt! Jeg er ude at rejse, så min fætter henter den i aften. Jeg overfører pengene, når han har den.',
    isScam: true,
    warning: 'min fætter henter den',
    warningIn: 'text',
    explanation:
      'Når en anden henter varen, og pengene først kommer bagefter, kan du ende uden både vare og penge. Med SikkerHandel sender du først varen, når køber har betalt til den sikrede handelskonto.',
  },
  {
    id: 'too-good-iphone',
    kind: 'ad',
    situation: 'Du leder efter en ny telefon.',
    icon: PiDeviceMobile,
    title: 'iPhone 16 Pro, 256 GB, som ny',
    price: '900 kr.',
    place: 'Odense',
    description:
      'Skal væk i dag! Fem andre er interesserede, så den første, der betaler, får den.',
    isScam: true,
    warning: 'Skal væk i dag! Fem andre er interesserede',
    warningIn: 'description',
    explanation:
      'En næsten ny iPhone til 900 kr. er for god til at være sand, og presset skal få dig til at handle, før du når at tænke. Med SikkerHandel betaler du aldrig direkte til sælger, og pengene udbetales først, når du har godkendt varen.',
  },
  {
    id: 'kids-bike',
    kind: 'ad',
    situation: 'Du leder efter en cykel til dit barn.',
    icon: PiBicycle,
    title: 'Børnecykel, 16 tommer',
    price: '350 kr.',
    place: 'Vejle',
    description: 'Brugt i to somre og har lidt ridser på skærmen. Sendes gerne med SikkerHandel.',
    isScam: false,
    explanation:
      'Alt ser fint ud: en realistisk pris, en ærlig beskrivelse, og sælger vil gerne bruge SikkerHandel.',
  },
  {
    id: 'rug-buyer',
    kind: 'chat',
    situation: 'Du sælger dit gulvtæppe.',
    sender: 'Anne_strikker',
    text: 'Hej! Er tæppet stadig til salg? Jeg køber det gerne med SikkerHandel, så kan du sende det, når jeg har betalt.',
    isScam: false,
    explanation:
      'Her er intet at være bange for. Køber vil bruge SikkerHandel, så pengene står sikkert, indtil hun har fået tæppet.',
  },
]
