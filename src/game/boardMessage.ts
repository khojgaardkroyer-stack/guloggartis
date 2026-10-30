import type { GameMode, Status } from './engine'

/**
 * The message on the board, or null during a run. After a lost 3D run while 3D isn't available
 * (eg. the WebGL context was lost), a tap can't start a new 3D run, so it points to 2D instead.
 */
export function boardMessage(status: Status, mode: GameMode | null, available3D: boolean): string | null {
  switch (status) {
    case 'ready':
      return 'Vælg 2D eller 3D nedenfor'
    case 'over':
      return mode === '3d' && !available3D ? '3D stoppede. Skift til 2D nedenfor.' : 'Av! Tryk for at prøve igen'
    case 'won':
      return '📦 Pakken er afleveret! Du vandt!'
    default:
      return null
  }
}
