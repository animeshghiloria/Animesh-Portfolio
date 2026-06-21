import { useEffect, useRef, useCallback } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useStore } from './store/useStore'
import { Navbar } from './components/Navbar'
import { FrostedUltraBackground } from './components/FrostedUltraBackground'
import { Scene } from './three/Scene'
import { HeroSection } from './components/sections/HeroSection'
import { AboutSection } from './components/sections/AboutSection'
import { TechStackSection } from './components/sections/TechStackSection'
import { ProjectsSection } from './components/sections/ProjectsSection'
import { ContactSection } from './components/sections/ContactSection'
import './styles/index.css'
import './styles/sections.css'
import './styles/animations.css'

gsap.registerPlugin(ScrollTrigger)

function App() {
  const isLoaded = useStore((s) => s.isLoaded)
  const setScrollProgress = useStore((s) => s.setScrollProgress)
  const setLenis = useStore((s) => s.setLenis)
  const lenisRef = useRef<Lenis | null>(null)

  const canTapped = useStore((s) => s.canTapped)
  const isMuted = useStore((s) => s.isMuted)
  const setIsMuted = useStore((s) => s.setIsMuted)
  
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const muteVolumeFactorRef = useRef({ value: 1 })

  // Audio Playback & Time-based Fade
  useEffect(() => {
    if (canTapped) {
      const audio = new Audio('/under-your-spell.mp3')
      audio.loop = true
      audio.volume = 0 // start at 0 for fade-in
      audioRef.current = audio

      const targetVolume = 0.75
      const fadeInDuration = 3 // seconds
      const fadeOutDuration = 5 // seconds

      const handleTimeUpdate = () => {
        const currentTime = audio.currentTime
        const duration = audio.duration
        if (!duration) return

        let trackFadeFactor = 1
        if (currentTime < fadeInDuration) {
          trackFadeFactor = currentTime / fadeInDuration
        } else if (duration - currentTime < fadeOutDuration) {
          trackFadeFactor = (duration - currentTime) / fadeOutDuration
        }

        const currentMuteFactor = muteVolumeFactorRef.current.value
        const computedVolume = targetVolume * trackFadeFactor * currentMuteFactor
        audio.volume = Math.max(0, Math.min(computedVolume, 1))
      }

      audio.addEventListener('timeupdate', handleTimeUpdate)
      
      // Attempt playback
      audio.play().catch((err) => {
        console.warn('Audio playback blocked by autoplay policy:', err)
      })

      return () => {
        audio.removeEventListener('timeupdate', handleTimeUpdate)
        audio.pause()
        audioRef.current = null
      }
    }
  }, [canTapped])

  // Smooth Mute/Unmute Fade
  useEffect(() => {
    if (!audioRef.current) return

    gsap.to(muteVolumeFactorRef.current, {
      value: isMuted ? 0 : 1,
      duration: 1.0,
      ease: 'power1.out',
      onUpdate: () => {
        if (audioRef.current) {
          const audio = audioRef.current
          const currentTime = audio.currentTime
          const duration = audio.duration
          
          const targetVolume = 0.75
          const fadeInDuration = 3
          const fadeOutDuration = 5
          
          let trackFadeFactor = 1
          if (duration) {
            if (currentTime < fadeInDuration) {
              trackFadeFactor = currentTime / fadeInDuration
            } else if (duration - currentTime < fadeOutDuration) {
              trackFadeFactor = (duration - currentTime) / fadeOutDuration
            }
          }
          
          const computedVolume = targetVolume * trackFadeFactor * muteVolumeFactorRef.current.value
          audio.volume = Math.max(0, Math.min(computedVolume, 1))
        }
      }
    })
  }, [isMuted])

  // Block scroll until the can is tapped
  useEffect(() => {
    if (!isLoaded) {
      document.body.style.overflow = 'hidden'
      lenisRef.current?.stop()
    } else {
      document.body.style.overflow = ''
      lenisRef.current?.start()
    }
    return () => {
      document.body.style.overflow = ''
      lenisRef.current?.start()
    }
  }, [isLoaded])

  const handleScroll = useCallback(() => {
    const scrollTop = window.scrollY
    const docHeight = document.documentElement.scrollHeight - window.innerHeight
    const progress = docHeight > 0 ? scrollTop / docHeight : 0
    setScrollProgress(Math.min(Math.max(progress, 0), 1))
  }, [setScrollProgress])

  useEffect(() => {
    // Initialize Lenis smooth scroll
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 2,
    })
    lenisRef.current = lenis
    setLenis(lenis)

    if (!isLoaded) {
      lenis.stop()
    }

    // Sync Lenis with GSAP ScrollTrigger
    lenis.on('scroll', () => {
      ScrollTrigger.update()
      handleScroll()
    })

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000)
    })
    gsap.ticker.lagSmoothing(0)

    return () => {
      lenis.destroy()
      setLenis(null)
      gsap.ticker.remove(lenis.raf as unknown as gsap.TickerCallback)
    }
  }, [handleScroll, isLoaded, setLenis])

  return (
    <>
      {/* Frosted Zero Ultra Background */}
      <FrostedUltraBackground />

      {/* 3D Canvas - fixed background */}
      <Scene />

      {/* Navigation */}
      <Navbar />

      {/* Floating Sound Controller */}
      <button
        className={`sound-controller glass ${canTapped ? 'visible' : ''} ${isMuted ? 'muted' : ''}`}
        onClick={() => setIsMuted(!isMuted)}
        aria-label={isMuted ? 'Unmute music' : 'Mute music'}
      >
        <div className="sound-bars">
          <div className="bar" />
          <div className="bar" />
          <div className="bar" />
          <div className="bar" />
        </div>
      </button>

      {/* Main scrollable content */}
      <main className="main-content">
        <HeroSection />
        <AboutSection />
        <TechStackSection />
        <ProjectsSection />
        <ContactSection />
      </main>
    </>
  )
}

export default App
