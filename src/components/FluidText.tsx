import { useEffect, useRef, useCallback, useState } from 'react'
import * as THREE from 'three'

/* ─────────────────────────────────────────────────────────────────────
   GLSL Shaders
   ───────────────────────────────────────────────────────────────────── */

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  precision highp float;

  uniform sampler2D uTexture;
  uniform vec2 uMouse;         // normalised 0-1 mouse position
  uniform float uHover;        // 0 → 1 hover intensity
  uniform float uTime;
  uniform vec2 uResolution;

  varying vec2 vUv;

  void main() {
    vec2 uv = vUv;

    // Distance from cursor (aspect-corrected)
    float aspect = uResolution.x / uResolution.y;
    vec2 diff = uv - uMouse;
    diff.x *= aspect;
    float dist = length(diff);

    // Fluid warp — multi-frequency sine waves, strongest near cursor
    float influence = smoothstep(0.55, 0.0, dist) * uHover;

    // Primary wave
    float wave1 = sin(dist * 14.0 - uTime * 3.0) * 0.04;
    // Secondary harmonic for liquid complexity
    float wave2 = sin(dist * 24.0 + uTime * 2.2) * 0.018;
    // Slow swirl rotation
    float angle = atan(diff.y, diff.x);
    float swirl = sin(angle * 3.0 + uTime * 1.8) * 0.015;

    vec2 distortion = normalize(diff + 0.001) * (wave1 + wave2 + swirl) * influence;

    // Add a bulge/lens push away from cursor
    vec2 bulge = normalize(diff + 0.001) * influence * 0.03;

    uv += distortion + bulge;

    vec4 texColor = texture2D(uTexture, uv);

    // Tint towards accent color near the cursor for a subtle glow
    vec3 accentTint = vec3(0.784, 1.0, 1.0); // #C8FFFF
    float tintStrength = influence * 0.4;
    texColor.rgb = mix(texColor.rgb, texColor.rgb * accentTint, tintStrength);

    // Brightness boost near cursor
    texColor.rgb += influence * 0.12;

    gl_FragColor = texColor;
  }
`

/* ─────────────────────────────────────────────────────────────────────
   Text-to-Canvas Renderer
   ───────────────────────────────────────────────────────────────────── */

interface TextLine {
  text: string
  color: string
  /** Optional glow shadow for accent text */
  glow?: string
}

interface CanvasConfig {
  lines: TextLine[]
  fontFamily: string
  fontWeight: string
  fontSize: number
  letterSpacing: number
  lineHeight: number
  textAlign: CanvasTextAlign
}

function createTextCanvas(
  config: CanvasConfig,
  width: number,
  height: number,
  dpr: number
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = width * dpr
  canvas.height = height * dpr

  const ctx = canvas.getContext('2d')!
  ctx.scale(dpr, dpr)

  // Transparent background
  ctx.clearRect(0, 0, width, height)

  const { lines, fontFamily, fontWeight, fontSize, letterSpacing, lineHeight, textAlign } = config

  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`
  ctx.textBaseline = 'middle'
  ctx.textAlign = textAlign
  ctx.letterSpacing = `${letterSpacing}px`

  // Compute total text block height
  const totalHeight = lines.length * fontSize * lineHeight
  const startY = (height - totalHeight) / 2 + (fontSize * lineHeight) / 2

  lines.forEach((line, i) => {
    const y = startY + i * fontSize * lineHeight

    // Calculate absolute X position manually to prevent browser bugs with experimental letterSpacing and right-alignment
    let lineX: number
    if (textAlign === 'right') {
      const metrics = ctx.measureText(line.text)
      lineX = width - 8 - metrics.width
    } else if (textAlign === 'left') {
      lineX = 8
    } else {
      const metrics = ctx.measureText(line.text)
      lineX = (width - metrics.width) / 2
    }

    // Always draw with left alignment for pixel-perfect coordinates consistency
    ctx.textAlign = 'left'

    // Draw glow behind if specified
    if (line.glow) {
      ctx.save()
      ctx.shadowColor = line.glow
      ctx.shadowBlur = 30
      ctx.fillStyle = line.color
      ctx.fillText(line.text, lineX, y)
      ctx.restore()
    }

    // Draw main text
    ctx.fillStyle = line.color
    ctx.fillText(line.text, lineX, y)
  })

  return canvas
}

/* ─────────────────────────────────────────────────────────────────────
   React Component
   ───────────────────────────────────────────────────────────────────── */

export interface FluidTextProps {
  /** Lines of text with individual styling */
  lines: TextLine[]
  /** Font family string, e.g. "'Syncopate', sans-serif" */
  fontFamily?: string
  /** Font weight, e.g. '700' */
  fontWeight?: string
  /** Font size in px — if not provided, will auto-scale to container */
  fontSize?: number
  /** Letter spacing in px */
  letterSpacing?: number
  /** Line height multiplier */
  lineHeight?: number
  /** Text alignment */
  textAlign?: CanvasTextAlign
  className?: string
  style?: React.CSSProperties
}

export function FluidText({
  lines,
  fontFamily = "'Rajdhani', sans-serif",
  fontWeight = '600',
  fontSize,
  letterSpacing = 2,
  lineHeight = 1.1,
  textAlign = 'center',
  className = '',
  style,
}: FluidTextProps) {
  const [hasWebGL, setHasWebGL] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null)
  const materialRef = useRef<THREE.ShaderMaterial | null>(null)
  const textureRef = useRef<THREE.CanvasTexture | null>(null)
  const rafRef = useRef<number>(0)
  const clockRef = useRef(new THREE.Clock())

  // Mouse state — lerped for organic feel
  const mouseTarget = useRef({ x: 0.5, y: 0.5 })
  const mouseCurrent = useRef({ x: 0.5, y: 0.5 })
  const hoverTarget = useRef(0)
  const hoverCurrent = useRef(0)

  const linesSerialized = JSON.stringify(lines)

  const getConfig = useCallback(
    (width: number, height: number): CanvasConfig => {
      // Auto-compute font size if not explicitly provided
      const computedSize = fontSize ?? Math.min(width * 0.12, height * 0.4, 72)
      return {
        lines,
        fontFamily,
        fontWeight,
        fontSize: computedSize,
        letterSpacing,
        lineHeight,
        textAlign,
      }
    },
    [linesSerialized, fontFamily, fontWeight, fontSize, letterSpacing, lineHeight, textAlign]
  )

  const isLoopActive = useRef(false)

  // Render loop with lerp (on-demand rendering)
  const animate = useCallback(() => {
    const renderer = rendererRef.current
    const scene = sceneRef.current
    const camera = cameraRef.current
    const material = materialRef.current
    if (!renderer || !scene || !camera || !material) {
      isLoopActive.current = false
      return
    }

    // Lerp mouse position (smooth follow)
    const lerpFactor = 0.08
    mouseCurrent.current.x += (mouseTarget.current.x - mouseCurrent.current.x) * lerpFactor
    mouseCurrent.current.y += (mouseTarget.current.y - mouseCurrent.current.y) * lerpFactor

    // Lerp hover intensity
    hoverCurrent.current += (hoverTarget.current - hoverCurrent.current) * 0.06

    // Update uniforms
    material.uniforms.uMouse.value.set(mouseCurrent.current.x, mouseCurrent.current.y)
    material.uniforms.uHover.value = hoverCurrent.current
    material.uniforms.uTime.value = clockRef.current.getElapsedTime()

    renderer.render(scene, camera)

    // If hover has completely settled to 0, stop loop to save CPU/GPU resources
    if (hoverTarget.current === 0.0 && hoverCurrent.current < 0.001) {
      hoverCurrent.current = 0.0
      material.uniforms.uHover.value = 0.0
      renderer.render(scene, camera) // draw one final clean frame
      isLoopActive.current = false
      return
    }

    rafRef.current = requestAnimationFrame(animate)
  }, [])

  const startLoop = useCallback(() => {
    if (!isLoopActive.current) {
      isLoopActive.current = true
      rafRef.current = requestAnimationFrame(animate)
    }
  }, [animate])

  const updateTexture = useCallback(() => {
    const container = containerRef.current
    const material = materialRef.current
    if (!container || !material) return

    const width = container.clientWidth
    const height = container.clientHeight
    if (width < 10 || height < 10) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const config = getConfig(width, height)
    const textCanvas = createTextCanvas(config, width, height, dpr)

    if (textureRef.current) textureRef.current.dispose()
    const texture = new THREE.CanvasTexture(textCanvas)
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter
    texture.generateMipmaps = false

    textureRef.current = texture
    material.uniforms.uTexture.value = texture
    startLoop() // Render the new texture once
  }, [getConfig, startLoop])

  const initScene = useCallback((width: number, height: number) => {
    const container = containerRef.current
    if (!container) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    // --- Create text texture ---
    const config = getConfig(width, height)
    const textCanvas = createTextCanvas(config, width, height, dpr)
    const texture = new THREE.CanvasTexture(textCanvas)
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter
    texture.generateMipmaps = false
    textureRef.current = texture

    try {
      // --- Renderer ---
      const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        premultipliedAlpha: false,
      })
      renderer.setSize(width, height)
      renderer.setPixelRatio(dpr)
      renderer.setClearColor(0x000000, 0) // transparent
      container.appendChild(renderer.domElement)

      // Style the canvas to overlay seamlessly
      renderer.domElement.style.position = 'absolute'
      renderer.domElement.style.top = '0'
      renderer.domElement.style.left = '0'
      renderer.domElement.style.width = '100%'
      renderer.domElement.style.height = '100%'
      renderer.domElement.style.pointerEvents = 'none'

      rendererRef.current = renderer

      // --- Camera (orthographic for 2D, z-clipping from -1 to 1) ---
      const camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, -1, 1)
      cameraRef.current = camera

      // --- Scene ---
      const scene = new THREE.Scene()
      sceneRef.current = scene

      // --- Shader material ---
      const material = new THREE.ShaderMaterial({
        uniforms: {
          uTexture: { value: texture },
          uMouse: { value: new THREE.Vector2(0.5, 0.5) },
          uHover: { value: 0.0 },
          uTime: { value: 0.0 },
          uResolution: { value: new THREE.Vector2(width, height) },
        },
        vertexShader,
        fragmentShader,
        transparent: true,
        depthTest: false,
        depthWrite: false,
      })
      materialRef.current = material

      // --- Full-screen quad ---
      const geometry = new THREE.PlaneGeometry(1, 1)
      const mesh = new THREE.Mesh(geometry, material)
      scene.add(mesh)

      // --- Start render loop ---
      clockRef.current.start()
    } catch (e) {
      console.warn('WebGL initialization failed in FluidText, falling back to 2D HTML/CSS text rendering.', e)
      setHasWebGL(false)
    }
  }, [getConfig])

  // WebGL Lifecycle, ResizeObserver, & Native Event Listeners
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let isInitialized = false
    let resizeTimeout: ReturnType<typeof setTimeout> | null = null

    const handleResize = (entries: ResizeObserverEntry[]) => {
      const entry = entries[0]
      if (!entry) return

      // Debounce resize to reduce thrashing
      if (resizeTimeout) clearTimeout(resizeTimeout)
      
      resizeTimeout = setTimeout(() => {
        const { width, height } = entry.contentRect
        if (width < 10 || height < 10) return

        const dpr = Math.min(window.devicePixelRatio || 1, 2)

        if (!isInitialized) {
          initScene(width, height)
          isInitialized = true
          startLoop()
        } else {
          const renderer = rendererRef.current
          const material = materialRef.current
          if (renderer && material) {
            renderer.setSize(width, height)
            renderer.setPixelRatio(dpr)
            material.uniforms.uResolution.value.set(width, height)

            // Regenerate the text texture
            const config = getConfig(width, height)
            const textCanvas = createTextCanvas(config, width, height, dpr)
            if (textureRef.current) textureRef.current.dispose()
            const newTex = new THREE.CanvasTexture(textCanvas)
            newTex.minFilter = THREE.LinearFilter
            newTex.magFilter = THREE.LinearFilter
            newTex.generateMipmaps = false
            textureRef.current = newTex
            material.uniforms.uTexture.value = newTex
            startLoop()
          }
        }
      }, 50) // 50ms debounce
    }

    const observer = new ResizeObserver(handleResize)
    observer.observe(container)

    // Native mouse events to bypass React event propagation limits
    const handleMouseMoveNative = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      mouseTarget.current.x = (e.clientX - rect.left) / rect.width
      mouseTarget.current.y = 1.0 - (e.clientY - rect.top) / rect.height
      startLoop()
    }

    const handleMouseEnterNative = () => {
      hoverTarget.current = 1.0
      startLoop()
    }

    const handleMouseLeaveNative = () => {
      hoverTarget.current = 0.0
      startLoop()
    }

    container.addEventListener('mousemove', handleMouseMoveNative)
    container.addEventListener('mouseenter', handleMouseEnterNative)
    container.addEventListener('mouseleave', handleMouseLeaveNative)

    return () => {
      observer.disconnect()
      cancelAnimationFrame(rafRef.current)
      container.removeEventListener('mousemove', handleMouseMoveNative)
      container.removeEventListener('mouseenter', handleMouseEnterNative)
      container.removeEventListener('mouseleave', handleMouseLeaveNative)
      if (rendererRef.current) {
        const canvas = rendererRef.current.domElement
        canvas.parentNode?.removeChild(canvas)
        rendererRef.current.dispose()
        rendererRef.current = null
      }
      if (textureRef.current) {
        textureRef.current.dispose()
        textureRef.current = null
      }
      if (materialRef.current) {
        materialRef.current.dispose()
        materialRef.current = null
      }
      sceneRef.current = null
      cameraRef.current = null
    }
  }, [initScene, animate, getConfig, startLoop])

  // Watch for dynamic changes in props/config to redraw texture
  useEffect(() => {
    updateTexture()
  }, [updateTexture])

  // Watch for font loading completion to redraw the texture
  useEffect(() => {
    let active = true

    // Check if fonts are already loaded/ready
    document.fonts.ready.then(() => {
      if (active) {
        updateTexture()
      }
    })

    // Listen for future font load events (covers race conditions on mount)
    const handleFontsLoaded = () => {
      if (active) {
        updateTexture()
      }
    }
    document.fonts.addEventListener('loadingdone', handleFontsLoaded)

    return () => {
      active = false
      document.fonts.removeEventListener('loadingdone', handleFontsLoaded)
    }
  }, [updateTexture])

  return (
    <div
      ref={containerRef}
      className={`fluid-text-container ${className}`}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        cursor: 'default',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: textAlign === 'left' ? 'flex-start' : textAlign === 'right' ? 'flex-end' : 'center',
        padding: textAlign === 'left' ? '0 8px' : textAlign === 'right' ? '0 8px' : '0',
        ...style,
      }}
    >
      {!hasWebGL && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          lineHeight: lineHeight,
          width: '100%',
          textAlign: textAlign,
          justifyContent: 'center',
          alignItems: textAlign === 'left' ? 'flex-start' : textAlign === 'right' ? 'flex-end' : 'center',
        }}>
          {lines.map((line, i) => (
            <span
              key={i}
              style={{
                fontFamily: fontFamily,
                fontWeight: fontWeight,
                fontSize: fontSize ?? 'clamp(1.8rem, 4.2vw, 4.4rem)',
                letterSpacing: `${letterSpacing}px`,
                color: line.color,
                textShadow: line.glow ? `0 0 30px ${line.glow}` : 'none',
                textTransform: 'uppercase',
                display: 'block',
              }}
            >
              {line.text}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
