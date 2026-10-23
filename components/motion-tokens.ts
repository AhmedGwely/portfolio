// Post-Cody motion system — shared tokens for the portfolio.
// Single emerald accent (var(--accent)), Geist + Geist Mono, no gradients, no emojis.
// Shared values so every moving element stays consistent (brief rule: "Define
// shared motion tokens in one file; reuse them everywhere").

'use client'

import { useState, useEffect, useCallback } from 'react'

// Duration presets (ms): 150 fast, 250 default, 600 slow, 900 visible-only.
export const DUR = {
  fast: 150,
  default: 250,
  slow: 600,
  visible: 900,
} as const

export const EASING = {
  // brief requires cubic-bezier(0.22, 1, 0.36, 1) as the primary easing
  easePrimary: [0.22, 1, 0.36, 1] as const,
  // spring preset for interactive micro-motion (tilt, magnetic)
  spring: [0.2, 0.85, 0.3, 1] as const,
  // slight overshoot for press/hover response
  springSoft: [0.34, 1.56, 0.64, 1] as const,
} as const

export const STAGGER = {
  // brief: stagger children 150ms between, scaled by container in callers
  small: 0.06,
  med: 0.1,
  large: 0.18,
} as const

// Reduced-motion guard. Brief: "Respect prefers-reduced-motion: disable
// parallax, tilt, marquee, loader; show static equivalents." Call this at the
// top of any component that animates per-frame and skip the RAF loop when true.
export function isReducedMotion(): boolean {
  if (typeof window === 'undefined') return true
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Cursor state for the desktop spotlight/magnetic system. */
export type CursorState = {
  x: number
  y: number
  isActive: boolean
}

/** Hook for the cursor state; window-only — used in 'use client' components. */
export function useCursorState(): CursorState {
  const [state, setState] = useState<CursorState>({ x: 0, y: 0, isActive: false })
  useEffect(() => {
    const onMove = (e: MouseEvent) => setState({ x: e.clientX, y: e.clientY, isActive: true })
    const onLeave = () => setState({ x: 0, y: 0, isActive: false })
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseleave', onLeave)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseleave', onLeave)
    }
  }, [])
  return state
}

// Desktop-only guard for cursor-based effects.
export function isCursorDesktop(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(max-width: 768px)').matches === false
}
