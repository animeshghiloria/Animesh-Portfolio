import { useEffect, useRef, useMemo } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useStore } from '../store/useStore'

gsap.registerPlugin(ScrollTrigger)

interface Point {
  x: number
  y: number
  tx: number
  ty: number
  nx: number
  ny: number
}

interface BaroqueElement {
  id: string
  type: 'stem' | 'leaf' | 'shading' | 'tendril' | 'medallion' | 'chain'
  path: string
  section: string
}

// Generates points along a logarithmic-like spiral winding inwards
function generateSpiralPoints(
  cx: number,
  cy: number,
  rStart: number,
  rEnd: number,
  thetaStart: number,
  thetaEnd: number,
  dir: 1 | -1,
  steps = 85
): Point[] {
  const points: Point[] = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const tEase = Math.pow(t, 1.2)
    const theta = thetaStart + (thetaEnd - thetaStart) * tEase
    const r = rStart + (rEnd - rStart) * tEase
    
    const x = cx + r * Math.cos(dir * theta)
    const y = cy + r * Math.sin(dir * theta)
    
    points.push({ x, y, tx: 0, ty: 0, nx: 0, ny: 0 })
  }
  
  // Tangents & Normals
  for (let i = 0; i <= steps; i++) {
    let tx = 0, ty = 0
    if (i < steps) {
      tx = points[i+1].x - points[i].x
      ty = points[i+1].y - points[i].y
    } else {
      tx = points[i].x - points[i-1].x
      ty = points[i].y - points[i-1].y
    }
    const len = Math.sqrt(tx*tx + ty*ty)
    if (len > 0.0001) {
      tx /= len
      ty /= len
    } else {
      tx = 1
      ty = 0
    }
    const nx = -ty * dir
    const ny = tx * dir
    points[i].tx = tx
    points[i].ty = ty
    points[i].nx = nx
    points[i].ny = ny
  }
  
  return points
}

// Generates a symmetric acanthus leaf with 4 lobes (unused but kept for reference)
/*
function generateSymmetricLeaf(
  spiralPoints: Point[],
  startIndex: number,
  endIndex: number,
  maxWidth: number,
  lobesCount = 4
): { leafPath: string; shadingPaths: string[] } {
  const leafPoints = spiralPoints.slice(startIndex, endIndex + 1)
  if (leafPoints.length < 3) return { leafPath: '', shadingPaths: [] }
  
  const N = leafPoints.length
  const rightPoints: { x: number; y: number }[] = []
  const leftPoints: { x: number; y: number }[] = []
  
  for (let i = 0; i < N; i++) {
    const p = leafPoints[i]
    const s = i / (N - 1)
    
    const envelope = Math.sin(s * Math.PI) * maxWidth
    const sLobe = (s * lobesCount) % 1
    const lobeProfile = Math.sin(sLobe * Math.PI) * (1.0 - 0.25 * sLobe)
    const lobeFactor = 0.2 + 0.8 * lobeProfile
    
    const W = envelope * lobeFactor
    
    const rx = p.x + p.nx * W
    const ry = p.y + p.ny * W
    
    const lx = p.x - p.nx * W
    const ly = p.y - p.ny * W
    
    rightPoints.push({ x: rx, y: ry })
    leftPoints.push({ x: lx, y: ly })
  }
  
  const rightStr = rightPoints.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')
  const leftStr = [...leftPoints].reverse().map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')
  const leafPath = `M ${rightStr} L ${leftStr} Z`
  
  const shadingPaths: string[] = []
  const shadingIndices = [
    Math.floor(N * 0.2),
    Math.floor(N * 0.4),
    Math.floor(N * 0.6),
    Math.floor(N * 0.8)
  ]
  
  shadingIndices.forEach(idx => {
    if (idx >= N - 1 || idx <= 0) return
    const p = leafPoints[idx]
    const rPt = rightPoints[idx]
    const lPt = leftPoints[N - 1 - idx]
    
    if (!rPt || !lPt) return
    const fraction = 0.82
    
    const rEndX = p.x + (rPt.x - p.x) * fraction
    const rEndY = p.y + (rPt.y - p.y) * fraction
    const rDist = Math.sqrt((rEndX - p.x)**2 + (rEndY - p.y)**2)
    const rCtrlX = p.x + (rEndX - p.x) * 0.5 + p.tx * rDist * 0.25
    const rCtrlY = p.y + (rEndY - p.y) * 0.5 + p.ty * rDist * 0.25
    shadingPaths.push(`M ${p.x.toFixed(1)},${p.y.toFixed(1)} Q ${rCtrlX.toFixed(1)},${rCtrlY.toFixed(1)} ${rEndX.toFixed(1)},${rEndY.toFixed(1)}`)
    
    const lEndX = p.x + (lPt.x - p.x) * fraction
    const lEndY = p.y + (lPt.y - p.y) * fraction
    const lDist = Math.sqrt((lEndX - p.x)**2 + (lEndY - p.y)**2)
    const lCtrlX = p.x + (lEndX - p.x) * 0.5 + p.tx * lDist * 0.25
    const lCtrlY = p.y + (lEndY - p.y) * 0.5 + p.ty * lDist * 0.25
    shadingPaths.push(`M ${p.x.toFixed(1)},${p.y.toFixed(1)} Q ${lCtrlX.toFixed(1)},${lCtrlY.toFixed(1)} ${lEndX.toFixed(1)},${lEndY.toFixed(1)}`)
  })
  
  return { leafPath, shadingPaths }
}
*/

// Generates a tendril path (unused but kept for reference)
/*
function generateTendrilPath(
  parent: Point,
  rStart: number,
  rEnd: number,
  thetaStart: number,
  thetaEnd: number,
  dir: 1 | -1
): string {
  const points: { x: number; y: number }[] = []
  const steps = 30
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const tEase = Math.pow(t, 1.3)
    const theta = thetaStart + (thetaEnd - thetaStart) * tEase
    const r = rStart + (rEnd - rStart) * tEase
    
    const localX = r * Math.cos(dir * theta)
    const localY = r * Math.sin(dir * theta)
    
    const x = parent.x + localX * parent.tx - localY * parent.nx
    const y = parent.y + localX * parent.ty - localY * parent.ny
    
    points.push({ x, y })
  }
  return 'M ' + points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')
}
*/

// Generates crown paths (unused but kept for reference)
/*
function generateCrownPaths(cx: number, cy: number, width: number, isPedestal = false): string[] {
  const paths: string[] = []
  const ptsLeft: { x: number; y: number }[] = []
  const steps = 40
  const dirFactor = isPedestal ? -1 : 1
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const x = cx - width * Math.sin(t * Math.PI * 0.5)
    const y = cy + 25 * Math.sin(t * Math.PI) * dirFactor
    ptsLeft.push({ x, y })
  }
  paths.push('M ' + ptsLeft.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L '))
  
  const ptsRight = ptsLeft.map(p => ({ x: 2 * cx - p.x, y: p.y }))
  paths.push('M ' + ptsRight.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L '))
  
  return paths
}
*/

// Generates a symmetrical medallion plaque for certifications
function generatePlaque(cx: number, cy: number, section: string, isRight: boolean): BaroqueElement[] {
  const elements: BaroqueElement[] = []
  const flip = isRight ? -1 : 1
  const id = `plaque-${isRight ? 'right' : 'left'}`

  // Hanging chain
  elements.push({
    id: `${id}-hang-chain`,
    type: 'chain',
    path: `M ${cx} ${cy - 120} L ${cx} ${cy - 50}`,
    section
  })

  // Outer border shape: Gothic diamond / shield plaque outline
  const plaquePath = `M ${cx} ${cy - 50} 
                      Q ${cx + 40 * flip} ${cy - 40} ${cx + 50 * flip} ${cy} 
                      Q ${cx + 40 * flip} ${cy + 40} ${cx} ${cy + 50} 
                      Q ${cx - 40 * flip} ${cy + 40} ${cx - 50 * flip} ${cy} 
                      Q ${cx - 40 * flip} ${cy - 40} ${cx} ${cy - 50} Z`
  elements.push({
    id: `${id}-border`,
    type: 'leaf',
    path: plaquePath,
    section
  })

  // Inner inset line
  const innerPath = `M ${cx} ${cy - 40} 
                     Q ${cx + 30 * flip} ${cy - 30} ${cx + 38 * flip} ${cy} 
                     Q ${cx + 30 * flip} ${cy + 30} ${cx} ${cy + 40} 
                     Q ${cx - 30 * flip} ${cy + 30} ${cx - 38 * flip} ${cy} 
                     Q ${cx - 30 * flip} ${cy - 30} ${cx} ${cy - 40} Z`
  elements.push({
    id: `${id}-inner`,
    type: 'stem',
    path: innerPath,
    section
  })

  // Symmetrical thorn accents on left/right edges of plaque
  const thornPath = `M ${cx + 50 * flip} ${cy} Q ${cx + 80 * flip} ${cy - 15} ${cx + 90 * flip} ${cy} Q ${cx + 70 * flip} ${cy + 15} ${cx + 50 * flip} ${cy} Z`
  elements.push({
    id: `${id}-thorn-acc`,
    type: 'leaf',
    path: thornPath,
    section
  })

  // Dripping bottom bead chain
  elements.push(...generateBeadChain(cx, cy + 50, 150, 15, section, `${id}-drip`))

  return elements
}

// ════════════════════════════════════════════════════════════════
// GOTHIC ELEMENT GENERATORS
// ════════════════════════════════════════════════════════════════

// Generates a vertical bead chain / dripping chain of beads in a single path
function generateBeadChain(cx: number, cy: number, length: number, spacing: number, section: string, id: string): BaroqueElement[] {
  const elements: BaroqueElement[] = []
  
  // Chain wire stem
  elements.push({
    id: `${id}-line`,
    type: 'chain',
    path: `M ${cx} ${cy} L ${cx} ${cy + length}`,
    section
  })
  
  // Beads path (looping sub-circles)
  const count = Math.floor(length / spacing)
  let beadsPath = ''
  for (let i = 1; i <= count; i++) {
    const y = cy + i * spacing
    beadsPath += `M ${cx} ${y - 1} A 1.5 1.5 0 1,1 ${cx} ${y - 1 + 0.01} Z `
  }
  
  if (beadsPath) {
    elements.push({
      id: `${id}-beads`,
      type: 'medallion', // styles as gothic-bead
      path: beadsPath.trim(),
      section
    })
  }
  
  return elements
}

// Generates an ornate gothic cross/dagger
function generateGothicCross(cx: number, cy: number, s: number, section: string, id: string): BaroqueElement[] {
  const elements: BaroqueElement[] = []
  
  // Bars
  elements.push({
    id: `${id}-vbar`,
    type: 'stem',
    path: `M ${cx} ${cy - 45*s} L ${cx} ${cy + 65*s}`,
    section
  })
  elements.push({
    id: `${id}-hbar`,
    type: 'stem',
    path: `M ${cx - 30*s} ${cy - 10*s} L ${cx + 30*s} ${cy - 10*s}`,
    section
  })
  
  // Pointy cusps
  const topCusp = `M ${cx} ${cy - 45*s} L ${cx - 6*s} ${cy - 35*s} L ${cx} ${cy - 25*s} L ${cx + 6*s} ${cy - 35*s} Z`
  const leftCusp = `M ${cx - 30*s} ${cy - 10*s} L ${cx - 20*s} ${cy - 15*s} L ${cx - 12*s} ${cy - 10*s} L ${cx - 20*s} ${cy - 5*s} Z`
  const rightCusp = `M ${cx + 30*s} ${cy - 10*s} L ${cx + 20*s} ${cy - 15*s} L ${cx + 12*s} ${cy - 10*s} L ${cx + 20*s} ${cy - 5*s} Z`
  const botCusp = `M ${cx} ${cy + 65*s} L ${cx - 8*s} ${cy + 45*s} L ${cx} ${cy + 30*s} L ${cx + 8*s} ${cy + 45*s} Z`
  
  elements.push({ id: `${id}-top-cusp`, type: 'leaf', path: topCusp, section })
  elements.push({ id: `${id}-left-cusp`, type: 'leaf', path: leftCusp, section })
  elements.push({ id: `${id}-right-cusp`, type: 'leaf', path: rightCusp, section })
  elements.push({ id: `${id}-bot-cusp`, type: 'leaf', path: botCusp, section })
  
  // Central diamond highlight
  elements.push({
    id: `${id}-center-diamond`,
    type: 'tendril',
    path: `M ${cx} ${cy - 20*s} L ${cx - 10*s} ${cy - 10*s} L ${cx} ${cy} L ${cx + 10*s} ${cy - 10*s} Z`,
    section
  })
  
  return elements
}

// Generates an ornate gothic chandelier
function generateChandelierPaths(cx: number, cy: number, s: number, section: string, id: string): BaroqueElement[] {
  const elements: BaroqueElement[] = []
  
  // Chain wire suspension
  elements.push({
    id: `${id}-sus`,
    type: 'chain',
    path: `M ${cx} ${cy - 90*s} L ${cx} ${cy + 10*s}`,
    section
  })
  
  // Core pedestal body
  elements.push({ id: `${id}-body-1`, type: 'stem', path: `M ${cx - 15*s} ${cy + 10*s} L ${cx + 15*s} ${cy + 10*s}`, section })
  elements.push({ id: `${id}-body-2`, type: 'leaf', path: `M ${cx} ${cy + 10*s} L ${cx - 25*s} ${cy + 45*s} L ${cx} ${cy + 80*s} L ${cx + 25*s} ${cy + 45*s} Z`, section })
  elements.push({ id: `${id}-body-3`, type: 'stem', path: `M ${cx} ${cy + 45*s} A ${8*s} ${8*s} 0 1,1 ${cx} ${cy + 45*s + 0.01} Z`, section })
  
  // Symmetrical arms
  const arms = [
    `M ${cx} ${cy + 45*s} Q ${cx - 80*s} ${cy + 45*s} ${cx - 100*s} ${cy + 10*s}`,
    `M ${cx} ${cy + 45*s} Q ${cx + 80*s} ${cy + 45*s} ${cx + 100*s} ${cy + 10*s}`,
    `M ${cx} ${cy + 10*s} Q ${cx - 50*s} ${cy - 10*s} ${cx - 70*s} ${cy - 40*s}`,
    `M ${cx} ${cy + 10*s} Q ${cx + 50*s} ${cy - 10*s} ${cx + 70*s} ${cy - 40*s}`
  ]
  arms.forEach((path, idx) => {
    elements.push({ id: `${id}-arm-${idx}`, type: 'stem', path, section })
  })
  
  // Candle stands at arm tips
  const addCandle = (candX: number, candY: number, candId: string) => {
    elements.push({ id: `${candId}-plate`, type: 'stem', path: `M ${candX - 10*s} ${candY} Q ${candX} ${candY + 5*s} ${candX + 10*s} ${candY}`, section })
    elements.push({ id: `${candId}-body`, type: 'leaf', path: `M ${candX - 6*s} ${candY} L ${candX - 6*s} ${candY - 20*s} L ${candX + 6*s} ${candY - 20*s} L ${candX + 6*s} ${candY} Z`, section })
    elements.push({ id: `${candId}-flame`, type: 'tendril', path: `M ${candX} ${candY - 20*s} Q ${candX - 3*s} ${candY - 30*s} ${candX} ${candY - 38*s} Q ${candX + 3*s} ${candY - 30*s} ${candX} ${candY - 20*s}`, section })
  }
  addCandle(cx - 100*s, cy + 10*s, `${id}-c-l`)
  addCandle(cx + 100*s, cy + 10*s, `${id}-c-r`)
  addCandle(cx - 70*s, cy - 40*s, `${id}-c-tl`)
  addCandle(cx + 70*s, cy - 40*s, `${id}-c-tr`)
  
  // Dripping chain loops connecting arms
  elements.push({ id: `${id}-loop-1`, type: 'chain', path: `M ${cx - 100*s} ${cy + 10*s} Q ${cx} ${cy + 90*s} ${cx + 100*s} ${cy + 10*s}`, section })
  elements.push({ id: `${id}-loop-2`, type: 'chain', path: `M ${cx - 70*s} ${cy - 40*s} Q ${cx} ${cy + 30*s} ${cx + 70*s} ${cy - 40*s}`, section })
  
  return elements
}

// Generates a winged angel statue silhouette in bottom-left
function generateAngelPaths(cx: number, cy: number, s: number, section: string, id: string): BaroqueElement[] {
  const elements: BaroqueElement[] = []
  
  // Head & Halo
  elements.push({ id: `${id}-head`, type: 'stem', path: `M ${cx} ${cy - 80*s} A ${12*s} ${12*s} 0 1,1 ${cx} ${cy - 80*s + 0.01} Z`, section })
  elements.push({ id: `${id}-halo`, type: 'tendril', path: `M ${cx} ${cy - 80*s} A ${22*s} ${22*s} 0 1,1 ${cx} ${cy - 80*s + 0.01} Z`, section })
  
  // Gown / body
  const gownPath = `M ${cx - 10*s} ${cy - 68*s} Q ${cx - 20*s} ${cy - 20*s} ${cx - 40*s} ${cy + 80*s} Q ${cx} ${cy + 90*s} ${cx + 40*s} ${cy + 80*s} Q ${cx + 20*s} ${cy - 20*s} ${cx + 10*s} ${cy - 68*s} Z`
  elements.push({ id: `${id}-gown`, type: 'leaf', path: gownPath, section })
  
  // Symmetrical wings
  const leftWings = [
    `M ${cx - 15*s} ${cy - 60*s} Q ${cx - 80*s} ${cy - 140*s} ${cx - 140*s} ${cy - 100*s} Q ${cx - 80*s} ${cy - 50*s} ${cx - 15*s} ${cy - 40*s}`,
    `M ${cx - 15*s} ${cy - 45*s} Q ${cx - 90*s} ${cy - 100*s} ${cx - 130*s} ${cy - 60*s} Q ${cx - 80*s} ${cy - 20*s} ${cx - 15*s} ${cy - 20*s}`,
    `M ${cx - 15*s} ${cy - 30*s} Q ${cx - 100*s} ${cy - 60*s} ${cx - 115*s} ${cy - 20*s} Q ${cx - 70*s} ${cy + 10*s} ${cx - 15*s} ${cy}`
  ]
  leftWings.forEach((path, idx) => {
    elements.push({ id: `${id}-wing-l-${idx}`, type: 'stem', path, section })
  })
  
  const rightWings = [
    `M ${cx + 15*s} ${cy - 60*s} Q ${cx + 80*s} ${cy - 140*s} ${cx + 140*s} ${cy - 100*s} Q ${cx + 80*s} ${cy - 50*s} ${cx + 15*s} ${cy - 40*s}`,
    `M ${cx + 15*s} ${cy - 45*s} Q ${cx + 90*s} ${cy - 100*s} ${cx + 130*s} ${cy - 60*s} Q ${cx + 80*s} ${cy - 20*s} ${cx + 15*s} ${cy - 20*s}`,
    `M ${cx + 15*s} ${cy - 30*s} Q ${cx + 100*s} ${cy - 60*s} ${cx + 115*s} ${cy - 20*s} Q ${cx + 70*s} ${cy + 10*s} ${cx + 15*s} ${cy}`
  ]
  rightWings.forEach((path, idx) => {
    elements.push({ id: `${id}-wing-r-${idx}`, type: 'stem', path, section })
  })
  
  return elements
}

// Generates sharp thorny branches meeting at needle-like cusps
function generateThornyBranch(
  cx: number,
  cy: number,
  rStart: number,
  rEnd: number,
  thetaStart: number,
  thetaEnd: number,
  dir: 1 | -1,
  section: string,
  id: string
): BaroqueElement[] {
  const elements: BaroqueElement[] = []
  const points = generateSpiralPoints(cx, cy, rStart, rEnd, thetaStart, thetaEnd, dir, 70)
  
  // Stem spine
  elements.push({
    id: `${id}-spine`,
    type: 'stem',
    path: 'M ' + points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L '),
    section
  })
  
  // Cusped thorn points
  const N = points.length
  const thornIndices = [12, 22, 32, 42, 52, 60]
  thornIndices.forEach((idx, tIdx) => {
    if (idx >= N - 1) return
    const p = points[idx]
    const nextP = points[idx + 1]
    const thornLen = (40 - tIdx * 5)
    
    const tx = p.nx * thornLen
    const ty = p.ny * thornLen
    
    const thornPath = `M ${p.x.toFixed(1)} ${p.y.toFixed(1)} L ${(p.x + tx).toFixed(1)} ${(p.y + ty).toFixed(1)} L ${nextP.x.toFixed(1)} ${nextP.y.toFixed(1)} Z`
    elements.push({ id: `${id}-thorn-${tIdx}`, type: 'leaf', path: thornPath, section })
  })
  
  return elements
}

export function CybersigilismBg() {
  const containerRef = useRef<HTMLDivElement>(null)
  const canTapped = useStore((s) => s.canTapped)

  const gothicSystem = useMemo(() => {
    const elements: BaroqueElement[] = []
    
    const generateMirrorThorns = (
      id: string,
      section: string,
      cx: number,
      cy: number,
      rStart: number,
      rEnd: number,
      tStart: number,
      tEnd: number,
      dir: 1 | -1
    ) => {
      elements.push(...generateThornyBranch(cx, cy, rStart, rEnd, tStart, tEnd, dir, section, `${id}-left`))
      elements.push(...generateThornyBranch(1920 - cx, cy, rStart, rEnd, tStart, tEnd, -dir as 1 | -1, section, `${id}-right`))
    }
    
    // ════════════════════════════════════════════════════════════════
    // 1. HOME SECTION LAYOUT (CHANDELIERS + CORNER THROTONS)
    // ════════════════════════════════════════════════════════════════
    elements.push(...generateChandelierPaths(600, 260, 1.4, 'home', 'home-ch-left'))
    elements.push(...generateChandelierPaths(1320, 260, 1.4, 'home', 'home-ch-right'))
    
    // Hanging crosses under chandeliers
    elements.push(...generateGothicCross(780, 240, 0.9, 'home', 'home-cross-left'))
    elements.push(...generateGothicCross(1140, 240, 0.9, 'home', 'home-cross-right'))
    
    // Symmetrical corner thorny borders
    generateMirrorThorns('home-corner-top', 'home', 150, 150, 310, 20, 0, 7.2, 1)
    generateMirrorThorns('home-corner-bot', 'home', 150, 930, 310, 20, 0, 7.2, -1)

    // ════════════════════════════════════════════════════════════════
    // 2. ABOUT SECTION LAYOUT (VERTICAL CHAINS & CROSSES)
    // ════════════════════════════════════════════════════════════════
    elements.push(...generateBeadChain(240, 100, 700, 16, 'about', 'about-chain-left-1'))
    elements.push(...generateBeadChain(360, 180, 500, 16, 'about', 'about-chain-left-2'))
    elements.push(...generateBeadChain(1680, 100, 700, 16, 'about', 'about-chain-right-1'))
    elements.push(...generateBeadChain(1560, 180, 500, 16, 'about', 'about-chain-right-2'))
    
    elements.push(...generateGothicCross(360, 680, 1.1, 'about', 'about-cross-left'))
    elements.push(...generateGothicCross(1560, 680, 1.1, 'about', 'about-cross-right'))
    generateMirrorThorns('about-side-thorn', 'about', 140, 540, 230, 15, 0.2, 7.0, 1)

    // ════════════════════════════════════════════════════════════════
    // 3. TECH SECTION LAYOUT (TALL THORNY PILLARS)
    // ════════════════════════════════════════════════════════════════
    generateMirrorThorns('tech-pillar-top', 'tech', 110, 220, 200, 12, 0.1, 7.0, 1)
    generateMirrorThorns('tech-pillar-mid', 'tech', 150, 540, 190, 10, 0.2, 7.2, -1)
    generateMirrorThorns('tech-pillar-bot', 'tech', 110, 860, 200, 12, 0.1, 7.0, 1)

    // ════════════════════════════════════════════════════════════════
    // 4. PROJECTS SECTION LAYOUT (HORIZONTAL FRAMES & HANGING CROSSES)
    // ════════════════════════════════════════════════════════════════
    generateMirrorThorns('projects-header', 'projects', 400, 150, 200, 10, 0.3, 7.0, -1)
    generateMirrorThorns('projects-footer', 'projects', 400, 930, 200, 10, 0.3, 7.0, 1)
    elements.push(...generateGothicCross(350, 220, 0.85, 'projects', 'projects-cr-top-l'))
    elements.push(...generateGothicCross(1570, 220, 0.85, 'projects', 'projects-cr-top-r'))

    // ════════════════════════════════════════════════════════════════
    // 5. TIMELINE SECTION LAYOUT (VERTICAL ROSARY SPINE - OFF CENTER CAN)
    // ════════════════════════════════════════════════════════════════
    elements.push(...generateBeadChain(960, 120, 840, 18, 'timeline', 'timeline-spine'))
    elements.push(...generateGothicCross(780, 540, 1.0, 'timeline', 'timeline-cross-l'))
    elements.push(...generateGothicCross(1140, 540, 1.0, 'timeline', 'timeline-cross-r'))
    generateMirrorThorns('timeline-margin', 'timeline', 160, 540, 230, 15, 0.2, 7.2, -1)

    // ════════════════════════════════════════════════════════════════
    // 6. CERTS SECTION LAYOUT (SYMMETRICAL MEDALLION PLAQUES)
    // ════════════════════════════════════════════════════════════════
    elements.push(...generatePlaque(240, 540, 'certs', false))
    elements.push(...generatePlaque(1680, 540, 'certs', true))

    // ════════════════════════════════════════════════════════════════
    // 7. CONTACT SECTION LAYOUT (WINGED ANGEL SILHOUETTES)
    // ════════════════════════════════════════════════════════════════
    elements.push(...generateAngelPaths(260, 840, 1.6, 'contact', 'contact-angel-left'))
    elements.push(...generateAngelPaths(1660, 840, 1.6, 'contact', 'contact-angel-right'))
    generateMirrorThorns('contact-thorny-base', 'contact', 200, 930, 310, 15, 0, 7.5, 1)

    return elements
  }, [])

  // Dynamic layout transitions watcher
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const sections = ['home', 'about', 'tech', 'projects', 'timeline', 'certs', 'contact']
    
    const ctx = gsap.context(() => {
      // 1. Initial setup: hide all groups and paths
      sections.forEach((secId) => {
        const groupEl = container.querySelector(`.gothic-group[data-section="${secId}"]`)
        if (groupEl) {
          gsap.set(groupEl, { opacity: 0, scale: 0.94 })
        }
        
        // Stems get drawn in via strokeDashoffset
        const stemPaths = container.querySelectorAll(`.baroque-path.gothic-stem[data-section="${secId}"]`)
        stemPaths.forEach((p) => {
          const pathEl = p as SVGPathElement
          const length = pathEl.getTotalLength ? pathEl.getTotalLength() : 800
          gsap.set(pathEl, {
            strokeDasharray: length,
            strokeDashoffset: length,
            opacity: 0
          })
        })

        // Other detail paths just get faded in
        const detailPaths = container.querySelectorAll(`.baroque-path:not(.gothic-stem)[data-section="${secId}"]`)
        detailPaths.forEach((p) => {
          gsap.set(p, { opacity: 0 })
        })
      })

      // 2. Crossfade layout transition
      const transitionToSection = (activeSec: string) => {
        sections.forEach((secId) => {
          const groupEl = container.querySelector(`.gothic-group[data-section="${secId}"]`)
          const stemPaths = container.querySelectorAll(`.baroque-path.gothic-stem[data-section="${secId}"]`)
          const detailPaths = container.querySelectorAll(`.baroque-path:not(.gothic-stem)[data-section="${secId}"]`)
          
          if (!groupEl) return

          if (secId === activeSec) {
            // Fade & Draw IN
            gsap.to(groupEl, {
              opacity: 1,
              scale: 1,
              duration: 1.3,
              ease: 'power2.out',
              overwrite: 'auto'
            })
            
            // Draw in the stems
            stemPaths.forEach((p) => {
              const pathEl = p as SVGPathElement
              gsap.to(pathEl, {
                strokeDashoffset: 0,
                opacity: 1,
                duration: 1.5,
                delay: Math.random() * 0.2, // staggered organic reveal
                ease: 'power2.out',
                overwrite: 'auto'
              })
            })

            // Fade in details
            detailPaths.forEach((p) => {
              gsap.to(p, {
                opacity: 1,
                duration: 1.2,
                delay: 0.15 + Math.random() * 0.25, // fade in slightly after stems draw
                ease: 'power2.out',
                overwrite: 'auto'
              })
            })
          } else {
            // Fade & Draw OUT
            gsap.to(groupEl, {
              opacity: 0,
              scale: 0.94,
              duration: 0.8,
              ease: 'power2.in',
              overwrite: 'auto'
            })
            
            stemPaths.forEach((p) => {
              const pathEl = p as SVGPathElement
              const length = pathEl.getTotalLength ? pathEl.getTotalLength() : 800
              gsap.to(pathEl, {
                strokeDashoffset: length,
                opacity: 0,
                duration: 0.8,
                ease: 'power2.in',
                overwrite: 'auto'
              })
            })

            detailPaths.forEach((p) => {
              gsap.to(p, {
                opacity: 0,
                duration: 0.6,
                ease: 'power2.in',
                overwrite: 'auto'
              })
            })
          }
        })
      }

      // If unlocked, immediately draw home section layout
      if (canTapped) {
        transitionToSection('home')
      }

      // Setup ScrollTriggers for layout swap transitions
      sections.forEach((secId) => {
        const sectionEl = document.getElementById(secId)
        if (!sectionEl) return

        ScrollTrigger.create({
          trigger: sectionEl,
          start: 'top 50%',
          end: 'bottom 50%',
          onToggle: (self) => {
            if (self.isActive) {
              if (canTapped || secId === 'home') {
                transitionToSection(secId)
              }
            }
          }
        })
      })
    }, container)

    return () => ctx.revert()
  }, [canTapped])

  // Group elements by section
  const groupedElements = useMemo(() => {
    const sections = ['home', 'about', 'tech', 'projects', 'timeline', 'certs', 'contact']
    return sections.map(sec => ({
      section: sec,
      paths: gothicSystem.filter(el => el.section === sec)
    }))
  }, [gothicSystem])

  // Sections thematic manuscript watermark texts in French Pinyon Script
  const sectionTexts = useMemo(() => {
    return [
      {
        section: 'home',
        lines: [
          { x: 180, y: 150, text: "Depuis l'aube du monde, la plume trace sa propre création..." },
          { x: 250, y: 350, text: "Une étincelle céleste anime le métal et éveille les sens..." },
          { x: 160, y: 850, text: "Les ombres murmurent de sombres secrets dans le silence noir..." }
        ]
      },
      {
        section: 'about',
        lines: [
          { x: 240, y: 200, text: "L'artifice de l'esprit s'exprime dans le code et les équations..." },
          { x: 180, y: 720, text: "Un profil gravé dans l'acier de la persévérance..." }
        ]
      },
      {
        section: 'tech',
        lines: [
          { x: 190, y: 300, text: "Des réseaux de pensées s'étendent à l'infini comme des racines..." },
          { x: 260, y: 650, text: "L'intelligence des machines façonne le futur de la terre..." }
        ]
      },
      {
        section: 'projects',
        lines: [
          { x: 220, y: 220, text: "Des architectures forgées dans les flammes de l'inspiration..." },
          { x: 170, y: 840, text: "Chaque projet est un monument érigé à la gloire de l'art..." }
        ]
      },
      {
        section: 'timeline',
        lines: [
          { x: 260, y: 320, text: "Le sablier du temps s'écoule lentement sous le ciel éternel..." },
          { x: 180, y: 760, text: "Les pas gravés dans la poussière de l'histoire..." }
        ]
      },
      {
        section: 'certs',
        lines: [
          { x: 200, y: 260, text: "Les sceaux du savoir couronnent le front des braves..." },
          { x: 240, y: 800, text: "Chaque distinction est une clé ouvrant les portes célestes..." }
        ]
      },
      {
        section: 'contact',
        lines: [
          { x: 170, y: 280, text: "Rejoignez-moi sous le voile céleste de la création..." },
          { x: 250, y: 780, text: "L'écho de nos esprits résonnera dans la nuit éternelle..." }
        ]
      }
    ]
  }, [])

  return (
    <div
      ref={containerRef}
      className="cybersigilism-bg"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
        className="cybersigilism-svg"
      >
        <defs>
          <filter id="sigil-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Dynamic Section Groups for Gothic Layout Trade Animations */}
        {groupedElements.map((group) => {
          const textGroup = sectionTexts.find(t => t.section === group.section)
          return (
            <g
              key={group.section}
              className="gothic-group"
              data-section={group.section}
            >
              {/* Manuscript handwriting watermark texts */}
              {textGroup?.lines.map((line, idx) => (
                <text
                  key={`text-${idx}`}
                  x={line.x}
                  y={line.y}
                  className="gothic-text"
                  transform={`rotate(-8 ${line.x} ${line.y})`}
                >
                  {line.text}
                </text>
              ))}

              {/* Gothic Engravings */}
              {group.paths.map((el) => (
                <path
                  key={el.id}
                  d={el.path}
                  className={`baroque-path gothic-${el.type}`}
                  data-section={el.section}
                />
              ))}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
