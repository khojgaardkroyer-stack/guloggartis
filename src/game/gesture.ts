// Touch and mouse gestures on the game board in lane mode. Plain functions, no DOM.

/** A horizontal swipe at least this long (px) steers; an upward one this long jumps */
export const SWIPE_MIN_PX = 30
/** A press that moves at most this far (px) counts as a tap */
export const TAP_MAX_PX = 10
/** Share of the board's width on each side where a tap steers instead of jumping */
export const SIDE_TAP_SHARE = 0.2
/** A press in the middle that stays put sideways this long (ms) jumps without waiting for the release */
export const TAP_JUMP_DELAY_MS = 80

export type Gesture = 'jump' | 'left' | 'right'

/** What a tap at `x` px from the board's left edge does: steer in the outer 20 %, jump in the middle */
export function tapZone(x: number, width: number): Gesture {
  if (x < width * SIDE_TAP_SHARE) return 'left'
  if (x > width * (1 - SIDE_TAP_SHARE)) return 'right'
  return 'jump'
}

/** A swipe by `dx`/`dy` px (y down): sideways steers, upwards jumps, anything shorter is null */
export function swipeGesture(dx: number, dy: number): Gesture | null {
  const ax = Math.abs(dx)
  const ay = Math.abs(dy)
  if (ax >= SWIPE_MIN_PX && ax > ay) return dx < 0 ? 'left' : 'right'
  if (-dy >= SWIPE_MIN_PX && ay >= ax) return 'jump'
  return null
}

/**
 * Classifies a finished press: `dx`/`dy` is the move from pointerdown to pointerup (px, y down),
 * `startX` where it started from the board's left edge and `width` the board's width.
 * Returns null for a drag that is neither a tap nor a swipe (short, or mostly downwards).
 */
export function classifyGesture({
  dx,
  dy,
  startX,
  width,
}: {
  dx: number
  dy: number
  startX: number
  width: number
}): Gesture | null {
  const swipe = swipeGesture(dx, dy)
  if (swipe) return swipe
  if (Math.hypot(dx, dy) <= TAP_MAX_PX) return tapZone(startX, width)
  return null
}

/**
 * A press on the board in lane mode, from pointerdown to pointerup. A press in the middle jumps
 * once it is clearly not a swipe: on release, or after TAP_JUMP_DELAY_MS still sideways, whichever
 * comes first. If it first moves TAP_MAX_PX or more sideways it is a swipe and never jumps as a tap.
 */
export type Press = {
  startX: number
  width: number
  /** Moved TAP_MAX_PX or more sideways before it jumped: only a swipe can come of it now */
  swiped: boolean
  /** Already jumped while held */
  jumped: boolean
}

export function startPress(startX: number, width: number): Press {
  return { startX, width, swiped: false, jumped: false }
}

/**
 * Updates a held press: `dx` is its sideways move so far (px) and `elapsedMs` how long it has been
 * held. Call it on every pointer move and every frame. `jump` is true the one time it jumps.
 */
export function holdPress(press: Press, dx: number, elapsedMs: number): { press: Press; jump: boolean } {
  if (press.swiped || press.jumped) return { press, jump: false }
  if (Math.abs(dx) >= TAP_MAX_PX) return { press: { ...press, swiped: true }, jump: false }
  if (tapZone(press.startX, press.width) === 'jump' && elapsedMs >= TAP_JUMP_DELAY_MS) {
    return { press: { ...press, jumped: true }, jump: true }
  }
  return { press, jump: false }
}

/**
 * What a press does when it is released after moving `dx`/`dy` px (y down). A sideways swipe
 * steers even after a held jump; a press never jumps twice, and a swipe never jumps as a tap.
 */
export function endPress(held: Press, dx: number, dy: number): Gesture | null {
  const { press } = holdPress(held, dx, 0)
  const swipe = swipeGesture(dx, dy)
  if (swipe === 'left' || swipe === 'right') return swipe
  if (swipe === 'jump') return press.jumped ? null : 'jump'
  if (press.swiped || press.jumped) return null
  const zone = tapZone(press.startX, press.width)
  // In the middle only sideways movement counts against a tap: that is what makes it a swipe
  if (zone === 'jump') return 'jump'
  return Math.hypot(dx, dy) <= TAP_MAX_PX ? zone : null
}
