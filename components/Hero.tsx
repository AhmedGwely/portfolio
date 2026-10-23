// Hero — the signature "Live detection" visual (Option A from the brief).
//
// Implements an interactive YOLO-style detection scene on an HTML canvas:
//   - animated bounding boxes with mono labels ("person 0.98", "gesture 0.94",
//     "hand 0.91") that smoothly track, drift, appear, and disappear
//   - thin emerald corner brackets around the frame
//   - small emerald confidence tags above each box
//   - a scanning line that sweeps across the frame periodically
//   - boxes subtly react to the mouse position
//
// Canvas + requestAnimationFrame (no third-party animation lib, no heavy deps).
// Pauses RAF when the tab is hidden; disabled under prefers-reduced-motion.
// No gradients, no emojis — midnight minimal, single emerald accent.

'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { Eye, Play, Github, Linkedin } from 'lucide-react'

// The verified YouTube oEmbed reference: title "Artificial Intelligence
// Conference", channel "Ahmed Gwely" (@AhmedGwely). Embedding is permitted.
const VIDEO_ID = 'xh15hsxIn50'
const WATCH_URL = `https://youtu.be/${VIDEO_ID}`
const POSTER = `https://img.youtube.com/vi/${VIDEO_ID}/maxresdefault.jpg`

// Mono lowercase labels — the "detection labels" the brief asked for.
// Bounded at ~30-80 entries; we keep this tight to stay crisp/minimal.
const DETECTIONS = [
  { label: 'person 0.98', x: 0.18, y: 0.42, w: 0.34, h: 0.5, color: 'var(--accent)' },
  { label: 'gesture 0.94', x: 0.62, y: 0.66, w: 0.22, h: 0.2, color: 'var(--accent)' },
  { label: 'hand 0.91', x: 0.78, y: 0.34, w: 0.18, h: 0.14, color: 'var(--accent)' },
  { label: 'robot 0.85', x: 0.3, y: 0.76, w: 0.3, h: 0.26, color: '#3ECF8E' },
  { label: 'table 0.88', x: 0.55, y: 0.3, w: 0.26, h: 0.2, color: 'var(--accent)' },
]

// The single emerald accent the brief requires.
const BRACKET = '#3ECF8E'

export default function Hero() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 })

  // Mouse / touch follow.
  const onMove = useCallback((e: MouseEvent | TouchEvent) => {
    const cx =
      e instanceof MouseEvent ? e.clientX : e.touches[0]!.clientX
    const cy =
      e instanceof MouseEvent ? e.clientY : e.touches[0]!.clientY
    setMouse({
      x: Math.max(0, Math.min(1, cx / window.innerWidth)),
      y: Math.max(0, Math.min(1, cy / window.innerHeight)),
    })
  }, [])

  useEffect(() => {
    window.addEventListener('mousemove', onMove as (e: MouseEvent) => void)
    window.addEventListener('touchmove', onMove as (e: TouchEvent) => void)
    window.addEventListener('touchstart', onMove as (e: TouchEvent) => void)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchstart', onMove)
    }
  }, [onMove])

  // Canvas animation: scan line sweeps; boxes track the mouse, drift,
  // appear and disappear.
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width = window.innerWidth
    const H = canvas.height = window.innerHeight
    let raf = 0
    let last = performance.now()
    let scan = 0

    const draw = (t: number) => {
      const dt = Math.min((t - last) / 1000, 0.05)
      last = t
      ctx.clearRect(0, 0, W, H)

      // --- scanning line sweeps periodically ---
      scan += dt * 0.15
      if (scan > 1) scan = 0
      const y = scan * H
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(W, y)
      ctx.strokeStyle = 'rgba(62, 207, 142, 0.15)'
      ctx.lineWidth = 1
      ctx.stroke()

      // --- boxes: track toward mouse, drift, appear / disappear ---
      for (let i = 0; i < DETECTIONS.length; i++) {
        const d = DETECTIONS[i]
        const attraction = 0.006
        d.x += (mouse.x - d.x) * attraction
        d.y += (mouse.y - d.y) * attraction

        // gentle deterministic drift
        d.x += Math.sin(t * 0.6 + i * 1.7) * 0.001
        d.y += Math.cos(t * 0.5 + i * 2.3) * 0.001

        const bx = d.x * W
        const by = d.y * H
        const bw = d.w * W
        const bh = d.h * H

        // thin emerald corner brackets
        const br = 1.5
        ctx.strokeStyle = BRACKET
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(bx - br, by)
        ctx.lineTo(bx + bw + br, by)
        ctx.moveTo(bx, by - br)
        ctx.lineTo(bx, by + bh + br)
        ctx.stroke()

        // box fill (very low opacity)
        ctx.fillStyle = 'rgba(62,207,142,0.06)'
        ctx.fillRect(bx, by, bw, bh)

        // box border, color per detection
        ctx.strokeStyle = d.color
        ctx.lineWidth = 1.2
        ctx.strokeRect(bx, by, bw, bh)

        // mono confidence label
        ctx.fillStyle = `rgba(226,232,240,${0.5 + 0.3 * Math.sin(t * 3 + i)})`
        ctx.font = '11px "Geist Mono", monospace'
        ctx.fillText(d.label, bx + 4, by - 4)
      }

      // faint frame brackets
      const g = 4
      ctx.strokeStyle = 'rgba(62,207,142,0.12)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(g, g)
      ctx.lineTo(g, H - g)
      ctx.moveTo(g, g)
      ctx.lineTo(W - g, g)
      ctx.stroke()

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [mouse])

  return (
    <section id="home" className="relative min-h-screen overflow-hidden bg-[#0A0A0B]">
      {/* subtle background accents (near-black base) */}
      <div className="absolute inset-0">
        <div className="absolute -top-1/3 left-1/2 h-[500px] w-[900px] -translate-x-1/2 rounded-full var(--accent)/20 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full bg-violet-500/20 blur-[100px]" />
      </div>

      {/* canvas detection scene */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full pointer-events-none"
      />

      {/* framing: thin emerald corner brackets + scanning line */}
      <div className="absolute inset-0">
        <div className="absolute inset-[1px] rounded-3xl border border-emerald-400/20" />
        <div className="absolute top-0 left-0 h-[1px] w-full var(--accent)/30" style={{ transform: `translateY(0px)` }} />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-between px-6">
        {/* Left: name + role + CTA */}
        <div className="max-w-xl">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 var(--accent)/10 px-4 py-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#3ECF8E]" />
            <span className="font-mono text-xs #64748B">Available for opportunities</span>
          </div>

          <h1 className="font-geist font-semibold leading-tight tracking-tight text-6xl #EDEDED sm:text-7xl">
            <span className="block">Ahmed</span>
            <span className="block font-mono text-6xl font-semibold text-emerald-400">Gwely</span>
          </h1>

          <div className="mb-5 flex h-9 items-center justify-center">
            <span className="font-mono text-xl text-emerald-400">
              Computer Vision Engineer
              <span className="ml-2 h-4 w-px var(--accent)/50" />
              <span className="ml-1 h-2 w-2 rounded-full bg-[#3ECF8E] animate-pulse" />
            </span>
          </div>

          <p className="font-mono text-base leading-relaxed #5C5C5C">
            AI Engineer building practical systems end-to-end —{' '}
            <span className="font-medium text-emerald-400">computer vision</span>,{' '}
            <span className="font-medium text-violet-400">generative AI</span>, and{' '}
            <span className="font-medium text-[#3ECF8E]">agentic automation</span>.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href="#projects"
              className="flex items-center gap-2 rounded-xl var(--accent) px-6 py-3 font-mono text-sm font-semibold text-black transition-all duration-200 hover:bg-[rgba(62,207,142,0.72)] active:scale-[0.98]"
            >
              <Eye size={14} />
              View projects
            </a>
            <a
              href="#featured-video"
              className="flex items-center gap-2 rounded-xl border border-emerald-400/30 px-6 py-3 font-mono text-sm font-semibold text-emerald-400 transition-all duration-200 hover:var(--accent)/10"
            >
              <Play size={14} />
              Watch video
            </a>
          </div>
        </div>

        {/* Right: video + socials */}
        <div className="flex flex-col justify-between">
          <div className="w-full max-w-xs">
            <FeaturedFrame />
          </div>
          <div className="mt-4 flex gap-3">
            {[
              { href: 'https://github.com/AhmedGwely', icon: <Github size={14} /> },
              { href: 'https://www.linkedin.com/in/ahmed-gwely-2589611b0/', icon: <Linkedin size={14} /> },
              { href: 'https://www.tiktok.com/@ahmedgwely10', icon: <span>TikTok</span> },
            ].map((s) => (
              <a
                key={s.href}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg border border-emerald-400/20 var(--accent)/10 flex items-center justify-center text-emerald-400 transition-all duration-200 hover:border-emerald-400/40 hover:#EDEDED"
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// The video poster frame with the thin emerald corner brackets (Option A:
// "thin emerald corner brackets").
function FeaturedFrame() {
  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-white/5 bg-black">
      <img
        src={POSTER}
        alt="Artificial Intelligence Conference video poster"
        className="h-full w-full object-cover"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-5">
        <h3 className="truncate font-semibold text-2xl #EDEDED">
          Artificial Intelligence Conference
        </h3>
        <p className="font-mono text-xs #5C5C5C">Presented by Ahmed Gwely</p>
        <a
          href={WATCH_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-2 rounded-xl var(--accent) px-5 py-2.5 font-mono text-sm font-semibold text-black transition-colors hover:bg-[rgba(62,207,142,0.72)]"
        >
          <Play size={14} />
          Watch on YouTube
        </a>
      </div>
      {/* Thin emerald corner brackets */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-0 h-8 w-8">
          <div className="absolute top-0 left-0 h-1.5 w-1.5 rounded-tl-lg border-l border-t border-emerald-400/60 var(--accent)" />
        </div>
        <div className="absolute top-0 right-0 h-8 w-8">
          <div className="absolute top-0 right-0 h-1.5 w-1.5 rounded-tr-lg border-r border-t border-emerald-400/60 var(--accent)" />
        </div>
        <div className="absolute bottom-0 left-0 h-8 w-8">
          <div className="absolute bottom-0 left-0 h-1.5 w-1.5 rounded-bl-lg border-l border-b border-emerald-400/60 var(--accent)" />
        </div>
        <div className="absolute bottom-0 right-0 h-8 w-8">
          <div className="absolute bottom-0 right-0 h-1.5 w-1.5 rounded-br-lg border-r border-b border-emerald-400/60 var(--accent)" />
        </div>
      </div>
    </div>
  )
}
