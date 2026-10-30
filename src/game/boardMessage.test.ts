import { describe, expect, it } from 'vitest'
import { boardMessage } from './boardMessage'

describe('boardMessage', () => {
  it('asks for a mode on the start screen', () => {
    expect(boardMessage('ready', null, true)).toBe('Vælg 2D eller 3D nedenfor')
    expect(boardMessage('ready', null, false)).toBe('Vælg 2D eller 3D nedenfor')
  })

  it('shows nothing during a run', () => {
    expect(boardMessage('running', '2d', true)).toBeNull()
    expect(boardMessage('delivering', '3d', true)).toBeNull()
  })

  it('offers a retry after a lost run that can start again', () => {
    expect(boardMessage('over', '2d', true)).toBe('Av! Tryk for at prøve igen')
    expect(boardMessage('over', '2d', false)).toBe('Av! Tryk for at prøve igen')
    expect(boardMessage('over', '3d', true)).toBe('Av! Tryk for at prøve igen')
  })

  it('points to 2D when a 3D run ended and 3D is no longer available', () => {
    expect(boardMessage('over', '3d', false)).toBe('3D stoppede. Skift til 2D nedenfor.')
  })

  it('keeps the win message in both modes', () => {
    expect(boardMessage('won', '2d', true)).toBe('📦 Pakken er afleveret! Du vandt!')
    expect(boardMessage('won', '3d', false)).toBe('📦 Pakken er afleveret! Du vandt!')
  })
})
