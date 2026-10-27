import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
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

// The game hides behind the player's G and unfolds from it (FLIP: the card starts at the G's box and grows)
function FoldableGame() {
  const gameId = useId()
  const [phase, setPhase] = useState<Phase>('closed')
  const buttonRef = useRef<HTMLButtonElement>(null)
  const logoRef = useRef<HTMLImageElement>(null)
  // The G's box, measured just before the switch to the card
  const logoRect = useRef<DOMRect | null>(null)
  // Transform that maps the card onto the G, kept for folding back up
  const foldedTransform = useRef<string | null>(null)
  const focusButton = useRef(false)
  const focusCanvas = useRef(false)

  function open() {
    focusCanvas.current = true
    logoRect.current = prefersReducedMotion() ? null : (logoRef.current?.getBoundingClientRect() ?? null)
    foldedTransform.current = null
    setPhase(logoRect.current ? 'opening' : 'open')
  }

  function close() {
    focusButton.current = true
    setPhase(foldedTransform.current && !prefersReducedMotion() ? 'closing' : 'closed')
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
      const from = logoRect.current
      const to = card.getBoundingClientRect()
      const transform = `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${from.width / to.width}, ${from.height / to.height})`
      foldedTransform.current = transform
      card.style.transition = 'none'
      card.style.transformOrigin = 'top left'
      card.style.transform = transform
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

    if (phase === 'closing' && foldedTransform.current) {
      const transform = foldedTransform.current
      card.style.transition = 'none'
      card.style.transformOrigin = 'top left'
      card.style.transform = 'none'
      card.style.opacity = '1'
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
        className="group flex items-center gap-3 rounded-xl text-left text-lg font-semibold text-text-primary focus-visible:outline-2 focus-visible:outline-border-focus"
      >
        <img
          ref={logoRef}
          src={playerSrc}
          alt=""
          className="size-16 transition group-hover:scale-110 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />
        Hvorfor er der mon et G?
      </button>
    )
  }

  return <GGame id={gameId} onClose={close} />
}

export default FoldableGame
