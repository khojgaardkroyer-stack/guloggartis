import type { Step } from '../content'

type Props = {
  title: string
  steps: Step[]
}

function StepList({ title, steps }: Props) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
      <h2 className="mb-6 text-2xl font-bold">{title}</h2>
      <ol className="space-y-4">
        {steps.map((step, i) => (
          <li key={i} className="flex gap-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-yellow-100 text-xl">
              <span aria-hidden="true">{step.emoji}</span>
            </span>
            <p className="pt-2 text-lg leading-snug">
              <span className="mr-1 font-semibold text-gray-500">{i + 1}.</span>
              {step.text}
            </p>
          </li>
        ))}
      </ol>
    </section>
  )
}

export default StepList
