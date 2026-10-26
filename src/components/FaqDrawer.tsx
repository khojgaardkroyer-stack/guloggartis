import { useEffect, useRef, useState } from 'react'
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
        className="fixed bottom-4 left-4 z-20 flex items-center gap-2 rounded-full bg-white px-5 py-3 font-semibold text-gray-900 shadow-lg transition hover:bg-gray-100 sm:top-6 sm:bottom-auto sm:left-6"
      >
        <span aria-hidden="true">❓</span> {title}
      </button>

      <div
        aria-hidden="true"
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-30 bg-black/40 transition-opacity ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      />

      <aside
        id="faq-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        inert={!open}
        className={`fixed inset-y-0 left-0 z-40 flex w-full max-w-md flex-col bg-white shadow-xl transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center justify-between gap-4 border-b border-gray-200 p-6">
          <h2 className="text-2xl font-bold">{title}</h2>
          <button
            ref={closeButton}
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Luk"
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-yellow-100 text-xl transition hover:bg-yellow-200"
          >
            ×
          </button>
        </div>
        <div className="flex-1 divide-y divide-gray-200 overflow-y-auto px-6">
          {faqs.map((faq) => (
            <details key={faq.question} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold">
                {faq.question}
                <span
                  aria-hidden="true"
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-yellow-100 transition group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <div className="mt-3 space-y-3 text-lg leading-snug text-gray-700">
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
