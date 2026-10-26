import type { Section } from '../content'

type Props = {
  section: Section
}

function TextSection({ section }: Props) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
      <h2 className="mb-4 flex items-center gap-3 text-2xl font-bold">
        <span
          aria-hidden="true"
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-yellow-100 text-xl"
        >
          {section.emoji}
        </span>
        {section.title}
      </h2>
      <div className="space-y-3 text-lg leading-relaxed text-gray-700">
        {section.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </section>
  )
}

export default TextSection
