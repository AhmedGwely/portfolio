// Motion system + design tokens for the portfolio.
// Applies the "Post-Cody / Make the site alive" brief:
//   - Midnight minimal: near-black base, single emerald accent (#3ECF8E),
//     Geist + Geist Mono, NO gradients, NO emojis.
//   - Every moving element relates to AI / computer vision.
// Shared tokens so every moving element stays consistent.

import { useState, useEffect, useCallback } from 'react'

// ── Design tokens ────────────────────────────────────────────────────────────

export const COLORS = {
  bg: '#0A0A0B', // near-black
  bgPanel: '#111113',
  bgElevated: '#16161A',
  border: '#2A2A2D',
  borderSoft: '#243044',
  text: '#EDEDED',
  textMuted: '#94A3B8',
  textDim: '#64748B',
  accent: '#3ECF8E', // THE single emerald accent
  accentSoft: 'rgba(62,207,142,0.12)',
  accentDim: 'rgba(62,207,142,0.72)',
  accentGlow: 'rgba(62,207,142,0.45)',
  cyan: '#00D4FF', // secondary (only used for non-motion accents)
  violet: '#7C3AED',
} as const

export const FONTS = {
  display: "'Geist', system-ui, -apple-system, sans-serif",
  mono: "'Geist Mono', monospace",
} as const

export const BORDER_RADIUS = {
  sm: '6px',
  md: '10px',
  lg: '14px',
  xl: '20px',
} as const

export const SPACING = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px',
} as const

export const DURATIONS = {
  fast: '150ms',
  default: '250ms',
  slow: '600ms',
  visible: '900ms',
} as const

// brief: cubic-bezier(0.22, 1, 0.36, 1) primary easing
export const EASING = {
  primary: 'cubic-bezier(0.22, 1, 0.36, 1)',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  springSoft: 'cubic-bezier(0.2, 0.85, 0.3, 1)',
} as const

// Stagger values (seconds) for staggered reveals.
export const STAGGER = {
  small: 0.06,
  med: 0.1,
  large: 0.18,
} as const

export const ELEVATION = {
  sm: '0 1px 2px rgba(0,0,0,0.3)',
  md: '0 2px 8px rgba(0,0,0,0.4)',
  lg: '0 6px 20px rgba(0,0,0,0.5)',
  xl: '0 12px 40px rgba(0,0,0,0.6)',
} as const

// Reduced-motion guard — brief: respect prefers-reduced-motion.
export function isReducedMotion(): boolean {
  if (typeof window === 'undefined') return true
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// ── Cursor spotlight / magnetic system (desktop only) ────────────────────────

export type CursorState = {
  x: number
  y: number
  isActive: boolean
}

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

/** Spring-attract offset toward a target, damped each frame — no physics lib. */
export function useSpring(
  from: number,
  to: number,
  damp = 0.12,
  stiffness = 0.06,
): number {
  const [v, setV] = useState(from)
  const reset = useCallback(() => setV(0), [])
  useEffect(() => {
    const id = setInterval(() => {
      const a = (to - v) * stiffness
      setV((prev) => prev + a - v * damp)
    }, 16)
    return () => clearInterval(id)
  }, [to, damp, stiffness, reset])
  return v
}
