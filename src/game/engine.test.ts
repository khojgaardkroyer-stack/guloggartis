import { describe, expect, it } from 'vitest'
import {
  GROUND_Y,
  LANE_SPAWN_X,
  PLAYER_H,
  PLAYER_X,
  WIDTH,
  WIN_SCORE,
  randomObstacle,
  startGame,
  step,
  type GameMode,
  type GameState,
  type Obstacle,
  type ObstacleTemplate,
} from './engine'

const DT = 1 / 60
const NO_INPUT = { jump: false }
const JUMP = { jump: true }

// Deterministic stand-in for Math.random
function fixedRng(value = 0) {
  return () => value
}

function run(state: GameState, frames: number, input = NO_INPUT): GameState {
  let s = state
  for (let i = 0; i < frames; i++) s = step(s, DT, input, fixedRng())
  return s
}

// A running game with one obstacle placed on top of the player, and no new spawns soon
function withObstacle(template: ObstacleTemplate, x = PLAYER_X): GameState {
  const obstacle: Obstacle = { x, ...template }
  return { ...startGame(), nextObstacleIn: 100, obstacles: [obstacle] }
}

function kindsAt(score: number): Set<string> {
  const kinds = new Set<string>()
  for (let i = 0; i < 100; i++) {
    const o = randomObstacle(score, fixedRng(i / 100))
    kinds.add(o.kind === 'envelope' ? `envelope-${o.lift}` : o.kind)
  }
  return kinds
}

describe('jumping', () => {
  it('goes up and lands on the ground again', () => {
    let s = step(startGame(), DT, JUMP, fixedRng())
    expect(s.vy).toBeLessThan(0)
    expect(s.y).toBeLessThan(GROUND_Y - PLAYER_H)

    let landed = false
    for (let i = 0; i < 120 && !landed; i++) {
      s = step(s, DT, NO_INPUT, fixedRng())
      landed = s.y === GROUND_Y - PLAYER_H
    }
    expect(landed).toBe(true)
    expect(s.y).toBe(GROUND_Y - PLAYER_H)
    expect(s.vy).toBe(0)
    expect(s.status).toBe('running')
  })

  it('ignores a jump input while in the air', () => {
    const airborne = run(step(startGame(), DT, JUMP, fixedRng()), 5)
    expect(airborne.y).toBeLessThan(GROUND_Y - PLAYER_H)

    const withJump = step(airborne, DT, JUMP, fixedRng())
    const withoutJump = step(airborne, DT, NO_INPUT, fixedRng())
    expect(withJump).toEqual(withoutJump)
  })
})

describe('collisions', () => {
  const cases: [string, ObstacleTemplate][] = [
    ['parcel', { kind: 'parcel', w: 18, h: 18, lift: 0 }],
    ['stack', { kind: 'stack', w: 20, h: 38, lift: 0 }],
    ['row', { kind: 'row', w: 54, h: 18, lift: 0 }],
    ['cone', { kind: 'cone', w: 16, h: 24, lift: 0 }],
    ['low envelope', { kind: 'envelope', w: 26, h: 16, lift: 12 }],
  ]

  it.each(cases)('hitting a %s ends the game', (_name, template) => {
    const s = step(withObstacle(template), DT, NO_INPUT, fixedRng())
    expect(s.status).toBe('over')
  })

  it('a high envelope flies over a player on the ground', () => {
    let s = withObstacle({ kind: 'envelope', w: 26, h: 16, lift: 44 }, PLAYER_X + 60)
    for (let i = 0; i < 60; i++) {
      s = step(s, DT, NO_INPUT, fixedRng())
      expect(s.status).toBe('running')
    }
    // The envelope has passed the player completely
    expect(s.obstacles).toHaveLength(0)
  })
})

describe('randomObstacle', () => {
  it('never returns a kind below its minScore', () => {
    expect(kindsAt(49).has('cone')).toBe(false)
    expect(kindsAt(99).has('stack')).toBe(false)
    expect(kindsAt(149).has('row')).toBe(false)
    expect(kindsAt(199).has('envelope-12')).toBe(false)
    expect(kindsAt(199).has('envelope-44')).toBe(false)
    expect([...kindsAt(0)]).toEqual(['parcel'])
  })

  it('can return each kind once its minScore is reached', () => {
    expect(kindsAt(50).has('cone')).toBe(true)
    expect(kindsAt(100).has('stack')).toBe(true)
    expect(kindsAt(150).has('row')).toBe(true)
    expect(kindsAt(200)).toEqual(
      new Set(['parcel', 'cone', 'stack', 'row', 'envelope-12', 'envelope-44']),
    )
  })
})

describe('winning', () => {
  it('reaching WIN_SCORE starts the delivery, which ends in a win', () => {
    let s: GameState = { ...startGame(), distance: WIN_SCORE * 20 - 1, nextObstacleIn: 100 }
    s = step(s, DT, NO_INPUT, fixedRng())
    expect(s.score).toBe(WIN_SCORE)
    expect(s.status).toBe('delivering')
    expect(s.parcel).toBe('carried')

    for (let i = 0; i < 60 * 30 && s.status === 'delivering'; i++) {
      s = step(s, DT, NO_INPUT, fixedRng())
    }
    expect(s.status).toBe('won')
    expect(s.parcel).toBe('delivered')
    expect(s.score).toBe(WIN_SCORE)
  })
})

describe('step', () => {
  it('does not mutate the state it is given', () => {
    const s = withObstacle({ kind: 'parcel', w: 18, h: 18, lift: 0 }, 200)
    const before = structuredClone(s)
    const next = step(s, DT, JUMP, fixedRng())
    expect(s).toEqual(before)
    expect(next).not.toBe(s)
    expect(next.obstacles[0]).not.toBe(s.obstacles[0])
    expect(next.obstacles[0].x).toBeLessThan(s.obstacles[0].x)
  })

  it('also leaves the state alone when it spawns an obstacle or ends the game', () => {
    const spawning = { ...startGame(), nextObstacleIn: DT / 2 }
    const spawnBefore = structuredClone(spawning)
    expect(step(spawning, DT, NO_INPUT, fixedRng()).obstacles).toHaveLength(1)
    expect(spawning).toEqual(spawnBefore)

    const crashing = withObstacle({ kind: 'parcel', w: 18, h: 18, lift: 0 })
    const crashBefore = structuredClone(crashing)
    expect(step(crashing, DT, NO_INPUT, fixedRng()).status).toBe('over')
    expect(crashing).toEqual(crashBefore)
  })
})

// Small seeded PRNG (mulberry32), so runs are repeatable
function seeded(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type Played = { states: GameState[]; spawned: (Obstacle & { at: number })[] }

// Plays a run from 0 m until it ends, clearing the track after every step so nothing is ever hit
function playToEnd(mode: GameMode, seed: number): Played {
  const rng = seeded(seed)
  const states: GameState[] = []
  const spawned: (Obstacle & { at: number })[] = []
  let s = startGame(mode)
  for (let i = 0; i < 60 * 600 && (s.status === 'running' || s.status === 'delivering'); i++) {
    s = step(s, DT, NO_INPUT, rng)
    states.push(s)
    spawned.push(...s.obstacles.map((o) => ({ ...o, at: s.score })))
    s = { ...s, obstacles: [] }
  }
  return { states, spawned }
}

describe('game modes', () => {
  const twoD = playToEnd('2d', 1)
  const threeD = playToEnd('3d', 1)

  it('a 2D run never goes into lane mode, also past 200 m and up to the win', () => {
    expect(startGame('2d').lanes).toBe(false)
    expect(startGame().lanes).toBe(false)
    expect(twoD.states.at(-1)?.score).toBe(WIN_SCORE)
    for (const s of twoD.states) {
      expect(s.lanes).toBe(false)
      expect(s.lane).toBe(0)
      expect(s.laneX).toBe(0)
    }
    expect(twoD.spawned.length).toBeGreaterThan(30)
    for (const o of twoD.spawned) {
      expect(o.kind).not.toBe('van')
      expect(o.kind).not.toBe('tower')
      expect(o.lane ?? 0).toBe(0)
    }
  })

  it('a 3D run is in lane mode from its first step, in the middle lane', () => {
    const start = startGame('3d')
    expect(start.status).toBe('running')
    expect(start.lanes).toBe(true)
    expect(start.lane).toBe(0)
    expect(start.laneX).toBe(0)
    expect(start.score).toBe(0)
    for (const s of threeD.states) expect(s.lanes).toBe(true)
  })

  it('a 3D run can spawn vans and towers, in every lane, from 0 m', () => {
    // Hold the run at 0 m and collect what spawns there
    const rng = seeded(2)
    const kinds = new Set<string>()
    const lanes = new Set<unknown>()
    let s = startGame('3d')
    for (let i = 0; i < 3000; i++) {
      s = step({ ...s, obstacles: [], distance: 0 }, DT, NO_INPUT, rng)
      for (const o of s.obstacles) {
        expect(s.score).toBe(0)
        expect(o.x).toBe(LANE_SPAWN_X)
        kinds.add(o.kind)
        lanes.add(o.lane)
      }
    }
    expect(kinds.has('van')).toBe(true)
    expect(kinds.has('tower')).toBe(true)
    expect(lanes).toEqual(new Set([-1, 0, 1]))
    // The score-unlocked kinds are unchanged: at 0 m only parcels besides vans and towers
    expect([...kinds].sort()).toEqual(['parcel', 'tower', 'van'])
  })

  it.each([
    ['2d', twoD],
    ['3d', threeD],
  ] as const)('a %s run reaches WIN_SCORE and ends in won via delivering', (_mode, played) => {
    const statuses = played.states.map((s) => s.status)
    const firstDelivering = statuses.indexOf('delivering')
    expect(firstDelivering).toBeGreaterThan(0)
    expect(statuses.slice(0, firstDelivering).every((st) => st === 'running')).toBe(true)
    expect(played.states[firstDelivering].score).toBe(WIN_SCORE)
    expect(statuses.at(-1)).toBe('won')
    expect(statuses).not.toContain('over')
  })

  it('has no spawn pause around 200 m in either mode', () => {
    for (const mode of ['2d', '3d'] as const) {
      for (let meters = 150; meters <= 300; meters++) {
        const s = { ...startGame(mode), distance: meters * 20, nextObstacleIn: 0 }
        const next = step(s, DT, NO_INPUT, fixedRng())
        expect(next.obstacles).toHaveLength(1)
        expect(next.obstacles[0].x).toBe(mode === '2d' ? WIDTH : LANE_SPAWN_X)
      }
    }
    // And in a whole run, obstacles keep coming between 180 m and 250 m
    for (const played of [twoD, threeD]) {
      expect(played.spawned.filter((o) => o.at >= 180 && o.at < 250).length).toBeGreaterThanOrEqual(2)
    }
  })
})
