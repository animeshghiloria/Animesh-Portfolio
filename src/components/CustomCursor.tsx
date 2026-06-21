import { useEffect, useRef } from 'react'
import { useStore } from '../store/useStore'

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null)
  const trailRef = useRef<HTMLDivElement>(null)
  const setMousePosition = useStore((s) => s.setMousePosition)

  useEffect(() => {
    const cursor = cursorRef.current
    const trail = trailRef.current
    if (!cursor || !trail) return

    let mouseX = 0
    let mouseY = 0
    let trailX = 0
    let trailY = 0
    let isCursorLoopActive = false

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY

      // Normalized mouse position (-1 to 1)
      const nx = (e.clientX / window.innerWidth) * 2 - 1
      const ny = -(e.clientY / window.innerHeight) * 2 + 1
      setMousePosition({ x: nx, y: ny })

      cursor.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`
      startCursorLoop()
    }

    const animate = () => {
      const dx = mouseX - trailX
      const dy = mouseY - trailY

      trailX += dx * 0.15
      trailY += dy * 0.15
      trail.style.transform = `translate3d(${trailX}px, ${trailY}px, 0)`

      // If trail has caught up to the cursor, stop loop
      if (Math.abs(dx) < 0.05 && Math.abs(dy) < 0.05) {
        trailX = mouseX
        trailY = mouseY
        trail.style.transform = `translate3d(${trailX}px, ${trailY}px, 0)`
        isCursorLoopActive = false
        return
      }

      requestAnimationFrame(animate)
    }

    const startCursorLoop = () => {
      if (!isCursorLoopActive) {
        isCursorLoopActive = true
        requestAnimationFrame(animate)
      }
    }

    const handleMouseEnterInteractive = () => {
      cursor.classList.add('cursor-hover')
      trail.classList.add('trail-hover')
    }

    const handleMouseLeaveInteractive = () => {
      cursor.classList.remove('cursor-hover')
      trail.classList.remove('trail-hover')
    }

    window.addEventListener('mousemove', handleMouseMove)
    startCursorLoop()

    // Add hover detection for interactive elements
    const interactives = document.querySelectorAll('a, button, .project-card, .tech-capsule, .contact-item')
    interactives.forEach(el => {
      el.addEventListener('mouseenter', handleMouseEnterInteractive)
      el.addEventListener('mouseleave', handleMouseLeaveInteractive)
    })

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      interactives.forEach(el => {
        el.removeEventListener('mouseenter', handleMouseEnterInteractive)
        el.removeEventListener('mouseleave', handleMouseLeaveInteractive)
      })
    }
  }, [setMousePosition])

  // Don't show on touch devices
  if (typeof window !== 'undefined' && 'ontouchstart' in window) {
    return null
  }

  return (
    <>
      <div ref={cursorRef} className="custom-cursor" />
      <div ref={trailRef} className="custom-cursor-trail" />
    </>
  )
}
