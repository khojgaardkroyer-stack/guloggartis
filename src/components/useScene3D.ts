import { type RefObject, useEffect, useRef, useState } from 'react'
import type { GamePalette } from '../game/palette'
import { availability3D, type Availability3D } from '../game/view3d'
import type { Scene3D } from '../game/three/scene'

type SceneModule = typeof import('../game/three/scene')

// Per page load: the 3D chunk is fetched at most once, and a failed load keeps the game in 2D
let modulePromise: Promise<SceneModule | null> | null = null
let webglSupport: boolean | null = null

function loadSceneModule(): Promise<SceneModule | null> {
  modulePromise ??= import('../game/three/scene').catch(() => null)
  return modulePromise
}

// Checked once, with a throwaway canvas that is released straight away
function hasWebGL(): boolean {
  if (webglSupport === null) {
    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl')
      webglSupport = gl !== null
      gl?.getExtension('WEBGL_lose_context')?.loseContext()
    } catch {
      webglSupport = false
    }
  }
  return webglSupport
}

// Building the scene (the WebGL context and the G, then the obstacle models a kind at a time,
// then the shaders) is spread over idle time while the start screen is shown, so no single frame
// stalls for long, also if a 2D run has already started
const IDLE_TIMEOUT_MS = 1000
// Where requestIdleCallback is missing (eg. Safari): the delay before the first step, and between steps
const IDLE_FALLBACK_MS = 300
const STEP_FALLBACK_MS = 30

/**
 * Runs `callback` when the browser is idle, or after `fallbackMs` where that isn't supported.
 * Returns a function that cancels it.
 */
function whenIdle(callback: () => void, fallbackMs: number): () => void {
  if (typeof window.requestIdleCallback === 'function') {
    const id = window.requestIdleCallback(callback, { timeout: IDLE_TIMEOUT_MS })
    return () => window.cancelIdleCallback(id)
  }
  const id = window.setTimeout(callback, fallbackMs)
  return () => window.clearTimeout(id)
}

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

function prefersReducedMotion(): boolean {
  return window.matchMedia?.(REDUCED_MOTION).matches ?? false
}

function checkAvailability(lost: boolean, loadFailed: boolean): Availability3D {
  return availability3D({
    webgl: !lost && hasWebGL(),
    loadFailed,
    reducedMotion: prefersReducedMotion(),
  })
}

/**
 * The game's 3D view on `canvasRef`'s canvas. Call `prepare()` when the start screen is shown: if
 * 3D is available it starts loading the 3D code and building the scene in the background.
 * `ready()` returns the scene once it can draw, or null; `isReady` is the same as state, for
 * rendering. `availability` says whether a 3D run may start; if loading or building the scene
 * fails it becomes 'load-failed'. When reduced motion is turned off while the game is open, the
 * scene starts loading then. `onLost` is called if the WebGL context is lost; the 3D view is then
 * gone for the rest of the mount.
 */
export function useScene3D(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  palette: RefObject<GamePalette | null>,
  onLost: () => void,
) {
  const scene = useRef<Scene3D | null>(null)
  const [isReady, setIsReady] = useState(false)
  const lost = useRef(false)
  // The 3D chunk couldn't be fetched, or the scene couldn't be built: 3D stays off for the mount
  const loadFailed = useRef(false)
  const [availability, setAvailability] = useState<Availability3D>(() => checkAvailability(false, false))
  // Stops the scene being built, if any, and disposes what it has made so far
  const cancelBuild = useRef<(() => void) | null>(null)
  const onLostRef = useRef(onLost)
  useEffect(() => {
    onLostRef.current = onLost
  })

  useEffect(() => {
    const canvas = canvasRef.current
    const handleLost = () => {
      lost.current = true
      setAvailability('no-webgl')
      setIsReady(false)
      cancelBuild.current?.()
      cancelBuild.current = null
      scene.current?.dispose()
      scene.current = null
      onLostRef.current()
    }
    // The canvas follows the 2D board's size, also in fullscreen and on rotation
    const observer = new ResizeObserver(() => scene.current?.resize())
    if (canvas) {
      canvas.addEventListener('webglcontextlost', handleLost)
      observer.observe(canvas)
    }
    return () => {
      // Disposing loses the context on purpose: that is not a lost 3D view
      canvas?.removeEventListener('webglcontextlost', handleLost)
      observer.disconnect()
      cancelBuild.current?.()
      cancelBuild.current = null
      scene.current?.dispose()
      scene.current = null
      setIsReady(false)
    }
  }, [canvasRef])

  // Follow the reduced-motion setting while the game is open; once it is turned off, prepare()
  // starts loading the scene (and only updates availability otherwise)
  const prepareRef = useRef(prepare)
  useEffect(() => {
    prepareRef.current = prepare
  })
  useEffect(() => {
    const query = window.matchMedia?.(REDUCED_MOTION)
    if (!query) return
    const onChange = () => prepareRef.current()
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  function prepare() {
    const now = checkAvailability(lost.current, loadFailed.current)
    setAvailability(now)
    if (now !== 'ok' || scene.current || cancelBuild.current) return

    // Until the scene is built and its shaders compiled, ready() returns null and no 3D run starts
    let cancelled = false
    let building: Scene3D | null = null
    let cancelIdle: (() => void) | null = null
    const stop = () => {
      cancelled = true
      cancelIdle?.()
      cancelIdle = null
      // Also while compileAsync is pending: it resolves once the materials are disposed
      building?.dispose()
      building = null
    }
    cancelBuild.current = stop
    // A cancelled build waits here for good, and is dropped
    const pause = (fallbackMs: number) =>
      new Promise<void>((resolve) => {
        cancelIdle = whenIdle(() => {
          cancelIdle = null
          resolve()
        }, fallbackMs)
      })

    const build = async () => {
      const module = await loadSceneModule()
      if (cancelled) return
      if (!module) throw new Error('The 3D chunk could not be loaded')
      await pause(IDLE_FALLBACK_MS)
      const canvas = canvasRef.current
      if (cancelled) return
      if (!canvas || !palette.current) throw new Error('No canvas or palette for the 3D scene')
      building = module.createScene(canvas, palette.current)
      await building.warmUp(() => pause(STEP_FALLBACK_MS))
      if (cancelled || !building) return
      // The canvas may have changed size while the scene was being built
      building.resize()
      scene.current = building
      building = null
      setIsReady(true)
    }
    build()
      .catch(() => {
        // The chunk couldn't be fetched or the scene couldn't be built: 3D is not available, and
        // a 3D button that is waiting for the scene stops waiting
        if (cancelled) return
        loadFailed.current = true
        setAvailability(checkAvailability(lost.current, true))
        building?.dispose()
        building = null
      })
      .finally(() => {
        if (cancelBuild.current === stop) cancelBuild.current = null
      })
  }

  function ready(): Scene3D | null {
    return scene.current
  }

  return { prepare, ready, isReady, availability }
}
