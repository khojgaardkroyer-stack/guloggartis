import {
  PiFacebookLogo,
  PiInstagramLogo,
  PiLinkedinLogo,
  PiTiktokLogo,
  PiYoutubeLogo,
} from 'react-icons/pi'

// TODO: replace with the real Gul&Gratis URLs
const GUL_OG_GRATIS_URL = 'https://www.guloggratis.dk/'

const socials = [
  { name: 'Facebook', icon: PiFacebookLogo },
  { name: 'LinkedIn', icon: PiLinkedinLogo },
  { name: 'Instagram', icon: PiInstagramLogo },
  { name: 'TikTok', icon: PiTiktokLogo },
  { name: 'YouTube', icon: PiYoutubeLogo },
]

const columns = [
  {
    title: 'Gul&Gratis',
    links: [
      'GG+ Abonnement',
      'Credits',
      'SikkerHandel',
      'Kundeservice',
      'Shop',
      'Guide',
      'E-avis',
      'Kategorioversigt',
      'Hvad er Gul&Gratis?',
    ],
  },
  {
    title: 'Vilkår og politikker',
    links: [
      'Brugervilkår',
      'Privatlivspolitik',
      'Indholdsmoderation',
      'Annonceringsregler',
      'Generelle konkurrencevilkår',
      'Whistleblowerordning',
    ],
  },
  {
    title: 'Erhverv',
    links: [
      'Erhvervsannoncering',
      'Vilkår for erhverv',
      'Samarbejdspartnere',
      'Annoncørbetalt indhold',
    ],
  },
]

type Props = {
  onTiktokClick: () => void
}

// Built after the manual's desktop footer (Figma node 994:20204)
function Footer({ onTiktokClick }: Props) {
  return (
    <footer className="relative border-t border-border-default bg-surface-gray-light px-4 pt-12 pb-24 text-text-primary sm:pb-12">
      <div className="mx-auto grid max-w-5xl gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <ul className="flex flex-wrap gap-2">
            {socials.map(({ name, icon: Icon }) => (
              <li key={name}>
                <a
                  href={GUL_OG_GRATIS_URL}
                  aria-label={name}
                  // Easter egg: TikTok swaps the page background instead of leaving the page
                  onClick={
                    name === 'TikTok'
                      ? (e) => {
                          e.preventDefault()
                          onTiktokClick()
                        }
                      : undefined
                  }
                  className="flex items-center justify-center rounded-control-pill bg-button-tertiary-background p-2-5 text-icon-default transition hover:bg-state-hover-neutral"
                >
                  <Icon aria-hidden="true" className="size-5" />
                </a>
              </li>
            ))}
          </ul>
          <address className="text-sm not-italic">
            <span className="block py-1">GulogGratis.dk A/S</span>
            <span className="block py-1">Banegårdspladsen 1</span>
            <span className="block py-1">5000 Odense C</span>
          </address>
        </div>

        {columns.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <h2 className="mb-2 text-base font-semibold">{column.title}</h2>
            <ul className="space-y-1 text-base">
              {column.links.map((link) => (
                <li key={link}>
                  <a href={GUL_OG_GRATIS_URL} className="text-text-secondary underline hover:no-underline">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
    </footer>
  )
}

export default Footer
