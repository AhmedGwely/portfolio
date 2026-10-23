'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import {
  ChevronLeft, ChevronRight, X, Maximize2, Calendar, GraduationCap, Mail,
} from 'lucide-react'
import { GALLERY_IMAGES, populatedCategories, type GalleryImage } from '@/data/gallery'
import { BOOKING_URL, CONTACT_EMAIL, BUSINESS_WHATSAPP, WHATSAPP_DISPLAY, BOOKER_NAME } from '@/lib/site-config'

const ACCENT = '#00D4FF'
const ACCENT_2 = '#7C3AED'

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
            <p className="text-slate-200 text-sm mt-0.5 truncate">{img.caption}</p>
          </div>
          <button
            ref={closeRef} onClick={onClose} aria-label="Close image viewer"
            className="w-9 h-9 shrink-0 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-red-500/20 transition-colors"
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
            className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm px-2 py-1">
            <ChevronLeft size={16} /> Previous
          </button>
          <span className="font-mono text-xs text-slate-500">{index + 1} / {images.length}</span>
          <button onClick={onNext} aria-label="Next image"
            className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm px-2 py-1">
            Next <ChevronRight size={16} />
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ──────────────────────────────────────────────────────────────────────────
   CTA — Book a Call + Request Mentorship
   ────────────────────────────────────────────────────────────────────────── */
function GalleryCta() {
  const [bookingOpen, setBookingOpen] = useState(false)
  const [mentorOpen, setMentorOpen] = useState(false)

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: EASE }}
        className="mt-14 rounded-2xl p-7 sm:p-9 relative overflow-hidden glass"
        style={{ border: `1px solid ${ACCENT}22` }}
      >
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: `linear-gradient(120deg, ${ACCENT}0d, transparent 45%, ${ACCENT_2}0d)` }} />

        <div className="relative flex flex-col lg:flex-row lg:items-center gap-7 justify-between">
          <div className="max-w-xl">
            <div className="flex items-center gap-2.5 mb-2.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#06FFA5' }} />
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-slate-400">
                Work with me
              </span>
            </div>
            <h3 className="font-display font-bold text-2xl sm:text-3xl text-slate-100 mb-2.5 leading-tight">
              Let&apos;s talk AI
            </h3>
            <p className="font-body text-slate-400 text-sm leading-relaxed">
              Whether you need an AI system built, a second pair of eyes on a computer-vision
              pipeline, or guidance breaking into applied AI — I&apos;m happy to help.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0 w-full lg:w-auto">
            <button
              onClick={() => setBookingOpen(true)}
              className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-body font-bold text-sm transition-all duration-300 hover:shadow-[0_0_35px_rgba(0,212,255,0.45)]"
              style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_2})`, color: '#0A0A0B' }}
            >
              <Calendar size={16} />
              Book a Call
            </button>
            <button
              onClick={() => setMentorOpen(true)}
              className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl glass border border-[rgba(255,255,255,0.12)] text-slate-300 font-body text-sm hover:text-white hover:border-[rgba(0,212,255,0.45)] transition-all"
            >
              <GraduationCap size={16} />
              Request Mentorship
            </button>
          </div>
        </div>
      </motion.div>

      <BookingModal isOpen={bookingOpen} onClose={() => setBookingOpen(false)} />
      <MentorshipModal isOpen={mentorOpen} onClose={() => setMentorOpen(false)} />
    </>
  )
}

/* ──────────────────────────────────────────────────────────────────────────
   Book a Call modal — collects name + phone, opens WhatsApp with message
   ────────────────────────────────────────────────────────────────────────── */
function BookingModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null)
  const firstRef = useRef<HTMLInputElement>(null)
  const restoreRef = useRef<HTMLElement | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState({ name: '', phone: '' })

  useEffect(() => {
    if (!isOpen) return
    restoreRef.current = document.activeElement as HTMLElement | null
    firstRef.current?.focus()
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev; restoreRef.current?.focus?.() }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) { setErrors({}); setForm({ name: '', phone: '' }) }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return }
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
  }, [isOpen, onClose])

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Please enter your name.'
    if (!form.phone.trim()) e.phone = 'Please enter your phone number.'
    else if (!/^[+]?[\d\s()-]{7,20}$/.test(form.phone.trim())) e.phone = 'Please enter a valid phone number.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!validate()) return
    const msg = `Hello ${BOOKER_NAME},\n\nMy name is ${form.name.trim()}.\nI would like to book a call with you.\nMy phone number is: ${form.phone.trim()}.\n\nPlease let me know a suitable time.`
    window.open(`https://wa.me/${BUSINESS_WHATSAPP}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener')
    onClose()
  }

  const field = 'w-full p-3 rounded-lg text-sm text-slate-100 placeholder:text-slate-600 outline-none transition-colors'
  const fieldStyle = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }
  const errStyle = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,107,107,0.55)' }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(8px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
          role="dialog" aria-modal="true" aria-labelledby="booking-title"
        >
          <motion.div
            ref={panelRef}
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className="relative w-full max-w-md rounded-2xl overflow-hidden my-auto"
            style={{ background: 'rgba(10,10,20,0.98)', border: `1px solid ${ACCENT}30` }}
          >
            <div className="flex items-start justify-between gap-3 px-6 py-4"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <div>
                <h3 id="booking-title" className="font-display font-bold text-slate-100 text-lg">
                  Book a Call
                </h3>
                <p className="font-body text-slate-500 text-xs mt-0.5">
                  I&apos;ll confirm a time on WhatsApp.
                </p>
              </div>
              <button onClick={onClose} aria-label="Close booking form"
                className="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-red-500/20 transition-colors">
                <X size={15} />
              </button>
            </div>

            <form onSubmit={submit} className="px-6 py-5 space-y-4" noValidate>
              <div>
                <label htmlFor="b-name" className="block font-mono text-[10px] uppercase tracking-widest text-slate-500 mb-1.5">Name *</label>
                <input id="b-name" ref={firstRef} name="name" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Your full name" className={field} style={errors.name ? errStyle : fieldStyle} />
                {errors.name && <p className="text-[11px] mt-1" style={{ color: '#FF6B6B' }}>{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="b-phone" className="block font-mono text-[10px] uppercase tracking-widest text-slate-500 mb-1.5">Phone number *</label>
                <input id="b-phone" name="phone" type="tel" value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+20 10 12345678" className={field} style={errors.phone ? errStyle : fieldStyle} />
                {errors.phone && <p className="text-[11px] mt-1" style={{ color: '#FF6B6B' }}>{errors.phone}</p>}
              </div>

              <button type="submit"
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-body font-bold text-sm transition-all"
                style={{ background: `linear-gradient(135deg, #25D366, #128C7E)`, color: '#0A0A0B' }}>
                Send via WhatsApp
              </button>
              <p className="text-center text-slate-600 text-[11px]">
                Opens WhatsApp with a pre-filled message
              </p>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ──────────────────────────────────────────────────────────────────────────
   Mentorship request — collects name + phone, opens WhatsApp with message
   ────────────────────────────────────────────────────────────────────────── */
function MentorshipModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null)
  const firstRef = useRef<HTMLInputElement>(null)
  const restoreRef = useRef<HTMLElement | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState({
    name: '', phone: '', topic: '', level: 'Beginner', message: '',
  })

  useEffect(() => {
    if (!isOpen) return
    restoreRef.current = document.activeElement as HTMLElement | null
    firstRef.current?.focus()
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev; restoreRef.current?.focus?.() }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) { setErrors({}); setForm({ name: '', phone: '', topic: '', level: 'Beginner', message: '' }) }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return }
      if (e.key === 'Tab' && panelRef.current) {
        const f = panelRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (!f.length) return
        const first = f[0], last = f[f.length - 1]
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Please enter your name.'
    if (!form.phone.trim()) e.phone = 'Please enter your phone number.'
    else if (!/^[+]?[\d\s()-]{7,20}$/.test(form.phone.trim())) e.phone = 'Please enter a valid phone number.'
    if (!form.topic.trim()) e.topic = 'Please enter a mentorship topic.'
    if (!form.message.trim()) e.message = 'Please add a short message.'
    else if (form.message.trim().length < 10) e.message = 'Please write at least 10 characters.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!validate()) return
    const msg = `Hello ${BOOKER_NAME},\n\nMy name is ${form.name.trim()}.\nI would like to request mentorship from you.\nMy phone number is: ${form.phone.trim()}.\n\nTopic: ${form.topic.trim()}\nLevel: ${form.level}\n\n${form.message.trim()}`
    window.open(`https://wa.me/${BUSINESS_WHATSAPP}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener')
    onClose()
  }

  const field = 'w-full p-3 rounded-lg text-sm text-slate-100 placeholder:text-slate-600 outline-none transition-colors'
  const fieldStyle = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }
  const errStyle = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,107,107,0.55)' }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(8px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
          role="dialog" aria-modal="true" aria-labelledby="mentorship-title"
        >
          <motion.div
            ref={panelRef}
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className="relative w-full max-w-lg rounded-2xl overflow-hidden my-auto"
            style={{ background: 'rgba(10,10,20,0.98)', border: `1px solid ${ACCENT}30` }}
          >
            <div className="flex items-start justify-between gap-3 px-6 py-4"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <div>
                <h3 id="mentorship-title" className="font-display font-bold text-slate-100 text-lg">
                  Request Mentorship
                </h3>
                <p className="font-body text-slate-500 text-xs mt-0.5">
                  Tell me what you&apos;d like help with.
                </p>
              </div>
              <button onClick={onClose} aria-label="Close mentorship request"
                className="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-red-500/20 transition-colors">
                <X size={15} />
              </button>
            </div>

            <form onSubmit={submit} className="px-6 py-5 space-y-4" noValidate>
              <div>
                <label htmlFor="m-name" className="block font-mono text-[10px] uppercase tracking-widest text-slate-500 mb-1.5">Name *</label>
                <input id="m-name" ref={firstRef} name="name" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Your name" className={field} style={errors.name ? errStyle : fieldStyle} />
                {errors.name && <p className="text-[11px] mt-1" style={{ color: '#FF6B6B' }}>{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="m-phone" className="block font-mono text-[10px] uppercase tracking-widest text-slate-500 mb-1.5">Phone number *</label>
                <input id="m-phone" name="phone" type="tel" value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+20 10 12345678" className={field} style={errors.phone ? errStyle : fieldStyle} />
                {errors.phone && <p className="text-[11px] mt-1" style={{ color: '#FF6B6B' }}>{errors.phone}</p>}
              </div>

              <div>
                <label htmlFor="m-topic" className="block font-mono text-[10px] uppercase tracking-widest text-slate-500 mb-1.5">Mentorship topic *</label>
                <input id="m-topic" name="topic" value={form.topic}
                  onChange={(e) => setForm({ ...form, topic: e.target.value })}
                  placeholder="e.g. computer vision, RAG pipelines, career guidance"
                  className={field} style={errors.topic ? errStyle : fieldStyle} />
                {errors.topic && <p className="text-[11px] mt-1" style={{ color: '#FF6B6B' }}>{errors.topic}</p>}
              </div>

              <div>
                <label htmlFor="m-level" className="block font-mono text-[10px] uppercase tracking-widest text-slate-500 mb-1.5">Experience level</label>
                <select id="m-level" name="level" value={form.level}
                  onChange={(e) => setForm({ ...form, level: e.target.value })}
                  className={field} style={fieldStyle}>
                  {['Beginner', 'Student', 'Intermediate', 'Professional', 'Other'].map((l) => (
                    <option key={l} value={l} style={{ background: '#0a0a14' }}>{l}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="m-message" className="block font-mono text-[10px] uppercase tracking-widest text-slate-500 mb-1.5">Message *</label>
                <textarea id="m-message" name="message" rows={4} value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="What would you like help with?" className={field}
                  style={errors.message ? errStyle : fieldStyle} />
                {errors.message && <p className="text-[11px] mt-1" style={{ color: '#FF6B6B' }}>{errors.message}</p>}
              </div>

              <div className="flex gap-3 pt-1">
                <button type="submit"
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-body font-bold text-sm transition-all"
                  style={{ background: `linear-gradient(135deg, #25D366, #128C7E)`, color: '#0A0A0B' }}>
                  Send via WhatsApp
                </button>
                <button type="button" onClick={onClose}
                  className="px-5 py-3 rounded-xl font-body text-sm text-slate-400 hover:text-white border border-[rgba(255,255,255,0.1)] transition-colors">
                  Cancel
                </button>
              </div>
              <p className="text-center text-slate-600 text-[11px]">
                Opens WhatsApp with a pre-filled message
              </p>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
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
            <p className="font-body text-slate-400 text-sm">Loading gallery…</p>
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
            <p className="font-body text-slate-400 text-sm">No images in this category yet.</p>
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
            <span className="font-mono text-[#00D4FF] text-sm">06.</span>
            <span className="text-slate-600 font-mono text-xs uppercase tracking-widest">Gallery</span>
            <div className="flex-1 h-px bg-gradient-to-r from-[rgba(0,212,255,0.3)] to-transparent" />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5">
            <h2 className="font-display font-bold text-4xl sm:text-5xl text-slate-100">
              Beyond the <span className="gradient-text">Code</span>
            </h2>
            <p className="text-slate-400 font-body text-sm max-w-sm">
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
                    active ? 'bg-[#00D4FF] text-[#0A0A0B] shadow-[0_0_20px_rgba(0,212,255,0.4)]'
                           : 'glass text-slate-400 hover:text-slate-200 border border-[rgba(255,255,255,0.06)]'
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
                <p className="font-display font-semibold text-white text-base sm:text-xl leading-snug mt-1 truncate">
                  {slide.caption}
                </p>
              </div>
              <button
                onClick={() => setLightbox(index)}
                aria-label="Open image full screen"
                className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-slate-200 backdrop-blur-md transition-colors hover:text-white"
                style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.18)' }}
              >
                <Maximize2 size={16} />
              </button>
            </div>

            {/* Prev / Next — always visible (touch devices have no hover) */}
            {shown.length > 1 && (
              <>
                <button onClick={() => go(-1)} aria-label="Previous image"
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center text-white opacity-70 hover:opacity-100 focus:opacity-100 transition-opacity"
                  style={{ background: 'rgba(0,0,0,0.55)', border: `1px solid ${ACCENT}40`, backdropFilter: 'blur(6px)' }}>
                  <ChevronLeft size={20} />
                </button>
                <button onClick={() => go(1)} aria-label="Next image"
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center text-white opacity-70 hover:opacity-100 focus:opacity-100 transition-opacity"
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

        {/* CTA */}
        <GalleryCta />
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
