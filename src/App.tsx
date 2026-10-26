import StepList from './components/StepList'
import { happyPath, rejectedPath } from './content'

const GUL_OG_GRATIS_URL = 'https://www.guloggratis.dk/'

function App() {
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12 text-gray-900 sm:py-20">
      <div className="mx-auto max-w-2xl space-y-8">
        <header className="space-y-4 text-center">
          <p className="inline-block rounded-full bg-yellow-200 px-4 py-1 text-sm font-semibold">
            Gul&Gratis
          </p>
          <h1 className="text-4xl font-bold sm:text-5xl">SikkerHandel</h1>
          <p className="text-lg text-gray-600">
            Pengene ligger på en sikret handelskonto, indtil køber har godkendt varerne.
          </p>
        </header>

        <StepList title="Det fungerer sådan her" steps={happyPath} />
        <StepList title="Hvis køber IKKE godkender varerne" steps={rejectedPath} />

        <div className="flex flex-wrap justify-center gap-3">
          <a
            href={GUL_OG_GRATIS_URL}
            className="flex items-center gap-2 rounded-full bg-gray-200 px-6 py-3 font-semibold transition hover:bg-gray-300"
          >
            <span aria-hidden="true">🛒</span> Gå på skattejagt
          </a>
          <a
            href={GUL_OG_GRATIS_URL}
            className="flex items-center gap-2 rounded-full bg-yellow-300 px-6 py-3 font-semibold transition hover:bg-yellow-400"
          >
            <span aria-hidden="true">🏪</span> Kom i gang
          </a>
        </div>
      </div>
    </main>
  )
}

export default App
