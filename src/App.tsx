import { PiStorefront } from 'react-icons/pi'
import ggLogo from './assets/gg-logo.svg'
import logo from './assets/gul-og-gratis-logo.png'
import FaqDrawer from './components/FaqDrawer'
import Footer from './components/Footer'
import GGame from './components/GGame'
import TextSection from './components/TextSection'
import { faqs, sections } from './content'

const GUL_OG_GRATIS_URL = 'https://www.guloggratis.dk/'

function App() {
  return (
    <>
      <main className="relative min-h-screen bg-page-background px-4 pt-16 pb-24 text-text-primary sm:py-20">
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 flex items-center justify-center overflow-hidden"
        >
          <img src={ggLogo} alt="" className="w-[min(110vw,1100px)] max-w-none -rotate-12 opacity-[0.07]" />
        </div>
        <a href={GUL_OG_GRATIS_URL} className="absolute top-4 right-4 sm:top-6 sm:right-6">
          <img src={logo} alt="Gul&Gratis" className="h-4 sm:h-6" />
        </a>
        <div className="relative mx-auto max-w-2xl space-y-8">
          <header className="space-y-4 text-center">
            <h1 className="text-4xl font-bold sm:text-5xl">Hvad er SikkerHandel?</h1>
            <p className="text-lg">
              SikkerHandel på{' '}
              <a href={GUL_OG_GRATIS_URL} className="font-semibold text-text-link underline">
                GulogGratis.dk
              </a>{' '}
              er en tryg og nem løsning, der sikrer, at både køber og sælger får en sikker handel, når
              I handler genbrug online.
            </p>
            <p className="text-lg">
              Når køber betaler, står pengene på en sikret handelskonto, indtil varen er modtaget og
              godkendt. Først derefter bliver de udbetalt til sælger. Køber har 12 timer efter
              afhentning i pakkeshoppen til at tjekke varen, og er den ikke som beskrevet, kan den
              afvises og sendes retur.
            </p>
          </header>

          {sections.map((section) => (
            <TextSection key={section.title} section={section} />
          ))}

          <div className="flex flex-wrap justify-center gap-3">
            <a
              href={GUL_OG_GRATIS_URL}
              className="flex items-center gap-2 rounded-control-pill bg-button-tertiary-background px-5 py-2-5 text-lg font-semibold shadow-card-shadow transition hover:bg-state-hover-neutral"
            >
              <PiStorefront aria-hidden="true" className="size-8 text-icon-default" /> Kom i gang
            </a>
          </div>
        </div>
        <div className="relative mt-12 flex justify-center sm:justify-end">
          <GGame />
        </div>
        <FaqDrawer title="Ofte stillede spørgsmål" faqs={faqs} />
      </main>
      <Footer />
    </>
  )
}

export default App
