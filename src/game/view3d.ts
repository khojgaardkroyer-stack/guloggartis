// The 3D view's timing, camera and geometry as plain numbers. No three.js here, so this stays
// in the main chunk; src/game/three/scene.ts (loaded lazily) draws with it.
import {
  GROUND_Y,
  HEIGHT,
  LANE_SPAWN_X,
  PLAYER_H,
  PLAYER_W,
  PLAYER_X,
  WIDTH,
  obstacleSideSpan,
  playerSideSpan,
  type GameState,
  type Obstacle,
} from './engine'

/** Length of the camera swing at the start of a 3D run, in real time; the G stands still meanwhile */
export const SWING_SECONDS = 1.5
/** How long the 3D view takes to fade in over the 2D board when the swing starts */
export const FADE_IN_MS = 200

const clamp01 = (t: number) => Math.min(Math.max(t, 0), 1)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** Smooth ease-in-out (cubic) for 0..1 */
export function easeInOut(t: number): number {
  const c = clamp01(t)
  return c < 0.5 ? 4 * c * c * c : 1 - (-2 * c + 2) ** 3 / 2
}

/** The G's turn around the vertical axis at swing progress `t`: 0 = side-on as in 2D, π/2 = seen from behind */
export function playerTurn(t: number): number {
  return (easeInOut(t) * Math.PI) / 2
}

// World axes: x = along the run (game x, 1:1), y = up (0 = the ground line), z = across the track
// (lane 1, the right lane, is +z). Game units map 1:1 to world units.

/** World height of a game y coordinate */
export function worldY(gameY: number): number {
  return GROUND_Y - gameY
}

/** An axis-aligned box in world units: [min, max] per axis */
export type WorldBox = { x: [number, number]; y: [number, number]; z: [number, number] }

/** The obstacle's box: exactly its 2D box along the run and in height, and its lane band across */
export function obstacleBox(o: Obstacle): WorldBox {
  return { x: [o.x, o.x + o.w], y: [o.lift, o.lift + o.h], z: obstacleSideSpan(o.lane) }
}

/** The G's box: exactly its 2D box along the run and in height, centred on laneX across */
export function playerBox(state: Pick<GameState, 'px' | 'y' | 'laneX'>): WorldBox {
  const bottom = worldY(state.y + PLAYER_H)
  return { x: [state.px, state.px + PLAYER_W], y: [bottom, bottom + PLAYER_H], z: playerSideSpan(state.laneX) }
}

export function boxesOverlap(a: WorldBox, b: WorldBox): boolean {
  return (['x', 'y', 'z'] as const).every((k) => a[k][0] < b[k][1] && b[k][0] < a[k][1])
}

/**
 * A camera pose: `fov` is the vertical field of view in degrees, and `shift` moves the view window
 * up by that fraction of its half-height (a lens shift), so the side view can look straight across
 * while the ground sits low on the board as in 2D.
 */
export type CameraPose = {
  position: [number, number, number]
  target: [number, number, number]
  fov: number
  shift: number
  near: number
  far: number
  fogNear: number
  fogFar: number
}

// Side view (t = 0): the 2D board seen straight on from far away (narrow field of view, nearly
// flat), with the camera at ground height so the track is edge-on, like the 2D ground line.
const SIDE = {
  target: [WIDTH / 2, 0, 0] as const,
  fov: 2.5,
  azimuth: 0,
  elevation: 0,
  viewHeight: HEIGHT,
  // The board's centre is HEIGHT / 2 above its bottom, which is HEIGHT - GROUND_Y below the ground
  shift: (HEIGHT / 2 - (HEIGHT - GROUND_Y)) / (HEIGHT / 2),
  fogNear: 6000,
  fogFar: 8000,
}

// Chase view (t = 1): behind and above the G, tilted down so the track ahead fills the view,
// looking down the track to the lane-mode spawn point
const CHASE_DISTANCE = 380
const CHASE_FOV = 48
const CHASE_TARGET_X = PLAYER_X + 196
const CHASE_ELEVATION = (18 * Math.PI) / 180
// Obstacles fade in out of the white over this distance after they spawn at LANE_SPAWN_X
const FOG_FADE_DISTANCE = 120

/** Fog depth (distance along the chase camera's view axis) of a point on the ground at run position x */
function chaseDepth(x: number): number {
  const cameraX = CHASE_TARGET_X - CHASE_DISTANCE * Math.cos(CHASE_ELEVATION)
  const cameraY = CHASE_DISTANCE * Math.sin(CHASE_ELEVATION)
  return (x - cameraX) * Math.cos(CHASE_ELEVATION) + cameraY * Math.sin(CHASE_ELEVATION)
}

const CHASE = {
  target: [CHASE_TARGET_X, 0, 0] as const,
  fov: CHASE_FOV,
  azimuth: -Math.PI / 2,
  elevation: CHASE_ELEVATION,
  viewHeight: 2 * CHASE_DISTANCE * Math.tan((CHASE_FOV * Math.PI) / 360),
  shift: 0,
  // Just visible at the spawn point, fully visible FOG_FADE_DISTANCE later
  fogNear: chaseDepth(LANE_SPAWN_X - FOG_FADE_DISTANCE),
  fogFar: chaseDepth(LANE_SPAWN_X) + 10,
}

/** Share of the G's jump height the chase camera rises with, so a high jump stays in view */
export const CHASE_JUMP_FOLLOW = 0.5

/**
 * The camera at swing progress `t` (clamped to 0..1), for a G at PLAYER_X that is `jumpHeight`
 * above the ground; the scene shifts it along the run by `state.px - PLAYER_X`. The side view
 * (t = 0) doesn't follow jumps, so it always lines up with the 2D board.
 */
export function cameraPose(t: number, jumpHeight = 0): CameraPose {
  const e = easeInOut(t)
  const rise = CHASE_JUMP_FOLLOW * jumpHeight * e
  const fov = lerp(SIDE.fov, CHASE.fov, e)
  const viewHeight = lerp(SIDE.viewHeight, CHASE.viewHeight, e)
  const distance = viewHeight / 2 / Math.tan((fov * Math.PI) / 360)
  const azimuth = lerp(SIDE.azimuth, CHASE.azimuth, e)
  const elevation = lerp(SIDE.elevation, CHASE.elevation, e)
  const target: [number, number, number] = [
    lerp(SIDE.target[0], CHASE.target[0], e),
    lerp(SIDE.target[1], CHASE.target[1], e) + rise,
    lerp(SIDE.target[2], CHASE.target[2], e),
  ]
  // Direction from the target to the camera: +z (side view) swings round to -x (behind the G)
  const position: [number, number, number] = [
    target[0] + distance * Math.sin(azimuth) * Math.cos(elevation),
    target[1] + distance * Math.sin(elevation),
    target[2] + distance * Math.cos(azimuth) * Math.cos(elevation),
  ]
  return {
    position,
    target,
    fov,
    shift: lerp(SIDE.shift, CHASE.shift, e),
    near: Math.max(5, distance - 1000),
    far: distance + 1500,
    fogNear: lerp(SIDE.fogNear, CHASE.fogNear, e),
    fogFar: lerp(SIDE.fogFar, CHASE.fogFar, e),
  }
}

/** Whether a 3D run is possible: needs WebGL, and not for visitors who prefer reduced motion */
export function can3D({ webgl, reducedMotion }: { webgl: boolean; reducedMotion: boolean }): boolean {
  return webgl && !reducedMotion
}
