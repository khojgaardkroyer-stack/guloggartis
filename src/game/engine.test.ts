import { describe, expect, it } from 'vitest'
import {
  GROUND_Y,
  PLAYER_H,
  PLAYER_X,
  WIN_SCORE,
  randomObstacle,
  startGame,
  step,
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
