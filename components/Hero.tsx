// Hero — identity + CTAs on the left, video card on the right, with a faint
// "live detection" canvas behind the right column only.
//
// Canvas (HTML canvas + requestAnimationFrame, no third-party animation lib):
//   - 4 bounding boxes spawned at well-separated positions with a hard minimum
//     distance so they never overlap
//   - each box is 14-18% of canvas width, drifts slowly and bounces off edges
//   - one mono label per box at its own top-left
//   - canvas size comes from its parent via ResizeObserver + devicePixelRatio
//   - RAF pauses when the tab is hidden or the canvas is scrolled off-screen
//   - disabled entirely under prefers-reduced-motion
//
// No gradients, no emojis - midnight minimal, single emerald accent.

'use client'

import { useEffect, useRef, useState } from 'react'
import { Play, Github, Linkedin, Youtube, ExternalLink, ArrowRight } from 'lucide-react'
import { CtaButtons, BookingModal, MentorshipModal } from './cta'

// Verified via YouTube oEmbed: title "Artificial Intelligence Conference",
// channel "Ahmed Gwely" (@AhmedGwely). Embedding is permitted.
const VIDEO_ID = 'xh15hsxIn50'
const WATCH_URL = `https://youtu.be/${VIDEO_ID}`
const POSTER = `https://img.youtube.com/vi/${VIDEO_ID}/maxresdefault.jpg`

// The rotating specialty line under the role.
const SPECIALTIES = ['Computer Vision', 'Generative AI', 'LLMs and Agents', 'Edge AI']

const ACCENT = 'var(--accent)'

/* --------------------------------------------------------------------------
   Rotating specialty line
   -------------------------------------------------------------------------- */
function SpecialtyRotator() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % SPECIALTIES.length)
    }, 2600)
    return () => clearInterval(id)
  }, [])

  const current = SPECIALTIES[index]

  return (
    <span className="inline-flex h-6 items-center font-mono text-base var(--text-muted)">
      <span
        key={current}
        className="inline-flex animate-[specialty-in_0.45s_var(--ease-primary)] items-center"
      >
        {current}
      </span>
    </span>
  )
}

/* --------------------------------------------------------------------------
   Social row - 4 identical 40px square icon buttons, aria-labelled, no text
   -------------------------------------------------------------------------- */
function TikTokGlyph({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V9.17a8.16 8.16 0 004.77 1.52V7.25a4.85 4.85 0 01-1-.56z" />
    </svg>
  )
}

const SOCIALS = [
  { label: 'GitHub', href: 'https://github.com/AhmedGwely' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/ahmed-gwely-2589611b0/' },
  { label: 'TikTok', href: 'https://www.tiktok.com/@ahmedgwely10' },
  { label: 'YouTube', href: 'https://www.youtube.com/@AhmedGwely' },
] as const

function SocialRow() {
  return (
    <div className="flex items-center gap-3">
      {SOCIALS.map((s) => (
        <a
          key={s.label}
          href={s.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={s.label}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-[rgba(255,255,255,0.08)] var(--text-dim) transition-all duration-200 hover:border-[rgba(62,207,142,0.35)] hover:var(--text)"
        >
          {s.label === 'GitHub' && <Github size={16} />}
          {s.label === 'LinkedIn' && <Linkedin size={16} />}
          {s.label === 'TikTok' && <TikTokGlyph size={16} />}
          {s.label === 'YouTube' && <Youtube size={16} />}
        </a>
      ))}
    </div>
  )
}

/* --------------------------------------------------------------------------
   Video card - 16:9 thumbnail, no text drawn over it, centered round play
   button, caption row BELOW the card.
   -------------------------------------------------------------------------- */
function HeroVideoCard({ onPlay }: { onPlay: () => void }) {
  return (
    <div className="w-full">
      <button
        type="button"
        onClick={onPlay}
        aria-label="Play Artificial Intelligence Conference"
        className="group relative block w-full overflow-hidden rounded-xl border border-[rgba(255,255,255,0.08)] bg-black text-left"
        style={{ aspectRatio: '16/9' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={POSTER}
          alt="Artificial Intelligence Conference video thumbnail"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          loading="lazy"
        />
        {/* Legibility scrim only - no text is drawn over the thumbnail */}
        <span className="absolute inset-0 bg-[rgba(0,0,0,0.18)] transition-opacity duration-300 group-hover:bg-[rgba(0,0,0,0.05)]" />

        <span className="absolute inset-0 flex items-center justify-center">
          <span
            className="flex h-14 w-14 items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-105"
            style={{ background: ACCENT, boxShadow: `0 0 40px ${ACCENT}66` }}
          >
            <Play size={22} className="ml-0.5" fill="var(--bg)" style={{ color: 'var(--bg)' }} />
          </span>
        </span>
      </button>

      {/* Caption row - BELOW the card */}
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="truncate font-body text-sm var(--text)">Artificial Intelligence Conference</span>
        <a
          href={WATCH_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex shrink-0 items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider var(--text-dim) transition-colors hover:var(--text)"
        >
          Watch on YouTube
          <ExternalLink size={12} />
        </a>
      </div>
    </div>
  )
}

/* --------------------------------------------------------------------------
   Detection canvas - 4 well-separated boxes that never overlap
   -------------------------------------------------------------------------- */

// Spawn positions chosen so each box starts in its own quadrant.
const BOX_SPAWNS = [
  { label: 'person 0.98', x: 0.20, y: 0.26, w: 0.16, h: 0.22 },
  { label: 'gesture 0.94', x: 0.74, y: 0.22, w: 0.15, h: 0.20 },
  { label: 'robot 0.85', x: 0.26, y: 0.74, w: 0.18, h: 0.22 },
  { label: 'object 0.91', x: 0.76, y: 0.70, w: 0.16, h: 0.22 },
]

// Hard floor for how far apart two box centres must stay (in canvas fractions).
const MIN_SEPARATION = 0.26

type Box = {
  label: string
  x: number // centre, 0..1
  y: number
  w: number
  h: number
  vx: number
  vy: number
}

function DetectionCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const boxRef = useRef<Box[]>(
    BOX_SPAWNS.map((s) => ({
      label: s.label,
      x: s.x,
      y: s.y,
      w: s.w,
      h: s.h,
      vx: (Math.random() - 0.5) * 0.02,
      vy: (Math.random() - 0.5) * 0.02,
    }))
  )
  const [onScreen, setOnScreen] = useState(true)

  // Pause the RAF loop while the canvas is scrolled out of view.
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return
    const el = canvasRef.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), {
      threshold: 0,
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (!onScreen) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Canvas size comes from its PARENT element, not the window.
    const parent = canvas.parentElement
    if (!parent) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let cssW = 0
    let cssH = 0

    const resize = () => {
      const rect = parent.getBoundingClientRect()
      cssW = Math.max(1, Math.floor(rect.width))
      cssH = Math.max(1, Math.floor(rect.height))
      canvas.width = Math.floor(cssW * dpr)
      canvas.height = Math.floor(cssH * dpr)
      canvas.style.width = `${cssW}px`
      canvas.style.height = `${cssH}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(parent)

    let raf = 0
    let last = performance.now()

    const draw = (t: number) => {
      const dt = Math.min((t - last) / 1000, 0.05)
      last = t

      ctx.clearRect(0, 0, cssW, cssH)

      const boxes = boxRef.current

      for (let i = 0; i < boxes.length; i++) {
        const b = boxes[i]

        // slow drift
        b.x += b.vx * dt
        b.y += b.vy * dt

        // edge bounce (kept inside 0..1)
        const halfW = b.w / 2
        const halfH = b.h / 2
        if (b.x - halfW < 0.02) { b.x = 0.02 + halfW; b.vx = Math.abs(b.vx) }
        else if (b.x + halfW > 0.98) { b.x = 0.98 - halfW; b.vx = -Math.abs(b.vx) }
        if (b.y - halfH < 0.02) { b.y = 0.02 + halfH; b.vy = Math.abs(b.vy) }
        else if (b.y + halfH > 0.98) { b.y = 0.98 - halfH; b.vy = -Math.abs(b.vy) }

        // enforce a minimum distance so boxes never overlap
        for (let j = i + 1; j < boxes.length; j++) {
          const o = boxes[j]
          const dx = o.x - b.x
          const dy = o.y - b.y
          const dist = Math.hypot(dx, dy)
          if (dist < MIN_SEPARATION) {
            const push = (MIN_SEPARATION - dist) / 2
            const nx = dist > 0.0001 ? dx / dist : 1
            const ny = dist > 0.0001 ? dy / dist : 0
            b.x -= nx * push
            b.y -= ny * push
            o.x += nx * push
            o.y += ny * push
            // exchange a little velocity so they keep drifting apart
            const tmp = b.vx
            b.vx = o.vx * 0.6
            o.vx = tmp * 0.6
          }
        }
      }

      for (const b of boxes) {
        const bx = (b.x - b.w / 2) * cssW
        const by = (b.y - b.h / 2) * cssH
        const bw = b.w * cssW
        const bh = b.h * cssH

        // box fill (very low opacity)
        ctx.fillStyle = 'rgba(62,207,142,0.05)'
        ctx.fillRect(bx, by, bw, bh)

        // thin emerald border
        ctx.strokeStyle = 'rgba(62,207,142,0.55)'
        ctx.lineWidth = 1
        ctx.strokeRect(bx, by, bw, bh)

        // corner brackets
        const br = 6
        ctx.strokeStyle = 'rgba(62,207,142,0.9)'
        ctx.lineWidth = 1.4
        ctx.beginPath()
        ctx.moveTo(bx, by + br); ctx.lineTo(bx, by); ctx.lineTo(bx + br, by)
        ctx.moveTo(bx + bw - br, by); ctx.lineTo(bx + bw, by); ctx.lineTo(bx + bw, by + br)
        ctx.moveTo(bx + bw, by + bh - br); ctx.lineTo(bx + bw, by + bh); ctx.lineTo(bx + bw - br, by + bh)
        ctx.moveTo(bx + br, by + bh); ctx.lineTo(bx, by + bh); ctx.lineTo(bx, by + bh - br)
        ctx.stroke()

        // one label per box at its own top-left
        ctx.font = '11px "Geist Mono", monospace'
        ctx.fillStyle = 'rgba(237,237,237,0.6)'
        ctx.fillText(b.label, bx + 4, by - 6)
      }

      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)

    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf)
      } else {
        last = performance.now()
        raf = requestAnimationFrame(draw)
      }
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [onScreen])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-0 right-0 hidden h-full w-1/2 opacity-35 md:block"
    />
  )
}

/* --------------------------------------------------------------------------
   Hero
   -------------------------------------------------------------------------- */
export default function Hero() {
  const [videoOpen, setVideoOpen] = useState(false)
  const [bookingOpen, setBookingOpen] = useState(false)
  const [mentorOpen, setMentorOpen] = useState(false)

  return (
    <section id="home" className="relative overflow-hidden bg-[var(--bg)]">
      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col justify-center px-6 py-24 lg:py-32">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* LEFT column */}
          <div className="flex flex-col items-start">
            {/* a. Status pill */}
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[rgba(62,207,142,0.20)] bg-[rgba(62,207,142,0.10)] px-4 py-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ background: ACCENT }} />
                <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: ACCENT }} />
              </span>
              <span className="font-mono text-xs var(--text-muted)">Available for opportunities</span>
            </div>

            {/* b. Name headline */}
            <h1 className="font-display text-5xl font-medium leading-[1.05] tracking-tight var(--text) sm:text-6xl lg:text-7xl">
              <span className="block">Ahmed Fathy</span>
              <span className="block font-mono" style={{ color: ACCENT }}>Gwely</span>
            </h1>

            {/* c. Role line with specialty rotation */}
            <div className="mt-6 flex flex-wrap items-baseline gap-x-3">
              <span className="font-display text-lg font-medium var(--text)">AI Engineer</span>
              <span aria-hidden="true" className="hidden h-4 w-px sm:block" style={{ background: `${ACCENT}66` }} />
              <span className="sr-only">Specialties:</span>
              <SpecialtyRotator />
            </div>

            {/* d. Short description */}
            <p className="mt-5 max-w-xl font-body text-base leading-relaxed var(--text-muted)">
              I build practical AI systems end to end - from computer vision and
              machine learning to LLM-powered applications, RAG pipelines, and
              AI-driven automation.
            </p>

            {/* e. CTA row */}
            <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
              <CtaButtons onBook={() => setBookingOpen(true)} onMentor={() => setMentorOpen(true)} />
              <a
                href="#projects"
                className="inline-flex items-center gap-1.5 font-body text-sm var(--text) transition-colors hover:var(--accent)"
              >
                View projects
                <ArrowRight size={14} />
              </a>
            </div>

            {/* f. Social row */}
            <div className="mt-8">
              <SocialRow />
            </div>
          </div>

          {/* RIGHT column */}
          <div className="relative">
            {/* canvas sits behind the right column only */}
            <DetectionCanvas />

            <div className="relative z-10 flex justify-center lg:justify-end">
              <div className="w-full max-w-md">
                <HeroVideoCard onPlay={() => setVideoOpen(true)} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Video opens in the existing modal/player */}
      {videoOpen && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 p-4"
          style={{ backdropFilter: 'blur(10px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setVideoOpen(false) }}
          role="dialog"
          aria-modal="true"
          aria-label="Artificial Intelligence Conference video"
        >
          <div className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.10)] bg-black">
            <div className="flex items-center justify-between px-5 py-3">
              <span className="font-display text-sm font-medium var(--text)">
                Artificial Intelligence Conference
              </span>
              <button
                onClick={() => setVideoOpen(false)}
                aria-label="Close video"
                className="flex h-8 w-8 items-center justify-center rounded-lg var(--text-dim) transition-colors hover:var(--text)"
              >
                X
              </button>
            </div>
            <div className="relative" style={{ aspectRatio: '16/9' }}>
              <iframe
                className="absolute inset-0 h-full w-full"
                src={`https://www.youtube.com/embed/${VIDEO_ID}?autoplay=1&rel=0`}
                title="Artificial Intelligence Conference"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}

      <BookingModal isOpen={bookingOpen} onClose={() => setBookingOpen(false)} />
      <MentorshipModal isOpen={mentorOpen} onClose={() => setMentorOpen(false)} />
    </section>
  )
}
