// The 3D view of the jump game. The only module that imports three.js; it is loaded with import()
// when a run starts, so it stays out of the main chunk. It only draws the game state: no rules.
import {
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DirectionalLight,
  EdgesGeometry,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Fog,
  Group,
  HemisphereLight,
  InstancedMesh,
  LineBasicMaterial,
  LineSegments,
  Material,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  Object3D,
  PerspectiveCamera,
  PlaneGeometry,
  SRGBColorSpace,
  Scene,
  Texture,
  WebGLRenderer,
  type ColorRepresentation,
} from 'three'
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js'
import playerSvg from '../../assets/g-player.svg?raw'
import {
  LANES,
  LANE_OBSTACLES,
  LANE_SPAWN_X,
  LANE_W,
  OBSTACLES,
  PLAYER_H,
  PLAYER_W,
  PLAYER_X,
  SHOP_DOOR_W,
  SHOP_DOOR_X,
  SHOP_H,
  SHOP_W,
  type GameState,
  type Obstacle,
} from '../engine'
import type { GamePalette } from '../palette'
import { cameraPose, obstacleBox, playerBox, playerTurn, type WorldBox } from '../view3d'

export type Scene3D = {
  /** Draws `state` with the camera at swing progress `swing` (0 = side view, 1 = behind the G) */
  render(state: GameState, swing: number): void
  /** Matches the drawing buffer to the canvas's displayed size and redraws the last frame */
  resize(): void
  /**
   * Prebuilds a few models of every obstacle, one kind per `pause()`, then compiles every shader
   * without blocking where the browser allows it. Resolves when the scene can draw without
   * stalling; stops early if the scene is disposed meanwhile.
   */
  warmUp(pause: () => Promise<void>): Promise<void>
  dispose(): void
}

const TRACK_W = LANES * LANE_W
const TRACK_START = -300
const TRACK_END = 1000
const DASH_PERIOD = 40 // as the 2D ground dashes
const DASH_LEN = 12
const LINE_W = 1.5 // the 2D ground line's width
const SURFACE = 0.15 // how far tape, windows and lines sit out from a surface
const G_DEPTH = 6
const POOL_START = 3 // models built up front per obstacle kind and size

type Span = [number, number]

export function createScene(canvas: HTMLCanvasElement, palette: GamePalette): Scene3D {
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true })
  renderer.setClearColor(0x000000, 0) // transparent: the card's white is the sky
  renderer.outputColorSpace = SRGBColorSpace

  const scene = new Scene()
  const fog = new Fog(palette.white, 1000, 2000)
  scene.fog = fog
  const camera = new PerspectiveCamera()

  // Everything created here is disposed in dispose()
  const geometries: BufferGeometry[] = []
  const materials: Material[] = []
  const textures: Texture[] = []
  const keep = <T extends BufferGeometry | Material | Texture>(item: T): T => {
    if (item instanceof BufferGeometry) geometries.push(item)
    else if (item instanceof Material) materials.push(item)
    else textures.push(item)
    return item
  }

  // Materials, one per colour and look, shared by every mesh
  const lambert = (color: ColorRepresentation) => keep(new MeshLambertMaterial({ color }))
  const basic = (color: ColorRepresentation) => keep(new MeshBasicMaterial({ color }))
  const line = (color: ColorRepresentation) => keep(new LineBasicMaterial({ color }))
  // Flat things on the ground: drawn first and without depth, so nothing fights with the track
  const decal = (color: ColorRepresentation, opacity = 1) =>
    keep(new MeshBasicMaterial({ color, depthWrite: false, transparent: opacity < 1, opacity }))

  const mat = {
    cardboard: lambert(palette.cardboard),
    tape: lambert(palette.tape),
    cardboardEdge: line(palette.cardboardEdge),
    cone: lambert(palette.cone),
    coneBase: lambert(palette.coneBase),
    white: lambert(palette.white),
    ink: lambert(palette.ink),
    inkLine: line(palette.ink),
    seal: lambert(palette.seal),
    shop: lambert(palette.shop),
    shopWindow: lambert(palette.shopWindow),
    tick: basic(palette.tick),
    track: decal(palette.track),
    dash: decal(palette.groundDash),
    footprint: decal(palette.ink, 0.2),
  }

  // Geometries made for one obstacle kind and size, built once and shared by all its pooled models
  const sharedGeometries = new Map<string, BufferGeometry>()
  const shared = (key: string, make: () => BufferGeometry) => {
    let geometry = sharedGeometries.get(key)
    if (!geometry) {
      geometry = keep(make())
      sharedGeometries.set(key, geometry)
    }
    return geometry
  }

  // Unit geometries, scaled per mesh. The box's origin is the middle of its bottom face.
  const unitBox = keep(new BoxGeometry(1, 1, 1).translate(0, 0.5, 0))
  const unitBoxEdges = keep(new EdgesGeometry(unitBox))
  const unitCylinder = keep(new CylinderGeometry(0.5, 0.5, 1, 14))
  const centredBox = keep(new BoxGeometry(1, 1, 1))
  const groundQuad = keep(new PlaneGeometry(1, 1).rotateX(-Math.PI / 2))

  /** A box filling x × y × z (each [min, max]) in the parent's coordinates */
  function box(parent: Object3D, material: Material, [x0, x1]: Span, [y0, y1]: Span, [z0, z1]: Span) {
    const mesh = new Mesh(unitBox, material)
    mesh.scale.set(x1 - x0, y1 - y0, z1 - z0)
    mesh.position.set((x0 + x1) / 2, y0, (z0 + z1) / 2)
    parent.add(mesh)
  }

  /** The edges of the box x × y × z, as lines */
  function edges(parent: Object3D, material: LineBasicMaterial, [x0, x1]: Span, y: Span, [z0, z1]: Span) {
    const [y0, y1] = y
    const lines = new LineSegments(unitBoxEdges, material)
    lines.scale.set(x1 - x0, y1 - y0, z1 - z0)
    lines.position.set((x0 + x1) / 2, y0, (z0 + z1) / 2)
    parent.add(lines)
  }

  /** A cardboard parcel with a cross of tape over the top, filling the box x × y × z */
  function parcel(parent: Object3D, [x0, x1]: Span, [y0, y1]: Span, [z0, z1]: Span) {
    const s = SURFACE
    const body: [Span, Span, Span] = [[x0 + s, x1 - s], [y0, y1 - s], [z0 + s, z1 - s]]
    box(parent, mat.cardboard, ...body)
    edges(parent, mat.cardboardEdge, ...body)
    const xm = (x0 + x1) / 2
    const zm = (z0 + z1) / 2
    box(parent, mat.tape, [xm - 2, xm + 2], [y0, y1], [z0, z1])
    box(parent, mat.tape, [x0, x1], [y0, y1], [zm - 2, zm + 2])
  }

  /** A bar `width` thick from (y0, z0) to (y1, z1), in the plane x facing the G */
  function bar(parent: Object3D, material: Material, x: number, [y0, z0]: Span, [y1, z1]: Span, width: number) {
    const mesh = new Mesh(centredBox, material)
    mesh.scale.set(0.6, width, Math.hypot(y1 - y0, z1 - z0) + width)
    mesh.position.set(x, (y0 + y1) / 2, (z0 + z1) / 2)
    mesh.rotation.x = -Math.atan2(y1 - y0, z1 - z0)
    parent.add(mesh)
  }

  // Obstacle models. Each is built for its kind and size, with its box at
  // [0, w] x [0, h] x [-d/2, d/2] locally, and only moved per frame.
  function buildObstacle(kind: Obstacle['kind'], w: number, h: number, d: number): Group {
    const g = new Group()
    const z0 = -d / 2
    const z1 = d / 2
    switch (kind) {
      case 'parcel':
        parcel(g, [0, w], [0, h], [z0, z1])
        break
      case 'stack':
        parcel(g, [0, w], [0, h / 2], [z0, z1])
        parcel(g, [2, w - 2], [h / 2, h], [z0 + 2, z1 - 2])
        break
      case 'row': {
        // Three parcels in a row along the track; across all lanes, one parcel per lane
        const across = Math.max(1, Math.round(d / LANE_W))
        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < across; j++) {
            const along: Span = [(i * w) / 3, ((i + 1) * w) / 3]
            parcel(g, along, [0, h], [z0 + (j * d) / across, z0 + ((j + 1) * d) / across])
          }
        }
        break
      }
      case 'tower': {
        // Five parcels stacked a little askew, inside the box
        const insets = [
          [0, 0, 0, 0],
          [2, 1, 1, 3],
          [1, 2, 3, 0],
          [3, 0, 1, 2],
          [1, 3, 2, 1],
        ]
        const layer = h / insets.length
        insets.forEach(([l, r, n, f], i) => {
          parcel(g, [l, w - r], [i * layer, (i + 1) * layer], [z0 + n, z1 - f])
        })
        break
      }
      case 'cone': {
        const r = Math.min(w, d) / 2
        const foot = 3
        box(g, mat.coneBase, [w / 2 - r, w / 2 + r], [0, foot], [-r, r])
        const coneGeometry = shared(`cone:${r}:${h}`, () =>
          new ConeGeometry(r - 1, h - foot, 16).translate(0, (h - foot) / 2, 0),
        )
        const cone = new Mesh(coneGeometry, mat.cone)
        cone.position.set(w / 2, foot, 0)
        g.add(cone)
        // White band as in 2D: 3 high, its top 45 % of the height down from the tip
        const radiusAt = (y: number) => ((r - 1) * (h - y)) / (h - foot) + 0.3
        const bandTop = h * 0.55
        const bandBottom = bandTop - 3
        const band = new Mesh(
          shared(`coneBand:${r}:${h}`, () =>
            new CylinderGeometry(radiusAt(bandTop), radiusAt(bandBottom), 3, 16, 1, true),
          ),
          mat.white,
        )
        band.position.set(w / 2, bandBottom + 1.5, 0)
        g.add(band)
        break
      }
      case 'envelope': {
        box(g, mat.white, [0, w], [0, h], [z0, z1])
        edges(g, mat.inkLine, [0, w], [0, h], [z0, z1])
        // The flap (a V down to 40 % of the height) and the red seal, on the face towards the G
        // and on both sides
        const tip = h * 0.4
        const front = -SURFACE
        const left = z0 - SURFACE
        const right = z1 + SURFACE
        const flap = shared(`envelopeFlap:${w}:${h}:${d}`, () => {
          const vertices = [
            [front, h, z0, front, tip, 0],
            [front, tip, 0, front, h, z1],
            [0, h, left, w / 2, tip, left],
            [w / 2, tip, left, w, h, left],
            [0, h, right, w / 2, tip, right],
            [w / 2, tip, right, w, h, right],
          ].flat()
          return new BufferGeometry().setAttribute('position', new Float32BufferAttribute(vertices, 3))
        })
        g.add(new LineSegments(flap, mat.inkLine))
        const seal = (x: number, z: number, rotateX: number, rotateZ: number) => {
          const disc = new Mesh(unitCylinder, mat.seal)
          disc.scale.set(5, 0.6, 5)
          disc.position.set(x, tip, z)
          disc.rotation.set(rotateX, 0, rotateZ)
          g.add(disc)
        }
        seal(front, 0, 0, Math.PI / 2)
        seal(w / 2, left, Math.PI / 2, 0)
        seal(w / 2, right, Math.PI / 2, 0)
        break
      }
      case 'van': {
        // A parcel van with its cab towards the G: white body, yellow stripe, dark windows and wheels
        const cab = Math.min(24, w * 0.35)
        const cabH = h * 0.6
        const s = SURFACE
        const inside: Span = [z0 + s, z1 - s]
        box(g, mat.white, [s, cab + 2], [0, cabH], inside)
        edges(g, mat.inkLine, [s, cab + 2], [0, cabH], inside)
        box(g, mat.white, [cab, w], [0, h], inside)
        edges(g, mat.inkLine, [cab, w], [0, h], inside)
        // Windscreen and side windows
        const windows: Span = [cabH * 0.6, cabH * 0.9]
        box(g, mat.ink, [0, s], windows, [z0 + 3, z1 - 3])
        box(g, mat.ink, [4, cab - 4], windows, [z0, z0 + s])
        box(g, mat.ink, [4, cab - 4], windows, [z1 - s, z1])
        // Stripe along the cargo box, and across its front above the cab
        box(g, mat.shop, [cab, w], [h * 0.45, h * 0.58], [z0, z1])
        box(g, mat.shop, [cab - s, cab], [h * 0.82, h * 0.92], [z0 + 3, z1 - 3])
        // Wheels: axles across the track, inside the box
        const wheelR = 9
        for (const x of [cab * 0.55, w - 14]) {
          for (const z of [z0 + 2, z1 - 2]) {
            const wheel = new Mesh(unitCylinder, mat.ink)
            wheel.scale.set(wheelR * 2, 4, wheelR * 2)
            wheel.rotation.x = Math.PI / 2
            wheel.position.set(x, wheelR, z)
            g.add(wheel)
          }
        }
        break
      }
    }
    return g
  }

  // Pools of obstacle models per kind and size: shown, hidden and moved each frame
  const pools = new Map<string, { models: Group[]; used: number }>()
  function obstacleModel(o: Obstacle, b: WorldBox): Group {
    const d = b.z[1] - b.z[0]
    const key = `${o.kind}:${o.w}:${o.h}:${d}`
    let pool = pools.get(key)
    if (!pool) {
      pool = { models: [], used: 0 }
      pools.set(key, pool)
    }
    let model = pool.models[pool.used]
    if (!model) {
      model = buildObstacle(o.kind, o.w, o.h, d)
      pool.models.push(model)
      scene.add(model)
    }
    pool.used++
    return model
  }

  // The track: a light strip with dark edges (the 2D ground line) and dashed lane dividers
  const track = new Mesh(groundQuad, mat.track)
  track.scale.set(TRACK_END - TRACK_START, 1, TRACK_W)
  track.position.set((TRACK_START + TRACK_END) / 2, 0, 0)
  track.renderOrder = -2
  scene.add(track)
  for (const z of [-TRACK_W / 2, TRACK_W / 2]) {
    // As high as the 2D line is wide, so the side view shows the same line
    box(scene, mat.ink, [TRACK_START, TRACK_END], [-LINE_W / 2, LINE_W / 2], [z - LINE_W / 2, z + LINE_W / 2])
  }
  const dashesPerLine = Math.ceil((TRACK_END - TRACK_START) / DASH_PERIOD)
  const dividers = Array.from({ length: LANES - 1 }, (_, i) => (i + 1 - LANES / 2) * LANE_W)
  const dashes = new InstancedMesh(groundQuad, mat.dash, dashesPerLine * dividers.length)
  const dashMatrix = new Matrix4()
  dividers.forEach((z, j) => {
    for (let i = 0; i < dashesPerLine; i++) {
      dashMatrix.makeScale(DASH_LEN, 1, LINE_W).setPosition(TRACK_START + i * DASH_PERIOD, 0.05, z)
      dashes.setMatrixAt(j * dashesPerLine + i, dashMatrix)
    }
  })
  dashes.renderOrder = -1
  dashes.frustumCulled = false
  scene.add(dashes)

  // The G: the logo's path from the SVG, extruded, in the SVG's own colours
  const player = new Group()
  scene.add(player)
  const svg = new SVGLoader().parse(playerSvg)
  // SVGLoader ignores the viewBox; the 2D sprite fills the player's box with it
  const [vbX, vbY, vbW, vbH] = /viewBox="([^"]+)"/
    .exec(playerSvg)?.[1]
    .trim()
    .split(/[\s,]+/)
    .map(Number) ?? [0, 0, PLAYER_W, PLAYER_H]
  for (const path of svg.paths) {
    const style = path.userData?.style as { fill?: string; stroke?: string } | undefined
    const geometry = keep(
      new ExtrudeGeometry(path.toShapes(), { depth: G_DEPTH, bevelEnabled: false, curveSegments: 8 }),
    )
    // Centre it, flip the SVG's y-down to y-up and scale it to the player's box. Flipping z as
    // well keeps the faces' winding (and so their normals) the right way round.
    geometry.translate(-(vbX + vbW / 2), -(vbY + vbH / 2), -G_DEPTH / 2)
    geometry.scale(PLAYER_W / vbW, -PLAYER_H / vbH, -1)
    const fill = style?.fill && style.fill !== 'none' ? style.fill : palette.cardboard
    player.add(new Mesh(geometry, lambert(fill)))
    const stroke = style?.stroke && style.stroke !== 'none' ? style.stroke : palette.ink
    player.add(new LineSegments(keep(new EdgesGeometry(geometry, 30)), line(stroke)))
  }
  const footprint = new Mesh(groundQuad, mat.footprint)
  footprint.scale.set(PLAYER_W, 1, PLAYER_W)
  footprint.renderOrder = -1
  scene.add(footprint)
  const carried = new Group()
  parcel(carried, [-8, 8], [0, 14], [-8, 8])
  scene.add(carried)

  // The parcel shop across the middle of the track, its front at the door (where the G stops)
  const shop = new Group()
  const shopDepth = SHOP_W - SHOP_DOOR_X
  const shopWidth = TRACK_W + 20
  const wallH = SHOP_H - 14
  const wall: [Span, Span, Span] = [[0, shopDepth], [0, wallH], [-shopWidth / 2, shopWidth / 2]]
  box(shop, mat.shop, ...wall)
  edges(shop, mat.inkLine, ...wall)
  box(shop, mat.ink, [-3, 8], [wallH - 2, SHOP_H], [-shopWidth / 2 - 4, shopWidth / 2 + 4])
  // Door with a knob, as in 2D
  box(shop, mat.ink, [-0.6, 0], [0, 40], [-SHOP_DOOR_W / 2, SHOP_DOOR_W / 2])
  box(shop, mat.shop, [-1.2, -0.6], [18, 21], [SHOP_DOOR_W / 2 - 6, SHOP_DOOR_W / 2 - 3])
  // A window on each side of the door, 26 high as in 2D, with a bar down the middle
  for (const side of [-1, 1]) {
    const near = side * (SHOP_DOOR_W / 2 + 10)
    const far = side * (SHOP_DOOR_W / 2 + 50)
    const across: Span = [Math.min(near, far), Math.max(near, far)]
    box(shop, mat.shopWindow, [-0.4, 0], [26, 52], across)
    edges(shop, mat.inkLine, [-0.4, 0], [26, 52], across)
    box(shop, mat.ink, [-0.6, 0], [26, 52], [(near + far) / 2 - 0.75, (near + far) / 2 + 0.75])
  }
  // The sign's text, on a canvas texture
  const signCanvas = document.createElement('canvas')
  signCanvas.width = 1024
  signCanvas.height = 112
  const signTexture = keep(new CanvasTexture(signCanvas))
  signTexture.colorSpace = SRGBColorSpace
  signTexture.anisotropy = renderer.capabilities.getMaxAnisotropy()
  const font = 'bold 72px "DM Sans", sans-serif'
  const drawSign = () => {
    const ctx = signCanvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = palette.ink
    ctx.fillRect(0, 0, signCanvas.width, signCanvas.height)
    ctx.fillStyle = palette.white
    ctx.font = font
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('PAKKESHOP', signCanvas.width / 2, signCanvas.height / 2 + 4)
    signTexture.needsUpdate = true
  }
  drawSign()
  document.fonts?.load(font).then(drawSign, () => {})
  const signHeight = SHOP_H - wallH + 2
  const sign = new Mesh(
    keep(new PlaneGeometry(signHeight * (signCanvas.width / signCanvas.height), signHeight)),
    keep(new MeshBasicMaterial({ map: signTexture })),
  )
  sign.rotation.y = -Math.PI / 2
  sign.position.set(-3 - SURFACE, wallH - 2 + signHeight / 2, 0)
  shop.add(sign)
  // The delivered parcel beside the G at the door, with a green tick above it
  const delivered = new Group()
  parcel(delivered, [-16, -2], [0, 14], [16, 30])
  bar(delivered, mat.tick, -2.5, [26, 16], [20, 21], 3)
  bar(delivered, mat.tick, -2.5, [20, 21], [33, 31], 3)
  shop.add(delivered)
  scene.add(shop)

  // Lights: soft light from the sky plus one light from behind the camera and above
  scene.add(new HemisphereLight(palette.white, palette.track, 2))
  const sun = new DirectionalLight(palette.white, 1.6)
  sun.position.set(-1, 1.6, 0.6)
  scene.add(sun)

  let disposed = false
  let last: { state: GameState; swing: number } | null = null
  const fogColor = new Color(palette.white)

  function render(state: GameState, swing: number) {
    last = { state, swing }
    const width = canvas.clientWidth
    const height = canvas.clientHeight
    if (!width || !height) return

    // Camera, following the G along the run
    const g = playerBox(state)
    const pose = cameraPose(swing, g.y[0])
    const dx = state.px - PLAYER_X
    camera.position.set(pose.position[0] + dx, pose.position[1], pose.position[2])
    camera.up.set(0, 1, 0)
    camera.lookAt(pose.target[0] + dx, pose.target[1], pose.target[2])
    camera.near = pose.near
    camera.far = pose.far
    const top = pose.near * Math.tan((pose.fov * Math.PI) / 360)
    const right = top * (width / height)
    const shift = pose.shift * top
    camera.projectionMatrix.makePerspective(-right, right, top + shift, -top + shift, pose.near, pose.far)
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert()
    fog.color.copy(fogColor)
    fog.near = pose.fogNear
    fog.far = pose.fogFar

    dashes.position.x = -(state.distance % DASH_PERIOD)

    for (const pool of pools.values()) pool.used = 0
    for (const o of state.obstacles) {
      // Only what can be in view: spawned at LANE_SPAWN_X (WIDTH before lane mode), gone behind the G
      if (o.x > LANE_SPAWN_X + 10 || o.x + o.w < TRACK_START) continue
      const b = obstacleBox(o)
      const model = obstacleModel(o, b)
      model.visible = true
      model.position.set(b.x[0], b.y[0], (b.z[0] + b.z[1]) / 2)
    }
    for (const pool of pools.values()) {
      for (let i = pool.used; i < pool.models.length; i++) pool.models[i].visible = false
    }

    const centreX = (g.x[0] + g.x[1]) / 2
    const centreZ = (g.z[0] + g.z[1]) / 2
    player.position.set(centreX, (g.y[0] + g.y[1]) / 2, centreZ)
    player.rotation.y = playerTurn(swing)
    footprint.position.set(centreX, 0.1, centreZ)
    carried.visible = state.parcel === 'carried'
    carried.position.set(centreX, g.y[1], centreZ)

    shop.visible = state.shopX !== null
    if (state.shopX !== null) shop.position.x = state.shopX + SHOP_DOOR_X
    delivered.visible = state.parcel === 'delivered'

    renderer.render(scene, camera)
  }

  function resize() {
    const width = canvas.clientWidth
    const height = canvas.clientHeight
    if (!width || !height) return
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setSize(width, height, false)
    if (last) render(last.state, last.swing)
  }

  // Builds a few models of every obstacle (out of sight, still visible so their shaders are
  // compiled), one kind at a time between pauses, so the pools rarely grow mid-run. Then compiles
  // every shader before the 3D run starts, not in its first frames.
  async function warmUp(pause: () => Promise<void>) {
    const templates = [...OBSTACLES.map((o) => o.make()), ...LANE_OBSTACLES.map((make) => make())]
    for (const template of templates) {
      await pause()
      if (disposed) return
      for (const lane of template.kind === 'row' ? ([0, 'all'] as const) : ([0] as const)) {
        const o: Obstacle = { ...template, x: -100_000, lane }
        for (let i = 0; i < POOL_START; i++) obstacleModel(o, obstacleBox(o)).position.x = o.x
      }
    }
    await pause()
    if (disposed) return
    resize()
    // compileAsync only helps with KHR_parallel_shader_compile; without it, three warns and
    // compiles as compile() does, with the linking finishing in the driver meanwhile
    if (renderer.extensions.has('KHR_parallel_shader_compile')) await renderer.compileAsync(scene, camera)
    else renderer.compile(scene, camera)
  }

  resize()

  return {
    render,
    resize,
    warmUp,
    dispose() {
      disposed = true
      last = null
      for (const item of [...geometries, ...materials, ...textures]) item.dispose()
      dashes.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
    },
  }
}
