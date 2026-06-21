import { create } from 'zustand'
import Lenis from 'lenis'

interface PortfolioStore {
  isLoaded: boolean
  setLoaded: (v: boolean) => void
  canTapped: boolean
  setCanTapped: (v: boolean) => void
  holoComplete: boolean
  setHoloComplete: (v: boolean) => void
  loadingProgress: number
  setLoadingProgress: (v: number) => void
  activeSection: number
  setActiveSection: (v: number) => void
  scrollProgress: number
  setScrollProgress: (v: number) => void
  mousePosition: { x: number; y: number }
  setMousePosition: (pos: { x: number; y: number }) => void
  lenis: Lenis | null
  setLenis: (lenis: Lenis | null) => void
  isMuted: boolean
  setIsMuted: (v: boolean) => void
}

export const useStore = create<PortfolioStore>((set) => ({
  isLoaded: false,
  setLoaded: (v) => set({ isLoaded: v }),
  canTapped: false,
  setCanTapped: (v) => set({ canTapped: v }),
  holoComplete: false,
  setHoloComplete: (v) => set({ holoComplete: v }),
  loadingProgress: 0,
  setLoadingProgress: (v) => set({ loadingProgress: v }),
  activeSection: 0,
  setActiveSection: (v) => set({ activeSection: v }),
  scrollProgress: 0,
  setScrollProgress: (v) => set({ scrollProgress: v }),
  mousePosition: { x: 0, y: 0 },
  setMousePosition: (pos) => set({ mousePosition: pos }),
  lenis: null,
  setLenis: (lenis) => set({ lenis }),
  isMuted: false,
  setIsMuted: (v) => set({ isMuted: v }),
}))
