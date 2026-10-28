import { describe, expect, it } from 'vitest'
import {
  TAP_JUMP_DELAY_MS,
  classifyGesture,
  endPress,
  holdPress,
  startPress,
  tapZone,
  type Gesture,
  type Press,
} from './gesture'

const W = 360

function gesture(dx: number, dy: number, startX = W / 2) {
  return classifyGesture({ dx, dy, startX, width: W })
}

describe('classifyGesture', () => {
  it('a tap in the middle is a jump', () => {
    expect(gesture(0, 0)).toBe('jump')
    expect(gesture(3, -2, W * 0.25)).toBe('jump')
    expect(gesture(-2, 4, W * 0.75)).toBe('jump')
  })

  it('a tap in the outer 20 % steers that way', () => {
    expect(gesture(0, 0, 10)).toBe('left')
    expect(gesture(2, 1, W * 0.19)).toBe('left')
    expect(gesture(0, 0, W - 10)).toBe('right')
    expect(gesture(-1, 2, W * 0.81)).toBe('right')
  })

  it('a horizontal swipe of 30 px or more steers that way, wherever it starts', () => {
    for (const startX of [10, W / 2, W - 10]) {
      expect(gesture(-30, 0, startX)).toBe('left')
      expect(gesture(45, 12, startX)).toBe('right')
      expect(gesture(-80, -40, startX)).toBe('left')
    }
  })

  it('an upward swipe is a jump', () => {
    expect(gesture(0, -40)).toBe('jump')
    expect(gesture(10, -35, 10)).toBe('jump')
    expect(gesture(-20, -60, W - 10)).toBe('jump')
  })

  it('a short or mostly vertical drag is not a steer', () => {
    for (const startX of [10, W / 2, W - 10]) {
      for (const [dx, dy] of [
        [20, 0],
        [-25, 5],
        [20, 40],
        [-28, 60],
        [10, -50],
      ]) {
        expect(['left', 'right']).not.toContain(gesture(dx, dy, startX))
      }
    }
  })
})

describe('tapZone', () => {
  it('splits the board 20 / 60 / 20', () => {
    expect(tapZone(0, W)).toBe('left')
    expect(tapZone(W * 0.2 + 1, W)).toBe('jump')
    expect(tapZone(W * 0.8 - 1, W)).toBe('jump')
    expect(tapZone(W, W)).toBe('right')
  })
})

// Plays a press: each move is [dx, dy, ms since pointerdown]; the last one is the release.
// Returns every jump and steer it gave, in order.
function play(startX: number, moves: [number, number, number][]): Gesture[] {
  let press: Press = startPress(startX, W)
  const out: Gesture[] = []
  for (const [dx, , ms] of moves.slice(0, -1)) {
    const held = holdPress(press, dx, ms)
    press = held.press
    if (held.jump) out.push('jump')
  }
  const [dx, dy] = moves[moves.length - 1]
  const end = endPress(press, dx, dy)
  if (end) out.push(end)
  return out
}

describe('a press in lane mode', () => {
  it('a still press in the middle jumps after the delay, once', () => {
    let press = startPress(W / 2, W)
    let held = holdPress(press, 0, TAP_JUMP_DELAY_MS - 1)
    expect(held.jump).toBe(false)
    press = held.press
    held = holdPress(press, 3, TAP_JUMP_DELAY_MS)
    expect(held.jump).toBe(true)
    press = held.press
    expect(holdPress(press, 3, TAP_JUMP_DELAY_MS + 50).jump).toBe(false)
    expect(endPress(press, 3, 0)).toBeNull()
    expect(play(W / 2, [[0, 0, 20], [1, 0, 100], [1, 0, 200], [1, 1, 300]])).toEqual(['jump'])
  })

  it('a quick tap in the middle jumps on release', () => {
    expect(play(W / 2, [[0, 0, 10], [2, 1, 40]])).toEqual(['jump'])
    expect(play(W / 2, [[0, 0, 30]])).toEqual(['jump'])
    // Moving up or down a little doesn't stop it being a tap in the middle
    expect(play(W / 2, [[0, 15, 30]])).toEqual(['jump'])
  })

  it('a swipe from the middle never jumps', () => {
    for (const sign of [-1, 1]) {
      // Fast: past 10 px sideways before the delay, held on well after it
      const fast = play(W / 2, [[sign * 4, 0, 16], [sign * 12, 0, 32], [sign * 40, 0, 120], [sign * 60, 2, 200]])
      expect(fast).toEqual([sign < 0 ? 'left' : 'right'])
      // Released straight away, without a move event
      expect(play(W / 2, [[sign * 45, 5, 50]])).toEqual([sign < 0 ? 'left' : 'right'])
      // A short swipe neither jumps nor steers, even if it comes back near the start
      expect(play(W / 2, [[sign * 15, 0, 30], [sign * 20, 0, 200], [sign * 4, 0, 300]])).toEqual([])
    }
  })

  it('an upward swipe from the middle still jumps, once', () => {
    expect(play(W / 2, [[0, -10, 20], [2, -40, 50]])).toEqual(['jump'])
    expect(play(W / 2, [[12, -20, 30], [15, -50, 60]])).toEqual(['jump'])
    // Held still first: it has jumped already, so the swipe up doesn't jump again
    expect(play(W / 2, [[0, 0, 100], [0, -50, 200]])).toEqual(['jump'])
  })

  it('a held press that has jumped never steers, even if it then swipes sideways', () => {
    for (const sign of [-1, 1]) {
      expect(play(W / 2, [[0, 0, 100], [sign * 20, 0, 150], [sign * 60, 0, 250], [sign * 80, 5, 300]])).toEqual([
        'jump',
      ])
      expect(play(W / 2, [[2, 0, TAP_JUMP_DELAY_MS], [sign * 45, 0, 200]])).toEqual(['jump'])
    }
  })

  it('a press at the side steers on release and never jumps while held', () => {
    expect(play(10, [[0, 0, 200], [1, 1, 300]])).toEqual(['left'])
    expect(play(W - 10, [[0, 0, 200], [0, 2, 300]])).toEqual(['right'])
    expect(play(10, [[40, 0, 50], [60, 0, 100]])).toEqual(['right'])
  })
})
