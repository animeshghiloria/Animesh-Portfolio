import { useEffect, useRef, useState, useCallback } from 'react'
import gsap from 'gsap'
import { useStore } from '../store/useStore'
import '../styles/loading.css'

/**
 * Interactive loading screen.
 *
 * 1. Shows "TAP THE CAN." below the 3D can (visible through semi-transparent overlay)
 * 2. On click — "FROM CAFFEINE" slides left, "TO CREATION" slides right, both scale up
 * 3. Brief pause to admire the composition
 * 4. Overlay fades out, site goes live
 */
export function LoadingScreen() {
  const isLoaded = useStore((s) => s.isLoaded)
  const setLoaded = useStore((s) => s.setLoaded)
  const canTapped = useStore((s) => s.canTapped)
  const setCanTapped = useStore((s) => s.setCanTapped)
  const holoComplete = useStore((s) => s.holoComplete)
  const overlayRef = useRef<HTMLDivElement>(null)
  const tapTextRef = useRef<HTMLDivElement>(null)
  const fromRef = useRef<HTMLDivElement>(null)
  const toRef = useRef<HTMLDivElement>(null)
  const pulseRef = useRef<HTMLDivElement>(null)
  const [showTapText, setShowTapText] = useState(false)

  // Show "TAP THE CAN." after holographic materialization completes
  useEffect(() => {
    if (!holoComplete) return
    // Brief additional delay after holo for a smooth beat
    const timer = setTimeout(() => setShowTapText(true), 400)
    return () => clearTimeout(timer)
  }, [holoComplete])

  const handleTap = useCallback(() => {
    if (canTapped) return
    setCanTapped(true)

    const tl = gsap.timeline({
      onComplete: () => {
        // After composition pause, fade out overlay
        gsap.to(overlayRef.current, {
          opacity: 0,
          duration: 0.8,
          ease: 'power2.inOut',
          onComplete: () => setLoaded(true),
        })
      },
    })

    // 1. Fade out "TAP THE CAN."
    tl.to(tapTextRef.current, {
      opacity: 0,
      y: 20,
      duration: 0.4,
      ease: 'power2.in',
    })

    // 2. Reveal "FROM CAFFEINE" — slide left + scale up
    tl.fromTo(
      fromRef.current,
      { opacity: 0, x: 0, scale: 0.5 },
      {
        opacity: 1,
        x: '-38vw',
        scale: 1,
        duration: 1.0,
        ease: 'power3.out',
      },
      '-=0.1'
    )

    // 3. Reveal "TO CREATION" — slide right + scale up (simultaneous)
    tl.fromTo(
      toRef.current,
      { opacity: 0, x: 0, scale: 0.5 },
      {
        opacity: 1,
        x: '38vw',
        scale: 1,
        duration: 1.0,
        ease: 'power3.out',
      },
      '<' // same start time as previous
    )

    // 4. Energy pulse across the middle
    tl.fromTo(
      pulseRef.current,
      { scaleX: 0, opacity: 0.8 },
      {
        scaleX: 1,
        opacity: 0,
        duration: 1.0,
        ease: 'power2.out',
      },
      '-=0.5'
    )

    // 5. Brief pause — admire the composition (~1.5s)
    tl.to({}, { duration: 1.5 })
  }, [canTapped, setCanTapped, setLoaded])

  if (isLoaded) return null

  return (
    <div
      ref={overlayRef}
      className="loading-screen"
      onClick={handleTap}
    >
      {/* The "FROM CAFFEINE" text — starts hidden at center, slides left */}
      <div ref={fromRef} className="loading-split-text loading-split-left">
        <span className="split-word">FROM</span>
        <span className="split-word accent-word">CAFFEINE</span>
      </div>

      {/* The "TO CREATION" text — starts hidden at center, slides right */}
      <div ref={toRef} className="loading-split-text loading-split-right">
        <span className="split-word">TO</span>
        <span className="split-word accent-word">CREATION</span>
      </div>

      {/* Energy pulse line */}
      <div ref={pulseRef} className="loading-energy-pulse" />

      {/* "TAP THE CAN." prompt */}
      <div
        ref={tapTextRef}
        className={`loading-tap-text ${showTapText ? 'visible' : ''}`}
      >
        TAP THE CAN.
      </div>

      {/* Subtle animated ring around can area */}
      <div className={`loading-can-ring ${showTapText ? 'visible' : ''}`} />
    </div>
  )
}
