import ggLogo from './assets/gg-logo.svg'
import logo from './assets/gul-og-gratis-logo.png'
import FaqList from './components/FaqList'
import StepList from './components/StepList'
import { facts, faqs, happyPath, rejectedPath } from './content'

const GUL_OG_GRATIS_URL = 'https://www.guloggratis.dk/'

function App() {
  return (
    <main className="relative min-h-screen bg-[#F3C91D] px-4 py-16 text-gray-900 sm:py-20">
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
          <p className="text-lg text-gray-800">
            SikkerHandel på{' '}
            <a href={GUL_OG_GRATIS_URL} className="font-semibold text-gray-900 underline">
              GulogGratis.dk
            </a>{' '}
            er en tryg og nem løsning, der sikrer, at både køber og sælger får en sikker handel, når
            I handler genbrug online.
          </p>
          <p className="text-lg text-gray-800">
            Når køber betaler, står pengene på en sikret handelskonto, indtil varen er modtaget og
            godkendt. Først derefter bliver de udbetalt til sælger. Køber har 12 timer efter
            afhentning i pakkeshoppen til at tjekke varen, og er den ikke som beskrevet, kan den
            afvises og sendes retur.
          </p>
        </header>

        <StepList title="Kort fortalt" steps={facts} numbered={false} />
        <StepList title="Det fungerer sådan her" steps={happyPath} />
        <StepList title="Hvis køber IKKE godkender varerne" steps={rejectedPath} />
        <FaqList title="Ofte stillede spørgsmål" faqs={faqs} />

        <div className="flex flex-wrap justify-center gap-3">
          <a
            href={GUL_OG_GRATIS_URL}
            className="flex items-center gap-2 rounded-full bg-gray-900 px-6 py-3 font-semibold text-white transition hover:bg-gray-700"
          >
            <span aria-hidden="true">🏪</span> Kom i gang
          </a>
        </div>
      </div>
    </main>
  )
}

export default App
