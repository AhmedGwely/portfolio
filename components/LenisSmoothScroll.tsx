// Lenis smooth-scroll wrapper (client). Initilizes Lenis and locks anchor
// scrolling so the page scrolls with premium momentum (step 3).
'use client'

import { useEffect } from 'react'
import Lenis from 'lenis'

export default function LenisSmoothScroll() {
  useEffect(() => {
    const lenis = new (Lenis as any)({
      duration: 0.8,
      easing: (t: number) => Math.min(1, t * 1.25),
      smooth: true,
      lerp: 0.08,
      gesture: true,
    })

    // Lenis animates a proxy element, so we need to inform the browser to
    // let Lenis manage scrolling for the window.
    const raf = (time: number) => {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }
    raf(0)

    // Autoplay so Lenis starts scrolling even when tab is not focused.
    lenis.autoplay = true

    // Show a hidden toggle so clicking anchors triggers Lenis.
    const style = document.createElement('style')
    style.textContent = `
      html.lenis, html.lenis body { height: auto; }
      .lenis‑anchor { scroll-behavior: auto; }
    `
    document.head.appendChild(style)

    return () => {
      const el = document.querySelector('style.lenis-anchor')
      if (el) el.remove()
      lenis.destroy()
    }
  }, [])

  return null
}
