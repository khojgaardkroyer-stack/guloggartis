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
const HIGH_SCORE_KEY = 'ggame-highscore'

type Obstacle = { x: number; w: number; h: number }
type Status = 'ready' | 'running' | 'over'

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

    // Parcels to jump over
    for (const o of g.obstacles) {
      const top = GROUND_Y - o.h
      ctx.fillStyle = '#c8955c'
      ctx.fillRect(o.x, top, o.w, o.h)
      ctx.fillStyle = '#a8743f'
      ctx.fillRect(o.x + o.w / 2 - 2, top, 4, o.h)
      ctx.strokeStyle = '#7a5229'
      ctx.lineWidth = 1
      ctx.strokeRect(o.x + 0.5, top + 0.5, o.w - 1, o.h - 1)
    }

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

      g.speed += SPEED_GAIN * dt
      g.distance += g.speed * dt
      for (const o of g.obstacles) o.x -= g.speed * dt
      g.obstacles = g.obstacles.filter((o) => o.x + o.w > 0)

      g.nextObstacleIn -= dt
      if (g.nextObstacleIn <= 0) {
        const big = Math.random() < 0.35
        g.obstacles.push({ x: WIDTH, w: big ? 26 : 18, h: big ? 26 : 18 })
        g.nextObstacleIn = 0.9 + Math.random() * 1.1
      }

      // Slightly forgiving hitbox
      const pad = 5
      const hit = g.obstacles.some(
        (o) =>
          PLAYER_X + pad < o.x + o.w &&
          PLAYER_X + PLAYER_W - pad > o.x &&
          g.y + PLAYER_H - pad > GROUND_Y - o.h,
      )

      const points = Math.floor(g.distance / 20)
      setScore(points)
      draw()

      if (hit) {
        setStatus('over')
        setHighScore((best) => {
          if (points > best) {
            saveHighScore(points)
            return points
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
        : null

  return (
    <section
      aria-label="Spil: Hop over pakkerne"
      className="w-full max-w-[392px] rounded-3xl bg-white p-4 shadow-sm"
    >
      <div className="mb-2 flex items-baseline justify-between gap-4 px-1">
        <h2 className="font-bold">Hop over pakkerne</h2>
        <p className="font-mono text-sm text-gray-600 tabular-nums">
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
          <p className="pointer-events-none absolute inset-x-0 top-6 text-center font-semibold text-gray-700">
            {message}
          </p>
        )}
      </div>
      <p className="mt-2 px-1 text-xs text-gray-500">Hop med mellemrum, pil op eller et tryk.</p>
    </section>
  )
}

export default GGame
