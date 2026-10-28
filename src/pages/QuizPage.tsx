import { useEffect, useRef, useState } from 'react'
import type { Ref } from 'react'
import type { IconType } from 'react-icons'
import {
  PiArrowCounterClockwise,
  PiArrowLeft,
  PiArrowRight,
  PiCheckCircle,
  PiFlag,
  PiXCircle,
} from 'react-icons/pi'
import { Link } from 'react-router'
import QuizItem from '../components/quiz/QuizItem'
import { items } from '../quiz/items'
import { type Answer, isCorrect, resultText, scoreOf, shuffle } from '../quiz/quiz'

const PILL_BASE =
  'flex items-center justify-center gap-2 rounded-control-pill bg-button-tertiary-background py-2-5 text-lg font-semibold shadow-card-shadow transition hover:bg-state-hover-neutral'
const PILL = `${PILL_BASE} px-5`
const CARD = 'rounded-3xl bg-surface-white p-6 shadow-card-shadow sm:p-8'

type PillButtonProps = {
  icon: IconType
  label: string
  onClick: () => void
  disabled?: boolean
  className?: string
  /** Less side padding on phones, so two buttons fit side by side */
  compact?: boolean
  ref?: Ref<HTMLButtonElement>
}

function PillButton({ icon: Icon, label, onClick, disabled, compact, className = '', ref }: PillButtonProps) {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${PILL_BASE} ${compact ? 'px-3 sm:px-5' : 'px-5'} disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-button-tertiary-background ${className}`}
    >
      <Icon aria-hidden="true" className="size-8 shrink-0 text-icon-default" /> {label}
    </button>
  )
}

function QuizPage() {
  const [order, setOrder] = useState(() => shuffle(items))
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Answer[]>([])

  const nextRef = useRef<HTMLButtonElement>(null)
  const progressRef = useRef<HTMLParagraphElement>(null)
  const resultRef = useRef<HTMLHeadingElement>(null)
  // Only move focus after the visitor has acted, not on the first render.
  const hasInteracted = useRef(false)

  const finished = index >= order.length
  const item = order[index]
  const answer = answers[index]
  const answered = answer !== undefined
  const isLast = index === order.length - 1

  useEffect(() => {
    if (!hasInteracted.current) return
    if (finished) resultRef.current?.focus()
    else if (answered) nextRef.current?.focus()
    else progressRef.current?.focus()
  }, [finished, answered, index])

  function choose(choice: Answer) {
    if (answered) return
    hasInteracted.current = true
    setAnswers((previous) => [...previous, choice])
  }

  function next() {
    setIndex((previous) => previous + 1)
  }

  function playAgain() {
    setOrder(shuffle(items))
    setAnswers([])
    setIndex(0)
  }

  const score = scoreOf(order.slice(0, answers.length).map((quizItem, i) => ({ item: quizItem, answer: answers[i] })))
  const correct = answered && isCorrect(item, answer)

  return (
    <>
      <title>Spot svindlen · SikkerHandel</title>
      <div className="relative mx-auto max-w-2xl space-y-8">
        <header className="space-y-4 text-center">
          <h1 className="text-4xl font-bold sm:text-5xl">Spot svindlen</h1>
          <p className="text-lg">
            Her er seks beskeder og annoncer. Nogle af dem er svindel, andre er helt i orden. Kan du se
            forskel?
          </p>
          <p className="text-sm">Alle navne, varer og beskeder er opdigtede.</p>
        </header>

        {finished ? (
          <section className={`${CARD} space-y-6 text-center`}>
            <h2 ref={resultRef} tabIndex={-1} className="text-3xl font-bold outline-none">
              {score} af {order.length} rigtige
            </h2>
            <div className="space-y-3 text-lg text-text-primary">
              <p>{resultText(score, order.length)}</p>
              <p>
                Uanset hvad står pengene med SikkerHandel på en sikret handelskonto, indtil varen er
                modtaget og godkendt.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <PillButton icon={PiArrowCounterClockwise} label="Spil igen" onClick={playAgain} />
              <Link to="/" className={PILL}>
                <PiArrowLeft aria-hidden="true" className="size-8 shrink-0 text-icon-default" /> Tilbage
                til forsiden
              </Link>
            </div>
          </section>
        ) : (
          <section className={`${CARD} space-y-6`} aria-label="Spot svindlen">
            <p ref={progressRef} tabIndex={-1} className="text-sm font-semibold outline-none">
              Besked {index + 1} af {order.length}
            </p>

            <QuizItem item={item} revealed={answered} />

            <div className="grid grid-cols-2 gap-3">
              <PillButton
                icon={PiFlag}
                label="Svindel"
                onClick={() => choose('scam')}
                disabled={answered}
                compact
                className={answer === 'scam' ? 'ring-2 ring-text-primary' : ''}
              />
              <PillButton
                icon={PiCheckCircle}
                label="I orden"
                onClick={() => choose('fine')}
                disabled={answered}
                compact
                className={answer === 'fine' ? 'ring-2 ring-text-primary' : ''}
              />
            </div>

            <div aria-live="polite">
              {answered && (
                <div className="space-y-4 border-t border-surface-gray-light pt-6">
                  <p className="flex items-center gap-2 text-xl font-bold text-text-primary">
                    {correct ? (
                      <PiCheckCircle aria-hidden="true" className="size-8 shrink-0 text-text-green" />
                    ) : (
                      <PiXCircle
                        aria-hidden="true"
                        className="size-8 shrink-0 text-foundation-palette-red-700"
                      />
                    )}
                    {correct ? 'Rigtigt!' : 'Ikke helt.'} {item.isScam ? 'Det var svindel.' : 'Den var i orden.'}
                  </p>
                  <p className="text-lg text-text-primary">{item.explanation}</p>
                  <div className="flex justify-end">
                    <PillButton
                      ref={nextRef}
                      icon={PiArrowRight}
                      label={isLast ? 'Se dit resultat' : 'Næste'}
                      onClick={next}
                    />
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </>
  )
}

export default QuizPage
