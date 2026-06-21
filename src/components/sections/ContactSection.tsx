import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion'
import { FluidText } from '../FluidText'

gsap.registerPlugin(ScrollTrigger)

const CYBER_CHARS = '!@#$%^&*()_+~`|}{[]:;?><,./-=XYZ0123456789'

function DecryptText({ text, trigger }: { text: string; trigger: boolean }) {
  const [displayText, setDisplayText] = useState(text)

  useEffect(() => {
    if (!trigger) {
      setDisplayText(text)
      return
    }

    let iterations = 0
    const targetLength = text.length
    const interval = setInterval(() => {
      setDisplayText(
        text
          .split('')
          .map((char, index) => {
            if (char === ' ' || char === '/' || char === '.' || char === '@' || char === ':' || char === '-') return char
            if (index < iterations) {
              return text[index]
            }
            return CYBER_CHARS[Math.floor(Math.random() * CYBER_CHARS.length)]
          })
          .join('')
      )

      if (iterations >= targetLength) {
        clearInterval(interval)
      }
      iterations += 1
    }, 25)

    return () => clearInterval(interval)
  }, [text, trigger])

  return <span>{displayText}</span>
}

const CONTACT_LINKS = [
  {
    label: 'EMAIL',
    value: 'animeshghiloria@gmail.com',
    href: 'mailto:animeshghiloria@gmail.com',
    isCopy: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="32" height="32">
        <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    label: 'LINKEDIN',
    value: 'linkedin.com/in/animeshghiloria',
    href: 'https://www.linkedin.com/in/animeshghiloria',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  {
    label: 'GITHUB',
    value: 'github.com/animeshghiloria',
    href: 'https://github.com/animeshghiloria',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
        <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
      </svg>
    ),
  },
  {
    label: 'INSTAGRAM',
    value: 'instagram.com/themeshwithin',
    href: 'https://www.instagram.com/themeshwithin',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="32" height="32">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    ),
  },
  {
    label: 'DISCORD',
    value: 'discord/themeshwithin',
    href: 'https://discord.com/channels/1304106297599328413',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
        <path d="M19.27 4.73a9.92 9.92 0 0 0-4.87-1.51l-.22.48c1.6.48 3.12 1.24 4.51 2.27A10.2 10.2 0 0 0 12.24 4h-.48a10.2 10.2 0 0 0-6.45 1.97C6.7 4.94 8.22 4.18 9.82 3.7l-.22-.48a9.92 9.92 0 0 0-4.87 1.51C1.98 9.3 1.15 13.9.75 18.37A19.8 19.8 0 0 0 6.64 21.4c.5-.7.93-1.44 1.29-2.22-.65-.25-1.26-.57-1.84-.96l.37-.3a13.3 13.3 0 0 0 11.08 0l.37.3a9.8 9.8 0 0 1-1.84.96c.36.78.79 1.52 1.29 2.22a19.8 19.8 0 0 0 5.89-3.03c-.4-4.47-1.23-9.07-3.98-13.64zM8.5 14c-.83 0-1.5-.75-1.5-1.67 0-.92.67-1.67 1.5-1.67s1.5.75 1.5 1.67c0 .92-.67 1.67-1.5 1.67zm7 0c-.83 0-1.5-.75-1.5-1.67 0-.92.67-1.67 1.5-1.67s1.5.75 1.5 1.67c0 .92-.67 1.67-1.5 1.67z" />
      </svg>
    ),
  },
  {
    label: 'GOOGLE DEV',
    value: 'developers.google.com/u/100941...',
    href: 'https://me.developers.google.com/u/100941522310018634728',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
        <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114A5.955 5.955 0 018 12.63c0-3.3 2.67-5.97 5.99-5.97 1.49 0 2.85.55 3.9 1.455l3.078-3.078C19.112 3.328 16.74 2 13.99 2 8.47 2 4 6.47 4 12c0 5.53 4.47 10 9.99 10 5.76 0 9.56-4.05 9.56-9.72 0-.66-.06-1.3-.17-1.995H12.24z" />
      </svg>
    ),
  },
]

function fallbackCopyText(text: string) {
  const textArea = document.createElement('textarea')
  textArea.value = text
  textArea.style.top = '0'
  textArea.style.left = '0'
  textArea.style.position = 'fixed'
  document.body.appendChild(textArea)
  textArea.focus()
  textArea.select()
  try {
    document.execCommand('copy')
  } catch (err) {
    console.error('Fallback copy failed', err)
  }
  document.body.removeChild(textArea)
}

function ContactCard({ link }: { link: typeof CONTACT_LINKS[number] }) {
  const [isHovered, setIsHovered] = useState(false)
  const [isCopied, setIsCopied] = useState(false)

  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [10, -10]), { damping: 25, stiffness: 220 })
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-10, 10]), { damping: 25, stiffness: 220 })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    x.set((mouseX / width) - 0.5)
    y.set((mouseY / height) - 0.5)

    e.currentTarget.style.setProperty('--mouse-x', `${mouseX}px`)
    e.currentTarget.style.setProperty('--mouse-y', `${mouseY}px`)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    x.set(0)
    y.set(0)
  }

  const handleMouseEnter = () => {
    setIsHovered(true)
  }

  const handleClick = (e: React.MouseEvent) => {
    if (link.isCopy) {
      e.preventDefault()
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(link.value)
            .then(() => {
              setIsCopied(true)
              setTimeout(() => setIsCopied(false), 2000)
            })
            .catch(() => {
              fallbackCopyText(link.value)
              setIsCopied(true)
              setTimeout(() => setIsCopied(false), 2000)
            })
        } else {
          fallbackCopyText(link.value)
          setIsCopied(true)
          setTimeout(() => setIsCopied(false), 2000)
        }
      } catch (err) {
        setIsCopied(true)
        setTimeout(() => setIsCopied(false), 2000)
      }
    }
  }

  const cardContent = (
    <>
      <motion.div
        className="contact-item glass"
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        <div className="contact-card-glare" />

        <div className="contact-icon" style={{ transform: 'translateZ(30px)' }}>
          {link.icon}
        </div>

        <span className="contact-label" style={{ transform: 'translateZ(15px)' }}>
          <DecryptText text={link.label} trigger={isHovered} />
        </span>

        <span className="contact-value" style={{ transform: 'translateZ(10px)' }}>
          <DecryptText text={link.value} trigger={isHovered} />
        </span>

        <div className="contact-energy-surge" />
      </motion.div>

      <AnimatePresence>
        {isCopied && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            className="copied-badge"
            style={{ transform: 'translateZ(25px)' }}
          >
            <span>SYSTEM ADDRESS COPIED</span>
            <div className="copied-badge-glitch" />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )

  if (link.isCopy) {
    return (
      <div className="contact-card-wrapper" style={{ perspective: 1000 }}>
        {cardContent}
      </div>
    )
  }

  return (
    <a
      href={link.href}
      target="_blank"
      rel="noopener noreferrer"
      className="contact-card-wrapper"
      style={{ perspective: 1000, textDecoration: 'none' }}
    >
      {cardContent}
    </a>
  )
}

export function ContactSection() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.contact-header',
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
        '.contact-card-wrapper',
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.12,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.contact-grid',
            start: 'top 75%',
            toggleActions: 'play none none reverse',
          },
        }
      )
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section id="contact" ref={sectionRef} className="section contact">
      <h2 className="contact-header">
        LET'S BUILD SOMETHING <span className="text-accent">POWERFUL</span>
      </h2>
      <p className="contact-subheader">READY TO COLLABORATE</p>

      <div className="contact-grid">
        {CONTACT_LINKS.map((link, i) => (
          <ContactCard key={i} link={link} />
        ))}
      </div>

      <footer className="footer">
        <div className="footer-line" />
        <div className="footer-text footer-text--fluid">
          <span className="footer-name">ANIMESH —</span>
          <div className="fluid-text-wrapper">
            <FluidText
              lines={[{ text: 'FROM CAFFEINE TO CREATION', color: '#707070' }]}
              fontFamily="'Rajdhani', sans-serif"
              fontWeight="600"
              letterSpacing={4}
            />
          </div>
        </div>
        <p className="footer-year">© {new Date().getFullYear()}</p>
      </footer>
    </section>
  )
}
