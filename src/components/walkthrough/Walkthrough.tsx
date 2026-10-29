import { useEffect, useRef, useState } from 'react'
import type { Ref } from 'react'
import type { IconType } from 'react-icons'
import {
  PiArrowCounterClockwise,
  PiArrowLeft,
  PiArrowRight,
  PiChatCircleDots,
  PiGuitar,
  PiShoppingCart,
  PiStarFill,
  PiStorefront,
} from 'react-icons/pi'
import {
  OTHER_PARTY,
  type Role,
  startStep,
  type StepId,
  starsLabel,
  steps,
  viewFor,
} from '../../walkthrough/flow'
import MoneyTrack from './MoneyTrack'
import ProgressBar from './ProgressBar'
import StarRating from './StarRating'

const ROLE_ICON: Record<Role, IconType> = { buyer: PiShoppingCart, seller: PiStorefront }
const OTHER_ROLE: Record<Role, Role> = { buyer: 'seller', seller: 'buyer' }
const TRY_AS: Record<Role, string> = { buyer: 'Prøv som køber', seller: 'Prøv som sælger' }

type PillButtonProps = {
  icon: IconType
  label: string
  onClick: () => void
  disabled?: boolean
  small?: boolean
}

function PillButton({ icon: Icon, label, onClick, disabled, small }: PillButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center gap-2 rounded-control-pill bg-button-tertiary-background font-semibold shadow-card-shadow transition hover:bg-state-hover-neutral disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-button-tertiary-background ${
        small ? 'px-4 py-2 text-base' : 'px-5 py-2-5 text-lg'
      }`}
    >
      <Icon aria-hidden="true" className={`${small ? 'size-6' : 'size-8'} shrink-0 text-icon-default`} />{' '}
      {label}
    </button>
  )
}

function Stars({ count }: { count: number }) {
  return (
    <span aria-hidden="true" className="flex gap-1">
      {Array.from({ length: count }, (_, i) => (
        <PiStarFill key={i} className="size-6 text-icon-default" />
      ))}
    </span>
  )
}

/**
 * "Prøv det selv": the visitor plays a SikkerHandel through as buyer or seller and sees where the
 * money is at each step. Self-contained: no props, all state inside, fills the width it gets.
 * Everything is pretend; nothing is sent anywhere.
 */
function Walkthrough() {
  const [role, setRole] = useState<Role | null>(null)
  const [stepId, setStepId] = useState<StepId>(startStep)
  const [history, setHistory] = useState<StepId[]>([])
  const [rating, setRating] = useState<number | null>(null)

  const headingRef = useRef<HTMLHeadingElement>(null)
  // Only move focus after the visitor has acted, not on the first render.
  const hasInteracted = useRef(false)

  useEffect(() => {
    if (!hasInteracted.current) return
    headingRef.current?.focus({ preventScroll: true })
  }, [role, stepId])

  function start(nextRole: Role | null) {
    hasInteracted.current = true
    setRole(nextRole)
    setStepId(startStep())
    setHistory([])
    setRating(null)
  }

  function go(next: StepId) {
    hasInteracted.current = true
    setHistory((previous) => [...previous, stepId])
    setStepId(next)
  }

  function back() {
    hasInteracted.current = true
    if (history.length === 0) {
      setRole(null)
      return
    }
    setStepId(history[history.length - 1])
    setHistory((previous) => previous.slice(0, -1))
  }

  return (
    <section className="w-full space-y-6 rounded-3xl bg-surface-white p-6 shadow-card-shadow sm:p-8">
      <h2 className="text-2xl font-bold">Prøv en handel selv</h2>

      {/* Fixed minimum height from the role choice through every step, so the card doesn't jump. */}
      <div className="flex min-h-188 flex-col gap-6 sm:min-h-154">
        <div aria-live="polite" className="flex flex-1 flex-col gap-6">
          {role === null ? (
            <>
              <MoneyTrack money="buyer" />
              <div className="my-auto space-y-6 text-center">
                <span
                  aria-hidden="true"
                  className="mx-auto flex size-24 items-center justify-center rounded-full bg-surface-yellow-light"
                >
                  <PiGuitar className="size-16 text-icon-default" />
                </span>
                <h3 ref={headingRef} tabIndex={-1} className="text-2xl font-bold outline-none">
                  Vil du prøve som køber eller sælger?
                </h3>
                <p className="text-lg text-text-primary">
                  Vi handler med en brugt guitar til 800 kr. Alt er på skrømt.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <PillButton icon={PiShoppingCart} label="Køber" onClick={() => start('buyer')} />
                  <PillButton icon={PiStorefront} label="Sælger" onClick={() => start('seller')} />
                </div>
              </div>
            </>
          ) : (
            <StepView
              role={role}
              stepId={stepId}
              rating={rating}
              onRate={setRating}
              onGo={go}
              onTryOtherRole={() => start(OTHER_ROLE[role])}
              headingRef={headingRef}
            />
          )}
        </div>

        {role !== null && (
          <div className="flex flex-wrap gap-3 border-t border-surface-gray-light pt-6">
            <PillButton icon={PiArrowLeft} label="Et trin tilbage" onClick={back} small />
            <PillButton icon={PiArrowCounterClockwise} label="Start forfra" onClick={() => start(null)} small />
          </div>
        )}
      </div>
    </section>
  )
}

type StepViewProps = {
  role: Role
  stepId: StepId
  rating: number | null
  onRate: (stars: number) => void
  onGo: (next: StepId) => void
  onTryOtherRole: () => void
  headingRef: Ref<HTMLHeadingElement>
}

function StepView({ role, stepId, rating, onRate, onGo, onTryOtherRole, headingRef }: StepViewProps) {
  const step = steps[stepId]
  const view = viewFor(stepId, role)
  const other = OTHER_PARTY[role]
  const otherRole = OTHER_ROLE[role]

  return (
    <>
      <ProgressBar progress={step.progress} />
      <MoneyTrack money={step.money} />

      <div className="space-y-4">
        <h3 ref={headingRef} tabIndex={-1} className="text-2xl font-bold outline-none">
          {step.title}
        </h3>

        {view.kind === 'event' && (
          <p className="flex items-start gap-2 text-lg font-semibold text-text-primary">
            <PiChatCircleDots aria-hidden="true" className="size-7 shrink-0 text-icon-default" />
            {view.event}
          </p>
        )}

        {view.kind === 'end' && view.review && (
          <>
            {rating !== null && (
              <p className="text-lg text-text-primary">
                Du gav {other} {starsLabel(rating)}.
              </p>
            )}
            <div className="space-y-2 rounded-xl bg-surface-yellow-light p-4">
              <Stars count={view.review.stars} />
              <p className="text-lg text-text-primary">{view.review.text}</p>
            </div>
          </>
        )}

        {view.text.map((paragraph) => (
          <p key={paragraph} className="text-lg text-text-primary">
            {paragraph}
          </p>
        ))}

        {step.rating && (
          <StarRating legend={`Din bedømmelse af ${other}`} value={rating} onChange={onRate} />
        )}
      </div>

      <div className="mt-auto flex flex-wrap gap-3">
        {view.kind === 'choices' &&
          view.choices.map((choice) => (
            <PillButton
              key={choice.label}
              icon={PiArrowRight}
              label={choice.label}
              onClick={() => onGo(choice.next)}
              disabled={step.rating && rating === null}
            />
          ))}
        {(view.kind === 'event' || view.kind === 'continue') && (
          <PillButton icon={PiArrowRight} label="Videre" onClick={() => onGo(view.next)} />
        )}
        {view.kind === 'end' && (
          <PillButton icon={ROLE_ICON[otherRole]} label={TRY_AS[otherRole]} onClick={onTryOtherRole} />
        )}
      </div>
    </>
  )
}

export default Walkthrough
