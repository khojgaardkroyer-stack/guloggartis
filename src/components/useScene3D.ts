import { type RefObject, useEffect, useRef } from 'react'
import type { GamePalette } from '../game/palette'
import { can3D } from '../game/view3d'
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

function prefersReducedMotion(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

/**
 * The game's 3D view on `canvasRef`'s canvas. Call `prepare()` when a run starts: it decides
 * whether this run may switch to 3D and starts loading the 3D code in the background. `ready()`
 * returns the scene once it can draw, or null. `onLost` is called if the WebGL context is lost;
 * the 3D view is then gone for the rest of the mount.
 */
export function useScene3D(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  palette: RefObject<GamePalette | null>,
  onLost: () => void,
) {
  const scene = useRef<Scene3D | null>(null)
  // Whether the current run may use 3D (WebGL and no reduced motion)
  const enabled = useRef(false)
  const lost = useRef(false)
  const mounted = useRef(false)
  const onLostRef = useRef(onLost)
  useEffect(() => {
    onLostRef.current = onLost
  })

  useEffect(() => {
    mounted.current = true
    const canvas = canvasRef.current
    const handleLost = () => {
      lost.current = true
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
      mounted.current = false
      observer.disconnect()
      canvas?.removeEventListener('webglcontextlost', handleLost)
      scene.current?.dispose()
      scene.current = null
    }
  }, [canvasRef])

  function prepare() {
    enabled.current = !lost.current && can3D({ webgl: hasWebGL(), reducedMotion: prefersReducedMotion() })
    if (!enabled.current || scene.current) return
    loadSceneModule().then((module) => {
      const canvas = canvasRef.current
      if (!module || !mounted.current || lost.current || scene.current || !canvas || !palette.current) return
      try {
        scene.current = module.createScene(canvas, palette.current)
      } catch {
        // No WebGL context after all: stay in 2D
        lost.current = true
      }
    })
  }

  function ready(): Scene3D | null {
    return enabled.current ? scene.current : null
  }

  return { prepare, ready }
}
