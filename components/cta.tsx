// Shared CTA components — single source for the "Book a Call" and
// "Request Mentorship" buttons and their WhatsApp modals.
//
// Both modals are copied VERBATIM from the previous Gallery.tsx versions
// (same validation rules, same wa.me URLs, same accessibility behaviour) so
// moving the CTAs between sections changes no behaviour.

'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, GraduationCap, X } from 'lucide-react'
import { BUSINESS_WHATSAPP, BOOKER_NAME } from '@/lib/site-config'

const ACCENT = 'var(--accent)'

const EASE = [0.16, 1, 0.3, 1] as const

/* ──────────────────────────────────────────────────────────────────────────
   Button pair
   ────────────────────────────────────────────────────────────────────────── */
export function CtaButtons({
  onBook,
  onMentor,
}: {
  onBook: () => void
  onMentor: () => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        onClick={onBook}
        className="flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-body text-sm font-medium transition-all duration-300 hover:shadow-[0_0_35px_rgba(62,207,142,0.45)] active:scale-[0.98]"
        style={{ background: `linear-gradient(135deg, ${ACCENT}, var(--accent))`, color: 'var(--bg)' }}
      >
        <Calendar size={16} />
        Book a Call
      </button>
      <button
        onClick={onMentor}
        className="flex items-center justify-center gap-2 rounded-xl border border-[rgba(255,255,255,0.12)] px-6 py-3 font-body text-sm var(--text-faint) hover:var(--text) hover:border-[rgba(62,207,142,0.45)] transition-all"
      >
        <GraduationCap size={16} />
        Request Mentorship
      </button>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────────────
   Shared modal shell behaviour (focus restore + scroll lock + Esc + trap)
   ────────────────────────────────────────────────────────────────────────── */
function useModalA11y(isOpen: boolean, onClose: () => void, panelRef: React.RefObject<HTMLDivElement | null>, firstRef: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    firstRef.current?.focus()
    return () => { document.body.style.overflow = prev }
  }, [isOpen, firstRef])

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
  }, [isOpen, onClose, panelRef])
}

/* ──────────────────────────────────────────────────────────────────────────
   Book a Call modal — VERBATIM behaviour from Gallery.tsx
   ────────────────────────────────────────────────────────────────────────── */
export function BookingModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null)
  const firstRef = useRef<HTMLInputElement>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState({ name: '', phone: '' })

  useModalA11y(isOpen, onClose, panelRef, firstRef)

  useEffect(() => {
    if (!isOpen) { setErrors({}); setForm({ name: '', phone: '' }) }
  }, [isOpen])

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

  const field = 'w-full p-3 rounded-lg text-sm var(--text) placeholder:var(--text-dim) outline-none transition-colors'
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
                <h3 id="booking-title" className="font-display font-medium var(--text) text-lg">
                  Book a Call
                </h3>
                <p className="font-body var(--text-dim) text-xs mt-0.5">
                  I&apos;ll confirm a time on WhatsApp.
                </p>
              </div>
              <button onClick={onClose} aria-label="Close booking form"
                className="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center var(--text-dim) hover:var(--text) hover:bg-red-500/20 transition-colors">
                <X size={15} />
              </button>
            </div>

            <form onSubmit={submit} className="px-6 py-5 space-y-4" noValidate>
              <div>
                <label htmlFor="b-name" className="block font-mono text-[10px] uppercase tracking-widest var(--text-dim) mb-1.5">Name *</label>
                <input id="b-name" ref={firstRef} name="name" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Your full name" className={field} style={errors.name ? errStyle : fieldStyle} />
                {errors.name && <p className="text-[11px] mt-1" style={{ color: 'var(--accent)' }}>{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="b-phone" className="block font-mono text-[10px] uppercase tracking-widest var(--text-dim) mb-1.5">Phone number *</label>
                <input id="b-phone" name="phone" type="tel" value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+20 10 12345678" className={field} style={errors.phone ? errStyle : fieldStyle} />
                {errors.phone && <p className="text-[11px] mt-1" style={{ color: 'var(--accent)' }}>{errors.phone}</p>}
              </div>

              <button type="submit"
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-body font-medium text-sm transition-all"
                style={{ background: `linear-gradient(135deg, #25D366, #128C7E)`, color: 'var(--bg)' }}>
                Send via WhatsApp
              </button>
              <p className="text-center var(--text-dim) text-[11px]">
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
   Mentorship modal — VERBATIM behaviour from Gallery.tsx
   ────────────────────────────────────────────────────────────────────────── */
export function MentorshipModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null)
  const firstRef = useRef<HTMLInputElement>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState({
    name: '', phone: '', topic: '', level: 'Beginner', message: '',
  })

  useModalA11y(isOpen, onClose, panelRef, firstRef)

  useEffect(() => {
    if (!isOpen) { setErrors({}); setForm({ name: '', phone: '', topic: '', level: 'Beginner', message: '' }) }
  }, [isOpen])

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

  const field = 'w-full p-3 rounded-lg text-sm var(--text) placeholder:var(--text-dim) outline-none transition-colors'
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
                <h3 id="mentorship-title" className="font-display font-medium var(--text) text-lg">
                  Request Mentorship
                </h3>
                <p className="font-body var(--text-dim) text-xs mt-0.5">
                  Tell me what you&apos;d like help with.
                </p>
              </div>
              <button onClick={onClose} aria-label="Close mentorship request"
                className="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center var(--text-dim) hover:var(--text) hover:bg-red-500/20 transition-colors">
                <X size={15} />
              </button>
            </div>

            <form onSubmit={submit} className="px-6 py-5 space-y-4" noValidate>
              <div>
                <label htmlFor="m-name" className="block font-mono text-[10px] uppercase tracking-widest var(--text-dim) mb-1.5">Name *</label>
                <input id="m-name" ref={firstRef} name="name" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Your name" className={field} style={errors.name ? errStyle : fieldStyle} />
                {errors.name && <p className="text-[11px] mt-1" style={{ color: 'var(--accent)' }}>{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="m-phone" className="block font-mono text-[10px] uppercase tracking-widest var(--text-dim) mb-1.5">Phone number *</label>
                <input id="m-phone" name="phone" type="tel" value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+20 10 12345678" className={field} style={errors.phone ? errStyle : fieldStyle} />
                {errors.phone && <p className="text-[11px] mt-1" style={{ color: 'var(--accent)' }}>{errors.phone}</p>}
              </div>

              <div>
                <label htmlFor="m-topic" className="block font-mono text-[10px] uppercase tracking-widest var(--text-dim) mb-1.5">Mentorship topic *</label>
                <input id="m-topic" name="topic" value={form.topic}
                  onChange={(e) => setForm({ ...form, topic: e.target.value })}
                  placeholder="e.g. computer vision, RAG pipelines, career guidance"
                  className={field} style={errors.topic ? errStyle : fieldStyle} />
                {errors.topic && <p className="text-[11px] mt-1" style={{ color: 'var(--accent)' }}>{errors.topic}</p>}
              </div>

              <div>
                <label htmlFor="m-level" className="block font-mono text-[10px] uppercase tracking-widest var(--text-dim) mb-1.5">Experience level</label>
                <select id="m-level" name="level" value={form.level}
                  onChange={(e) => setForm({ ...form, level: e.target.value })}
                  className={field} style={fieldStyle}>
                  {['Beginner', 'Student', 'Intermediate', 'Professional', 'Other'].map((l) => (
                    <option key={l} value={l} style={{ background: 'var(--bg)' }}>{l}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="m-message" className="block font-mono text-[10px] uppercase tracking-widest var(--text-dim) mb-1.5">Message *</label>
                <textarea id="m-message" name="message" rows={4} value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="What would you like help with?" className={field}
                  style={errors.message ? errStyle : fieldStyle} />
                {errors.message && <p className="text-[11px] mt-1" style={{ color: 'var(--accent)' }}>{errors.message}</p>}
              </div>

              <div className="flex gap-3 pt-1">
                <button type="submit"
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-body font-medium text-sm transition-all"
                  style={{ background: `linear-gradient(135deg, #25D366, #128C7E)`, color: 'var(--bg)' }}>
                  Send via WhatsApp
                </button>
                <button type="button" onClick={onClose}
                  className="px-5 py-3 rounded-xl font-body text-sm var(--text-dim) hover:var(--text) border border-[rgba(255,255,255,0.1)] transition-colors">
                  Cancel
                </button>
              </div>
              <p className="text-center var(--text-dim) text-[11px]">
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
   "Let's talk AI" closing card — the same two CTAs, reused.
   ────────────────────────────────────────────────────────────────────────── */
export function TalkAiCard() {
  const [bookingOpen, setBookingOpen] = useState(false)
  const [mentorOpen, setMentorOpen] = useState(false)

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: EASE }}
        className="rounded-2xl p-7 sm:p-9 relative overflow-hidden glass"
        style={{ border: `1px solid var(--accent)22` }}
      >
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: `linear-gradient(120deg, ${ACCENT}0d, transparent 45%, ${ACCENT}0d)` }} />

        <div className="relative flex flex-col lg:flex-row lg:items-center gap-7 justify-between">
          <div className="max-w-xl">
            <div className="flex items-center gap-2.5 mb-2.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] var(--text-dim)">
                Work with me
              </span>
            </div>
            <h3 className="font-display font-medium text-2xl sm:text-3xl var(--text) mb-2.5 leading-tight">
              Let&apos;s talk AI
            </h3>
            <p className="font-body var(--text-dim) text-sm leading-relaxed">
              Whether you need an AI system built, a second pair of eyes on a computer-vision
              pipeline, or guidance breaking into applied AI — I&apos;m happy to help.
            </p>
          </div>

          <CtaButtons onBook={() => setBookingOpen(true)} onMentor={() => setMentorOpen(true)} />
        </div>
      </motion.div>

      <BookingModal isOpen={bookingOpen} onClose={() => setBookingOpen(false)} />
      <MentorshipModal isOpen={mentorOpen} onClose={() => setMentorOpen(false)} />
    </>
  )
}
