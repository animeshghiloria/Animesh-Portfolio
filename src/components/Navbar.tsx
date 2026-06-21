import { useRef } from 'react'
import { useStore } from '../store/useStore'
import { SECTIONS } from '../utils/constants'

export function Navbar() {
  const scrollProgress = useStore((s) => s.scrollProgress)
  const canTapped = useStore((s) => s.canTapped)
  const lenis = useStore((s) => s.lenis)
  const navRef = useRef<HTMLElement>(null)

  const sectionSize = 1 / SECTIONS.length
  const activeIndex = Math.min(
    Math.floor(scrollProgress / sectionSize),
    SECTIONS.length - 1
  )

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      if (lenis) {
        lenis.scrollTo(el)
      } else {
        el.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }

  return (
    <nav ref={navRef} className={`navbar ${canTapped ? 'visible' : ''}`}>
      <div className="navbar-inner">
        <div className="navbar-logo" onClick={() => lenis ? lenis.scrollTo(0) : window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <span className="logo-text">ANIMESH</span>
        </div>

        <div className="navbar-links">
          {SECTIONS.map((section, i) => (
            <button
              key={section}
              className={`navbar-link ${activeIndex === i ? 'active' : ''}`}
              onClick={() => scrollToSection(section)}
            >
              <span className="navbar-link-text">{section.toUpperCase()}</span>
              <span className="navbar-link-line" />
            </button>
          ))}
        </div>

        <div className="navbar-indicator">
          <span className="indicator-progress">
            {Math.round(scrollProgress * 100)}%
          </span>
        </div>
      </div>
    </nav>
  )
}
