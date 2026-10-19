'use client'

import { useCallback, useEffect, useRef, useState, type CSSProperties, type FormEvent } from 'react'

/* ──────────────────────────────────────────────────────────────────────────
   Theme constants — mirror app/admin/layout.tsx
   ────────────────────────────────────────────────────────────────────────── */
const ACCENT = '#00D4FF'
const ACCENT_2 = '#7C3AED'

const CATEGORIES = [
  'Conferences & Community',
  'Teaching & Workshops',
  'Projects & Experiments',
  'AI & Computer Vision',
  'Samsung Mentorship',
] as const

type Category = (typeof CATEGORIES)[number]

type GalleryImage = {
  id: number
  src: string
  caption: string
  alt: string
  category: Category
  width: number
  height: number
}

type FormState = {
  src: string
  caption: string
  alt: string
  category: Category
  width: string
  height: string
}

type Status = 'idle' | 'loading' | 'ready' | 'error'

/* ──────────────────────────────────────────────────────────────────────────
   Form helpers
   ────────────────────────────────────────────────────────────────────────── */
const emptyForm: FormState = {
  src: '',
  caption: '',
  alt: '',
  category: 'Conferences & Community',
  width: '',
  height: '',
}

function imageToForm(img: GalleryImage): FormState {
  return {
    src: img.src,
    caption: img.caption,
    alt: img.alt,
    category: img.category,
    width: String(img.width),
    height: String(img.height),
  }
}

function validateForm(form: FormState): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!form.src.trim()) errors.src = 'Image URL is required'
  if (!form.caption.trim()) errors.caption = 'Caption is required'
  if (!form.alt.trim()) errors.alt = 'Alt text is required'
  const w = Number(form.width)
  const h = Number(form.height)
  if (!form.width || !Number.isFinite(w) || w <= 0)
    errors.width = 'Width must be a positive number'
  if (!form.height || !Number.isFinite(h) || h <= 0)
    errors.height = 'Height must be a positive number'
  return errors
}

/* ──────────────────────────────────────────────────────────────────────────
   Inline styles (glass morphism / dark cyberpunk)
   ────────────────────────────────────────────────────────────────────────── */
const glass: CSSProperties = {
  background: 'rgba(13,17,23,0.7)',
  border: `1px solid ${ACCENT}18`,
  backdropFilter: 'blur(12px)',
  borderRadius: 12,
}

const inputStyle = (hasError?: boolean): CSSProperties => ({
  width: '100%',
  padding: '10px 12px',
  fontSize: 14,
  color: '#e2e8f0',
  background: 'rgba(255,255,255,0.04)',
  border: hasError ? '1px solid rgba(255,107,107,0.55)' : '1px solid rgba(255,255,255,0.09)',
  borderRadius: 8,
  outline: 'none',
  transition: 'border-color 0.2s',
})

const labelStyle: CSSProperties = {
  display: 'block',
  fontFamily: 'monospace',
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: '#94a3b8',
  marginBottom: 6,
}

const errStyle: CSSProperties = {
  fontSize: 11,
  color: '#FF6B6B',
  marginTop: 4,
}

/* ──────────────────────────────────────────────────────────────────────────
   Component
   ────────────────────────────────────────────────────────────────────────── */
export default function GalleryAdminPage() {
  const [images, setImages] = useState<GalleryImage[]>([])
  const [status, setStatus] = useState<Status>('loading')
  const [error, setError] = useState('')
  const [mutating, setMutating] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [deletingId, setDeletingId] = useState<number | null>(null)

  /* ── Fetch list ── */
  const fetchImages = useCallback(async () => {
    setStatus('loading')
    setError('')
    try {
      const res = await fetch('/api/gallery')
      if (!res.ok) throw new Error(`API returned ${res.status}`)
      const data = (await res.json()) as GalleryImage[]
      setImages(data)
      setStatus('ready')
    } catch {
      setError('Failed to load images. Please try again.')
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    fetchImages()
  }, [fetchImages])

  /* ── Open modal for add or edit ── */
  function openAdd() {
    setEditingId(null)
    setForm(emptyForm)
    setFormErrors({})
    setModalOpen(true)
  }

  function openEdit(img: GalleryImage) {
    setEditingId(img.id)
    setForm(imageToForm(img))
    setFormErrors({})
    setModalOpen(true)
  }

  /* ── Submit create or update ── */
  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const errors = validateForm(form)
    setFormErrors(errors)
    if (Object.keys(errors).length > 0) return

    setMutating(true)
    try {
      const payload = {
        src: form.src.trim(),
        caption: form.caption.trim(),
        alt: form.alt.trim(),
        category: form.category,
        width: Number(form.width),
        height: Number(form.height),
      }

      const url =
        editingId !== null ? `/api/gallery/${editingId}` : '/api/gallery'
      const method = editingId !== null ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string
          details?: string[]
        } | null
        throw new Error(
          body?.details?.join(', ') ?? body?.error ?? `API returned ${res.status}`,
        )
      }

      setModalOpen(false)
      await fetchImages()
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Something went wrong'
      setFormErrors({ submit: msg })
    } finally {
      setMutating(false)
    }
  }

  /* ── Delete ── */
  async function handleDelete(id: number) {
    if (!window.confirm('Are you sure you want to delete this image?')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/gallery/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string
        } | null
        throw new Error(body?.error ?? `API returned ${res.status}`)
      }
      setImages((prev) => prev.filter((i) => i.id !== id))
    } catch (err) {
      window.alert(
        err instanceof Error ? err.message : 'Failed to delete image',
      )
    } finally {
      setDeletingId(null)
    }
  }

  /* ── Derived ── */
  const isEditing = editingId !== null

  /* ── Render ── */
  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="text-2xl font-bold font-[Syne]"
            style={{ color: ACCENT }}
          >
            Gallery
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage your portfolio gallery images.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="px-4 py-2 rounded-lg text-sm font-bold transition-all hover:shadow-[0_0_20px_rgba(0,212,255,0.35)]"
          style={{
            background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_2})`,
            color: '#030712',
          }}
        >
          + Add Image
        </button>
      </div>

      {/* Loading */}
      {status === 'loading' && (
        <div className="flex items-center justify-center py-24">
          <div
            className="text-lg animate-pulse"
            style={{ color: ACCENT }}
          >
            Loading images…
          </div>
        </div>
      )}

      {/* Error */}
      {status === 'error' && (
        <div
          className="rounded-xl p-8 text-center"
          style={{ ...glass, border: '1px solid rgba(255,107,107,0.3)' }}
        >
          <p className="text-slate-400 text-sm">{error}</p>
          <button
            onClick={fetchImages}
            className="mt-4 px-4 py-2 rounded-lg text-sm border transition-colors"
            style={{ borderColor: `${ACCENT}40`, color: ACCENT }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty state */}
      {status === 'ready' && images.length === 0 && (
        <div className="rounded-xl p-16 text-center" style={glass}>
          <p className="text-slate-500 text-sm">
            No images yet. Click &ldquo;Add Image&rdquo; to get started.
          </p>
        </div>
      )}

      {/* Grid */}
      {status === 'ready' && images.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {images.map((img) => (
            <div
              key={img.id}
              className="overflow-hidden group"
              style={glass}
            >
              {/* Thumbnail */}
              <div
                className="relative overflow-hidden"
                style={{ aspectRatio: '4/3', background: '#080810' }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.src}
                  alt={img.alt}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                {/* Category badge */}
                <span
                  className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-md text-[10px] font-mono uppercase tracking-wider"
                  style={{
                    background: 'rgba(0,0,0,0.7)',
                    color: ACCENT,
                    backdropFilter: 'blur(4px)',
                    border: `1px solid ${ACCENT}30`,
                  }}
                >
                  {img.category}
                </span>
              </div>

              {/* Info */}
              <div className="p-4">
                <p className="text-slate-200 text-sm font-medium truncate">
                  {img.caption}
                </p>
                <p className="text-slate-500 text-xs mt-1 font-mono">
                  {img.width} × {img.height}
                </p>

                {/* Actions */}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => openEdit(img)}
                    className="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    style={{
                      border: `1px solid ${ACCENT}30`,
                      color: ACCENT,
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(img.id)}
                    disabled={deletingId === img.id}
                    className="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                    style={{
                      border: '1px solid rgba(239,68,68,0.3)',
                      color: '#f87171',
                    }}
                  >
                    {deletingId === img.id ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto"
          style={{
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(8px)',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalOpen(false)
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="gallery-modal-title"
        >
          <div
            className="w-full max-w-lg rounded-2xl overflow-hidden my-auto"
            style={{
              background: 'rgba(10,10,20,0.98)',
              border: `1px solid ${ACCENT}30`,
            }}
          >
            {/* Modal header */}
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{
                borderBottom: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <h2
                id="gallery-modal-title"
                className="font-bold text-slate-100 text-lg font-[Syne]"
              >
                {isEditing ? 'Edit Image' : 'Add Image'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                aria-label="Close modal"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-red-500/20 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4" noValidate>
              {/* src */}
              <div>
                <label htmlFor="g-src" style={labelStyle}>
                  Image URL *
                </label>
                <input
                  id="g-src"
                  type="text"
                  value={form.src}
                  onChange={(e) =>
                    setForm({ ...form, src: e.target.value })
                  }
                  placeholder="/gallery/image.jpg"
                  style={inputStyle(!!formErrors.src)}
                />
                {formErrors.src && (
                  <p style={errStyle}>{formErrors.src}</p>
                )}
              </div>

              {/* caption */}
              <div>
                <label htmlFor="g-caption" style={labelStyle}>
                  Caption *
                </label>
                <input
                  id="g-caption"
                  type="text"
                  value={form.caption}
                  onChange={(e) =>
                    setForm({ ...form, caption: e.target.value })
                  }
                  placeholder="Short caption"
                  style={inputStyle(!!formErrors.caption)}
                />
                {formErrors.caption && (
                  <p style={errStyle}>{formErrors.caption}</p>
                )}
              </div>

              {/* alt */}
              <div>
                <label htmlFor="g-alt" style={labelStyle}>
                  Alt Text *
                </label>
                <textarea
                  id="g-alt"
                  rows={2}
                  value={form.alt}
                  onChange={(e) =>
                    setForm({ ...form, alt: e.target.value })
                  }
                  placeholder="Descriptive alt text for accessibility"
                  style={{
                    ...inputStyle(!!formErrors.alt),
                    resize: 'vertical',
                  }}
                />
                {formErrors.alt && (
                  <p style={errStyle}>{formErrors.alt}</p>
                )}
              </div>

              {/* category */}
              <div>
                <label htmlFor="g-category" style={labelStyle}>
                  Category *
                </label>
                <select
                  id="g-category"
                  value={form.category}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      category: e.target.value as Category,
                    })
                  }
                  style={inputStyle()}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c} style={{ background: '#0a0a14' }}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* width / height */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="g-width" style={labelStyle}>
                    Width *
                  </label>
                  <input
                    id="g-width"
                    type="number"
                    min="1"
                    value={form.width}
                    onChange={(e) =>
                      setForm({ ...form, width: e.target.value })
                    }
                    placeholder="1920"
                    style={inputStyle(!!formErrors.width)}
                  />
                  {formErrors.width && (
                    <p style={errStyle}>{formErrors.width}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="g-height" style={labelStyle}>
                    Height *
                  </label>
                  <input
                    id="g-height"
                    type="number"
                    min="1"
                    value={form.height}
                    onChange={(e) =>
                      setForm({ ...form, height: e.target.value })
                    }
                    placeholder="1080"
                    style={inputStyle(!!formErrors.height)}
                  />
                  {formErrors.height && (
                    <p style={errStyle}>{formErrors.height}</p>
                  )}
                </div>
              </div>

              {/* Submit-level error */}
              {formErrors.submit && (
                <div
                  className="rounded-lg px-3.5 py-3 text-[12px] leading-relaxed"
                  style={{
                    background: 'rgba(255,107,107,0.08)',
                    border: '1px solid rgba(255,107,107,0.3)',
                    color: '#FFB4B4',
                  }}
                >
                  {formErrors.submit}
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={mutating}
                  className="flex-1 px-5 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-60"
                  style={{
                    background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_2})`,
                    color: '#030712',
                  }}
                >
                  {mutating
                    ? 'Saving…'
                    : isEditing
                      ? 'Save Changes'
                      : 'Add Image'}
                </button>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-3 rounded-xl text-sm text-slate-400 hover:text-white border border-[rgba(255,255,255,0.1)] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
