import { useEffect, useRef, useCallback, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { motion } from 'framer-motion'
import { useStore } from '../../store/useStore'
import { FluidText } from '../FluidText'

gsap.registerPlugin(ScrollTrigger)

const CYBER_CHARS = '!@#$%^&*()_+~`|}{[]:;?><,./-=XYZ0123456789'

function DecryptText({ text, trigger }: { text: string; trigger: boolean }) {
  const containerRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    if (!trigger) {
      el.textContent = text
        .split('')
        .map((char) => {
          if (char === ' ') return ' '
          return CYBER_CHARS[Math.floor(Math.random() * CYBER_CHARS.length)]
        })
        .join('')
      return
    }

    let iterations = 0
    const targetLength = text.length
    const interval = setInterval(() => {
      el.textContent = text
        .split('')
        .map((char, index) => {
          if (char === ' ') return char
          if (index < iterations) {
            return text[index]
          }
          return CYBER_CHARS[Math.floor(Math.random() * CYBER_CHARS.length)]
        })
        .join('')

      if (iterations >= targetLength) {
        clearInterval(interval)
      }
      iterations += 1
    }, 50)

    return () => clearInterval(interval)
  }, [text, trigger])

  return <span ref={containerRef} />
}

/**
 * HeroSection — combined landing + hero.
 *
 * Layout (final state):
 *
 *   FROM        [CAN]        TO
 *   CAFFEINE             CREATION
 *
 *         subtitle text here
 *         SCROLL DOWN (animated)
 *
 * Animation sequence on tap:
 *   1. "TAP THE CAN." fades out
 *   2. "FROM / CAFFEINE" slides left from center (emerges from behind can)
 *   3. "TO / CREATION" slides right from center simultaneously
 *   4. Energy pulse flash
 *   5. Subtitle, scroll indicator fade in (no separate layout change)
 *   → Everything lands in place. That's the hero. Done.
 */
export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const tapTextRef = useRef<HTMLDivElement>(null)
  const fromRef = useRef<HTMLDivElement>(null)
  const toRef = useRef<HTMLDivElement>(null)
  const scrollIndicatorRef = useRef<HTMLDivElement>(null)

  const isLoaded = useStore((s) => s.isLoaded)
  const canTapped = useStore((s) => s.canTapped)
  const lenis = useStore((s) => s.lenis)
  const setLoaded = useStore((s) => s.setLoaded)
  const setCanTapped = useStore((s) => s.setCanTapped)
  const holoComplete = useStore((s) => s.holoComplete)
  const hasScrollSetup = useRef(false)
  const [showTapPrompt, setShowTapPrompt] = useState(false)

  const handleScrollDown = (e: React.MouseEvent) => {
    e.preventDefault()
    const target = document.getElementById('about')
    if (target) {
      if (lenis) {
        lenis.scrollTo(target)
      } else {
        target.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }

  // Show tap prompt after holographic materialization is complete
  useEffect(() => {
    if (canTapped || !holoComplete) return
    const t = setTimeout(() => setShowTapPrompt(true), 400)
    return () => clearTimeout(t)
  }, [canTapped, holoComplete])

  const handleTap = useCallback(() => {
    if (canTapped || !holoComplete) return
    setCanTapped(true)
    setShowTapPrompt(false)

    const tl = gsap.timeline({ onComplete: () => setLoaded(true) })

    // 1. Fade out TAP THE CAN immediately
    tl.to(tapTextRef.current, {
      opacity: 0,
      y: 8,
      duration: 0.4,
      ease: 'power2.out',
    })

    // 2. FROM/CAFFEINE slides LEFT, TO/CREATION slides RIGHT, and scroll down indicator fades in simultaneously
    tl.fromTo(
      fromRef.current,
      { opacity: 0, x: '8vw', scale: 0.8 },
      { opacity: 1, x: '0%', scale: 1, duration: 1.4, ease: 'power4.out' },
      '0'
    )
    tl.fromTo(
      toRef.current,
      { opacity: 0, x: '-8vw', scale: 0.8 },
      { opacity: 1, x: '0%', scale: 1, duration: 1.4, ease: 'power4.out' },
      '0'
    )
    tl.fromTo(
      scrollIndicatorRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 1.3, ease: 'power4.out' },
      '0'
    )
  }, [canTapped, holoComplete, setCanTapped, setLoaded])

  // Scroll-driven parallax (only after loaded)
  useEffect(() => {
    if (!isLoaded || hasScrollSetup.current) return
    hasScrollSetup.current = true

    const ctx = gsap.context(() => {
      gsap.to('.hero-inner', {
        y: -120,
        opacity: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 1,
        },
      })
    }, sectionRef)


    return () => ctx.revert()
  }, [isLoaded])

  return (
    <section
      id="home"
      ref={sectionRef}
      className={`hero ${!canTapped ? 'hero--intro' : ''}`}
      onClick={!canTapped && holoComplete ? handleTap : undefined}
    >

      {/* Main layout container */}
      <div className="hero-inner">

        {/* ── Middle row: LEFT TEXT | CAN SPACE | RIGHT TEXT ── */}
        <div className="hero-center-row">

          {/* FROM / CAFFEINE — left of can */}
          <div ref={fromRef} className="hero-side-text hero-side-left">
            <div className="hero-fluid-text-wrap hero-fluid-text-left">
              <FluidText
                lines={[
                  { text: 'FROM', color: '#FFFFFF' },
                  { text: 'CAFFEINE', color: '#C8FFFF', glow: 'rgba(200, 255, 255, 0.35)' },
                ]}
                fontFamily="'Syncopate', sans-serif"
                fontWeight="700"
                fontSize={72}
                letterSpacing={2}
                lineHeight={1.05}
                textAlign="right"
              />
            </div>
          </div>

          {/* Can placeholder — the 3D canvas sits behind, this reserves space */}
          <div className="hero-can-space" />

          {/* TO / CREATION — right of can */}
          <div ref={toRef} className="hero-side-text hero-side-right">
            <div className="hero-fluid-text-wrap hero-fluid-text-right">
              <FluidText
                lines={[
                  { text: 'TO', color: '#FFFFFF' },
                  { text: 'CREATION', color: '#C8FFFF', glow: 'rgba(200, 255, 255, 0.35)' },
                ]}
                fontFamily="'Syncopate', sans-serif"
                fontWeight="700"
                fontSize={72}
                letterSpacing={2}
                lineHeight={1.05}
                textAlign="left"
              />
            </div>
          </div>
        </div>



        {/* ── Bottom Content Wrapper (absolutely positioned below the can) ── */}
        <div className="hero-bottom-wrapper">
          {/* ── TAP THE CAN. text ── */}
          <div
            ref={tapTextRef}
            className={`hero-tap-text ${showTapPrompt && !isLoaded ? 'visible' : ''}`}
          >
            <DecryptText text="TAP THE CAN" trigger={showTapPrompt} />
          </div>

          {/* ── Scroll Down Indicator ── */}
          <div
            ref={scrollIndicatorRef}
            className="hero-scroll-indicator"
            onClick={handleScrollDown}
          >
            <span className="hero-scroll-text">SCROLL DOWN</span>
            <div className="hero-scroll-track">
              <motion.div
                className="hero-scroll-dot"
                animate={{
                  y: [0, 34],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}
