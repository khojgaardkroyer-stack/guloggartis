import { describe, expect, it } from 'vitest'
import {
  GROUND_Y,
  HEIGHT,
  OBSTACLES,
  LANE_OBSTACLES,
  PLAYER_H,
  PLAYER_W,
  PLAYER_X,
  WIDTH,
  collides,
  enterLanes,
  startGame,
  type GameState,
  type Lane,
  type Obstacle,
  type ObstacleTemplate,
} from './engine'
import {
  SLOWMO_MIN,
  boxesOverlap,
  cameraPose,
  can3D,
  obstacleBox,
  playerBox,
  swingTimeScale,
  worldY,
} from './view3d'

describe('swingTimeScale', () => {
  it('is 1 at both ends and SLOWMO_MIN in the middle', () => {
    expect(swingTimeScale(0)).toBe(1)
    expect(swingTimeScale(1)).toBeCloseTo(1, 10)
    expect(swingTimeScale(0.5)).toBeCloseTo(SLOWMO_MIN, 10)
  })

  it('stays between SLOWMO_MIN and 1 and has no jumps', () => {
    let prev = swingTimeScale(-0.5)
    for (let t = -0.5; t <= 1.5; t += 0.001) {
      const s = swingTimeScale(t)
      expect(s).toBeGreaterThanOrEqual(SLOWMO_MIN - 1e-9)
      expect(s).toBeLessThanOrEqual(1)
      expect(Math.abs(s - prev)).toBeLessThan(0.01)
      prev = s
    }
  })
})

describe('cameraPose', () => {
  it('starts as a side view that frames the 2D board', () => {
    const pose = cameraPose(0)
    const [px, py, pz] = pose.position
    const [tx, ty, tz] = pose.target
    // Looking straight across the track at ground height, centred on the board
    expect(px).toBeCloseTo(WIDTH / 2, 6)
    expect(tx).toBeCloseTo(WIDTH / 2, 6)
    expect(py).toBeCloseTo(0, 6)
    expect(ty).toBeCloseTo(0, 6)
    expect(tz).toBe(0)
    expect(pz).toBeGreaterThan(1000)

    // The view window at the target spans the board: game y 0..HEIGHT
    const distance = pz - tz
    const halfHeight = distance * Math.tan((pose.fov * Math.PI) / 360)
    const centre = ty + pose.shift * halfHeight
    expect(centre + halfHeight).toBeCloseTo(worldY(0), 6)
    expect(centre - halfHeight).toBeCloseTo(worldY(HEIGHT), 6)
    expect(halfHeight * 2 * (WIDTH / HEIGHT)).toBeCloseTo(WIDTH, 6)
  })

  it('ends as a chase view behind and above the G, looking down the track', () => {
    const pose = cameraPose(1)
    const [px, py, pz] = pose.position
    const [tx, ty] = pose.target
    expect(px).toBeLessThan(PLAYER_X)
    expect(pz).toBeCloseTo(0, 6)
    expect(py).toBeGreaterThan(PLAYER_H)
    // A little above: a chase view, not a view from the top
    expect(py).toBeLessThan(100)
    expect(tx).toBeGreaterThan(PLAYER_X + PLAYER_W)
    expect(ty).toBeLessThan(py)
    expect(pose.shift).toBe(0)
    // Fog fades obstacles in around the spawn point
    expect(pose.fogFar).toBeGreaterThan(WIDTH - px - 20)
  })

  it('clamps t to 0..1', () => {
    expect(cameraPose(-1)).toEqual(cameraPose(0))
    expect(cameraPose(2)).toEqual(cameraPose(1))
  })
})

const ALL_TEMPLATES: ObstacleTemplate[] = [...OBSTACLES.map((o) => o.make()), ...LANE_OBSTACLES.map((make) => make())]

describe('world boxes', () => {
  it.each(ALL_TEMPLATES.map((t) => [`${t.kind} (lift ${t.lift}, w ${t.w})`, t] as const))(
    '%s: the world box equals the 2D box along the run and in height',
    (_name, template) => {
      const o: Obstacle = { x: 123, lane: 1, ...template }
      const box = obstacleBox(o)
      expect(box.x).toEqual([o.x, o.x + o.w])
      expect(box.y).toEqual([o.lift, o.lift + o.h])
      // 2D: the box is drawn from GROUND_Y - lift - h to GROUND_Y - lift
      expect(box.y[1]).toBe(worldY(GROUND_Y - o.lift - o.h))
    },
  )

  it('the G’s world box matches its 2D box', () => {
    const state = { px: 40, y: GROUND_Y - PLAYER_H - 30, laneX: 0 }
    const box = playerBox(state)
    expect(box.x).toEqual([40, 40 + PLAYER_W])
    expect(box.y).toEqual([worldY(state.y + PLAYER_H), worldY(state.y)])
    expect(box.y[0]).toBe(30)
  })

  const grounded: GameState = enterLanes(startGame())
  const envelope = (lift: number): Obstacle => ({ kind: 'envelope', x: PLAYER_X, w: 26, h: 16, lift, lane: 0 })

  it('a high envelope is entirely above a grounded G, and a low one overlaps it', () => {
    const g = playerBox(grounded)
    expect(obstacleBox(envelope(44)).y[0]).toBeGreaterThan(g.y[1])
    expect(boxesOverlap(obstacleBox(envelope(44)), g)).toBe(false)
    expect(boxesOverlap(obstacleBox(envelope(12)), g)).toBe(true)
    expect(collides({ ...grounded, obstacles: [envelope(44)] })).toBe(false)
    expect(collides({ ...grounded, obstacles: [envelope(12)] })).toBe(true)
  })

  it('sideways, an obstacle in another lane misses the G and a row across all lanes hits it, as in collides', () => {
    const lanes: Lane[] = [-1, 0, 1]
    for (const lane of lanes) {
      const state: GameState = { ...grounded, lane, laneX: lane }
      const g = playerBox(state)
      for (const other of lanes) {
        const o: Obstacle = { kind: 'parcel', x: PLAYER_X, w: 26, h: 26, lift: 0, lane: other }
        expect(boxesOverlap(obstacleBox(o), g)).toBe(other === lane)
        expect(collides({ ...state, obstacles: [o] })).toBe(other === lane)
      }
      const row: Obstacle = { kind: 'row', x: PLAYER_X, w: 54, h: 18, lift: 0, lane: 'all' }
      expect(boxesOverlap(obstacleBox(row), g)).toBe(true)
      expect(collides({ ...state, obstacles: [row] })).toBe(true)
    }
  })
})

describe('can3D', () => {
  it('needs WebGL and no reduced motion', () => {
    expect(can3D({ webgl: false, reducedMotion: false })).toBe(false)
    expect(can3D({ webgl: true, reducedMotion: true })).toBe(false)
    expect(can3D({ webgl: false, reducedMotion: true })).toBe(false)
    expect(can3D({ webgl: true, reducedMotion: false })).toBe(true)
  })
})
