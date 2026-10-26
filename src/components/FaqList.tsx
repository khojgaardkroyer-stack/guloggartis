import type { Faq } from '../content'

type Props = {
  title: string
  faqs: Faq[]
}

function FaqList({ title, faqs }: Props) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
      <h2 className="mb-4 text-2xl font-bold">{title}</h2>
      <div className="divide-y divide-gray-200">
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
    </section>
  )
}

export default FaqList
