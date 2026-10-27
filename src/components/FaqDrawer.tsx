import { useEffect, useRef, useState } from 'react'
import { PiPlus, PiQuestion, PiX } from 'react-icons/pi'
import type { Faq } from '../content'

type Props = {
  title: string
  faqs: Faq[]
}

function FaqDrawer({ title, faqs }: Props) {
  const [open, setOpen] = useState(false)
  const closeButton = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    closeButton.current?.focus()
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="faq-drawer"
        className="fixed bottom-4 left-4 z-20 flex items-center gap-2 rounded-control-pill bg-button-tertiary-background px-5 py-2-5 text-lg font-semibold text-text-primary shadow-card-shadow transition hover:bg-state-hover-neutral sm:top-6 sm:bottom-auto sm:left-6"
      >
        <PiQuestion aria-hidden="true" className="size-8 text-icon-default" /> {title}
      </button>

      <div
        aria-hidden="true"
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-30 bg-surface-overlay-gray transition-opacity ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      />

      <aside
        id="faq-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        inert={!open}
        className={`fixed inset-y-0 left-0 z-40 flex w-full max-w-md flex-col bg-surface-white text-text-primary transition duration-300 ${open ? 'translate-x-0 shadow-card-shadow' : '-translate-x-full'}`}
      >
        {/* Header as in the manual's modal: Headline/2XL - Bold and a grey round close button */}
        <div className="flex items-center justify-between gap-4 border-b border-border-default px-6 py-4">
          <h2 className="text-2xl font-bold">{title}</h2>
          <button
            ref={closeButton}
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Luk"
            className="flex shrink-0 items-center justify-center rounded-control-pill bg-button-secondary-background p-2 text-icon-default transition hover:bg-state-hover-neutral"
          >
            <PiX aria-hidden="true" className="size-4" />
          </button>
        </div>
        <div className="flex-1 divide-y divide-border-divider overflow-y-auto px-6">
          {faqs.map((faq) => (
            <details key={faq.question} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold">
                {faq.question}
                <span
                  aria-hidden="true"
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-yellow-light text-icon-default transition group-open:rotate-45"
                >
                  <PiPlus className="size-4" />
                </span>
              </summary>
              <div className="mt-3 space-y-3 text-lg">
                {faq.answer.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </details>
          ))}
        </div>
      </aside>
    </>
  )
}

export default FaqDrawer
