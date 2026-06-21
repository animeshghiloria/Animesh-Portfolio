import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SKILLS } from '../../utils/constants'

gsap.registerPlugin(ScrollTrigger)

export function TechStackSection() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.tech-header',
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        }
      )

      gsap.fromTo(
        '.tech-category',
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.2,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.tech-categories',
            start: 'top 75%',
            toggleActions: 'play none none reverse',
          },
        }
      )

      gsap.fromTo(
        '.tech-capsule',
        { scale: 0.8, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.5,
          stagger: 0.05,
          ease: 'back.out(1.7)',
          scrollTrigger: {
            trigger: '.tech-categories',
            start: 'top 70%',
            toggleActions: 'play none none reverse',
          },
        }
      )
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section id="tech" ref={sectionRef} className="section tech-stack">
      <h2 className="tech-header">
        TECH <span className="text-accent">INGREDIENTS</span>
      </h2>
      <p className="tech-subheader">WHAT POWERS THE MACHINE</p>

      <div className="tech-categories">
        {SKILLS.map((category, ci) => (
          <div key={ci} className="tech-category">
            <h3 className="tech-category-title">{category.category}</h3>
            <div className="tech-grid">
              {category.items.map((item, ii) => (
                <div key={ii} className="tech-capsule">
                  <span className="tech-capsule-name">{item}</span>
                  <span className="tech-capsule-glow" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
