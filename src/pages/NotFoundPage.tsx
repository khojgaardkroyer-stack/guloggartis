import { PiArrowLeft } from 'react-icons/pi'
import { Link } from 'react-router'
import GGame from '../components/GGame'
import { GUL_OG_GRATIS_URL } from '../content'

function NotFoundPage() {
  return (
    <>
      <title>Siden findes ikke · SikkerHandel</title>
      <div className="relative mx-auto max-w-2xl space-y-8">
        <header className="space-y-4 text-center">
          <h1 className="text-4xl font-bold sm:text-5xl">
            <strong>404</strong> Den er væk væk
          </h1>
          <p className="text-lg font-semibold">Siden er væk, men måske kan du nå at levere pakken?</p>
        </header>

        <div className="flex justify-center">
          <GGame />
        </div>

        <p className="text-center text-lg">
          Vi har allerede kigget i kælderen, garagen og loftsrummet, men denne side findes desværre ikke
          længere. Heldigvis bliver der lagt nye annoncer op hele tiden på{' '}
          <a href={GUL_OG_GRATIS_URL} className="font-semibold whitespace-nowrap text-text-link underline">
            GulogGratis
          </a>
          .
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-2 rounded-control-pill bg-button-tertiary-background px-5 py-2-5 text-lg font-semibold shadow-card-shadow transition hover:bg-state-hover-neutral"
          >
            <PiArrowLeft aria-hidden="true" className="size-8 text-icon-default" /> Tilbage til SikkerHandel
          </Link>
        </div>
      </div>
    </>
  )
}

export default NotFoundPage
