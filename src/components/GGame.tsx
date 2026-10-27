import { useEffect, useRef, useState } from 'react'
import { MdFullscreen, MdFullscreenExit } from 'react-icons/md'
import playerSrc from '../assets/g-player.svg'
import { drawGame } from '../game/draw'
import {
  HEIGHT,
  PLAYER_H,
  PLAYER_W,
  WIDTH,
  WIN_SCORE,
  newGame,
  startGame,
  step,
  type Status,
} from '../game/engine'

const HIGH_SCORE_KEY = 'ggame-highscore'

function readHighScore() {
  try {
    return Number(localStorage.getItem(HIGH_SCORE_KEY)) || 0
  } catch {
    return 0
  }
}

function saveHighScore(score: number) {
  try {
    localStorage.setItem(HIGH_SCORE_KEY, String(score))
  } catch {
    // storage unavailable; keep the score for this visit only
  }
}

function GGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sectionRef = useRef<HTMLElement>(null)
  const [isFull, setIsFull] = useState(false)
  const [status, setStatus] = useState<Status>('ready')
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(readHighScore)

  // Game state lives in a ref so the animation loop doesn't re-render React
  const game = useRef(newGame())
  // Set by input, applied (and cleared) by the next step
  const pendingJump = useRef(false)
  const playerImg = useRef<HTMLImageElement | null>(null)
  // The player SVG rasterised once at the current canvas scale
  const playerSprite = useRef<{ scale: number; canvas: HTMLCanvasElement } | null>(null)

  useEffect(() => {
    let cancelled = false
    const img = new Image()
    img.src = playerSrc
    const ready = () => {
      if (cancelled) return
      playerImg.current = img
      playerSprite.current = null
      draw()
    }
    // Wait for decode() before the sprite is rasterised: WebKit can draw an SVG blank straight
    // from onload, and the cached sprite would then stay blank. Fall back to onload if decode fails.
    img.decode().then(ready, () => {
      if (img.complete && img.naturalWidth) ready()
      else img.addEventListener('load', ready, { once: true })
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Browsers differ in how they rasterise an SVG passed to drawImage under a scale transform,
  // so draw it once onto an offscreen canvas at the exact pixel size and reuse that bitmap.
  function playerSpriteFor(scale: number) {
    const img = playerImg.current
    if (!img) return null
    if (playerSprite.current?.scale !== scale) {
      const sprite = document.createElement('canvas')
      sprite.width = Math.round(PLAYER_W * scale)
      sprite.height = Math.round(PLAYER_H * scale)
      sprite.getContext('2d')?.drawImage(img, 0, 0, sprite.width, sprite.height)
      playerSprite.current = { scale, canvas: sprite }
    }
    return playerSprite.current.canvas
  }

  function draw() {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    // Match the backing store to the displayed size so it stays sharp in fullscreen
    const scale = (window.devicePixelRatio || 1) * Math.max(canvas.clientWidth / WIDTH, 1)
    const pixelWidth = Math.round(WIDTH * scale)
    if (canvas.width !== pixelWidth) {
      canvas.width = pixelWidth
      canvas.height = Math.round(HEIGHT * scale)
    }
    ctx.setTransform(scale, 0, 0, scale, 0, 0)
    drawGame(ctx, game.current, playerSpriteFor(scale))
  }

  function recordHighScore(points: number) {
    setHighScore((best) => {
      if (points > best) {
        saveHighScore(points)
        return points
      }
      return best
    })
  }

  function handleInput() {
    if (status === 'delivering') return
    if (status !== 'running') {
      game.current = startGame()
      setScore(0)
      setStatus('running')
    }
    pendingJump.current = true
  }

  useEffect(() => {
    if (status !== 'running' && status !== 'delivering') {
      draw()
      return
    }
    let frame = 0
    let last = performance.now()

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      const prev = game.current
      const g = step(prev, dt, { jump: pendingJump.current })
      pendingJump.current = false
      game.current = g

      if (g.score !== prev.score) setScore(g.score)
      draw()

      if (g.status !== prev.status) {
        if (g.status === 'over' || g.status === 'delivering') recordHighScore(g.score)
        setStatus(g.status)
        if (g.status === 'over' || g.status === 'won') return
      }
      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  // Native fullscreen where supported (not on iPhone); otherwise cover the window with CSS
  function toggleFullscreen() {
    const el = sectionRef.current
    if (!el) return
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else if (isFull) {
      setIsFull(false)
    } else if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => setIsFull(true))
    } else {
      setIsFull(true)
    }
  }

  useEffect(() => {
    const onChange = () => setIsFull(document.fullscreenElement === sectionRef.current)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  useEffect(() => {
    draw()
    if (isFull) canvasRef.current?.focus()
    if (!isFull || document.fullscreenElement) return
    // CSS fallback: lock page scroll and let Escape close it
    document.body.style.overflow = 'hidden'
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFull(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKeyDown)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFull])

  useEffect(() => {
    window.addEventListener('resize', draw)
    return () => window.removeEventListener('resize', draw)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const message =
    status === 'ready'
      ? 'Tryk for at starte'
      : status === 'over'
        ? 'Av! Tryk for at prøve igen'
        : status === 'won'
          ? '📦 Pakken er afleveret! Du vandt!'
          : null

  return (
    <section
      ref={sectionRef}
      aria-label="Spil: Hop over forhindringerne"
      className={
        isFull
          ? 'fixed inset-0 z-50 flex flex-col items-center justify-center bg-white p-4'
          : 'w-full max-w-[392px] rounded-3xl bg-white p-4 shadow-sm'
      }
    >
      <div
        className="w-full"
        // Fit the 360x150 board inside the screen, leaving room for the header and help text
        style={isFull ? { maxWidth: 'min(100%, calc((100dvh - 9rem) * 2.4))' } : undefined}
      >
        <div className="mb-2 flex flex-wrap items-center justify-between gap-x-2 gap-y-1 px-1">
          <h2 className={`font-bold ${isFull ? 'text-xl sm:text-2xl' : 'text-sm'}`}>
            Hop over forhindringerne
          </h2>
          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            <p
              className={`font-mono whitespace-nowrap text-gray-600 tabular-nums ${isFull ? 'text-base sm:text-lg' : 'text-xs'}`}
            >
              HI {String(highScore).padStart(5, '0')} {String(score).padStart(5, '0')}
            </p>
            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label={isFull ? 'Luk fuld skærm' : 'Fuld skærm'}
              title={isFull ? 'Luk fuld skærm' : 'Fuld skærm'}
              className="flex size-7 items-center justify-center rounded-full bg-gray-100 text-lg transition hover:bg-gray-200"
            >
              {isFull ? <MdFullscreenExit aria-hidden="true" /> : <MdFullscreen aria-hidden="true" />}
            </button>
          </div>
        </div>
        <div className="relative">
          <canvas
            ref={canvasRef}
            tabIndex={0}
            aria-label="Spillepladen. Tryk mellemrum, pil op eller på skærmen for at hoppe."
            onPointerDown={(e) => {
              e.preventDefault()
              handleInput()
            }}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'ArrowUp') {
                e.preventDefault()
                handleInput()
              }
            }}
            className="block aspect-[360/150] w-full cursor-pointer touch-manipulation rounded-xl focus-visible:outline-2 focus-visible:outline-gray-900"
          />
          {message && (
            <p
              className={`pointer-events-none absolute inset-x-0 text-center font-semibold ${isFull ? 'top-6 text-2xl sm:text-3xl' : status === 'won' ? 'top-2 text-lg' : 'top-2'} ${status === 'won' ? 'text-green-700' : 'text-gray-700'}`}
            >
              <span className="rounded-full bg-white/90 px-3 py-1">{message}</span>
            </p>
          )}
        </div>
        <p className={`mt-2 px-1 text-gray-500 ${isFull ? 'text-sm sm:text-base' : 'text-xs'}`}>
          Hop med mellemrum, pil op eller tryk. Vind ved {WIN_SCORE} point!
        </p>
      </div>
    </section>
  )
}

export default GGame
