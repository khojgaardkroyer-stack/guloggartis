import { useEffect, useRef, useState } from 'react'
import playerSrc from '../assets/g-player.png'

const WIDTH = 360
const HEIGHT = 150
const GROUND_Y = 128
const PLAYER_W = 30
const PLAYER_H = 35
const PLAYER_X = 24
const GRAVITY = 2200
const JUMP_VELOCITY = -680
const START_SPEED = 260
const SPEED_GAIN = 8 // px/s added per second
const MAX_SPEED = 650
const WIN_SCORE = 5000
const HIGH_SCORE_KEY = 'ggame-highscore'

type ObstacleKind = 'parcel' | 'stack' | 'row' | 'cone' | 'envelope'
// lift = distance from the ground to the obstacle's bottom edge
type Obstacle = { kind: ObstacleKind; x: number; w: number; h: number; lift: number }
type Template = Omit<Obstacle, 'x'>

// New obstacle types unlock as the score climbs
const OBSTACLES: { minScore: number; make: () => Template }[] = [
  { minScore: 0, make: () => ({ kind: 'parcel', w: 18, h: 18, lift: 0 }) },
  { minScore: 0, make: () => ({ kind: 'parcel', w: 26, h: 26, lift: 0 }) },
  { minScore: 50, make: () => ({ kind: 'cone', w: 16, h: 24, lift: 0 }) },
  { minScore: 100, make: () => ({ kind: 'stack', w: 20, h: 38, lift: 0 }) },
  { minScore: 150, make: () => ({ kind: 'row', w: 54, h: 18, lift: 0 }) },
  // Low envelopes must be jumped; high ones fly over you if you stay on the ground
  { minScore: 200, make: () => ({ kind: 'envelope', w: 26, h: 16, lift: 12 }) },
  { minScore: 200, make: () => ({ kind: 'envelope', w: 26, h: 16, lift: 44 }) },
]

function randomObstacle(score: number): Template {
  const available = OBSTACLES.filter((o) => score >= o.minScore)
  return available[Math.floor(Math.random() * available.length)].make()
}

function drawParcel(ctx: CanvasRenderingContext2D, x: number, top: number, w: number, h: number) {
  ctx.fillStyle = '#c8955c'
  ctx.fillRect(x, top, w, h)
  ctx.fillStyle = '#a8743f'
  ctx.fillRect(x + w / 2 - 2, top, 4, h)
  ctx.strokeStyle = '#7a5229'
  ctx.lineWidth = 1
  ctx.strokeRect(x + 0.5, top + 0.5, w - 1, h - 1)
}

function drawObstacle(ctx: CanvasRenderingContext2D, o: Obstacle) {
  const top = GROUND_Y - o.lift - o.h
  switch (o.kind) {
    case 'parcel':
      drawParcel(ctx, o.x, top, o.w, o.h)
      break
    case 'stack':
      drawParcel(ctx, o.x, top + o.h / 2, o.w, o.h / 2)
      drawParcel(ctx, o.x + 2, top, o.w - 4, o.h / 2)
      break
    case 'row':
      for (let i = 0; i < 3; i++) drawParcel(ctx, o.x + i * (o.w / 3), top, o.w / 3, o.h)
      break
    case 'cone':
      ctx.fillStyle = '#f97316'
      ctx.beginPath()
      ctx.moveTo(o.x + o.w / 2, top)
      ctx.lineTo(o.x + o.w, GROUND_Y - 3)
      ctx.lineTo(o.x, GROUND_Y - 3)
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = '#fff'
      ctx.fillRect(o.x + o.w * 0.3, top + o.h * 0.45, o.w * 0.4, 3)
      ctx.fillStyle = '#c2410c'
      ctx.fillRect(o.x - 2, GROUND_Y - 3, o.w + 4, 3)
      break
    case 'envelope':
      ctx.fillStyle = '#fff'
      ctx.strokeStyle = '#2d2d2d'
      ctx.lineWidth = 1.5
      ctx.fillRect(o.x, top, o.w, o.h)
      ctx.strokeRect(o.x, top, o.w, o.h)
      ctx.beginPath()
      ctx.moveTo(o.x, top)
      ctx.lineTo(o.x + o.w / 2, top + o.h * 0.6)
      ctx.lineTo(o.x + o.w, top)
      ctx.stroke()
      ctx.fillStyle = '#ef4444'
      ctx.beginPath()
      ctx.arc(o.x + o.w / 2, top + o.h * 0.6, 2.5, 0, Math.PI * 2)
      ctx.fill()
      break
  }
}
type Status = 'ready' | 'running' | 'over' | 'won'

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
  const [status, setStatus] = useState<Status>('ready')
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(readHighScore)

  // Mutable game state lives in a ref so the animation loop doesn't re-render React
  const game = useRef({
    y: GROUND_Y - PLAYER_H,
    vy: 0,
    speed: START_SPEED,
    distance: 0,
    nextObstacleIn: 0,
    obstacles: [] as Obstacle[],
  })
  const playerImg = useRef<HTMLImageElement | null>(null)

  useEffect(() => {
    const img = new Image()
    img.src = playerSrc
    img.onload = () => {
      playerImg.current = img
      draw()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function draw() {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const dpr = window.devicePixelRatio || 1
    if (canvas.width !== WIDTH * dpr) {
      canvas.width = WIDTH * dpr
      canvas.height = HEIGHT * dpr
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, WIDTH, HEIGHT)

    const g = game.current

    // Ground with little dashes that scroll by
    ctx.strokeStyle = '#2d2d2d'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(0, GROUND_Y)
    ctx.lineTo(WIDTH, GROUND_Y)
    ctx.stroke()
    ctx.fillStyle = '#9ca3af'
    const offset = g.distance % 40
    for (let x = -offset; x < WIDTH; x += 40) {
      ctx.fillRect(x + 8, GROUND_Y + 6, 6, 1.5)
      ctx.fillRect(x + 26, GROUND_Y + 11, 3, 1.5)
    }

    for (const o of g.obstacles) drawObstacle(ctx, o)

    if (playerImg.current) {
      ctx.drawImage(playerImg.current, PLAYER_X, g.y, PLAYER_W, PLAYER_H)
    }
  }

  function reset() {
    game.current = {
      y: GROUND_Y - PLAYER_H,
      vy: 0,
      speed: START_SPEED,
      distance: 0,
      nextObstacleIn: 0.6,
      obstacles: [],
    }
    setScore(0)
  }

  function jump() {
    const g = game.current
    if (g.y >= GROUND_Y - PLAYER_H - 0.5) g.vy = JUMP_VELOCITY
  }

  function handleInput() {
    if (status === 'running') {
      jump()
    } else {
      reset()
      setStatus('running')
      jump()
    }
  }

  useEffect(() => {
    if (status !== 'running') {
      draw()
      return
    }
    let frame = 0
    let last = performance.now()

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      const g = game.current

      g.vy += GRAVITY * dt
      g.y = Math.min(g.y + g.vy * dt, GROUND_Y - PLAYER_H)
      if (g.y === GROUND_Y - PLAYER_H) g.vy = 0

      g.speed = Math.min(g.speed + SPEED_GAIN * dt, MAX_SPEED)
      g.distance += g.speed * dt
      for (const o of g.obstacles) o.x -= g.speed * dt
      g.obstacles = g.obstacles.filter((o) => o.x + o.w > 0)

      const points = Math.floor(g.distance / 20)

      g.nextObstacleIn -= dt
      if (g.nextObstacleIn <= 0) {
        const o = { x: WIDTH, ...randomObstacle(points) }
        g.obstacles.push(o)
        // Always leave enough room to land before the next obstacle
        g.nextObstacleIn = 0.75 + (o.w + 40) / g.speed + Math.random() * 0.9
      }

      // Slightly forgiving hitbox
      const pad = 5
      const hit = g.obstacles.some((o) => {
        const top = GROUND_Y - o.lift - o.h
        const bottom = GROUND_Y - o.lift
        const inset = o.kind === 'cone' ? 3 : 0
        return (
          PLAYER_X + pad < o.x + o.w - inset &&
          PLAYER_X + PLAYER_W - pad > o.x + inset &&
          g.y + PLAYER_H - pad > top &&
          g.y + pad < bottom
        )
      })
      const won = points >= WIN_SCORE
      const finalPoints = Math.min(points, WIN_SCORE)
      setScore(finalPoints)
      draw()

      if (hit || won) {
        setStatus(won ? 'won' : 'over')
        setHighScore((best) => {
          if (finalPoints > best) {
            saveHighScore(finalPoints)
            return finalPoints
          }
          return best
        })
        return
      }
      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  const message =
    status === 'ready'
      ? 'Tryk for at starte'
      : status === 'over'
        ? 'Av! Tryk for at prøve igen'
        : status === 'won'
          ? `🎉 Du vandt! Du nåede ${WIN_SCORE} point`
          : null

  return (
    <section
      aria-label="Spil: Hop over forhindringerne"
      className="w-full max-w-[392px] rounded-3xl bg-white p-4 shadow-sm"
    >
      <div className="mb-2 flex items-baseline justify-between gap-2 px-1">
        <h2 className="text-sm font-bold sm:text-base">Hop over forhindringerne</h2>
        <p className="shrink-0 font-mono text-xs whitespace-nowrap text-gray-600 tabular-nums sm:text-sm">
          HI {String(highScore).padStart(5, '0')} {String(score).padStart(5, '0')}
        </p>
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
            className={`pointer-events-none absolute inset-x-0 top-6 text-center font-semibold ${status === 'won' ? 'text-lg text-green-700' : 'text-gray-700'}`}
          >
            <span className="rounded-full bg-white/90 px-3 py-1">{message}</span>
          </p>
        )}
      </div>
      <p className="mt-2 px-1 text-xs text-gray-500">
        Hop med mellemrum, pil op eller tryk. Vind ved {WIN_SCORE} point!
      </p>
    </section>
  )
}

export default GGame
