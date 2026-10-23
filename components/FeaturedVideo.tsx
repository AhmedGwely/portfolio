'use client'
import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { Play, ExternalLink, Youtube, Radio, Sparkles } from 'lucide-react'
import YouTubePlayer from './YouTubePlayer'

const ACCENT = '#00D4FF'
const ACCENT_2 = '#7C3AED'
const ACCENT_3 = '#06FFA5'

// Verified via YouTube oEmbed: title "Artificial Intelligence Conference",
// channel "Ahmed Gwely" (@AhmedGwely). Embedding is permitted.
const VIDEO_ID = 'xh15hsxIn50'
const WATCH_URL = `https://youtu.be/${VIDEO_ID}`
const POSTER = `https://img.youtube.com/vi/${VIDEO_ID}/maxresdefault.jpg`

const META = [
  { label: 'Channel', value: '@AhmedGwely' },
  { label: 'Format', value: 'Keynote Video' },
  { label: 'Topic', value: 'Applied AI' },
]

const TAGS = ['Artificial Intelligence', 'Public Speaking', 'Computer Vision', 'Deep Learning']

// Rotating conic-gradient ring — the cinematic frame border.
function AuroraRing() {
  return (
    <motion.div
      aria-hidden
      className="absolute inset-[-120%] pointer-events-none"
      style={{
        background: `conic-gradient(from 0deg,
          transparent 0deg,
          ${ACCENT} 40deg,
          transparent 90deg,
          transparent 150deg,
          ${ACCENT_2} 200deg,
          transparent 250deg,
          transparent 300deg,
          ${ACCENT_3} 340deg,
          transparent 360deg)`,
        opacity: 0.55,
      }}
      animate={{ rotate: 360 }}
      transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
    />
  )
}

// HUD corner brackets
function Corners() {
  const base = 'absolute w-6 h-6 pointer-events-none'
  return (
    <>
      <span className={`${base} top-3 left-3 border-t-2 border-l-2`} style={{ borderColor: `${ACCENT}80` }} />
      <span className={`${base} top-3 right-3 border-t-2 border-r-2`} style={{ borderColor: `${ACCENT}80` }} />
      <span className={`${base} bottom-3 left-3 border-b-2 border-l-2`} style={{ borderColor: `${ACCENT}80` }} />
      <span className={`${base} bottom-3 right-3 border-b-2 border-r-2`} style={{ borderColor: `${ACCENT}80` }} />
    </>
  )
}

export default function FeaturedVideo() {
  const [playing, setPlaying] = useState(false)
  const [posterFailed, setPosterFailed] = useState(false)
  const { ref, inView } = useInView({ threshold: 0.1, triggerOnce: true })
  const playerRef = useRef<HTMLDivElement>(null)

  // Plays inline, on the page — no modal. The poster stays as a lightweight
  // facade so nothing loads or autoplays until the visitor asks for it.
  const start = (scroll = false) => {
    setPlaying(true)
    if (scroll) {
      requestAnimationFrame(() => {
        playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      })
    }
  }

  return (
    <section id="featured-video" ref={ref} className="relative py-32 px-6 overflow-hidden">
      {/* Ambient glow — matches the page background language */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[900px] h-[500px] blur-3xl opacity-[0.07]"
          style={{ background: `radial-gradient(ellipse at center, ${ACCENT}, transparent 70%)` }}
        />
        <div
          className="absolute bottom-0 right-1/4 w-[500px] h-[400px] blur-3xl opacity-[0.06]"
          style={{ background: `radial-gradient(ellipse at center, ${ACCENT_2}, transparent 70%)` }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto">
        {/* ── Header ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="mb-14"
        >
          <div className="flex items-center gap-4 mb-4">
            <Sparkles size={14} style={{ color: ACCENT }} />
            <span className="font-mono text-xs uppercase tracking-[0.25em]" style={{ color: ACCENT }}>
              Main Featured
            </span>
            <div className="flex-1 h-px bg-gradient-to-r from-[rgba(0,212,255,0.35)] to-transparent" />
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <h2 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl text-slate-100 leading-[1.05] tracking-tight">
              Artificial Intelligence{' '}
              <span className="gradient-text">Conference</span>
            </h2>

            {/* Status pill */}
            <div
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full self-start lg:self-auto shrink-0"
              style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${ACCENT}30` }}
            >
              <span className="relative flex w-2 h-2">
                <span
                  className="absolute inline-flex w-full h-full rounded-full opacity-75 animate-ping"
                  style={{ background: ACCENT_3 }}
                />
                <span className="relative inline-flex w-2 h-2 rounded-full" style={{ background: ACCENT_3 }} />
              </span>
              <span className="font-mono text-[11px] text-slate-400 uppercase tracking-widest">
                Now Streaming
              </span>
            </div>
          </div>
        </motion.div>

        {/* ── Cinematic video frame ──────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.98 }}
          animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="group relative"
        >
          {/* Outer glow on hover */}
          <div
            className="absolute -inset-4 rounded-[28px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-2xl pointer-events-none"
            style={{ background: `radial-gradient(ellipse at center, ${ACCENT}22, transparent 70%)` }}
          />

          {/* Rotating aurora border */}
          <div className="relative rounded-2xl sm:rounded-[26px] p-[1.5px] overflow-hidden">
            <AuroraRing />

            {/* Video surface */}
            <div
              ref={playerRef}
              className="relative rounded-2xl sm:rounded-[24px] overflow-hidden bg-[#05070d]"
              style={{ aspectRatio: '16/9' }}
            >
              {playing ? (
                /* ── Inline player with custom control bar ── */
                <YouTubePlayer
                  videoId={VIDEO_ID}
                  title="Artificial Intelligence Conference"
                  watchUrl={WATCH_URL}
                  accent={ACCENT}
                  accent2={ACCENT_2}
                  accent3={ACCENT_3}
                />
              ) : (
                /* ── Poster facade — nothing loads until clicked ── */
                <div
                  className="absolute inset-0 cursor-pointer"
                  onClick={() => start()}
                  role="button"
                  tabIndex={0}
                  aria-label="Play the Artificial Intelligence Conference video"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      start()
                    }
                  }}
                >
                  {!posterFailed ? (
                    <img
                      src={POSTER}
                      alt="Artificial Intelligence Conference — video thumbnail"
                      className="w-full h-full object-cover scale-[1.02] group-hover:scale-[1.08] transition-transform duration-[1200ms] ease-out"
                      loading="lazy"
                      onError={() => setPosterFailed(true)}
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{ background: `linear-gradient(135deg, ${ACCENT}1a, ${ACCENT_2}1a)` }}
                    >
                      <Youtube size={64} style={{ color: ACCENT, opacity: 0.5 }} />
                    </div>
                  )}

                  {/* Cinematic vignette */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/30" />
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{ background: `linear-gradient(135deg, ${ACCENT}14, transparent 55%)` }}
                  />

                  <Corners />

                  {/* Top chips */}
                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <span
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-[11px] font-bold tracking-wide"
                      style={{ background: ACCENT, color: '#0A0A0B' }}
                    >
                      <Play size={10} fill="currentColor" />
                      MAIN FEATURED
                    </span>
                  </div>

                  <div className="absolute top-4 right-4 flex items-center gap-2">
                    <span
                      className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-mono text-[11px] text-slate-200 backdrop-blur-md"
                      style={{ background: 'rgba(255,0,0,0.22)', border: '1px solid rgba(255,0,0,0.35)' }}
                    >
                      <Youtube size={12} />
                      YouTube
                    </span>
                  </div>

                  {/* Center play button with pulsing rings */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative flex items-center justify-center">
                      {[0, 0.6, 1.2].map((delay, i) => (
                        <motion.span
                          key={i}
                          className="absolute rounded-full"
                          style={{ border: `1.5px solid ${ACCENT}`, width: 88, height: 88 }}
                          animate={{ scale: [1, 1.9], opacity: [0.55, 0] }}
                          transition={{ duration: 2.4, repeat: Infinity, delay, ease: 'easeOut' }}
                        />
                      ))}

                      <motion.div
                        whileHover={{ scale: 1.12 }}
                        whileTap={{ scale: 0.96 }}
                        className="relative w-[88px] h-[88px] rounded-full flex items-center justify-center"
                        style={{
                          background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_2})`,
                          boxShadow: `0 0 50px ${ACCENT}80, 0 0 100px ${ACCENT}35`,
                        }}
                      >
                        <Play size={32} className="text-[#0A0A0B] ml-1.5" fill="currentColor" />
                      </motion.div>
                    </div>
                  </div>

                  {/* Bottom title bar */}
                  <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <Radio size={12} style={{ color: ACCENT_3 }} />
                          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-400">
                            Keynote
                          </span>
                        </div>
                        <p className="font-display font-bold text-white text-lg sm:text-2xl leading-tight truncate">
                          Artificial Intelligence Conference
                        </p>
                        <p className="font-body text-slate-400 text-xs sm:text-sm mt-1">
                          Presented by Ahmed Gwely
                        </p>
                      </div>

                      <span
                        className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-xl font-body text-sm font-semibold text-white shrink-0 backdrop-blur-md"
                        style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.18)' }}
                      >
                        Play here
                        <Play size={13} fill="currentColor" />
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── Details ────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="grid lg:grid-cols-5 gap-10 mt-12 items-start"
        >
          {/* Copy */}
          <div className="lg:col-span-3">
            <h3 className="font-display font-bold text-2xl sm:text-3xl text-slate-100 mb-3 leading-tight">
              Sharing applied AI with the next generation of engineers
            </h3>
            <p className="font-body text-base sm:text-lg text-slate-400 mb-5 leading-relaxed">
              A full conference keynote on artificial intelligence — covering real-world computer
              vision systems, deep learning in production, and what it takes to move a model from a
              notebook to something people actually use.
            </p>

            <div className="flex flex-wrap gap-2">
              {TAGS.map((t) => (
                <span key={t} className="tech-tag">{t}</span>
              ))}
            </div>
          </div>

          {/* Meta + actions */}
          <div className="lg:col-span-2 space-y-5">
            <div className="grid grid-cols-3 lg:grid-cols-1 gap-3">
              {META.map((m, i) => (
                <motion.div
                  key={m.label}
                  initial={{ opacity: 0, x: 20 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.35 + i * 0.08 }}
                  className="glass rounded-xl p-4 relative overflow-hidden"
                  style={{ border: `1px solid ${ACCENT}18` }}
                >
                  <div
                    className="absolute left-0 top-0 bottom-0 w-[2px]"
                    style={{ background: `linear-gradient(180deg, ${ACCENT}, ${ACCENT_2})` }}
                  />
                  <div className="font-mono text-[10px] text-slate-600 uppercase tracking-widest mb-1">
                    {m.label}
                  </div>
                  <div className="font-body text-sm text-slate-300">{m.value}</div>
                </motion.div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-3">
              <button
                onClick={() => start(true)}
                className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-body font-bold text-sm transition-all duration-300 hover:shadow-[0_0_35px_rgba(0,212,255,0.45)]"
                style={{
                  background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_2})`,
                  color: '#0A0A0B',
                }}
              >
                <Play size={16} fill="currentColor" />
                {playing ? 'Playing…' : 'Watch Video'}
              </button>
              <a
                href={WATCH_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl glass border border-[rgba(255,255,255,0.1)] text-slate-400 font-body text-sm hover:text-white hover:border-[rgba(255,255,255,0.3)] transition-all"
              >
                <Youtube size={16} />
                Watch on YouTube
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
