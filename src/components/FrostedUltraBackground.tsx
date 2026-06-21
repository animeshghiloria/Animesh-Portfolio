import { useMemo } from 'react'
import { motion } from 'framer-motion'

export function FrostedUltraBackground() {
  // Config for floating metallic dust/shimmer particles, memoized to prevent jumping on re-renders
  const particles = useMemo(() => {
    return Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      width: Math.random() * 3 + 1,
      height: Math.random() * 3 + 1,
      left: Math.random() * 100,
      top: Math.random() * 100,
      yTravel: -60 - Math.random() * 40,
      duration: Math.random() * 6 + 6,
      delay: Math.random() * 4,
    }))
  }, [])

  return (
    <div className="frosted-bg-container">
      {/* 1. Frosted Can Texture Overlay (Pure SVG noise with fixed xmlns namespace) */}
      <div 
        className="frosted-noise-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* 2. Left Baroque Engraving (Soft Floating & Tracing) */}
      <motion.div 
        animate={{ y: [0, -10, 0], rotate: [0, 0.5, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="frosted-engraving-container frosted-engraving-left"
      >
        <svg viewBox="0 0 100 200" className="frosted-engraving-svg">
          <motion.path 
            d="M0,20 C30,40 10,70 40,90 C70,110 20,150 50,180 C10,130 60,100 20,60 Z" 
            initial={{ pathLength: 0.7 }}
            animate={{ pathLength: [0.7, 1, 0.7] }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          />
          <motion.path 
            d="M10,0 C5,40 45,60 15,110 C55,130 25,180 5,200" 
            initial={{ pathLength: 0.5 }}
            animate={{ pathLength: [0.5, 0.9, 0.5] }}
            transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
          />
        </svg>
      </motion.div>

      {/* 3. Right Baroque Engraving (Mirrored) */}
      <motion.div 
        animate={{ y: [0, 10, 0], rotate: [0, -0.5, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        className="frosted-engraving-container frosted-engraving-right"
      >
        <svg viewBox="0 0 100 200" className="frosted-engraving-svg">
          <motion.path 
            d="M0,20 C30,40 10,70 40,90 C70,110 20,150 50,180 Z" 
            initial={{ pathLength: 0.6 }}
            animate={{ pathLength: [0.6, 1, 0.6] }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          />
        </svg>
      </motion.div>

      {/* 4. Silver Metallic Shimmer Particles */}
      <div className="frosted-shimmer-particles">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="frosted-shimmer-particle"
            style={{
              width: p.width + "px",
              height: p.height + "px",
              left: p.left + "%",
              top: p.top + "%",
            }}
            animate={{
              y: [0, p.yTravel],
              opacity: [0, 0.6, 0],
              scale: [0.8, 1.2, 0.8]
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              ease: "easeInOut",
              delay: p.delay,
            }}
          />
        ))}
      </div>

      {/* 5. Center Core Ambient Ice-Glow */}
      <div className="frosted-ambient-glow" />
    </div>
  )
}

export default FrostedUltraBackground
