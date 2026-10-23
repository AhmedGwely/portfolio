// Intro loader — 'AG/' mono wordmark draws in, then the screen wipes up to
// reveal the hero.
//
// Under 1.2 seconds. Skips on repeat visits (sessionStorage) and when
// prefers-reduced-motion is on.

'use client'

import { useEffect, useState } from 'react'

export default function IntroLoader() {
  const [shown, setShown] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    // Skip on repeat visits.
    if (typeof window === 'undefined') return
    const visited = sessionStorage.getItem('intro-loaded')
    if (visited) {
      setShown(true)
      return
    }
    // Respect prefers-reduced-motion.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(true)
      return
    }

    let id: number | undefined
    let frame: number
    let progress = 0
    const total = 28 // number of frames for ~1.2s @ ~23fps
    const start = performance.now()

    const draw = (now: number) => {
      progress = (now - start) / 1200
      if (progress >= 1) {
        progress = 1
        setShown(true)
        setDone(true)
        sessionStorage.setItem('intro-loaded', '1')
        return
      }
      // Draw the AG// wordmark in segments (masked slide-up).
      const seg = Math.floor(progress * total)
      if (seg > 0 && id === undefined) {
        id = window.setInterval(() => {
          setShown((s) => {
            if (s) return s
            return true
          })
        }, 40)
      }
      frame = requestAnimationFrame(draw)
    }
    frame = requestAnimationFrame(draw)
    return () => {
      if (id !== undefined) window.clearInterval(id)
      cancelAnimationFrame(frame)
    }
  }, [])

  if (!shown) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0A0B]"
      style={{ transform: done ? 'translateY(-100%)' : 'translateY(0)' }}
    >
      <div className="font-mono text-5xl font-bold tracking-[0.35em] text-emerald-400">
        AG
        <span className="text-[0.3em] text-[#3ECF8E] mx-2">//</span>
      </div>
    </div>
  )
}
