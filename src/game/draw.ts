// Canvas drawing for the jump game. Only draws: no state changes, no React.
import {
  GROUND_Y,
  HEIGHT,
  PLAYER_H,
  PLAYER_W,
  SHOP_DOOR_W,
  SHOP_DOOR_X,
  SHOP_H,
  SHOP_W,
  WIDTH,
  type GameState,
  type Obstacle,
} from './engine'

function drawParcel(ctx: CanvasRenderingContext2D, x: number, top: number, w: number, h: number) {
  ctx.fillStyle = '#c8955c'
  ctx.fillRect(x, top, w, h)
  ctx.fillStyle = '#a8743f'
  ctx.fillRect(x + w / 2 - 2, top, 4, h)
  ctx.strokeStyle = '#7a5229'
  ctx.lineWidth = 1
  ctx.strokeRect(x + 0.5, top + 0.5, w - 1, h - 1)
}

function drawObstacle(ctx: CanvasRenderingContext2D, o: Obstacle) {
  const top = GROUND_Y - o.lift - o.h
  switch (o.kind) {
    case 'parcel':
      drawParcel(ctx, o.x, top, o.w, o.h)
      break
    case 'stack':
      drawParcel(ctx, o.x, top + o.h / 2, o.w, o.h / 2)
      drawParcel(ctx, o.x + 2, top, o.w - 4, o.h / 2)
      break
    case 'row':
      for (let i = 0; i < 3; i++) drawParcel(ctx, o.x + i * (o.w / 3), top, o.w / 3, o.h)
      break
    case 'cone':
      ctx.fillStyle = '#f97316'
      ctx.beginPath()
      ctx.moveTo(o.x + o.w / 2, top)
      ctx.lineTo(o.x + o.w, GROUND_Y - 3)
      ctx.lineTo(o.x, GROUND_Y - 3)
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = '#fff'
      ctx.fillRect(o.x + o.w * 0.3, top + o.h * 0.45, o.w * 0.4, 3)
      ctx.fillStyle = '#c2410c'
      ctx.fillRect(o.x - 2, GROUND_Y - 3, o.w + 4, 3)
      break
    case 'envelope':
      ctx.fillStyle = '#fff'
      ctx.strokeStyle = '#2d2d2d'
      ctx.lineWidth = 1.5
      ctx.fillRect(o.x, top, o.w, o.h)
      ctx.strokeRect(o.x, top, o.w, o.h)
      ctx.beginPath()
      ctx.moveTo(o.x, top)
      ctx.lineTo(o.x + o.w / 2, top + o.h * 0.6)
      ctx.lineTo(o.x + o.w, top)
      ctx.stroke()
      ctx.fillStyle = '#ef4444'
      ctx.beginPath()
      ctx.arc(o.x + o.w / 2, top + o.h * 0.6, 2.5, 0, Math.PI * 2)
      ctx.fill()
      break
  }
}

function drawShop(ctx: CanvasRenderingContext2D, x: number) {
  const top = GROUND_Y - SHOP_H
  ctx.fillStyle = '#F3C91D'
  ctx.fillRect(x, top + 14, SHOP_W, SHOP_H - 14)
  ctx.strokeStyle = '#2d2d2d'
  ctx.lineWidth = 1.5
  ctx.strokeRect(x, top + 14, SHOP_W, SHOP_H - 14)
  // Sign
  ctx.fillStyle = '#2d2d2d'
  ctx.fillRect(x - 4, top, SHOP_W + 8, 16)
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 10px "DM Sans", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('PAKKESHOP', x + SHOP_W / 2, top + 8.5)
  // Door
  ctx.fillStyle = '#2d2d2d'
  ctx.fillRect(x + SHOP_DOOR_X, GROUND_Y - 40, SHOP_DOOR_W, 40)
  ctx.fillStyle = '#F3C91D'
  ctx.fillRect(x + SHOP_DOOR_X + SHOP_DOOR_W - 6, GROUND_Y - 22, 3, 3)
  // Window
  ctx.fillStyle = '#e0f2fe'
  ctx.fillRect(x + 56, top + 26, 50, 26)
  ctx.strokeRect(x + 56, top + 26, 50, 26)
  ctx.beginPath()
  ctx.moveTo(x + 81, top + 26)
  ctx.lineTo(x + 81, top + 52)
  ctx.stroke()
}

/**
 * Draws one frame in game units (WIDTH x HEIGHT). The caller sizes the canvas and sets the
 * transform from game units to pixels before calling this.
 */
export function drawGame(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  playerImg: HTMLImageElement | null,
) {
  ctx.clearRect(0, 0, WIDTH, HEIGHT)

  // Ground with little dashes that scroll by
  ctx.strokeStyle = '#2d2d2d'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(0, GROUND_Y)
  ctx.lineTo(WIDTH, GROUND_Y)
  ctx.stroke()
  ctx.fillStyle = '#9ca3af'
  const offset = state.distance % 40
  for (let x = -offset; x < WIDTH; x += 40) {
    ctx.fillRect(x + 8, GROUND_Y + 6, 6, 1.5)
    ctx.fillRect(x + 26, GROUND_Y + 11, 3, 1.5)
  }

  if (state.shopX !== null) drawShop(ctx, state.shopX)
  for (const o of state.obstacles) drawObstacle(ctx, o)

  if (playerImg) {
    ctx.drawImage(playerImg, state.px, state.y, PLAYER_W, PLAYER_H)
  }

  if (state.parcel === 'carried') {
    drawParcel(ctx, state.px + (PLAYER_W - 16) / 2, state.y - 13, 16, 14)
  } else if (state.parcel === 'delivered' && state.shopX !== null) {
    const doorX = state.shopX + SHOP_DOOR_X
    drawParcel(ctx, doorX + 4, GROUND_Y - 14, 16, 14)
    ctx.strokeStyle = '#15803d'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(doorX + 6, GROUND_Y - 26)
    ctx.lineTo(doorX + 11, GROUND_Y - 21)
    ctx.lineTo(doorX + 20, GROUND_Y - 32)
    ctx.stroke()
  }
}
