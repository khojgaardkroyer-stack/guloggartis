// Canvas colours for the jump game, read from the theme's CSS custom properties in
// src/index.css so the canvas follows the design manual too. See docs/design-tokens.md.

/** Theme variable behind each colour the canvas draws with */
export const PALETTE_VARS = {
  ink: '--color-brand-gray-dark',
  white: '--color-surface-white',
  groundDash: '--color-foundation-neutral-550',
  cardboard: '--color-foundation-palette-yellow-700',
  tape: '--color-foundation-palette-rust-500',
  cardboardEdge: '--color-foundation-palette-rust-900',
  cone: '--color-foundation-palette-orange-700',
  coneBase: '--color-foundation-palette-rust-700',
  seal: '--color-foundation-palette-red-700',
  shop: '--color-page-background',
  shopWindow: '--color-brand-blue-light',
  tick: '--color-text-green',
} as const

export type GamePalette = Record<keyof typeof PALETTE_VARS, string>

/** Used when a variable is missing, so the canvas still draws something visible */
export const MISSING_COLOR = 'black'

/**
 * Reads the palette from computed styles, eg. `getComputedStyle(document.documentElement)`.
 * Call it once when the game mounts, not per frame.
 */
export function readPalette(styles: Pick<CSSStyleDeclaration, 'getPropertyValue'>): GamePalette {
  const palette = {} as GamePalette
  for (const [key, name] of Object.entries(PALETTE_VARS) as [keyof GamePalette, string][]) {
    palette[key] = styles.getPropertyValue(name).trim() || MISSING_COLOR
  }
  return palette
}
