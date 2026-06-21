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
