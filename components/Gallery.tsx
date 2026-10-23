'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import {
  ChevronLeft, ChevronRight, X, Maximize2,
} from 'lucide-react'
import { GALLERY_IMAGES, populatedCategories, type GalleryImage } from '@/data/gallery'

const ACCENT = 'var(--accent)'
const ACCENT_2 = 'var(--accent)'

const EASE = [0.16, 1, 0.3, 1] as const

/* ──────────────────────────────────────────────────────────────────────────
   Lightbox — accessible dialog with keyboard + focus management
   ────────────────────────────────────────────────────────────────────────── */
function Lightbox({
  images, index, onClose, onPrev, onNext,
}: {
  images: GalleryImage[]
  index: number
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const restoreRef = useRef<HTMLElement | null>(null)
  const img = images[index]

  // remember what had focus, move focus in, restore on close
  useEffect(() => {
    restoreRef.current = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
      restoreRef.current?.focus?.()
    }
  }, [])

  // keyboard: Esc closes, arrows navigate, Tab is trapped
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return }
      if (e.key === 'ArrowRight') { e.preventDefault(); onNext(); return }
      if (e.key === 'ArrowLeft') { e.preventDefault(); onPrev(); return }
      if (e.key === 'Tab' && panelRef.current) {
        const f = panelRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, [tabindex]:not([tabindex="-1"])'
        )
        if (!f.length) return
        const first = f[0], last = f[f.length - 1]
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, onNext, onPrev])

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-6"
      style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      role="dialog" aria-modal="true" aria-label={`Image viewer: ${img.caption}`}
    >
      <motion.div
        ref={panelRef}
        initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.94, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="relative w-full max-w-5xl rounded-2xl overflow-hidden"
        style={{ background: 'rgba(10,10,20,0.97)', border: `1px solid ${ACCENT}30` }}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="min-w-0">
            <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: ACCENT }}>
              {img.category}
            </span>
            <p className="var(--text-muted) text-sm mt-0.5 truncate">{img.caption}</p>
          </div>
          <button
            ref={closeRef} onClick={onClose} aria-label="Close image viewer"
            className="w-9 h-9 shrink-0 rounded-lg flex items-center justify-center var(--text-dim) hover:var(--text) hover:bg-red-500/20 transition-colors"
          >
            <X size={17} />
          </button>
        </div>

        {/* Image */}
        <div className="relative bg-[#080810]" style={{ height: 'min(66vh, 620px)' }}>
          <img
            key={img.src}
            src={img.src} alt={img.alt}
            className="w-full h-full object-contain"
            decoding="async"
          />
        </div>

        {/* Footer nav */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={onPrev} aria-label="Previous image"
            className="flex items-center gap-1.5 var(--text-dim) hover:var(--text) transition-colors text-sm px-2 py-1">
            <ChevronLeft size={16} /> Previous
          </button>
          <span className="font-mono text-xs var(--text-dim)">{index + 1} / {images.length}</span>
          <button onClick={onNext} aria-label="Next image"
            className="flex items-center gap-1.5 var(--text-dim) hover:var(--text) transition-colors text-sm px-2 py-1">
            Next <ChevronRight size={16} />
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ──────────────────────────────────────────────────────────────────────────
   Gallery section
   ────────────────────────────────────────────────────────────────────────── */
export default function Gallery() {
  const { ref, inView } = useInView({ threshold: 0.08, triggerOnce: true })
  const reduce = useReducedMotion()
  const [category, setCategory] = useState<string>('All')
  const [index, setIndex] = useState(0)
  const [lightbox, setLightbox] = useState<number | null>(null)
  const touchX = useRef<number | null>(null)
  const [images, setImages] = useState<GalleryImage[]>(GALLERY_IMAGES)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const ctrl = new AbortController()
    fetch('/api/gallery', { signal: ctrl.signal })
      .then((res) => {
        if (!res.ok) throw new Error()
        return res.json() as Promise<GalleryImage[]>
      })
      .then((data) => {
        if (data.length > 0) setImages(data)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
    return () => ctrl.abort()
  }, [])

  const cats = useMemo(() => populatedCategories(images), [images])
  const shown = useMemo(
    () => (category === 'All' ? images : images.filter((i) => i.category === category)),
    [category, images]
  )

  // keep index in range when the filter changes
  useEffect(() => { setIndex(0) }, [category])

  const go = useCallback((dir: number) => {
    setIndex((i) => (shown.length ? (i + dir + shown.length) % shown.length : 0))
  }, [shown.length])

  // keyboard control while the slider has focus
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(1) }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1) }
  }

  const slide = shown[index]

  // Loading state
  if (loading) {
    return (
      <section id="gallery" ref={ref} className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="glass rounded-2xl p-12 text-center" style={{ border: `1px solid ${ACCENT}18` }}>
            <div className="w-8 h-8 mx-auto mb-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: `${ACCENT}40`, borderTopColor: 'transparent' }} />
            <p className="font-body var(--text-dim) text-sm">Loading gallery…</p>
          </div>
        </div>
      </section>
    )
  }

  // Empty state — no invented content
  if (!shown.length) {
    return (
      <section id="gallery" ref={ref} className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="glass rounded-2xl p-12 text-center" style={{ border: `1px solid ${ACCENT}18` }}>
            <p className="font-body var(--text-dim) text-sm">No images in this category yet.</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="gallery" ref={ref} className="py-32 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="mb-12"
        >
          <div className="flex items-center gap-4 mb-4">
            <span className="font-mono text-[var(--accent)] text-sm">06.</span>
            <span className="var(--text-dim) font-mono text-xs uppercase tracking-widest">Gallery</span>
            <div className="flex-1 h-px bg-gradient-to-r from-[rgba(62,207,142,0.12)] to-transparent" />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5">
            <h2 className="font-display font-medium text-4xl sm:text-5xl var(--text)">
              Beyond the <span className="gradient-text">Code</span>
            </h2>
            <p className="var(--text-dim) font-body text-sm max-w-sm">
              A glimpse into my projects, experiments, teaching sessions, and journey in AI.
            </p>
          </div>
        </motion.div>

        {/* Category filters — only categories with real images */}
        {cats.length > 1 && (
          <motion.div
            initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="flex gap-2 flex-wrap mb-8"
            role="group" aria-label="Filter gallery by category"
          >
            {['All', ...cats].map((c) => {
              const active = category === c
              const n = c === 'All' ? images.length : images.filter((i) => i.category === c).length
              return (
                <button key={c} onClick={() => setCategory(c)} aria-pressed={active}
                  className={`px-4 py-2 rounded-lg text-sm font-body font-medium transition-all duration-200 ${
                    active ? 'text-[var(--accent)] text-[var(--bg)] shadow-[0_0_20px_rgba(62,207,142,0.45)]'
                           : 'glass var(--text-dim) hover:var(--text-muted) border border-[rgba(255,255,255,0.06)]'
                  }`}>
                  {c}
                  <span className={`ml-1.5 text-[10px] ${active ? 'opacity-70' : 'opacity-50'}`}>({n})</span>
                </button>
              )
            })}
          </motion.div>
        )}

        {/* Slider */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: EASE, delay: 0.1 }}
          className="group relative"
        >
          <div
            className="relative rounded-2xl overflow-hidden glass"
            style={{ border: `1px solid ${ACCENT}22`, aspectRatio: '16/9', maxHeight: '62vh' }}
            onKeyDown={onKeyDown}
            tabIndex={0}
            role="group"
            aria-roledescription="carousel"
            aria-label={`Gallery image ${index + 1} of ${shown.length}`}
            onTouchStart={(e) => { touchX.current = e.touches[0].clientX }}
            onTouchEnd={(e) => {
              if (touchX.current === null) return
              const dx = e.changedTouches[0].clientX - touchX.current
              if (Math.abs(dx) > 45) go(dx < 0 ? 1 : -1)
              touchX.current = null
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={slide.src}
                initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 1.03 }}
                animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.99 }}
                transition={{ duration: reduce ? 0.2 : 0.5, ease: EASE }}
                className="absolute inset-0"
              >
                <img
                  src={slide.src}
                  alt={slide.alt}
                  width={slide.width}
                  height={slide.height}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                  className="w-full h-full object-cover"
                />
              </motion.div>
            </AnimatePresence>

            {/* Legibility scrim + caption */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent pointer-events-none" />

            <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7 flex items-end justify-between gap-4">
              <div className="min-w-0">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: ACCENT }}>
                  {slide.category}
                </span>
                <p className="font-display font-medium var(--text) text-base sm:text-xl leading-snug mt-1 truncate">
                  {slide.caption}
                </p>
              </div>
              <button
                onClick={() => setLightbox(index)}
                aria-label="Open image full screen"
                className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center var(--text-muted) backdrop-blur-md transition-colors hover:var(--text)"
                style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.18)' }}
              >
                <Maximize2 size={16} />
              </button>
            </div>

            {/* Prev / Next — always visible (touch devices have no hover) */}
            {shown.length > 1 && (
              <>
                <button onClick={() => go(-1)} aria-label="Previous image"
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center var(--text) opacity-70 hover:opacity-100 focus:opacity-100 transition-opacity"
                  style={{ background: 'rgba(0,0,0,0.55)', border: `1px solid ${ACCENT}40`, backdropFilter: 'blur(6px)' }}>
                  <ChevronLeft size={20} />
                </button>
                <button onClick={() => go(1)} aria-label="Next image"
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center var(--text) opacity-70 hover:opacity-100 focus:opacity-100 transition-opacity"
                  style={{ background: 'rgba(0,0,0,0.55)', border: `1px solid ${ACCENT}40`, backdropFilter: 'blur(6px)' }}>
                  <ChevronRight size={20} />
                </button>
              </>
            )}
          </div>

          {/* Dots — 44px tap targets around a visual pill */}
          {shown.length > 1 && (
            <div className="flex items-center justify-center gap-1 mt-4" role="tablist" aria-label="Choose image">
              {shown.map((s, i) => (
                <button key={s.src} onClick={() => setIndex(i)}
                  role="tab" aria-selected={i === index} aria-label={`Show image ${i + 1}`}
                  className="h-11 px-1.5 flex items-center justify-center">
                  <span className="block h-2 rounded-full transition-all duration-300"
                    style={{
                      width: i === index ? 26 : 8,
                      background: i === index ? `linear-gradient(90deg, ${ACCENT}, ${ACCENT_2})` : 'rgba(255,255,255,0.18)',
                    }} />
                </button>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox !== null && shown[lightbox] && (
          <Lightbox
            images={shown}
            index={lightbox}
            onClose={() => setLightbox(null)}
            onPrev={() => setLightbox((i) => (i === null ? null : (i - 1 + shown.length) % shown.length))}
            onNext={() => setLightbox((i) => (i === null ? null : (i + 1) % shown.length))}
          />
        )}
      </AnimatePresence>
    </section>
  )
}
