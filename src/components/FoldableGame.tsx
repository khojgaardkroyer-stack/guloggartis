import { type Ref, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import playerSrc from '../assets/g-player.svg'
import GGame from './GGame'

const DURATION_MS = 400
const TRANSITION = `transform ${DURATION_MS}ms ease-out, opacity ${DURATION_MS}ms ease-out`

type Phase = 'closed' | 'opening' | 'open' | 'closing'

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function clearStyles(card: HTMLElement) {
  // A transformed ancestor would break GGame's CSS fullscreen fallback (position: fixed)
  card.style.transform = ''
  card.style.transformOrigin = ''
  card.style.transition = ''
  card.style.opacity = ''
}

// Transform that maps the card's box onto the G's box (with transform-origin: top left)
function foldTransform(logo: DOMRect, card: DOMRect) {
  return `translate(${logo.left - card.left}px, ${logo.top - card.top}px) scale(${logo.width / card.width}, ${logo.height / card.height})`
}

// The G and its text, shared by the button and the hidden placeholder that keeps the G's spot while the game is open
function GLabel({ logoRef, hover }: { logoRef: Ref<HTMLImageElement>; hover?: boolean }) {
  return (
    <>
      <img
        ref={logoRef}
        src={playerSrc}
        alt=""
        className={
          hover
            ? 'size-16 transition group-hover:scale-110 motion-reduce:transition-none motion-reduce:group-hover:scale-100'
            : 'size-16'
        }
      />
      Hvorfor er der mon et G?
    </>
  )
}

const LABEL_CLASSES = 'flex items-center gap-3 text-left text-lg font-semibold text-text-primary'

// The game hides behind the player's G and unfolds from it (FLIP: the card starts at the G's box and grows)
function FoldableGame() {
  const gameId = useId()
  const [phase, setPhase] = useState<Phase>('closed')
  const buttonRef = useRef<HTMLButtonElement>(null)
  const logoRef = useRef<HTMLImageElement>(null)
  // The G inside the placeholder: where the G button will be once the game folds up
  const placeholderLogoRef = useRef<HTMLImageElement>(null)
  // The G's box, measured just before the switch to the card
  const logoRect = useRef<DOMRect | null>(null)
  const focusButton = useRef(false)
  const focusCanvas = useRef(false)

  function open() {
    focusCanvas.current = true
    logoRect.current = prefersReducedMotion() ? null : (logoRef.current?.getBoundingClientRect() ?? null)
    setPhase(logoRect.current ? 'opening' : 'open')
  }

  function close() {
    focusButton.current = true
    setPhase(prefersReducedMotion() ? 'closed' : 'closing')
  }

  useLayoutEffect(() => {
    if (phase === 'closed') return
    const card = document.getElementById(gameId)
    if (!card) return

    if (focusCanvas.current) {
      focusCanvas.current = false
      card.querySelector('canvas')?.focus({ preventScroll: true })
    }

    if (phase === 'opening' && logoRect.current) {
      card.style.transition = 'none'
      card.style.transformOrigin = 'top left'
      card.style.transform = foldTransform(logoRect.current, card.getBoundingClientRect())
      card.style.opacity = '0'
      // Commit the start state so the browser transitions from it
      void card.offsetWidth

      let timer = 0
      const frame = requestAnimationFrame(() => {
        card.style.transition = TRANSITION
        card.style.transform = 'none'
        card.style.opacity = '1'
        timer = window.setTimeout(() => setPhase('open'), DURATION_MS)
      })
      return () => {
        cancelAnimationFrame(frame)
        clearTimeout(timer)
        clearStyles(card)
      }
    }

    if (phase === 'closing') {
      // Measure now, not at open: the layout may have changed since (resize, rotation, crossing sm)
      const logo = placeholderLogoRef.current?.getBoundingClientRect()
      // No input while folding up, so a tap or key can't start a run that is thrown away
      card.inert = true
      card.style.transition = 'none'
      card.style.transformOrigin = 'top left'
      card.style.transform = 'none'
      card.style.opacity = '1'
      const transform = logo ? foldTransform(logo, card.getBoundingClientRect()) : 'none'
      void card.offsetWidth

      let timer = 0
      const frame = requestAnimationFrame(() => {
        card.style.transition = TRANSITION
        card.style.transform = transform
        card.style.opacity = '0'
        timer = window.setTimeout(() => setPhase('closed'), DURATION_MS)
      })
      return () => {
        cancelAnimationFrame(frame)
        clearTimeout(timer)
        clearStyles(card)
        card.inert = false
      }
    }
  }, [phase, gameId])

  useEffect(() => {
    if (phase === 'closed' && focusButton.current) {
      focusButton.current = false
      buttonRef.current?.focus()
    }
  }, [phase])

  if (phase === 'closed') {
    return (
      <button
        ref={buttonRef}
        type="button"
        onClick={open}
        aria-expanded={false}
        aria-controls={gameId}
        className={`group rounded-xl focus-visible:outline-2 focus-visible:outline-border-focus ${LABEL_CLASSES}`}
      >
        <GLabel logoRef={logoRef} hover />
      </button>
    )
  }

  return (
    <>
      {/* Out of flow, so the layout is unchanged; as an absolute flex child it still sits where the
          container's alignment would put the G button */}
      <div aria-hidden="true" className={`pointer-events-none invisible absolute ${LABEL_CLASSES}`}>
        <GLabel logoRef={placeholderLogoRef} />
      </div>
      <GGame id={gameId} onClose={close} />
    </>
  )
}

export default FoldableGame
