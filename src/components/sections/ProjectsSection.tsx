import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { PROJECTS } from '../../utils/constants'

gsap.registerPlugin(ScrollTrigger)

export function ProjectsSection() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.projects-header',
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
        '.project-card',
        { y: 80, opacity: 0, rotateX: 10 },
        {
          y: 0,
          opacity: 1,
          rotateX: 0,
          duration: 1,
          stagger: 0.2,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.projects-grid',
            start: 'top 75%',
            toggleActions: 'play none none reverse',
          },
        }
      )
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section id="projects" ref={sectionRef} className="section projects">
      <h2 className="projects-header">
        ENERGY CONVERTED <span className="text-accent">INTO PRODUCTS</span>
      </h2>
      <p className="projects-subheader">POWERED BY CAFFEINE AND CODE</p>

      <div className="projects-grid">
        {PROJECTS.map((project, i) => (
          <ProjectCard key={i} project={project} index={i} />
        ))}
      </div>
    </section>
  )
}

function ProjectCard({ project, index }: { project: typeof PROJECTS[number]; index: number }) {
  const cardRef = useRef<HTMLAnchorElement>(null)

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const card = cardRef.current
    if (!card) return
    const rect = card.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    card.style.transform = `perspective(1000px) rotateX(${y * -10}deg) rotateY(${x * 10}deg)`
  }

  const handleMouseLeave = () => {
    if (cardRef.current) {
      cardRef.current.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)'
    }
  }



  return (
    <a
      ref={cardRef as any}
      className="project-card"
      href={project.link}
      target="_blank"
      rel="noopener noreferrer"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg)',
        textDecoration: 'none',
        display: 'block',
        color: 'inherit'
      }}
    >
      <div
        className="project-card-visual"
        style={{ background: project.gradient }}
      >
        <img
          src={project.image}
          alt={project.title}
          className="project-card-image"
          loading="lazy"
        />
        <div className="project-card-image-overlay" />
        <div className="project-card-number">0{index + 1}</div>
      </div>

      <div className="project-card-content">
        <h3 className="project-card-title">{project.title}</h3>
        <p className="project-card-subtitle">{project.subtitle}</p>

        {project.siteDisplay && (
          <div className="project-card-site">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="12" height="12">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7-7l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7 7l1.71-1.71" />
            </svg>
            <span className="project-card-site-url">{project.siteDisplay}</span>
          </div>
        )}

        <p className="project-card-desc">{project.description}</p>
        <div className="project-card-tags">
          {project.tags.map((tag, ti) => (
            <span key={ti} className="project-card-tag">{tag}</span>
          ))}
        </div>
      </div>

      <div className="project-card-shine" />
    </a>
  )
}
