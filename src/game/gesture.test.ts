import { describe, expect, it } from 'vitest'
import { classifyGesture, tapZone } from './gesture'

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
