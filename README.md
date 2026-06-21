# ⚡ ANIMESH | From Caffeine To Creation

A premium, interactive 3D portfolio combining dark-cyber aesthetics, high-performance animations, and tactile design systems. Inspired by the textured silver and neon cyan branding of **Monster Energy Zero Ultra**.

---

## ✦ The Concept

This is not a traditional static portfolio. It is a dynamic 3D experience designed to sit at the intersection of raw performance and gothic cyberpunk sigilism. Every interaction is tied to scroll and tap triggers, dragging the viewer into a highly tailored developer environment.

---

## ⚙️ Tech Stack

- **Core**: React 19, TypeScript, Vite
- **3D Graphics**: WebGL / Three.js
- **Styling**: Modern CSS with custom design tokens (Monster-inspired neon cyan `--accent` + chrome silver gradients)
- **Deployment**: Vercel (clean URLs, optimized routing)

---

## 🛠️ The Arsenal (Libraries & Modules)

### 3D & Shaders
* **`@react-three/fiber` & `@react-three/drei`**
  Renders the interactive 3D soda can scene directly in the React DOM tree. Handles camera controls, custom lighting setups, and environmental mapping.
* **`three`**
  The underlying WebGL engine handling materials, geometries, and renderer logic.
* **`@react-three/postprocessing`**
  Injects cinematic effects: holographic distortions, subtle grain overlays, chromatic aberration, and neon glows.

### Motion & Physics
* **`gsap` (GreenSock Animation Platform) & `ScrollTrigger`**
  Drives the scroll-bound 3D animations, pinning sections and morphing the 3D assets smoothly as the user navigates through the page.
* **`framer-motion` & `motion`**
  Powers fluid entrance animations, micro-interactions, custom cursor tracking, and spring-physics page elements.
* **`lenis`**
  Provides unified, smooth inertial scrolling across platforms, syncing perfectly with the GSAP ticker for a stutter-free experience.

### State & Architecture
* **`zustand`**
  Orchestrates application state (such as 3D asset loaded states, scroll progresses, and navigation triggers) with minimal re-renders.

---

## 🚀 Setting Up the Lab

To run this build locally:

### 1. Clone & Install
```bash
git clone https://github.com/animeshghiloria/Animesh-Portfolio.git
cd Animesh-Portfolio
npm install
```

### 2. Launch Dev Environment
```bash
npm run dev
```

### 3. Production Build
```bash
npm run build
```

---

## 📐 Architecture Highlights

* **Critical CSS Loading**: Inline critical background configurations block white-flash rendering before components paint.
* **Ambient Glow System**: Custom CSS variables mapping neon cyan glows (`#C8FFFF`) and responsive breakpoints optimized for performance on mobile viewports.
* **Responsive 3D Canvas**: The Three.js canvas dynamically scales viewport dimensions, adjusting model scales based on device profiles.
