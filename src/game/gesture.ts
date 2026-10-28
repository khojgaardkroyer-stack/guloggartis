// Touch and mouse gestures on the game board in lane mode. Plain functions, no DOM.

/** A horizontal swipe at least this long (px) steers; an upward one this long jumps */
export const SWIPE_MIN_PX = 30
/** A press that moves at most this far (px) counts as a tap */
export const TAP_MAX_PX = 10
/** Share of the board's width on each side where a tap steers instead of jumping */
export const SIDE_TAP_SHARE = 0.2

export type Gesture = 'jump' | 'left' | 'right'

/** What a tap at `x` px from the board's left edge does: steer in the outer 20 %, jump in the middle */
export function tapZone(x: number, width: number): Gesture {
  if (x < width * SIDE_TAP_SHARE) return 'left'
  if (x > width * (1 - SIDE_TAP_SHARE)) return 'right'
  return 'jump'
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
  const ax = Math.abs(dx)
  const ay = Math.abs(dy)
  if (ax >= SWIPE_MIN_PX && ax > ay) return dx < 0 ? 'left' : 'right'
  if (-dy >= SWIPE_MIN_PX && ay >= ax) return 'jump'
  if (Math.hypot(dx, dy) <= TAP_MAX_PX) return tapZone(startX, width)
  return null
}
