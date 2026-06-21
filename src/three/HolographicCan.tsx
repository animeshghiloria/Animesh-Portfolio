import { useRef, useEffect, useState, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import gsap from 'gsap'
import { createHolographicMaterial } from './HolographicMaterial'
import { useStore } from '../store/useStore'

interface HolographicCanProps {
  children: ReactNode
}

/**
 * Holographic materialization wrapper with smooth crossfade.
 *
 * Timeline:
 *   Phase 1 — Reveal (0→2.2s):    uProgress 0→1, hologram materializes
 *   Phase 2 — Crossfade (0.8s):    Holo fades out (uFadeOut 0→1) while
 *                                   real can fades in (opacity 0→1)
 *   Phase 3 — Cleanup:             Hide holo, restore materials, signal done
 */
export function HolographicCan({ children }: HolographicCanProps) {
  const realCanRef = useRef<THREE.Group>(null!)
  const holoGroupRef = useRef<THREE.Group>(null!)
  const materialsRef = useRef<THREE.ShaderMaterial[]>([])
  const realMaterialsRef = useRef<{ mat: THREE.Material; origTransparent: boolean; origOpacity: number }[]>([])
  const progressRef = useRef({ value: 0 })
  const fadeOutRef = useRef({ value: 0 })
  const realOpacityRef = useRef({ value: 0 })
  const [holoReady, setHoloReady] = useState(false)
  const phaseRef = useRef<'holo' | 'crossfade' | 'done'>('holo')

  // Reset holoComplete on mount (handles HMR and fresh loads)
  useEffect(() => {
    useStore.getState().setHoloComplete(false)
  }, [])

  // Build the holographic clone once the real can's geometry is available
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!realCanRef.current || !holoGroupRef.current) return

      const holoMaterials: THREE.ShaderMaterial[] = []
      const realMats: { mat: THREE.Material; origTransparent: boolean; origOpacity: number }[] = []

      // Clear any previous holo meshes
      while (holoGroupRef.current.children.length) {
        const child = holoGroupRef.current.children[0]!
        holoGroupRef.current.remove(child)
      }

      // Traverse the real can and clone each mesh with holo material
      // Also collect real materials for crossfade
      realCanRef.current.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh
          const holoMat = createHolographicMaterial()
          holoMaterials.push(holoMat)

          const holoMesh = new THREE.Mesh(mesh.geometry, holoMat)

          // Copy the mesh's local transform relative to the realCanRef group
          mesh.updateWorldMatrix(true, false)
          realCanRef.current.updateWorldMatrix(true, false)

          const relativeMatrix = new THREE.Matrix4()
          const parentInverse = new THREE.Matrix4().copy(realCanRef.current.matrixWorld).invert()
          relativeMatrix.multiplyMatrices(parentInverse, mesh.matrixWorld)

          holoMesh.applyMatrix4(relativeMatrix)
          holoGroupRef.current.add(holoMesh)

          // Store original material state for crossfade
          const mat = mesh.material as THREE.Material
          realMats.push({
            mat,
            origTransparent: mat.transparent,
            origOpacity: (mat as THREE.MeshPhysicalMaterial).opacity ?? 1,
          })
        }
      })

      materialsRef.current = holoMaterials
      realMaterialsRef.current = realMats
      holoGroupRef.current.visible = true

      setHoloReady(true)
    }, 150)

    return () => clearTimeout(timer)
  }, [])

  // Start the GSAP animation once holo meshes are ready
  useEffect(() => {
    if (!holoReady) return

    const tl = gsap.timeline({
      onComplete: () => {
        phaseRef.current = 'done'

        // Hide holographic clone
        if (holoGroupRef.current) holoGroupRef.current.visible = false

        // Restore real can materials to their original state
        realMaterialsRef.current.forEach(({ mat, origTransparent, origOpacity }) => {
          if (mat.transparent !== origTransparent) {
            mat.transparent = origTransparent
            mat.needsUpdate = true
          }
          ;(mat as THREE.MeshPhysicalMaterial).opacity = origOpacity
        })

        // Make sure all real meshes are visible
        if (realCanRef.current) {
          realCanRef.current.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              (child as THREE.Mesh).visible = true
            }
          })
        }

        // Signal completion
        useStore.getState().setHoloComplete(true)

        // Dispose holo materials
        materialsRef.current.forEach((m) => m.dispose())
        materialsRef.current = []
        realMaterialsRef.current = []
      },
    })

    // ── Phase 1: Holographic reveal (uProgress 0→1) ──
    tl.to(progressRef.current, {
      value: 1,
      duration: 2.2,
      ease: 'power2.inOut',
    })

    // ── Phase 2: Crossfade — holo fades out, real can fades in ──
    tl.add(() => {
      phaseRef.current = 'crossfade'

      // Make real can meshes visible but fully transparent
      if (realCanRef.current) {
        realCanRef.current.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh
            const mat = mesh.material as THREE.MeshPhysicalMaterial
            if (!mat.transparent) {
              mat.transparent = true
              mat.needsUpdate = true
            }
            mat.opacity = 0
            mesh.visible = true
          }
        })
      }
    })

    // Fade out holographic material
    tl.to(fadeOutRef.current, {
      value: 1,
      duration: 1.3,
      ease: 'power2.inOut',
    }, '<')

    // Simultaneously fade in real can opacity
    tl.to(realOpacityRef.current, {
      value: 1,
      duration: 0.8,
      ease: 'power2.inOut',
    }, '<')

    return () => {
      tl.kill()
    }
  }, [holoReady])

  // Update shader uniforms every frame + manage crossfade + mirror transforms
  useFrame((state) => {
    const time = state.clock.elapsedTime
    const progress = progressRef.current.value
    const fadeOut = fadeOutRef.current.value

    // Update holographic shader uniforms
    materialsRef.current.forEach((mat) => {
      mat.uniforms.uTime!.value = time
      mat.uniforms.uProgress!.value = progress
      mat.uniforms.uFadeOut!.value = fadeOut
    })

    // During the crossfade, update real can material opacity
    if (phaseRef.current === 'crossfade' && realCanRef.current) {
      const opacity = realOpacityRef.current.value
      realCanRef.current.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mat = (child as THREE.Mesh).material as THREE.MeshPhysicalMaterial
          if (mat.opacity !== undefined) {
            mat.opacity = opacity
          }
        }
      })
    }

    // During pure holo phase, hide real can meshes (group stays active for rotation)
    if (phaseRef.current === 'holo' && realCanRef.current) {
      realCanRef.current.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          (child as THREE.Mesh).visible = false
        }
      })
    }

    // Mirror the real can group's transform to the holo group
    if (holoGroupRef.current && realCanRef.current && phaseRef.current !== 'done') {
      const canGroup = realCanRef.current.children[0] as THREE.Group | undefined
      if (canGroup) {
        holoGroupRef.current.rotation.copy(canGroup.rotation)
        holoGroupRef.current.position.copy(canGroup.position)
        holoGroupRef.current.scale.copy(canGroup.scale)
      }
    }
  })

  // Cleanup: ensure real can is visible if component unmounts
  useEffect(() => {
    if (!holoReady) return
    return () => {
      if (realCanRef.current) {
        realCanRef.current.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            (child as THREE.Mesh).visible = true
          }
        })
      }
      // Restore materials
      realMaterialsRef.current.forEach(({ mat, origTransparent, origOpacity }) => {
        mat.transparent = origTransparent
        ;(mat as THREE.MeshPhysicalMaterial).opacity = origOpacity
        mat.needsUpdate = true
      })
    }
  }, [holoReady])

  return (
    <>
      {/* The real can — meshes hidden during holo, crossfade to visible */}
      <group ref={realCanRef}>
        {children}
      </group>

      {/* Holographic clone — visible during materialization */}
      <group ref={holoGroupRef} visible={false} />
    </>
  )
}
