import { useThree } from '@react-three/fiber'
import { Environment as DreiEnvironment } from '@react-three/drei'
import { useEffect } from 'react'
import * as THREE from 'three'

export function Environment() {
  const { scene } = useThree()

  useEffect(() => {
    scene.fog = new THREE.Fog('#141414', 5, 20)
    return () => {
      scene.fog = null
    }
  }, [scene])

  return (
    <>
      {/* Soft ambient fill — slightly brighter for white can */}
      <ambientLight intensity={0.4} />

      {/* Main key light — warm white from upper right */}
      <directionalLight
        position={[5, 5, 5]}
        intensity={1.0}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.5}
        shadow-camera-far={50}
      />

      {/* Cyan fill light — Monster accent from the left */}
      <directionalLight
        position={[-3, 3, -5]}
        intensity={0.35}
        color="#C8FFFF"
      />

      {/* Rim light — metallic edge definition from behind */}
      <directionalLight
        position={[-2, 2, -6]}
        intensity={0.5}
        color="#ffffff"
      />

      {/* Top-down spot for dramatic falloff */}
      <spotLight
        position={[0, 10, 0]}
        intensity={0.6}
        angle={0.3}
        penumbra={1}
        castShadow={false}
      />

      {/* HDR environment — boosted for realistic aluminum reflections */}
      <DreiEnvironment
        preset="city"
        environmentIntensity={0.7}
      />
    </>
  )
}
