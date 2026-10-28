import { describe, expect, it } from 'vitest'
import {
  GROUND_Y,
  LANE_CHANGE_SECONDS,
  PLAYER_H,
  PLAYER_W,
  PLAYER_X,
  WIN_SCORE,
  enterLanes,
  obstacleSideSpan,
  playerSideSpan,
  startGame,
  step,
  type GameInput,
  type GameState,
  type Lane,
  type Obstacle,
  type ObstacleLane,
  type ObstacleTemplate,
  type Rng,
} from './engine'

const DT = 1 / 60
const NO_INPUT: GameInput = { jump: false }
const JUMP: GameInput = { jump: true }
const LEFT: GameInput = { jump: false, steer: -1 }
const RIGHT: GameInput = { jump: false, steer: 1 }

// Small seeded PRNG (mulberry32), so runs are repeatable
function seeded(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const noRng: Rng = () => 0

function run(state: GameState, frames: number, input = NO_INPUT): GameState {
  let s = state
  for (let i = 0; i < frames; i++) s = step(s, DT, input, noRng)
  return s
}

// A running game in lane mode with no new spawns soon
function laneGame(overrides: Partial<GameState> = {}): GameState {
  return { ...enterLanes(startGame()), nextObstacleIn: 100, ...overrides }
}

function placed(template: ObstacleTemplate, lane: ObstacleLane, x = PLAYER_X): Obstacle {
  return { x, lane, ...template }
}

const PARCEL: ObstacleTemplate = { kind: 'parcel', w: 18, h: 18, lift: 0 }
const ROW: ObstacleTemplate = { kind: 'row', w: 54, h: 18, lift: 0 }
const VAN: ObstacleTemplate = { kind: 'van', w: 70, h: 120, lift: 0 }
const TOWER: ObstacleTemplate = { kind: 'tower', w: 26, h: 120, lift: 0 }

// Runs until the obstacles are gone or the run ends, jumping on frame `jumpAt` (-1: never)
function passObstacle(state: GameState, jumpAt: number): GameState {
  let s = state
  for (let i = 0; i < 240 && s.status === 'running' && s.obstacles.length > 0; i++) {
    s = step(s, DT, i === jumpAt ? JUMP : NO_INPUT, noRng)
  }
  return s
}

// Records every obstacle spawned in `frames` steps, clearing the track each step so nothing is hit
// and holding the distance so the run never reaches the shop
function spawnsOver(state: GameState, frames: number, rng: Rng): Obstacle[] {
  const spawned: Obstacle[] = []
  let s = state
  for (let i = 0; i < frames; i++) {
    s = step(s, DT, NO_INPUT, rng)
    spawned.push(...s.obstacles)
    s = { ...s, obstacles: [], distance: state.distance }
  }
  return spawned
}

describe('lane mode off', () => {
  it('ignores steering and never spawns a van or a tower', () => {
    // Start at 400 m so every 2D obstacle is unlocked
    const start: GameState = { ...startGame(), distance: 400 * 20 }
    expect(start.lanes).toBe(false)

    const rngA = seeded(1)
    const rngB = seeded(1)
    let steered = start
    let plain = start
    for (let i = 0; i < 2000; i++) {
      steered = step(steered, DT, i % 2 ? LEFT : RIGHT, rngA)
      plain = step(plain, DT, NO_INPUT, rngB)
      expect(steered).toEqual(plain)
      expect(steered.lane).toBe(0)
      expect(steered.laneX).toBe(0)
      steered = { ...steered, obstacles: [] }
      plain = { ...plain, obstacles: [] }
    }

    const kinds = new Set(spawnsOver(start, 3000, seeded(2)).map((o) => o.kind))
    expect(kinds.size).toBeGreaterThan(3)
    expect(kinds.has('van')).toBe(false)
    expect(kinds.has('tower')).toBe(false)
  })
})

describe('enterLanes', () => {
  it('turns lane mode on with the G in the middle lane, and obstacles keep lane 0', () => {
    const spawned = spawnsOver({ ...startGame(), distance: 300 * 20 }, 300, seeded(3))
    const obstacles = spawned.slice(0, 3).map((o, i) => ({ ...o, x: 200 + i * 60 }))
    const before: GameState = { ...startGame(), obstacles }
    expect(before.obstacles.length).toBe(3)

    const s = enterLanes(before)
    expect(s.lanes).toBe(true)
    expect(s.lane).toBe(0)
    expect(s.laneX).toBe(0)
    for (const o of s.obstacles) expect(o.lane ?? 0).toBe(0)

    const later = step({ ...s, nextObstacleIn: 100 }, DT, NO_INPUT, noRng)
    for (const o of later.obstacles) expect(o.lane ?? 0).toBe(0)
  })
})

describe('steering', () => {
  const glideFrames = Math.ceil(LANE_CHANGE_SECONDS / DT) + 1

  it('moves one lane per steer and glides there within LANE_CHANGE_SECONDS', () => {
    let s = step(laneGame(), DT, RIGHT, noRng)
    expect(s.lane).toBe(1)
    expect(s.laneX).toBeGreaterThan(0)
    expect(s.laneX).toBeLessThan(1)
    s = run(s, glideFrames - 1)
    expect(s.laneX).toBe(1)

    s = step(s, DT, LEFT, noRng)
    s = step(s, DT, LEFT, noRng)
    expect(s.lane).toBe(-1)
    s = run(s, 2 * glideFrames)
    expect(s.laneX).toBe(-1)
  })

  it('clamps at the outer lanes', () => {
    let s = laneGame()
    for (let i = 0; i < 4; i++) s = step(s, DT, RIGHT, noRng)
    expect(s.lane).toBe(1)
    for (let i = 0; i < 6; i++) s = step(s, DT, LEFT, noRng)
    expect(s.lane).toBe(-1)
    s = run(s, 30)
    expect(s.laneX).toBe(-1)
  })

  it('works mid-jump', () => {
    let s = run(step(laneGame(), DT, JUMP, noRng), 5)
    expect(s.y).toBeLessThan(GROUND_Y - PLAYER_H)
    s = step(s, DT, LEFT, noRng)
    expect(s.lane).toBe(-1)
    s = run(s, glideFrames)
    expect(s.laneX).toBe(-1)
    expect(s.y).toBeLessThan(GROUND_Y - PLAYER_H)
  })
})

describe('collisions in lane mode', () => {
  const lanes: Lane[] = [-1, 0, 1]

  it('an obstacle in another lane does not collide; in the G’s lane it does', () => {
    for (const lane of lanes) {
      for (const obstacleLane of lanes) {
        const s = step(
          laneGame({ lane, laneX: lane, obstacles: [placed(PARCEL, obstacleLane)] }),
          DT,
          NO_INPUT,
          noRng,
        )
        expect(s.status).toBe(lane === obstacleLane ? 'over' : 'running')
      }
    }
  })

  it.each([
    ['van', VAN],
    ['tower', TOWER],
  ])('a %s in the G’s lane ends the run however the G jumps, but not in another lane', (_name, template) => {
    for (const lane of lanes) {
      const start = laneGame({ lane, laneX: lane, obstacles: [placed(template, lane, PLAYER_X + 150)] })
      // -1 = no jump; otherwise jump on that frame
      for (let jumpAt = -1; jumpAt < 40; jumpAt++) {
        expect(passObstacle(start, jumpAt).status).toBe('over')
      }
      for (const other of lanes.filter((l) => l !== lane)) {
        const s = passObstacle(laneGame({ lane: other, laneX: other, obstacles: start.obstacles }), -1)
        expect(s.status).toBe('running')
        expect(s.obstacles).toHaveLength(0)
      }
    }
  })

  it('a row spans every lane: it collides in each lane unless jumped', () => {
    for (const lane of lanes) {
      const hit = step(laneGame({ lane, laneX: lane, obstacles: [placed(ROW, 'all')] }), DT, NO_INPUT, noRng)
      expect(hit.status).toBe('over')

      const start = laneGame({ lane, laneX: lane, obstacles: [placed(ROW, 'all', PLAYER_X + 150)] })
      expect(passObstacle(start, -1).status).toBe('over')
      const jumpable = Array.from({ length: 40 }, (_, k) => passObstacle(start, k)).some(
        (s) => s.status === 'running' && s.obstacles.length === 0,
      )
      expect(jumpable).toBe(true)
    }
  })
})

describe('spawning in lane mode', () => {
  it('spawns vans, towers and other kinds in all three lanes, and a row is always across all lanes', () => {
    const spawned = spawnsOver(laneGame({ distance: 300 * 20, nextObstacleIn: 0 }), 30000, seeded(4))
    expect(spawned.length).toBeGreaterThan(100)

    for (const kind of ['van', 'tower', 'parcel', 'cone', 'stack', 'envelope'] as const) {
      const lanesSeen = new Set(spawned.filter((o) => o.kind === kind).map((o) => o.lane))
      expect(lanesSeen).toEqual(new Set([-1, 0, 1]))
    }
    const rows = spawned.filter((o) => o.kind === 'row')
    expect(rows.length).toBeGreaterThan(0)
    for (const o of rows) expect(o.lane).toBe('all')

    // Vans and towers together are roughly a third of the spawns
    const share = spawned.filter((o) => o.kind === 'van' || o.kind === 'tower').length / spawned.length
    expect(share).toBeGreaterThan(0.25)
    expect(share).toBeLessThan(0.42)
  })
})

describe('winning in lane mode', () => {
  it('returns the G to the middle lane, ignores steering and still ends in a win', () => {
    let s = laneGame({ lane: 1, laneX: 1, distance: WIN_SCORE * 20 - 1 })
    s = step(s, DT, NO_INPUT, noRng)
    expect(s.status).toBe('delivering')
    expect(s.lane).toBe(0)

    s = step(s, DT, LEFT, noRng)
    expect(s.lane).toBe(0)

    for (let i = 0; i < 60 * 30 && s.status === 'delivering'; i++) {
      s = step(s, DT, i % 2 ? LEFT : RIGHT, noRng)
      expect(s.lane).toBe(0)
    }
    expect(s.status).toBe('won')
    expect(s.parcel).toBe('delivered')
    expect(s.laneX).toBe(0)
  })

  // The G's box and an obstacle's box overlap in all three directions (no forgiving padding)
  function touches(state: GameState, o: Obstacle): boolean {
    const [pl, pr] = playerSideSpan(state.laneX)
    const [ol, or] = obstacleSideSpan(o.lane)
    const playerBottom = GROUND_Y - state.y
    return (
      state.px < o.x + o.w &&
      state.px + PLAYER_W > o.x &&
      playerBottom - PLAYER_H < o.lift + o.h &&
      playerBottom > o.lift &&
      pl < or &&
      pr > ol
    )
  }

  it('keeps obstacles beside the G in lanes off its way to the middle, and clears everything ahead', () => {
    const besideLeft = placed(VAN, -1, PLAYER_X - 10)
    const behind = placed(PARCEL, 1, PLAYER_X - 30)
    let s = laneGame({
      lane: 1,
      laneX: 1,
      distance: WIN_SCORE * 20 - 1,
      obstacles: [
        besideLeft,
        behind,
        placed(VAN, 0, PLAYER_X), // beside, but in the middle lane the G steers back to
        placed(TOWER, 1, PLAYER_X + 4), // beside, in the G's own lane
        placed(ROW, 'all', PLAYER_X), // across every lane
        placed(PARCEL, -1, 200), // ahead in a free lane
        placed(VAN, 1, 120), // ahead in the G's lane
      ],
    })
    s = step(s, DT, NO_INPUT, noRng)
    expect(s.status).toBe('delivering')
    expect(s.obstacles.map((o) => [o.kind, o.lane])).toEqual([
      ['van', -1],
      ['parcel', 1],
    ])

    // Nothing kept touches the G on its way to the middle lane or the shop, and it all scrolls away
    for (let i = 0; i < 60 * 30 && s.status === 'delivering'; i++) {
      s = step(s, DT, NO_INPUT, noRng)
      for (const o of s.obstacles) {
        expect(touches(s, o)).toBe(false)
        if (s.shopX !== null) expect(o.x + o.w).toBeLessThan(s.shopX)
      }
    }
    expect(s.status).toBe('won')
    expect(s.obstacles).toEqual([])
  })

  it('keeps obstacles beside the G in both outer lanes when it is in the middle', () => {
    let s = laneGame({
      distance: WIN_SCORE * 20 - 1,
      obstacles: [placed(VAN, -1, PLAYER_X), placed(TOWER, 1, PLAYER_X), placed(PARCEL, 0, PLAYER_X + 10)],
    })
    s = step(s, DT, NO_INPUT, noRng)
    expect(s.obstacles.map((o) => o.kind)).toEqual(['van', 'tower'])
  })
})
