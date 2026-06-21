import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../store/useStore'

/**
 * Point light that follows the user's mouse cursor mapped to 3D space.
 *
 * - Reads normalized mouse position from Zustand (-1..1)
 * - Maps to world-space range (-3..3 on X, -2..2 on Y)
 * - Smooth lerp following for fluid motion
 * - Cyan accent color matching Monster Ultra White palette
 */
export function MouseLight() {
  const lightRef = useRef<THREE.PointLight>(null!)

  useFrame((_state, delta) => {
    if (!lightRef.current) return

    const { mousePosition } = useStore.getState()

    // Map normalized coordinates to world space
    const targetX = mousePosition.x * 3
    const targetY = mousePosition.y * 2

    // Smooth follow with lerp
    const dampFactor = 4
    lightRef.current.position.x = THREE.MathUtils.damp(
      lightRef.current.position.x,
      targetX,
      dampFactor,
      delta
    )
    lightRef.current.position.y = THREE.MathUtils.damp(
      lightRef.current.position.y,
      targetY,
      dampFactor,
      delta
    )
  })

  return (
    <pointLight
      ref={lightRef}
      color="#C8FFFF"
      intensity={0.8}
      distance={10}
      decay={2}
      position={[0, 0, 3]}
    />
  )
}
