// Game rules for the jump game: plain TypeScript, no React and no canvas.

export const WIDTH = 360
export const HEIGHT = 150
export const GROUND_Y = 128
export const PLAYER_W = 32
export const PLAYER_H = 32
export const PLAYER_X = 24
export const GRAVITY = 2200
export const JUMP_VELOCITY = -680
export const START_SPEED = 260
export const SPEED_GAIN = 8 // px/s added per second
export const MAX_SPEED = 650
export const WIN_SCORE = 2000

export const SHOP_W = 120
export const SHOP_H = 78
export const SHOP_STOP_X = WIDTH - SHOP_W - 16
export const SHOP_DOOR_X = 18
export const SHOP_DOOR_W = 26
export const WALK_SPEED = 110

// Lane mode (3D only): three lanes side by side, switched on by enterLanes()
export const LANES = 3
export const LANE_W = 40 // distance between lane centres, in game units
export const LANE_CHANGE_SECONDS = 0.15 // time to glide one lane sideways
export const OBSTACLE_SIDE_W = 30 // an obstacle's width across the track, inside its lane
const SIDE_PAD = 5 // forgiving sideways hitbox, like the 5 px padding in collides()
// In lane mode an obstacle is kept until it is wholly behind this x (2D drops it at x = 0), so it
// leaves the 3D view behind the chase camera (at about x = -97) instead of vanishing in sight.
// It is behind the G by then, so it can't collide. view3d.test.ts checks it is behind the camera.
export const LANE_DROP_X = -150

export type Status = 'ready' | 'running' | 'delivering' | 'over' | 'won'
// van and tower only spawn in lane mode and are too tall to jump over
export type ObstacleKind = 'parcel' | 'stack' | 'row' | 'cone' | 'envelope' | 'van' | 'tower'
/** -1 = left, 0 = middle, 1 = right */
export type Lane = -1 | 0 | 1
/** A single lane, or 'all' for an obstacle across the whole track */
export type ObstacleLane = Lane | 'all'
// lift = distance from the ground to the obstacle's bottom edge.
// lane: everything spawned before lane mode is in the middle lane; a missing lane means 0 too.
export type Obstacle = {
  kind: ObstacleKind
  x: number
  w: number
  h: number
  lift: number
  lane?: ObstacleLane
}
export type ObstacleTemplate = Omit<Obstacle, 'x' | 'lane'>
export type ParcelState = 'none' | 'carried' | 'delivered'
/** steer: one lane left (-1) or right (1); only used in lane mode */
export type GameInput = { jump: boolean; steer?: -1 | 1 }
export type Rng = () => number

export type GameState = {
  status: Status
  score: number
  px: number
  y: number
  vy: number
  speed: number
  distance: number
  nextObstacleIn: number
  obstacles: Obstacle[]
  shopX: number | null
  parcel: ParcelState
  celebrateIn: number
  /** Lane mode is on (3D only) */
  lanes: boolean
  /** The lane the G is in or heading for */
  lane: Lane
  /** The G's actual sideways position in lane units; glides towards `lane` */
  laneX: number
}

// New obstacle types unlock as the score climbs
export const OBSTACLES: { minScore: number; make: () => ObstacleTemplate }[] = [
  { minScore: 0, make: () => ({ kind: 'parcel', w: 18, h: 18, lift: 0 }) },
  { minScore: 0, make: () => ({ kind: 'parcel', w: 26, h: 26, lift: 0 }) },
  { minScore: 50, make: () => ({ kind: 'cone', w: 16, h: 24, lift: 0 }) },
  { minScore: 100, make: () => ({ kind: 'stack', w: 20, h: 38, lift: 0 }) },
  { minScore: 150, make: () => ({ kind: 'row', w: 54, h: 18, lift: 0 }) },
  // Low envelopes must be jumped; high ones fly over you if you stay on the ground
  { minScore: 200, make: () => ({ kind: 'envelope', w: 26, h: 16, lift: 12 }) },
  { minScore: 200, make: () => ({ kind: 'envelope', w: 26, h: 16, lift: 44 }) },
]

export function randomObstacle(score: number, rng: Rng = Math.random): ObstacleTemplate {
  const available = OBSTACLES.filter((o) => score >= o.minScore)
  return available[Math.floor(rng() * available.length)].make()
}

// Only in lane mode. Taller than the highest jump (~105), so the only way past is another lane.
export const LANE_OBSTACLES: (() => ObstacleTemplate)[] = [
  () => ({ kind: 'van', w: 70, h: 120, lift: 0 }),
  () => ({ kind: 'tower', w: 26, h: 120, lift: 0 }),
]

/** Share of lane-mode spawns that are a van or a tower */
export const LANE_OBSTACLE_SHARE = 1 / 3

/** A lane-mode obstacle: a van or tower about a third of the time, otherwise as randomObstacle */
export function randomLaneObstacle(
  score: number,
  rng: Rng = Math.random,
): ObstacleTemplate & { lane: ObstacleLane } {
  const template =
    rng() < LANE_OBSTACLE_SHARE
      ? LANE_OBSTACLES[Math.floor(rng() * LANE_OBSTACLES.length)]()
      : randomObstacle(score, rng)
  // A row spans every lane and must be jumped
  const lane: ObstacleLane = template.kind === 'row' ? 'all' : ((Math.floor(rng() * LANES) - 1) as Lane)
  return { ...template, lane }
}

export function newGame(): GameState {
  return {
    status: 'ready',
    score: 0,
    px: PLAYER_X,
    y: GROUND_Y - PLAYER_H,
    vy: 0,
    speed: START_SPEED,
    distance: 0,
    nextObstacleIn: 0.6,
    obstacles: [],
    shopX: null,
    parcel: 'none',
    celebrateIn: 0,
    lanes: false,
    lane: 0,
    laneX: 0,
  }
}

export function startGame(): GameState {
  return { ...newGame(), status: 'running' }
}

/** Switches lane mode on, with the G in the middle lane. Obstacles keep their lanes. */
export function enterLanes(state: GameState): GameState {
  return { ...state, lanes: true, lane: 0, laneX: 0 }
}

/** The G's extent across the track, centred on `laneX` (game units, 0 = middle of the track) */
export function playerSideSpan(laneX: number): [number, number] {
  const centre = laneX * LANE_W
  return [centre - PLAYER_W / 2, centre + PLAYER_W / 2]
}

/** An obstacle's extent across the track: inside its lane, or the full track width for 'all' */
export function obstacleSideSpan(lane: ObstacleLane = 0): [number, number] {
  if (lane === 'all') return [(-LANES * LANE_W) / 2, (LANES * LANE_W) / 2]
  const centre = lane * LANE_W
  return [centre - OBSTACLE_SIDE_W / 2, centre + OBSTACLE_SIDE_W / 2]
}

function sideOverlaps(state: GameState, o: Obstacle): boolean {
  const [pl, pr] = playerSideSpan(state.laneX)
  const [ol, or] = obstacleSideSpan(o.lane)
  return pl + SIDE_PAD < or && pr - SIDE_PAD > ol
}

/**
 * In lane mode at the goal: an obstacle beside the G (not ahead of it) in a lane that the G
 * doesn't cross on its way back to the middle lane. It can't touch the G or the shop, so it is
 * left to scroll away instead of vanishing next to the camera.
 */
function besideOutOfTheWay(state: GameState, o: Obstacle): boolean {
  if (o.x >= state.px + PLAYER_W) return false
  const [left] = playerSideSpan(Math.min(state.laneX, 0))
  const [, right] = playerSideSpan(Math.max(state.laneX, 0))
  const [ol, or] = obstacleSideSpan(o.lane)
  return or <= left || ol >= right
}

export function isOnGround(state: GameState): boolean {
  return state.y >= GROUND_Y - PLAYER_H - 0.5
}

// Slightly forgiving hitbox
export function collides(state: GameState): boolean {
  const pad = 5
  return state.obstacles.some((o) => {
    const top = GROUND_Y - o.lift - o.h
    const bottom = GROUND_Y - o.lift
    const inset = o.kind === 'cone' ? 3 : 0
    return (
      state.px + pad < o.x + o.w - inset &&
      state.px + PLAYER_W - pad > o.x + inset &&
      state.y + PLAYER_H - pad > top &&
      state.y + pad < bottom &&
      (!state.lanes || sideOverlaps(state, o))
    )
  })
}

/** Advances the game by one time step. Returns a new state; never mutates `state`. */
export function step(state: GameState, dt: number, input: GameInput, rng: Rng = Math.random): GameState {
  if (state.status !== 'running' && state.status !== 'delivering') return state

  const g: GameState = { ...state }
  if (input.jump && g.status === 'running' && isOnGround(g)) g.vy = JUMP_VELOCITY

  const delivering = g.shopX !== null

  if (g.lanes) {
    // One lane per steer, in the air too, but not once the delivery has started
    if (input.steer && !delivering) {
      g.lane = Math.max(-1, Math.min(1, g.lane + input.steer)) as Lane
    }
    const maxMove = dt / LANE_CHANGE_SECONDS
    const towards = g.lane - g.laneX
    g.laneX = Math.abs(towards) <= maxMove ? g.lane : g.laneX + Math.sign(towards) * maxMove
  }

  g.vy += GRAVITY * dt
  g.y = Math.min(g.y + g.vy * dt, GROUND_Y - PLAYER_H)
  if (g.y === GROUND_Y - PLAYER_H) g.vy = 0

  if (g.shopX === null) {
    g.speed = Math.min(g.speed + SPEED_GAIN * dt, MAX_SPEED)
  } else {
    // Brake so the shop rolls to a stop at its spot
    const remaining = g.shopX - SHOP_STOP_X
    g.speed = remaining > 0 ? Math.max(Math.min(g.speed, remaining * 3), 60) : 0
  }
  const move =
    g.shopX === null ? g.speed * dt : Math.min(g.speed * dt, Math.max(g.shopX - SHOP_STOP_X, 0))
  g.distance += move
  const dropX = g.lanes ? LANE_DROP_X : 0
  g.obstacles = state.obstacles.map((o) => ({ ...o, x: o.x - move })).filter((o) => o.x + o.w > dropX)
  if (g.shopX !== null) g.shopX -= move

  if (!delivering) {
    const points = Math.min(Math.floor(g.distance / 20), WIN_SCORE)
    g.score = points

    if (points >= WIN_SCORE) {
      // Reached the goal: clear the road ahead and bring in the parcel shop
      g.obstacles = g.obstacles.filter((o) => o.x + o.w < g.px || (g.lanes && besideOutOfTheWay(g, o)))
      g.shopX = WIDTH + 10
      g.parcel = 'carried'
      g.status = 'delivering'
      // The shop sits across the middle of the track: steer back to the middle lane
      if (g.lanes) g.lane = 0
    } else {
      g.nextObstacleIn -= dt
      if (g.nextObstacleIn <= 0) {
        const o: Obstacle = g.lanes
          ? { x: WIDTH, ...randomLaneObstacle(points, rng) }
          : { x: WIDTH, lane: 0, ...randomObstacle(points, rng) }
        g.obstacles = [...g.obstacles, o]
        // Always leave enough room to land before the next obstacle
        g.nextObstacleIn = 0.75 + (o.w + 40) / g.speed + rng() * 0.9
      }

      if (collides(g)) g.status = 'over'
    }
  } else if (
    g.shopX !== null &&
    g.shopX <= SHOP_STOP_X &&
    g.vy === 0 &&
    (!g.lanes || g.laneX === 0)
  ) {
    // Shop has arrived: walk to the door and hand over the parcel
    if (g.parcel === 'carried') {
      g.px += WALK_SPEED * dt
      if (g.px + PLAYER_W >= g.shopX + SHOP_DOOR_X) {
        g.px = g.shopX + SHOP_DOOR_X - PLAYER_W
        g.parcel = 'delivered'
        g.celebrateIn = 0.6
      }
    } else if (g.parcel === 'delivered') {
      g.celebrateIn -= dt
      if (g.celebrateIn <= 0) g.status = 'won'
    }
  }

  return g
}
