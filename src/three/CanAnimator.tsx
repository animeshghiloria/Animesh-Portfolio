import { useRef, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../store/useStore'

interface CanAnimatorProps {
  children: ReactNode
}

/**
 * Scroll-driven animation controller for the can.
 *
 * - Before site is loaded: can is centered, full scale, gentle idle bob
 * - After loaded: reads scrollProgress from Zustand and smoothly interpolates
 *   the can through 7 portfolio sections
 */
export function CanAnimator({ children }: CanAnimatorProps) {
  const groupRef = useRef<THREE.Group>(null!)

  // Current interpolated values (persisted across frames)
  const current = useRef({
    x: 0,
    y: 0,
    z: 0,
    rotX: 0,
    rotY: 0,
    rotZ: 0,
    scale: 1, // Start at 1 — visible immediately for the loading screen
  })

  useFrame((_state, delta) => {
    if (!groupRef.current) return

    const { scrollProgress, isLoaded, canTapped, holoComplete } = useStore.getState()
    const time = _state.clock.elapsedTime

    // Damping factor — higher = snappier, lower = smoother
    const dampFactor = 4.0

    // Smoothstep helper for buttery transitions
    const smooth = (x: number) => x * x * (3 - 2 * x)

    let targetX = 0
    let targetY = 0
    let targetZ = 0
    let targetRotX = 0
    let targetRotY = 0
    let targetRotZ = 0
    let targetScale = 1

    if (!isLoaded) {
      if (!holoComplete) {
        // === Holographic phase: perfectly still, centered ===
        targetScale = 1.0
        targetY = 0
        targetRotY = 0
        targetRotX = 0
      } else {
        // === Loading screen after holo: centered, full scale, gentle idle bob ===
        targetScale = canTapped ? 1.3 : 1.0
        targetY = Math.sin(time * 1.0) * 0.06
        targetRotY = Math.sin(time * 0.4) * 0.08
        targetRotX = Math.sin(time * 0.6) * 0.02
      }
    } else {
      // === Site is loaded: scroll-driven animation ===
      const t = Math.max(0, Math.min(1, scrollProgress))

      if (t <= 0.18) {
        // === Hero: can smoothly travels from center to right column ===
        const heroT = t / 0.18
        const eased = smooth(heroT)
        targetX = 2.50 * eased
        targetY = Math.sin(time * 1.2) * 0.06 * (1 - eased * 0.5) + 0.1 * eased
        targetRotY = Math.sin(time * 0.5) * 0.1 * (1 - eased) + (Math.PI * 0.55 + Math.sin(time * 0.4) * 0.04) * eased
        targetRotX = Math.sin(time * 0.8) * 0.03 * (1 - eased) + 0.08 * eased
        targetRotZ = -0.349 * eased
        targetScale = THREE.MathUtils.lerp(1.3, 1.35, eased)
      } else if (t <= 0.27) {
        // === About: can floats in right column with gentle bob ===
        targetX = 2.50
        targetY = Math.sin(time * 1.0) * 0.04 + 0.1
        targetRotY = Math.PI * 0.55 + Math.sin(time * 0.4) * 0.04
        targetRotX = 0.08
        targetRotZ = -0.349
        targetScale = 1.35
      } else if (t <= 0.58) {
        // === Tech Stack: move up, scale down, gentle rotation ===
        const techT = (t - 0.27) / 0.31
        targetX = THREE.MathUtils.lerp(2.50, 0.3, techT)
        targetY = THREE.MathUtils.lerp(0.1, 1.5, techT) + Math.sin(time * 1.5) * 0.03
        targetRotY = THREE.MathUtils.lerp(Math.PI * 0.55, Math.PI * 1.5, techT) + Math.sin(time * 0.5) * 0.05
        targetRotX = 0.08 - 0.08 * techT
        targetRotZ = THREE.MathUtils.lerp(-0.349, 0, techT)
        targetScale = THREE.MathUtils.lerp(1.35, 0.65, techT)
      } else if (t <= 0.78) {
        // === Projects: move left, particles dispersing ===
        const projT = smooth((t - 0.58) / 0.20)
        targetX = THREE.MathUtils.lerp(0.3, -2.0, projT)
        targetY = THREE.MathUtils.lerp(1.5, 0.3, projT) + Math.sin(time * 1.0) * 0.04
        targetRotY = time * 0.2
        targetRotX = -0.1 * projT
        targetRotZ = 0.12 * projT
        targetScale = THREE.MathUtils.lerp(0.65, 0.55, projT)
      } else if (t <= 0.95) {
        // === Contact: move back to center, land ===
        const contactT = smooth((t - 0.78) / 0.17)
        targetX = THREE.MathUtils.lerp(-2.0, 0, contactT)
        targetY = THREE.MathUtils.lerp(0.3, -0.5, contactT) + Math.sin(time * 0.8) * 0.02
        targetRotY = time * 0.1
        targetRotX = THREE.MathUtils.lerp(-0.1, 0, contactT)
        targetRotZ = THREE.MathUtils.lerp(0.12, 0, contactT)
        targetScale = THREE.MathUtils.lerp(0.55, 0.8, contactT)
      } else {
        // === Final launch: rocket upward! ===
        const launchT = smooth((t - 0.95) / 0.05)
        targetX = 0
        targetY = THREE.MathUtils.lerp(-0.5, 10, launchT * launchT)
        targetRotY = time * 0.5 + launchT * Math.PI * 4
        targetRotX = -0.3 * launchT
        targetScale = THREE.MathUtils.lerp(0.8, 0.6, launchT)
      }
    }

    // Smooth damp all values
    const c = current.current

    c.x = THREE.MathUtils.damp(c.x, targetX, dampFactor, delta)
    c.y = THREE.MathUtils.damp(c.y, targetY, dampFactor, delta)
    c.z = THREE.MathUtils.damp(c.z, targetZ, dampFactor, delta)
    c.rotX = THREE.MathUtils.damp(c.rotX, targetRotX, dampFactor, delta)
    c.rotY = THREE.MathUtils.damp(c.rotY, targetRotY, dampFactor, delta)
    c.rotZ = THREE.MathUtils.damp(c.rotZ, targetRotZ, dampFactor, delta)
    c.scale = THREE.MathUtils.damp(c.scale, targetScale, 1.8, delta)

    // Apply to group
    groupRef.current.position.set(c.x, c.y, c.z)
    groupRef.current.rotation.set(c.rotX, c.rotY, c.rotZ)
    const s = Math.max(0.001, c.scale)
    groupRef.current.scale.setScalar(s)
  })

  return <group ref={groupRef}>{children}</group>
}
