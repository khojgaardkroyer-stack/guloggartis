import { describe, expect, it } from 'vitest'
import {
  GROUND_Y,
  HEIGHT,
  LANE_DROP_X,
  LANE_SPAWN_X,
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
  boxesOverlap,
  cameraPose,
  availability3D,
  obstacleBox,
  playerBox,
  worldY,
} from './view3d'

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
    expect(tx).toBeGreaterThan(PLAYER_X + PLAYER_W)
    expect(ty).toBeLessThan(py)
    expect(pose.shift).toBe(0)
    // Tilted down about 18°: a chase view, not a view from the top
    const tilt = (Math.atan2(py - ty, tx - px) * 180) / Math.PI
    expect(tilt).toBeCloseTo(18, 6)
  })

  // Angle below the chase camera's view axis (degrees) and fog depth of a point at run position x, height y
  function inChaseView(x: number, y: number) {
    const pose = cameraPose(1)
    const [px, py] = pose.position
    const [tx, ty] = pose.target
    const axis = Math.atan2(py - ty, tx - px)
    const len = Math.hypot(tx - px, ty - py)
    const depth = ((x - px) * (tx - px) + (y - py) * (ty - py)) / len
    const fog = Math.min(Math.max((depth - pose.fogNear) / (pose.fogFar - pose.fogNear), 0), 1)
    return { below: ((Math.atan2(py - y, x - px) - axis) * 180) / Math.PI, fog, halfFov: pose.fov / 2 }
  }

  it('shows the G and the track up to the lane-mode spawn point', () => {
    for (const [x, y] of [
      [PLAYER_X + PLAYER_W / 2, 0],
      [PLAYER_X + PLAYER_W / 2, PLAYER_H],
      [LANE_SPAWN_X, 0],
    ]) {
      const { below, halfFov } = inChaseView(x, y)
      expect(Math.abs(below)).toBeLessThan(halfFov)
    }
  })

  it('fades obstacles in out of the fog just after they spawn at LANE_SPAWN_X', () => {
    expect(inChaseView(LANE_SPAWN_X, 0).fog).toBeGreaterThan(0.9)
    expect(inChaseView(LANE_SPAWN_X, 0).fog).toBeLessThan(1)
    // Fully visible well before reaching the G: at least 300 units of clear track ahead of it
    expect(inChaseView(PLAYER_X + PLAYER_W + 300, 0).fog).toBe(0)
  })

  it('sees lane-mode obstacles leave behind it: LANE_DROP_X is behind the chase camera', () => {
    // The camera only moves forward from here (it follows the G to the shop door), so an obstacle
    // dropped at LANE_DROP_X is out of view. Keep a margin so the two can't drift together.
    expect(LANE_DROP_X).toBeLessThan(cameraPose(1).position[0] - 30)
    expect(LANE_DROP_X).toBeLessThan(cameraPose(1, 200).position[0] - 30)
  })

  it('rises with a jump in the chase view, but not in the side view', () => {
    expect(cameraPose(0, 80)).toEqual(cameraPose(0))
    const ground = cameraPose(1)
    const jumping = cameraPose(1, 80)
    expect(jumping.position[1]).toBeGreaterThan(ground.position[1])
    expect(jumping.target[1] - ground.target[1]).toBeCloseTo(jumping.position[1] - ground.position[1], 6)
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

describe('availability3D', () => {
  const base = { webgl: true, loadFailed: false, reducedMotion: false }

  it('is ok with WebGL, a loaded scene and no reduced motion', () => {
    expect(availability3D(base)).toBe('ok')
  })

  it('names the reason when 3D is not possible', () => {
    expect(availability3D({ ...base, webgl: false })).toBe('no-webgl')
    expect(availability3D({ ...base, loadFailed: true })).toBe('load-failed')
    expect(availability3D({ ...base, reducedMotion: true })).toBe('reduced-motion')
  })

  it('puts no WebGL before a failed load, and a failed load before reduced motion', () => {
    expect(availability3D({ webgl: false, loadFailed: true, reducedMotion: true })).toBe('no-webgl')
    expect(availability3D({ webgl: true, loadFailed: true, reducedMotion: true })).toBe('load-failed')
  })

  it('is ok again once reduced motion is turned off, if nothing else is wrong', () => {
    expect(availability3D({ ...base, reducedMotion: true })).toBe('reduced-motion')
    expect(availability3D({ ...base, reducedMotion: false })).toBe('ok')
  })
})
