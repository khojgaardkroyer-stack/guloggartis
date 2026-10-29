import Walkthrough from '../components/walkthrough/Walkthrough'

function TryItPage() {
  return (
    <>
      <title>Prøv det selv · SikkerHandel</title>
      <div className="relative mx-auto max-w-2xl space-y-8">
        <header className="space-y-4 text-center">
          <h1 className="text-4xl font-bold sm:text-5xl">Prøv det selv</h1>
          <p className="text-lg">
            Spil en SikkerHandel igennem som køber eller sælger, og se hvor pengene er undervejs.
          </p>
        </header>
        <Walkthrough />
      </div>
    </>
  )
}

export default TryItPage
