import { describe, expect, it } from 'vitest'
import { MISSING_COLOR, readPalette } from './palette'

function stylesFrom(values: Record<string, string>) {
  return { getPropertyValue: (name: string) => values[name] ?? '' }
}

describe('readPalette', () => {
  it('reads each colour from its CSS variable and trims it', () => {
    const palette = readPalette(
      stylesFrom({ '--color-brand-gray-dark': ' #2e2e2e', '--color-page-background': '#e8bb3e ' }),
    )
    expect(palette.ink).toBe('#2e2e2e')
    expect(palette.shop).toBe('#e8bb3e')
  })

  it('falls back to a visible colour when a variable is missing or empty', () => {
    const palette = readPalette(stylesFrom({ '--color-surface-white': '  ' }))
    expect(palette.white).toBe(MISSING_COLOR)
    expect(palette.cone).toBe(MISSING_COLOR)
  })
})
