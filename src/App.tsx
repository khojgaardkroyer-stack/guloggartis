import gLogo from './assets/g-logo.png'
import logo from './assets/gul-og-gratis-logo.png'
import StepList from './components/StepList'
import { facts, happyPath, rejectedPath } from './content'

const GUL_OG_GRATIS_URL = 'https://www.guloggratis.dk/'

function App() {
  return (
    <main className="relative min-h-screen bg-[#F3C91D] px-4 py-16 text-gray-900 sm:py-20">
      <a href={GUL_OG_GRATIS_URL} className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <img src={logo} alt="Gul&Gratis" className="h-5 mix-blend-multiply sm:h-7" />
      </a>
      <div className="mx-auto max-w-2xl space-y-8">
        <header className="space-y-4 text-center">
          <img src={gLogo} alt="" className="mx-auto h-24 sm:h-28" />
          <h1 className="text-4xl font-bold sm:text-5xl">SikkerHandel</h1>
          <p className="text-lg text-gray-800">
            SikkerHandel på{' '}
            <a href={GUL_OG_GRATIS_URL} className="font-semibold text-gray-900 underline">
              GulogGratis.dk
            </a>{' '}
            er en tryg og nem løsning, der sikrer, at både køber og sælger får en sikker handel, når
            I handler genbrug online.
          </p>
        </header>

        <StepList title="Hvad er SikkerHandel?" steps={facts} numbered={false} />
        <StepList title="Det fungerer sådan her" steps={happyPath} />
        <StepList title="Hvis køber IKKE godkender varerne" steps={rejectedPath} />

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
