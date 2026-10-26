import { FaFacebook, FaInstagram, FaLinkedinIn, FaTiktok, FaYoutube } from 'react-icons/fa6'

// TODO: replace with the real Gul&Gratis URLs
const GUL_OG_GRATIS_URL = 'https://www.guloggratis.dk/'

const socials = [
  { name: 'Facebook', icon: FaFacebook },
  { name: 'LinkedIn', icon: FaLinkedinIn },
  { name: 'Instagram', icon: FaInstagram },
  { name: 'TikTok', icon: FaTiktok },
  { name: 'YouTube', icon: FaYoutube },
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

function Footer() {
  return (
    <footer className="relative bg-white px-4 pt-12 pb-24 text-gray-900 sm:pb-12">
      <div className="mx-auto grid max-w-5xl gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <ul className="flex flex-wrap gap-1.5">
            {socials.map(({ name, icon: Icon }) => (
              <li key={name}>
                <a
                  href={GUL_OG_GRATIS_URL}
                  aria-label={name}
                  className="flex size-9 items-center justify-center rounded-full bg-gray-100 text-lg transition hover:bg-gray-200"
                >
                  <Icon aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
          <address className="text-lg leading-relaxed not-italic">
            GulogGratis.dk A/S
            <br />
            Banegårdspladsen 1
            <br />
            5000 Odense C
          </address>
        </div>

        {columns.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <h2 className="mb-3 text-lg font-semibold">{column.title}</h2>
            <ul className="space-y-1.5">
              {column.links.map((link) => (
                <li key={link}>
                  <a href={GUL_OG_GRATIS_URL} className="underline hover:no-underline">
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
