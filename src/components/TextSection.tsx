import type { Section } from '../content'

type Props = {
  section: Section
}

function TextSection({ section }: Props) {
  const Icon = section.icon
  return (
    <section className="rounded-3xl bg-surface-white p-6 shadow-card-shadow sm:p-8">
      <h2 className="mb-4 flex items-center gap-3 text-2xl font-bold">
        <span
          aria-hidden="true"
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-yellow-light text-xl text-icon-default"
        >
          <Icon />
        </span>
        {section.title}
      </h2>
      <div className="space-y-3 text-lg text-text-primary">
        {section.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </section>
  )
}

export default TextSection
