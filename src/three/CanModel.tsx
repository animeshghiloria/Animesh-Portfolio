import { forwardRef, useRef, useMemo } from 'react'
import { useFrame, useLoader } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../store/useStore'

// ─── 500 ml Aluminum Can — Visual Dimensions ────────────────────────────
//
// Based on the reference photo of a Monster Energy Ultra White 500ml can.
// Proportions tuned to match the visual appearance:
//
//   Body diameter:    66 mm  →  radius 0.33
//   Total height:    168 mm  →  1.68
//   Neck taper:       gentle — body narrows to ~60 mm over ~14 mm
//   Lid seam (rim):   thick visible ring, ~3 mm tall
//   Lid surface:      recessed inside seam, ~58 mm diameter
//   Bottom:           nearly flush, tiny inward tuck + hidden inner dome
//
// Scale: 1 unit ≈ 100 mm
// ────────────────────────────────────────────────────────────────────────

const R          = 0.33          // body radius
const TOTAL_H    = 1.68          // total can height
const NECK_H     = 0.07          // gentle neck taper height (halved)
const SEAM_H     = 0.035         // double-seam rim height (visible thick ring)
const SEAM_R     = 0.31          // seam outer radius
const LID_R      = 0.29          // lid surface radius (recessed inside seam)
const NECK_BOT_R = 0.30          // bottom of neck (where taper starts narrowing)
const BOTTOM_TUCK = 0.02         // slight inward tuck at bottom edge
const SEG        = 64

// Derived: straight body height
const BODY_H = TOTAL_H - NECK_H - SEAM_H - BOTTOM_TUCK  // ≈ 1.485

/**
 * Canvas roughness map.
 */
function createRoughnessMap(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = '#484848'
  ctx.fillRect(0, 0, 256, 256)

  const imageData = ctx.getImageData(0, 0, 256, 256)
  const data = imageData.data
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 10
    data[i] = Math.max(0, Math.min(255, data[i]! + noise))
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1]! + noise))
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2]! + noise))
  }
  ctx.putImageData(imageData, 0, 0)

  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.ClampToEdgeWrapping
  tex.needsUpdate = true
  return tex
}

/**
 * Canvas normal map.
 */
function createNormalMap(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = 'rgb(128, 128, 255)'
  ctx.fillRect(0, 0, 256, 256)

  const imageData = ctx.getImageData(0, 0, 256, 256)
  const data = imageData.data
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.max(0, Math.min(255, 128 + (Math.random() - 0.5) * 6))
    data[i + 1] = Math.max(0, Math.min(255, 128 + (Math.random() - 0.5) * 6))
  }
  ctx.putImageData(imageData, 0, 0)

  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.ClampToEdgeWrapping
  tex.needsUpdate = true
  return tex
}

/**
 * Top section profile — gentle neck taper + thick double-seam rim.
 *
 * Looking at the reference photo:
 * - The body barely tapers — goes from 33mm radius to ~30mm over 14mm
 * - Then there's a thick, clearly visible double-seam rim (crimped lid edge)
 * - The lid surface sits slightly recessed inside the seam
 *
 * y=0 is at the top of the body cylinder.
 */
function createTopGeometry(): THREE.LatheGeometry {
  const pts: THREE.Vector2[] = []

  // 1. Gentle shoulder curve (body → neck)
  //    Very subtle — only narrows ~3mm in radius over 14mm height
  const steps = 20
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    // Ease-out curve — most taper happens near the top
    const ease = 1 - (1 - t) * (1 - t)
    const r = R - (R - NECK_BOT_R) * ease
    const y = NECK_H * t
    pts.push(new THREE.Vector2(r, y))
  }

  // 2. Double-seam rim — the thick visible ring at the very top
  //    This is where the lid is crimped onto the can body.
  //    Profile: neck → outward bulge → flat top → slight inward
  const seamBase = NECK_H
  // Transition from neck to seam outer wall
  pts.push(new THREE.Vector2(NECK_BOT_R + 0.002, seamBase + 0.002))
  // Seam outer wall (nearly vertical, slightly wider)
  pts.push(new THREE.Vector2(SEAM_R, seamBase + 0.005))
  pts.push(new THREE.Vector2(SEAM_R + 0.002, seamBase + SEAM_H * 0.3))
  pts.push(new THREE.Vector2(SEAM_R + 0.003, seamBase + SEAM_H * 0.5))
  pts.push(new THREE.Vector2(SEAM_R + 0.002, seamBase + SEAM_H * 0.7))
  pts.push(new THREE.Vector2(SEAM_R, seamBase + SEAM_H * 0.9))
  // Top edge of seam — curves inward to lid
  pts.push(new THREE.Vector2(SEAM_R - 0.005, seamBase + SEAM_H))
  pts.push(new THREE.Vector2(LID_R + 0.005, seamBase + SEAM_H + 0.002))
  // Lid surface (recessed flat area)
  pts.push(new THREE.Vector2(LID_R, seamBase + SEAM_H + 0.002))

  const geo = new THREE.LatheGeometry(pts, SEG)
  geo.computeVertexNormals()
  return geo
}

/**
 * Bottom section — slight inward tuck + hidden concave dome.
 *
 * From the reference photo, the bottom is nearly flush with the body.
 * Just a very slight narrowing at the very bottom edge.
 * The concave dome is entirely inside and not visible from the front.
 *
 * y=0 is at the bottom of the body cylinder. Flipped via rotation.
 */
function createBottomGeometry(): THREE.LatheGeometry {
  const pts: THREE.Vector2[] = []

  // Inner dome (concave, hidden — only visible if looking up at the can)
  const domeDepth = 0.08
  const domeR = 0.27
  const domeSteps = 12

  pts.push(new THREE.Vector2(0, -domeDepth + 0.005))
  for (let i = 1; i <= domeSteps; i++) {
    const t = i / domeSteps
    const angle = (t * Math.PI) / 2
    const r = domeR * Math.sin(angle)
    const y = -domeDepth + domeDepth * (1 - Math.cos(angle))
    pts.push(new THREE.Vector2(r, y))
  }

  // Chime — the standing ring / bottom edge
  // Very tight curve outward to body wall
  pts.push(new THREE.Vector2(R - 0.008, -0.004))
  pts.push(new THREE.Vector2(R - 0.002, -0.001))

  // Slight inward tuck at the bottom edge of the body wall
  // This creates the subtle bottom rim visible in the photo
  pts.push(new THREE.Vector2(R, 0))
  pts.push(new THREE.Vector2(R, BOTTOM_TUCK))

  const geo = new THREE.LatheGeometry(pts, SEG)
  geo.computeVertexNormals()
  return geo
}

/**
 * Ultra-realistic 500 ml Monster Energy Ultra White can.
 */
export const CanModel = forwardRef<THREE.Group>(function CanModel(_props, ref) {
  const groupRef = useRef<THREE.Group>(null!)
  const resolvedRef = (ref as React.RefObject<THREE.Group>) || groupRef

  // ── Label texture ──
  const labelTexture = useLoader(THREE.TextureLoader, '/monster_label.png')

  useMemo(() => {
    labelTexture.wrapS = THREE.RepeatWrapping
    labelTexture.wrapT = THREE.ClampToEdgeWrapping
    labelTexture.colorSpace = THREE.SRGBColorSpace
    labelTexture.minFilter = THREE.LinearMipmapLinearFilter
    labelTexture.magFilter = THREE.LinearFilter
    labelTexture.anisotropy = 16
    labelTexture.repeat.set(1, 1)
    labelTexture.offset.set(0, 0)
    labelTexture.needsUpdate = true
  }, [labelTexture])

  // ── Geometries ──
  const bodyGeo = useMemo(() => {
    return new THREE.CylinderGeometry(R, R, BODY_H, SEG, 1, true)
  }, [])

  const topGeo = useMemo(() => createTopGeometry(), [])
  const bottomGeo = useMemo(() => createBottomGeometry(), [])
  const roughnessMap = useMemo(() => createRoughnessMap(), [])
  const normalMap = useMemo(() => createNormalMap(), [])

  // ── Pull tab ──
  const tabGeo = useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(-0.035, -0.009)
    shape.lineTo(0.035, -0.009)
    shape.quadraticCurveTo(0.048, -0.009, 0.048, 0)
    shape.quadraticCurveTo(0.048, 0.009, 0.035, 0.009)
    shape.lineTo(-0.035, 0.009)
    shape.quadraticCurveTo(-0.048, 0.009, -0.048, 0)
    shape.quadraticCurveTo(-0.048, -0.009, -0.035, -0.009)

    const hole = new THREE.Path()
    hole.moveTo(0.018, 0)
    hole.absarc(0.018, 0, 0.01, 0, Math.PI * 2, false)
    shape.holes.push(hole)

    return new THREE.ExtrudeGeometry(shape, {
      depth: 0.002,
      bevelEnabled: true,
      bevelThickness: 0.0008,
      bevelSize: 0.0008,
      bevelSegments: 2,
    })
  }, [])

  // Slow idle rotation before tap, then smoothly align logo to front
  useFrame((_state, delta) => {
    if (resolvedRef.current) {
      const canTapped = useStore.getState().canTapped
      if (!canTapped) {
        resolvedRef.current.rotation.y += 0.001 * (delta * 60)
      } else {
        resolvedRef.current.rotation.y = THREE.MathUtils.damp(
          resolvedRef.current.rotation.y,
          0,
          4,
          delta
        )
      }
    }
  })

  // ── Materials ──
  const bodyMat = useMemo(
    () => ({
      color: '#fafafa',
      metalness: 0.88,
      roughness: 0.18,
      clearcoat: 0.9,
      clearcoatRoughness: 0.08,
      envMapIntensity: 1.6,
      map: labelTexture,
      roughnessMap,
      normalMap,
      normalScale: new THREE.Vector2(0.1, 0.1),
      reflectivity: 0.85,
      side: THREE.DoubleSide as THREE.Side,
      transparent: true,
    }),
    [labelTexture, roughnessMap, normalMap]
  )

  // Silver aluminum for neck/shoulder and bottom
  const silverMat = useMemo(
    () => ({
      color: '#d8d8d8',
      metalness: 0.96,
      roughness: 0.08,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      envMapIntensity: 1.8,
      reflectivity: 1.0,
      transparent: true,
    }),
    []
  )

  // Seam rim — slightly darker, more defined
  const seamMat = useMemo(
    () => ({
      color: '#cccccc',
      metalness: 0.97,
      roughness: 0.04,
      clearcoat: 1.0,
      clearcoatRoughness: 0.02,
      envMapIntensity: 2.2,
      reflectivity: 1.0,
      transparent: true,
    }),
    []
  )

  // Lid surface
  const lidMat = useMemo(
    () => ({
      color: '#d4d4d4',
      metalness: 0.97,
      roughness: 0.06,
      clearcoat: 1.0,
      clearcoatRoughness: 0.03,
      envMapIntensity: 2.0,
      reflectivity: 1.0,
      transparent: true,
    }),
    []
  )

  const tabMat = useMemo(
    () => ({
      color: '#c8c8c8',
      metalness: 0.96,
      roughness: 0.06,
      clearcoat: 0.8,
      clearcoatRoughness: 0.05,
      envMapIntensity: 2.0,
      transparent: true,
    }),
    []
  )

  // ── Y positions (body centered at origin) ──
  const bodyTop = BODY_H / 2
  const bodyBot = -BODY_H / 2
  const canTopY = bodyTop + NECK_H + SEAM_H + 0.002  // top of lid surface

  return (
    <group ref={resolvedRef}>
      {/* ── Straight body wall (label wraps here) ── */}
      <mesh geometry={bodyGeo}>
        <meshPhysicalMaterial {...bodyMat} />
      </mesh>

      {/* ── Top: gentle neck taper + double-seam rim ── */}
      <mesh geometry={topGeo} position={[0, bodyTop, 0]}>
        <meshPhysicalMaterial {...seamMat} />
      </mesh>

      {/* ── Bottom: tuck + hidden dome ── */}
      <mesh
        geometry={bottomGeo}
        position={[0, bodyBot, 0]}
        rotation={[Math.PI, 0, 0]}
      >
        <meshPhysicalMaterial {...silverMat} side={THREE.DoubleSide} />
      </mesh>

      {/* ── Flat lid surface (recessed inside seam) ── */}
      <mesh position={[0, canTopY, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[LID_R, 64]} />
        <meshPhysicalMaterial {...lidMat} />
      </mesh>

      {/* ── Drink opening ── */}
      <mesh position={[0.06, canTopY + 0.001, 0.03]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.022, 16]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.5} roughness={0.8} transparent />
      </mesh>

      {/* ── Pull tab ── */}
      <group position={[0.035, canTopY + 0.003, 0]} rotation={[Math.PI / 2, 0, -0.15]}>
        <mesh geometry={tabGeo}>
          <meshPhysicalMaterial {...tabMat} />
        </mesh>
      </group>

      {/* ── Rivet (tab pivot) ── */}
      <mesh position={[-0.006, canTopY + 0.002, 0]}>
        <sphereGeometry args={[0.009, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial {...lidMat} />
      </mesh>
    </group>
  )
})

CanModel.displayName = 'CanModel'
