import { useEffect, useRef, useCallback } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/**
 * AboutSection — 3-column layout:
 *   [Photo Card]  [Profile Card]  [Can Space]
 *
 * The photo card uses a halftone dot effect (canvas-drawn)
 * with a GSAP-animated radial cursor reveal of the clear image.
 */
export function AboutSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const photoContainerRef = useRef<HTMLDivElement>(null)
  const asciiCanvasRef = useRef<HTMLCanvasElement>(null)
  const revealRef = useRef<HTMLImageElement>(null)
  const maskPos = useRef({ x: 50, y: 50 })
  const maskRadius = useRef({ value: 0 })
  const rafId = useRef<number>(0)
  const asciiDrawn = useRef(false)
  const isHovered = useRef(false)

  // Draw ASCII art from the image onto a canvas
  const drawAscii = useCallback(() => {
    const canvas = asciiCanvasRef.current
    const container = photoContainerRef.current
    if (!canvas || !container) return

    const rect = container.getBoundingClientRect()
    // Don't draw if the container has no size yet
    if (rect.width < 10 || rect.height < 10) return

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = '/animesh.jpg'
    img.onload = () => {
      asciiDrawn.current = true
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Match canvas resolution to container
      const dpr = window.devicePixelRatio || 1
      const cW = rect.width
      const cH = rect.height
      canvas.width = Math.round(cW * dpr)
      canvas.height = Math.round(cH * dpr)
      ctx.scale(dpr, dpr)

      // Compute "object-fit: cover" source crop
      const imgAspect = img.width / img.height
      const canvasAspect = cW / cH
      let sx = 0, sy = 0, sW = img.width, sH = img.height
      if (imgAspect > canvasAspect) {
        sW = img.height * canvasAspect
        sx = (img.width - sW) / 2
      } else {
        sH = img.width / canvasAspect
        sy = (img.height - sH) / 2
      }

      // Draw to offscreen canvas to sample pixel data
      const offscreen = document.createElement('canvas')
      offscreen.width = Math.round(cW)
      offscreen.height = Math.round(cH)
      const offCtx = offscreen.getContext('2d')!
      offCtx.drawImage(img, sx, sy, sW, sH, 0, 0, cW, cH)
      const imageData = offCtx.getImageData(0, 0, Math.round(cW), Math.round(cH))
      const pixels = imageData.data
      const pixelWidth = Math.round(cW)

      // Clear canvas to dark background
      ctx.fillStyle = '#141414'
      ctx.fillRect(0, 0, cW, cH)

      // Draw ASCII art
      const charWidth = 5
      const charHeight = 8
      ctx.font = 'bold 8px Consolas, Monaco, "Courier New", monospace'
      ctx.textBaseline = 'middle'
      ctx.textAlign = 'center'

      // Character ramp from dark/sparse to bright/dense
      const chars = ' .:-=+*#%@'

      for (let y = 0; y < cH; y += charHeight) {
        for (let x = 0; x < cW; x += charWidth) {
          const px = Math.min(Math.round(x), pixelWidth - 1)
          const py = Math.min(Math.round(y), Math.round(cH) - 1)
          const i = (py * pixelWidth + px) * 4
          const r = pixels[i] ?? 0
          const g = pixels[i + 1] ?? 0
          const b = pixels[i + 2] ?? 0
          // Luminance
          const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
          
          // Select character based on luminance
          const charIndex = Math.min(
            Math.floor(lum * chars.length),
            chars.length - 1
          )
          const char = chars[charIndex]

          if (char && char !== ' ') {
            // Opacity proportional to luminance (brighter = more visible)
            const opacity = 0.15 + lum * 0.7
            ctx.fillStyle = `rgba(200, 255, 255, ${opacity.toFixed(2)})`
            
            // Draw character at center of cell
            ctx.fillText(char, x + charWidth / 2, y + charHeight / 2)
          }
        }
      }
    }
  }, [])

  const isMaskLoopActive = useRef(false)
  const maskLogCounter = useRef(0)

  // Update the mask CSS on the reveal image
  const updateMask = useCallback(() => {
    if (!revealRef.current) {
      // #region agent log
      fetch('http://127.0.0.1:7401/ingest/cf45b50a-42b3-4860-be0d-1c20cc15274d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'21c26f'},body:JSON.stringify({sessionId:'21c26f',location:'AboutSection.tsx:updateMask',message:'revealRef null — stopping loop',data:{loopActive:isMaskLoopActive.current},timestamp:Date.now(),hypothesisId:'H6',runId:'post-fix-2'})}).catch(()=>{});
      // #endregion
      isMaskLoopActive.current = false
      return
    }

    const r = maskRadius.current.value
    // #region agent log
    if (isHovered.current && maskLogCounter.current++ % 15 === 0) {
      fetch('http://127.0.0.1:7401/ingest/cf45b50a-42b3-4860-be0d-1c20cc15274d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'21c26f'},body:JSON.stringify({sessionId:'21c26f',location:'AboutSection.tsx:updateMask',message:'mask frame while hovered',data:{r,isHovered:isHovered.current,loopActive:isMaskLoopActive.current,opacity:revealRef.current.style.opacity},timestamp:Date.now(),hypothesisId:'H2-H3-H4',runId:'post-fix-2'})}).catch(()=>{});
    }
    // #endregion
    if (r < 0.5 && !isHovered.current) {
      // Hide completely
      revealRef.current.style.setProperty('opacity', '0')
      isMaskLoopActive.current = false
      return
    }

    const gradient = `radial-gradient(circle ${r}px at ${maskPos.current.x}% ${maskPos.current.y}%, black 0%, black 70%, transparent 100%)`
    revealRef.current.style.setProperty('-webkit-mask-image', gradient)
    revealRef.current.style.setProperty('mask-image', gradient)
    revealRef.current.style.setProperty('opacity', '1')
    rafId.current = requestAnimationFrame(updateMask)
  }, [])

  const startMaskLoop = useCallback(() => {
    const wasActive = isMaskLoopActive.current
    isMaskLoopActive.current = true
    cancelAnimationFrame(rafId.current)
    rafId.current = requestAnimationFrame(updateMask)
    // #region agent log
    fetch('http://127.0.0.1:7401/ingest/cf45b50a-42b3-4860-be0d-1c20cc15274d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'21c26f'},body:JSON.stringify({sessionId:'21c26f',location:'AboutSection.tsx:startMaskLoop',message:'startMaskLoop restarted RAF',data:{wasActive,rafId:rafId.current},timestamp:Date.now(),hypothesisId:'H2-H5',runId:'post-fix-2'})}).catch(()=>{});
    // #endregion
  }, [updateMask])

  // Mouse handlers for the photo container
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const container = photoContainerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    const targetX = ((e.clientX - rect.left) / rect.width) * 100
    const targetY = ((e.clientY - rect.top) / rect.height) * 100

    gsap.to(maskPos.current, {
      x: targetX,
      y: targetY,
      duration: 0.35,
      ease: 'power3.out',
      overwrite: 'auto',
    })
    startMaskLoop()
  }, [startMaskLoop])

  const handleMouseEnter = useCallback(() => {
    isHovered.current = true
    const rect = photoContainerRef.current?.getBoundingClientRect()
    // #region agent log
    fetch('http://127.0.0.1:7401/ingest/cf45b50a-42b3-4860-be0d-1c20cc15274d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'21c26f'},body:JSON.stringify({sessionId:'21c26f',location:'AboutSection.tsx:handleMouseEnter',message:'mouse enter',data:{width:rect?.width,height:rect?.height,loopActive:isMaskLoopActive.current},timestamp:Date.now(),hypothesisId:'H1',runId:'post-fix-2'})}).catch(()=>{});
    // #endregion
    gsap.to(maskRadius.current, {
      value: 204,
      duration: 0.3,
      ease: 'power3.out',
    })
    startMaskLoop()
  }, [startMaskLoop])

  const handleMouseLeave = useCallback(() => {
    isHovered.current = false
    gsap.to(maskRadius.current, {
      value: 0,
      duration: 0.25,
      ease: 'power2.in',
    })
    startMaskLoop()
  }, [startMaskLoop])

  // Draw ASCII art when the section scrolls into view (so container has real dimensions)
  useEffect(() => {
    // Only run mask update loop initially once to render state
    startMaskLoop()

    // Use a ScrollTrigger to draw the ASCII art once the section is near-visible
    const trigger = ScrollTrigger.create({
      trigger: sectionRef.current,
      start: 'top 120%',
      once: true,
      onEnter: () => {
        // Small delay to ensure layout is computed
        requestAnimationFrame(() => {
          drawAscii()
        })
      },
    })

    // Also try on mount in case already in view
    const timer = setTimeout(() => {
      if (!asciiDrawn.current) drawAscii()
    }, 500)

    // Redraw on resize
    const handleResize = () => {
      drawAscii()
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(rafId.current)
      rafId.current = 0
      isMaskLoopActive.current = false
      // #region agent log
      fetch('http://127.0.0.1:7401/ingest/cf45b50a-42b3-4860-be0d-1c20cc15274d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'21c26f'},body:JSON.stringify({sessionId:'21c26f',location:'AboutSection.tsx:useEffect cleanup',message:'effect cleanup',data:{loopActiveReset:true},timestamp:Date.now(),hypothesisId:'H2',runId:'post-fix'})}).catch(()=>{});
      // #endregion
      trigger.kill()
      clearTimeout(timer)
    }
  }, [drawAscii, startMaskLoop])

  // Native pointer listener to verify events reach the container (H1)
  useEffect(() => {
    const el = photoContainerRef.current
    if (!el) return

    const onPointerEnter = (e: PointerEvent) => {
      const topEl = document.elementFromPoint(e.clientX, e.clientY)
      // #region agent log
      fetch('http://127.0.0.1:7401/ingest/cf45b50a-42b3-4860-be0d-1c20cc15274d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'21c26f'},body:JSON.stringify({sessionId:'21c26f',location:'AboutSection.tsx:native pointerenter',message:'native pointer enter',data:{topTag:topEl?.tagName,topClass:topEl?.className,isContainer:topEl===el||el.contains(topEl),width:el.offsetWidth,height:el.offsetHeight},timestamp:Date.now(),hypothesisId:'H1',runId:'post-fix-2'})}).catch(()=>{});
      // #endregion
    }

    el.addEventListener('pointerenter', onPointerEnter)
    return () => el.removeEventListener('pointerenter', onPointerEnter)
  }, [])

  // GSAP scroll-triggered entrance animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Header animation
      gsap.fromTo(
        '.about-header',
        { y: 60, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%',
            end: 'top 40%',
            toggleActions: 'play none none reverse',
          },
        }
      )

      // Stagger: photo card, profile card, can space
      gsap.fromTo(
        '.about-photo-card',
        { y: 80, opacity: 0, rotateY: -8 },
        {
          y: 0,
          opacity: 1,
          rotateY: 0,
          duration: 1.2,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.about-grid',
            start: 'top 78%',
            toggleActions: 'play none none reverse',
          },
        }
      )

      gsap.fromTo(
        '.about-profile',
        { y: 60, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          delay: 0.15,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.about-grid',
            start: 'top 75%',
            toggleActions: 'play none none reverse',
          },
        }
      )

      gsap.fromTo(
        '.about-can-space',
        { opacity: 0 },
        {
          opacity: 1,
          duration: 1,
          delay: 0.3,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.about-grid',
            start: 'top 75%',
            toggleActions: 'play none none reverse',
          },
        }
      )
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section id="about" ref={sectionRef} className="section about">
      <h2 className="about-header">
        WHO'S HOLDING <span className="text-accent">THE CAN</span>?
      </h2>

      <div className="about-grid">
        {/* ── Left: Photo Card with ASCII Art ── */}
        <div className="about-photo-card">
          <div
            ref={photoContainerRef}
            className="about-photo-container"
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <img
              ref={revealRef}
              src="/animesh.jpg"
              alt="Animesh"
              className="about-photo-reveal"
            />
            {/* ASCII canvas (on top, z-index 2) */}
            <canvas
              ref={asciiCanvasRef}
              className="about-photo-ascii"
            />
          </div>
          <div className="about-photo-label">THE DEVELOPER</div>
        </div>

        {/* ── Center: Profile Card ── */}
        <div className="about-profile glass">
          <div className="about-profile-inner">
            <h3 className="about-name">ANIMESH</h3>
            <p className="about-title">DEVELOPER PROFILE</p>

            <div className="about-education">
              <p className="about-edu-degree">B.Tech — Computer Science Engineering</p>
              <p className="about-edu-college">Inderprastha Engineering College (2024-2028)</p>
            </div>

            <div className="about-roles">
              <span className="about-role">Full Stack Developer</span>
              <span className="about-role-separator">×</span>
              <span className="about-role">AI Engineer</span>
            </div>

            <div className="about-stats">
              <div className="about-stat">
                <span className="about-stat-value">10+</span>
                <span className="about-stat-label">PROJECTS</span>
              </div>
              <div className="about-stat">
                <span className="about-stat-value">15+</span>
                <span className="about-stat-label">TECHNOLOGIES</span>
              </div>
              <div className="about-stat">
                <span className="about-stat-value">∞</span>
                <span className="about-stat-label">CAFFEINE</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: Can Space (3D can floats here via CanAnimator) ── */}
        <div className="about-can-space" />
      </div>
    </section>
  )
}
