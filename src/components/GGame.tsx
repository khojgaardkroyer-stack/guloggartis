import { type KeyboardEvent as ReactKeyboardEvent, type PointerEvent, useEffect, useId, useRef, useState } from 'react'
import { PiCornersIn, PiCornersOut, PiX } from 'react-icons/pi'
import playerSrc from '../assets/g-player.svg'
import { drawGame } from '../game/draw'
import { readPalette, type GamePalette } from '../game/palette'
import {
  HEIGHT,
  PLAYER_H,
  PLAYER_W,
  WIDTH,
  WIN_SCORE,
  newGame,
  startGame,
  step,
  type GameMode,
  type Status,
} from '../game/engine'
import { endPress, holdPress, startPress, type Press } from '../game/gesture'
import { readRecord, saveRecord } from '../game/records'
import { FADE_IN_MS, SWING_SECONDS } from '../game/view3d'
import { useScene3D } from './useScene3D'

// localStorage itself can throw (eg. blocked site data), so the record helpers get it through this
const getStorage = () => localStorage

function readRecords(): Record<GameMode, number> {
  return { '2d': readRecord(getStorage, '2d'), '3d': readRecord(getStorage, '3d') }
}

const MODE_LABEL: Record<GameMode, string> = { '2d': '2D', '3d': '3D' }

const REASON_3D = {
  'no-webgl': '3D virker ikke i din browser.',
  'reduced-motion': '3D er slået fra, fordi du har valgt mindre bevægelse.',
} as const

// Pill buttons under the board, as the manual's secondary button
const MODE_BUTTON =
  'rounded-control-pill bg-button-secondary-background px-4 py-2 text-sm font-semibold text-text-primary transition hover:bg-state-hover-neutral focus-visible:outline-2 focus-visible:outline-border-focus disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-button-secondary-background aria-busy:cursor-progress'

// 2d: the 2D board. swing: the 3D run's intro, the camera swings round behind the G. 3d: the chase view, in lanes.
type View = '2d' | 'swing' | '3d'

// A press on the board in lane mode: where and when it started, how far it has moved sideways
type Pointer = { x: number; y: number; dx: number; downAt: number; press: Press }

const STEER_KEYS: Record<string, -1 | 1> = { ArrowLeft: -1, a: -1, A: -1, ArrowRight: 1, d: 1, D: 1 }
const JUMP_KEYS = new Set([' ', 'ArrowUp', 'w', 'W'])

type GGameProps = {
  id?: string
  // When set, a close button is shown next to the fullscreen button
  onClose?: () => void
}

function GGame({ id, onClose }: GGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const canvas3dRef = useRef<HTMLCanvasElement>(null)
  const sectionRef = useRef<HTMLElement>(null)
  const [isFull, setIsFull] = useState(false)
  const [status, setStatus] = useState<Status>('ready')
  const [score, setScore] = useState(0)
  const [records, setRecords] = useState(readRecords)
  // The mode of the current or last run; null on the start screen, before a run is chosen
  const [mode, setMode] = useState<GameMode | null>(null)
  const runMode = useRef<GameMode>('2d')
  // 3D was chosen before the scene was ready: the run starts as soon as it is
  const [waiting3D, setWaiting3D] = useState(false)
  const reasonId = useId()
  // The view lives in a ref for the loop; the state copy is only for what React renders
  const view = useRef<View>('2d')
  const [shownView, setShownView] = useState<View>('2d')
  const swingStart = useRef(0)
  // Swing progress the 3D view is drawn at: 0..1 during the swing, 1 in 3D
  const swing = useRef(0)
  const pendingSteer = useRef<(-1 | 1)[]>([])
  // Presses in lane mode by pointerId, so two thumbs on a phone are each read on their own
  const presses = useRef(new Map<number, Pointer>())
  const cleared2D = useRef(false)

  // Game state lives in a ref so the animation loop doesn't re-render React
  const game = useRef(newGame())
  // Set by input, applied (and cleared) by the next step
  const pendingJump = useRef(false)
  const playerImg = useRef<HTMLImageElement | null>(null)
  // The player SVG rasterised once at the current canvas scale
  const playerSprite = useRef<{ scale: number; canvas: HTMLCanvasElement } | null>(null)
  // Canvas colours from the theme's CSS variables, read once on mount (before the effects below draw)
  const palette = useRef<GamePalette | null>(null)

  useEffect(() => {
    palette.current = readPalette(getComputedStyle(document.documentElement))
  }, [])

  const scene3d = useScene3D(canvas3dRef, palette, handleContextLost)

  function setView(next: View) {
    view.current = next
    setShownView(next)
  }

  // Back to the 2D board, for a new run or when the game is closed
  function resetView() {
    setView('2d')
    swing.current = 0
    pendingSteer.current = []
    presses.current.clear()
  }

  // The 3D view is gone for this mount. A run in lanes can't go on in 2D, so it ends as a loss.
  function handleContextLost() {
    setWaiting3D(false)
    if (view.current === '2d') return
    setView('2d')
    presses.current.clear()
    const g = game.current
    if (g.lanes) {
      const ended = g.status === 'running' || g.status === 'delivering'
      if (g.status === 'running') recordHighScore(g.score)
      if (ended) setStatus('over')
      // The 2D board never shows lanes: keep only what lies in the G's lane and 2D can draw
      const lane = Math.round(g.laneX)
      const obstacles = g.obstacles.filter(
        (o) => (o.lane === 'all' || o.lane === lane) && o.kind !== 'van' && o.kind !== 'tower',
      )
      game.current = { ...g, status: ended ? 'over' : g.status, lanes: false, lane: 0, laneX: 0, obstacles }
    }
    draw()
  }

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
    const scene = view.current === '2d' ? null : scene3d.ready()
    scene?.render(game.current, swing.current)
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || !palette.current) return
    // The 2D board stays under the 3D view while that fades in; after that only 3D is drawn
    if (scene && performance.now() - swingStart.current > FADE_IN_MS) {
      if (!cleared2D.current) ctx.clearRect(0, 0, canvas.width, canvas.height)
      cleared2D.current = true
      return
    }
    cleared2D.current = false
    // Match the backing store to the displayed size so it stays sharp in fullscreen
    const scale = (window.devicePixelRatio || 1) * Math.max(canvas.clientWidth / WIDTH, 1)
    const pixelWidth = Math.round(WIDTH * scale)
    if (canvas.width !== pixelWidth) {
      canvas.width = pixelWidth
      canvas.height = Math.round(HEIGHT * scale)
    }
    ctx.setTransform(scale, 0, 0, scale, 0, 0)
    drawGame(ctx, game.current, playerSpriteFor(scale), palette.current)
  }

  // Saves the current run's score as its mode's record if it beats it
  function recordHighScore(points: number) {
    const m = runMode.current
    const best = saveRecord(getStorage, m, points)
    setRecords((r) => (best > r[m] ? { ...r, [m]: best } : r))
  }

  const loading3D = waiting3D && scene3d.availability === 'ok'

  /**
   * Starts a run in `next` at once. A 3D run starts with the camera swing; if the scene isn't
   * ready yet, it waits for it instead. Returns whether the run started.
   */
  function startRun(next: GameMode): boolean {
    if (next === '3d') {
      if (scene3d.availability !== 'ok') return false
      if (!scene3d.ready()) {
        setWaiting3D(true)
        return false
      }
    }
    setWaiting3D(false)
    resetView()
    runMode.current = next
    game.current = startGame(next)
    setMode(next)
    setScore(0)
    setStatus('running')
    if (next === '3d') {
      swingStart.current = performance.now()
      setView('swing')
    }
    // The buttons go away during the run: hand the keys to the board
    canvasRef.current?.focus({ preventScroll: true })
    return true
  }

  function handleInput() {
    // On the start screen the run is chosen with the buttons under the board
    if (status === 'delivering' || status === 'ready') return
    if (status === 'over' || status === 'won') {
      if (!mode || !startRun(mode)) return
    }
    pendingJump.current = true
  }

  // Start loading and building the 3D scene as soon as the start screen is shown
  useEffect(() => {
    scene3d.prepare()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 3D was chosen while the scene was still loading: start the run once it is ready
  useEffect(() => {
    if (waiting3D && scene3d.isReady) startRun('3d')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waiting3D, scene3d.isReady])

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

      // A 3D run's intro: the camera swings round behind the G, which stands still meanwhile.
      // Input during the swing is dropped, so the run starts calmly.
      if (view.current === 'swing') {
        swing.current = Math.min((now - swingStart.current) / 1000 / SWING_SECONDS, 1)
        pendingJump.current = false
        pendingSteer.current = []
        if (swing.current < 1) {
          draw()
          frame = requestAnimationFrame(tick)
          return
        }
        setView('3d')
      }
      // A press held still in the middle jumps without waiting for the release
      for (const p of presses.current.values()) holdPointer(p, now)

      const g = step(game.current, dt, {
        jump: pendingJump.current,
        steer: pendingSteer.current.shift(),
      })
      pendingJump.current = false
      game.current = g

      if (g.score !== prev.score) setScore(g.score)
      draw()

      if (g.status !== prev.status) {
        if (g.status === 'over' || g.status === 'delivering') recordHighScore(g.score)
        setStatus(g.status)
        if (g.status === 'over' || g.status === 'won') {
          presses.current.clear()
          return
        }
      }
      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  // Steering only works in lane mode during a run, after the intro swing
  function canSteer() {
    return game.current.lanes && game.current.status === 'running' && view.current === '3d'
  }

  function handleKeyDown(e: ReactKeyboardEvent<HTMLCanvasElement>) {
    if (JUMP_KEYS.has(e.key)) {
      e.preventDefault()
      handleInput()
      return
    }
    const steer = STEER_KEYS[e.key]
    if (steer && canSteer()) {
      e.preventDefault()
      // One lane per press; holding the key doesn't repeat
      if (!e.repeat) pendingSteer.current.push(steer)
    }
  }

  function handlePointerDown(e: PointerEvent<HTMLCanvasElement>) {
    e.preventDefault()
    if (!canSteer()) {
      handleInput()
      return
    }
    // In lanes a press is read as it moves and when it ends, so a swipe never also jumps
    const rect = e.currentTarget.getBoundingClientRect()
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // Capture is only a nicety: the swipe still counts if it ends on the board
    }
    presses.current.set(e.pointerId, {
      x: e.clientX,
      y: e.clientY,
      dx: 0,
      downAt: performance.now(),
      press: startPress(e.clientX - rect.left, rect.width),
    })
  }

  function holdPointer(p: Pointer, now: number) {
    const held = holdPress(p.press, p.dx, now - p.downAt)
    p.press = held.press
    if (held.jump && canSteer()) pendingJump.current = true
  }

  function handlePointerMove(e: PointerEvent<HTMLCanvasElement>) {
    const p = presses.current.get(e.pointerId)
    if (!p) return
    p.dx = e.clientX - p.x
    holdPointer(p, performance.now())
  }

  function handlePointerUp(e: PointerEvent<HTMLCanvasElement>) {
    const p = presses.current.get(e.pointerId)
    if (!p) return
    presses.current.delete(e.pointerId)
    if (!canSteer()) return
    const gesture = endPress(p.press, e.clientX - p.x, e.clientY - p.y)
    if (gesture === 'left' || gesture === 'right') pendingSteer.current.push(gesture === 'left' ? -1 : 1)
    else if (gesture === 'jump') pendingJump.current = true
  }

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

  // Stop the run (saving the high score as on a loss), leave fullscreen first, then hand over to onClose
  function close() {
    if (status === 'running') recordHighScore(game.current.score)
    resetView()
    game.current = newGame()
    setScore(0)
    setStatus('ready')
    setMode(null)
    setWaiting3D(false)
    if (document.fullscreenElement) {
      // Don't wait for fullscreenchange: the fold-up must not start while the section is still fixed
      const done = () => {
        setIsFull(false)
        onClose?.()
      }
      document.exitFullscreen().then(done, done)
      return
    }
    if (isFull) setIsFull(false)
    onClose?.()
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

  // The header shows the 2D record until a run is chosen
  const shownMode = mode ?? '2d'
  const unavailable3D = scene3d.availability === 'ok' ? null : REASON_3D[scene3d.availability]
  const reason3D = unavailable3D && (
    <p id={reasonId} className={`w-full text-text-secondary ${isFull ? 'text-sm sm:text-base' : 'text-xs'}`}>
      {unavailable3D}
    </p>
  )

  // The 3D button (and "Skift til 3D"): disabled with a reason without 3D, busy while it loads
  function button3D(label: string) {
    return (
      <button
        type="button"
        disabled={unavailable3D !== null}
        aria-describedby={unavailable3D ? reasonId : undefined}
        aria-busy={loading3D || undefined}
        aria-disabled={loading3D || undefined}
        onClick={() => {
          if (!loading3D) startRun('3d')
        }}
        className={MODE_BUTTON}
      >
        {loading3D ? 'Henter 3D …' : label}
      </button>
    )
  }

  const message =
    status === 'ready'
      ? 'Vælg 2D eller 3D nedenfor'
      : status === 'over'
        ? 'Av! Tryk for at prøve igen'
        : status === 'won'
          ? '📦 Pakken er afleveret! Du vandt!'
          : null

  return (
    <section
      ref={sectionRef}
      id={id}
      aria-label="Spil: Hop over forhindringerne"
      className={
        isFull
          ? 'fixed inset-0 z-50 flex flex-col items-center justify-center bg-surface-white p-4 text-text-primary'
          : 'w-full max-w-[392px] rounded-3xl bg-surface-white p-4 text-text-primary shadow-card-shadow'
      }
    >
      <div
        className="w-full"
        // Fit the 360x150 board inside the screen, leaving room for the header, the buttons and help text
        style={isFull ? { maxWidth: 'min(100%, calc((100dvh - 12rem) * 2.4))' } : undefined}
      >
        <div className="mb-2 flex flex-wrap items-center justify-between gap-x-2 gap-y-1 px-1">
          <h2 className={`font-bold ${isFull ? 'text-xl sm:text-2xl' : 'text-sm'}`}>
            Hop over forhindringerne
          </h2>
          <div className="ml-auto flex shrink-0 items-center gap-1-5">
            {/* DM Sans has no tabular digits, so the score's width changes with every point. An invisible
                widest-case copy ("0" is the widest digit) fixes the box's width, so the header never
                re-wraps mid-run and the card can't change height */}
            <p
              className={`grid whitespace-pre text-text-secondary tabular-nums ${isFull ? 'text-base sm:text-lg' : 'text-xs'}`}
            >
              <span aria-hidden="true" className="invisible col-start-1 row-start-1">
                {'2D HI 0000 m  0000 m'}
              </span>
              <span className="col-start-1 row-start-1 text-right">{`${MODE_LABEL[shownMode]} HI ${records[shownMode]} m  ${score} m`}</span>
            </p>
            {/* Icon button as in the manual's modal close button: 16px icon, spacing/2 padding */}
            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label={isFull ? 'Luk fuld skærm' : 'Fuld skærm'}
              title={isFull ? 'Luk fuld skærm' : 'Fuld skærm'}
              className="flex items-center justify-center rounded-control-pill bg-button-secondary-background p-2 text-icon-default transition hover:bg-state-hover-neutral"
            >
              {isFull ? (
                <PiCornersIn aria-hidden="true" className="size-4" />
              ) : (
                <PiCornersOut aria-hidden="true" className="size-4" />
              )}
            </button>
            {onClose && (
              <button
                type="button"
                onClick={close}
                aria-label="Luk spillet"
                title="Luk spillet"
                className="flex items-center justify-center rounded-control-pill bg-button-secondary-background p-2 text-icon-default transition hover:bg-state-hover-neutral"
              >
                <PiX aria-hidden="true" className="size-4" />
              </button>
            )}
          </div>
        </div>
        <div className="relative">
          <canvas
            ref={canvasRef}
            tabIndex={0}
            aria-label="Spillepladen. Tryk mellemrum, pil op eller på skærmen for at hoppe."
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={(e) => {
              presses.current.delete(e.pointerId)
            }}
            onKeyDown={handleKeyDown}
            className={`block aspect-[360/150] w-full cursor-pointer rounded-xl focus-visible:outline-2 focus-visible:outline-border-focus ${mode === '3d' && status === 'running' ? 'touch-none' : 'touch-manipulation'}`}
          />
          {/* The 3D view sits over the 2D board; the 2D canvas keeps focus and input */}
          <canvas
            ref={canvas3dRef}
            aria-hidden="true"
            className={`pointer-events-none absolute inset-0 size-full rounded-xl ${shownView === '2d' ? 'opacity-0' : 'opacity-100 transition-opacity duration-200'}`}
          />
          {message && (
            <p
              className={`pointer-events-none absolute inset-x-0 text-center font-semibold ${isFull ? 'top-6 text-2xl sm:text-3xl' : status === 'won' ? 'top-2 text-lg' : 'top-2'} ${status === 'won' ? 'text-text-green' : 'text-text-primary'}`}
            >
              <span className="rounded-full bg-surface-white/90 px-3 py-1">{message}</span>
            </p>
          )}
        </div>
        {status === 'ready' && (
          <div className="mt-2 flex flex-wrap items-center gap-2 px-1">
            <button type="button" onClick={() => startRun('2d')} className={MODE_BUTTON}>
              {`2D · HI ${records['2d']}`}
            </button>
            {button3D(`3D · HI ${records['3d']}`)}
            {reason3D}
          </div>
        )}
        {(status === 'over' || status === 'won') && mode && (
          <div className="mt-2 flex flex-wrap items-center gap-2 px-1">
            {mode === '3d' ? (
              <button type="button" onClick={() => startRun('2d')} className={MODE_BUTTON}>
                Skift til 2D
              </button>
            ) : (
              <>
                {button3D('Skift til 3D')}
                {reason3D}
              </>
            )}
          </div>
        )}
        <p className={`mt-2 px-1 text-text-secondary ${isFull ? 'text-sm sm:text-base' : 'text-xs'}`}>
          {mode === '3d'
            ? 'Hop med mellemrum, pil op eller W. Skift bane med pilene, A/D, swipe eller tryk i siderne.'
            : `Hop med mellemrum, pil op eller tryk. Vind ved ${WIN_SCORE} m!`}
        </p>
      </div>
    </section>
  )
}

export default GGame
