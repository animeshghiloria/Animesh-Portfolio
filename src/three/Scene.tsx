import { Canvas, useThree } from '@react-three/fiber'
import { Suspense, useEffect } from 'react'
import gsap from 'gsap'
import { Environment } from './Environment'
import { CanModel } from './CanModel'
import { CanAnimator } from './CanAnimator'
import { HolographicCan } from './HolographicCan'
import { MouseLight } from './MouseLight'
import {
  EffectComposer,
  Bloom,
  Vignette,
  ChromaticAberration,
} from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { Vector2 } from 'three'
import { useStore } from '../store/useStore'

const chromaticOffset = new Vector2(0.0005, 0.0005)
const zeroOffset = new Vector2(0, 0)

/**
 * Camera zoom-in animation that plays during the holographic reveal.
 * Starts zoomed out (z=12) and animates to the default position (z=6).
 */
function CameraZoom() {
  const { camera } = useThree()

  useEffect(() => {
    // Start zoomed out
    camera.position.z = 12

    const tl = gsap.timeline()

    tl.to(camera.position, {
      z: 6,
      duration: 2.2,
      ease: 'power2.inOut',
    })

    return () => {
      tl.kill()
    }
  }, [camera])

  return null
}

function SceneContent() {
  const holoComplete = useStore((s) => s.holoComplete)
  const isLoaded = useStore((s) => s.isLoaded)

  return (
    <>
      <Environment />
      <CameraZoom />
      <CanAnimator>
        <HolographicCan>
          <CanModel />
        </HolographicCan>
      </CanAnimator>
      <MouseLight />
      <EffectComposer multisampling={0}>
        <Bloom
          intensity={holoComplete ? 0.4 : 1.2}
          luminanceThreshold={holoComplete ? 0.8 : 0.3}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
        <Vignette
          offset={0.3}
          darkness={0.7}
          blendFunction={BlendFunction.NORMAL}
        />
        <ChromaticAberration
          offset={isLoaded ? chromaticOffset : zeroOffset}
          blendFunction={BlendFunction.NORMAL}
        />
      </EffectComposer>
    </>
  )
}

/**
 * Main 3D scene — fixed full-viewport R3F Canvas.
 *
 * Contains the procedural Monster can, particles, energy rings,
 * mouse-following light, and post-processing effects.
 */
export function Scene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 45 }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1,
        pointerEvents: 'none',
      }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      }}
      dpr={[1, 2]}
    >
      <Suspense fallback={null}>
        <SceneContent />
      </Suspense>
    </Canvas>
  )
}

export default Scene
