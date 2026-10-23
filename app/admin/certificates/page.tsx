'use client'

import {
  useCallback,
  useEffect,
  useState,
  type CSSProperties,
  type FormEvent,
  type ChangeEvent,
} from 'react'

/* ──────────────────────────────────────────────────────────────────────────
   Theme constants — mirror app/admin/layout.tsx
   ────────────────────────────────────────────────────────────────────────── */
const ACCENT = 'var(--accent)'
const ACCENT_2 = 'var(--accent)'

const CATEGORIES = [
  'Computer Vision',
  'AI & ML',
  'Machine Learning',
  'Data Science',
  'Programming',
  'Engineering',
  'Projects',
  'Quantum',
] as const

const CERT_TYPES = ['pdf', 'image'] as const

type Category = (typeof CATEGORIES)[number]
type CertType = (typeof CERT_TYPES)[number]

type Certificate = {
  id: number
  title: string
  issuer: string
  category: string
  color: string
  emoji: string
  file: string
  preview: string
  type: CertType
}

type FormState = {
  title: string
  issuer: string
  category: Category
  color: string
  emoji: string
  file: string
  preview: string
  type: CertType
}

type Status = 'idle' | 'loading' | 'ready' | 'error'

/* ──────────────────────────────────────────────────────────────────────────
   Form helpers
   ────────────────────────────────────────────────────────────────────────── */
const emptyForm: FormState = {
  title: '',
  issuer: '',
  category: 'Computer Vision',
  color: 'var(--accent)',
  emoji: '',
  file: '',
  preview: '',
  type: 'pdf',
}

function certToForm(c: Certificate): FormState {
  return {
    title: c.title,
    issuer: c.issuer,
    category: (CATEGORIES as readonly string[]).includes(c.category)
      ? (c.category as Category)
      : 'Computer Vision',
    color: c.color,
    emoji: c.emoji,
    file: c.file,
    preview: c.preview,
    type: c.type,
  }
}

function validateForm(form: FormState): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!form.title.trim()) errors.title = 'Title is required'
  if (!form.issuer.trim()) errors.issuer = 'Issuer is required'
  if (!form.color.trim()) {
    errors.color = 'Color is required'
  } else if (!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(form.color.trim())) {
    errors.color = 'Color must be a valid hex (e.g. #RRGGBB)'
  }
  if (!form.emoji.trim()) errors.emoji = 'Emoji is required'
  if (!form.file.trim()) errors.file = 'File path is required'
  if (!form.preview.trim()) errors.preview = 'Preview path is required'
  if (!form.type || !(CERT_TYPES as readonly string[]).includes(form.type)) {
    errors.type = 'Type must be pdf or image'
  }
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
export default function CertificatesAdminPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [status, setStatus] = useState<Status>('loading')
  const [error, setError] = useState('')
  const [mutating, setMutating] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [deletingId, setDeletingId] = useState<number | null>(null)

  /* ── Fetch list ── */
  const fetchCertificates = useCallback(async () => {
    setStatus('loading')
    setError('')
    try {
      const res = await fetch('/api/certificates')
      if (!res.ok) throw new Error(`API returned ${res.status}`)
      const data = (await res.json()) as Certificate[]
      setCertificates(data)
      setStatus('ready')
    } catch {
      setError('Failed to load certificates. Please try again.')
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    fetchCertificates()
  }, [fetchCertificates])

  /* ── Open modal for add or edit ── */
  function openAdd() {
    setEditingId(null)
    setForm(emptyForm)
    setFormErrors({})
    setModalOpen(true)
  }

  function openEdit(cert: Certificate) {
    setEditingId(cert.id)
    setForm(certToForm(cert))
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
        title: form.title.trim(),
        issuer: form.issuer.trim(),
        category: form.category,
        color: form.color.trim(),
        emoji: form.emoji.trim(),
        file: form.file.trim(),
        preview: form.preview.trim(),
        type: form.type,
      }

      const url =
        editingId !== null
          ? `/api/certificates/${editingId}`
          : '/api/certificates'
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
      await fetchCertificates()
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
    if (
      !window.confirm('Are you sure you want to delete this certificate?')
    )
      return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/certificates/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string
        } | null
        throw new Error(body?.error ?? `API returned ${res.status}`)
      }
      setCertificates((prev) => prev.filter((c) => c.id !== id))
    } catch (err) {
      window.alert(
        err instanceof Error ? err.message : 'Failed to delete certificate',
      )
    } finally {
      setDeletingId(null)
    }
  }

  /* ── Color picker helper ── */
  function handleColorChange(e: ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, color: e.target.value })
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
            className="text-2xl font-semibold font-display"
            style={{ color: ACCENT }}
          >
            Certificates
          </h1>
          <p className="#5C5C5C text-sm mt-1">
            Manage your certificates & credentials.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:shadow-[0_0_20px_rgba(0,212,255,0.35)]"
          style={{
            background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_2})`,
            color: '#0A0A0B',
          }}
        >
          + Add Certificate
        </button>
      </div>

      {/* Loading */}
      {status === 'loading' && (
        <div className="flex items-center justify-center py-24">
          <div className="text-lg animate-pulse" style={{ color: ACCENT }}>
            Loading certificates…
          </div>
        </div>
      )}

      {/* Error */}
      {status === 'error' && (
        <div
          className="rounded-xl p-8 text-center"
          style={{
            ...glass,
            border: '1px solid rgba(255,107,107,0.3)',
          }}
        >
          <p className="#5C5C5C text-sm">{error}</p>
          <button
            onClick={fetchCertificates}
            className="mt-4 px-4 py-2 rounded-lg text-sm border transition-colors"
            style={{ borderColor: `${ACCENT}40`, color: ACCENT }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty state */}
      {status === 'ready' && certificates.length === 0 && (
        <div className="rounded-xl p-16 text-center" style={glass}>
          <p className="#5C5C5C text-sm">
            No certificates yet. Click &ldquo;Add Certificate&rdquo; to get
            started.
          </p>
        </div>
      )}

      {/* Grid */}
      {status === 'ready' && certificates.length > 0 && (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {certificates.map((cert) => (
            <div
              key={cert.id}
              className="rounded-xl overflow-hidden transition-all hover:scale-[1.02]"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${cert.color}22`,
                boxShadow: `0 4px 20px ${cert.color}08`,
              }}
            >
              {/* Preview thumbnail */}
              <div
                className="relative overflow-hidden"
                style={{ height: 140, background: '#0a0a14' }}
              >
                <img
                  src={cert.preview}
                  alt={cert.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {/* Badges */}
                <div className="absolute top-2 left-2 flex gap-1.5">
                  <span
                    className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase"
                    style={{
                      background: `${cert.color}30`,
                      color: cert.color,
                      border: `1px solid ${cert.color}45`,
                    }}
                  >
                    {cert.type}
                  </span>
                  <span
                    className="w-3 h-3 rounded-full inline-block"
                    style={{
                      background: cert.color,
                      border: '1px solid rgba(255,255,255,0.2)',
                    }}
                  />
                </div>
              </div>

              {/* Card body */}
              <div className="p-3.5">
                <div
                  className="font-mono text-[9px] uppercase tracking-widest mb-1"
                  style={{ color: cert.color }}
                >
                  {cert.category}
                </div>
                <h3 className="#9B9B9B text-xs font-semibold leading-snug line-clamp-2 mb-1">
                  {cert.emoji} {cert.title}
                </h3>
                <p className="#5C5C5C text-[10px] truncate mb-3">
                  {cert.issuer}
                </p>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(cert)}
                    className="flex-1 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-colors text-center"
                    style={{
                      border: `1px solid ${ACCENT}30`,
                      color: ACCENT,
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(cert.id)}
                    disabled={deletingId === cert.id}
                    className="flex-1 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-colors text-center disabled:opacity-50"
                    style={{
                      border: '1px solid rgba(239,68,68,0.3)',
                      color: '#f87171',
                    }}
                  >
                    {deletingId === cert.id ? '…' : 'Delete'}
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
          aria-labelledby="certs-modal-title"
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
                id="certs-modal-title"
                className="font-semibold text-slate-100 text-lg font-display"
              >
                {isEditing ? 'Edit Certificate' : 'Add Certificate'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                aria-label="Close modal"
                className="w-8 h-8 rounded-lg flex items-center justify-center #5C5C5C hover:text-white hover:bg-red-500/20 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto"
              noValidate
            >
              {/* title */}
              <div>
                <label htmlFor="c-title" style={labelStyle}>
                  Title *
                </label>
                <input
                  id="c-title"
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Certificate title"
                  style={inputStyle(!!formErrors.title)}
                />
                {formErrors.title && (
                  <p style={errStyle}>{formErrors.title}</p>
                )}
              </div>

              {/* issuer */}
              <div>
                <label htmlFor="c-issuer" style={labelStyle}>
                  Issuer *
                </label>
                <input
                  id="c-issuer"
                  type="text"
                  value={form.issuer}
                  onChange={(e) =>
                    setForm({ ...form, issuer: e.target.value })
                  }
                  placeholder="Issuing organization"
                  style={inputStyle(!!formErrors.issuer)}
                />
                {formErrors.issuer && (
                  <p style={errStyle}>{formErrors.issuer}</p>
                )}
              </div>

              {/* category + type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="c-category" style={labelStyle}>
                    Category *
                  </label>
                  <select
                    id="c-category"
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
                      <option
                        key={c}
                        value={c}
                        style={{ background: '#0a0a14' }}
                      >
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="c-type" style={labelStyle}>
                    Type *
                  </label>
                  <select
                    id="c-type"
                    value={form.type}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        type: e.target.value as CertType,
                      })
                    }
                    style={inputStyle(!!formErrors.type)}
                  >
                    {CERT_TYPES.map((t) => (
                      <option
                        key={t}
                        value={t}
                        style={{ background: '#0a0a14' }}
                      >
                        {t}
                      </option>
                    ))}
                  </select>
                  {formErrors.type && (
                    <p style={errStyle}>{formErrors.type}</p>
                  )}
                </div>
              </div>

              {/* color + emoji */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="c-color" style={labelStyle}>
                    Color *
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="c-color"
                      type="color"
                      value={form.color}
                      onChange={handleColorChange}
                      className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent"
                      style={{ padding: 0 }}
                    />
                    <input
                      type="text"
                      value={form.color}
                      onChange={(e) =>
                        setForm({ ...form, color: e.target.value })
                      }
                      placeholder="#3ECF8E"
                      className="flex-1"
                      style={inputStyle(!!formErrors.color)}
                    />
                  </div>
                  {formErrors.color && (
                    <p style={errStyle}>{formErrors.color}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="c-emoji" style={labelStyle}>
                    Emoji *
                  </label>
                  <input
                    id="c-emoji"
                    type="text"
                    value={form.emoji}
                    onChange={(e) =>
                      setForm({ ...form, emoji: e.target.value })
                    }
                    placeholder="🏆"
                    style={inputStyle(!!formErrors.emoji)}
                  />
                  {formErrors.emoji && (
                    <p style={errStyle}>{formErrors.emoji}</p>
                  )}
                </div>
              </div>

              {/* file */}
              <div>
                <label htmlFor="c-file" style={labelStyle}>
                  File Path *
                </label>
                <input
                  id="c-file"
                  type="text"
                  value={form.file}
                  onChange={(e) => setForm({ ...form, file: e.target.value })}
                  placeholder="/certificates/example.pdf"
                  style={inputStyle(!!formErrors.file)}
                />
                {formErrors.file && (
                  <p style={errStyle}>{formErrors.file}</p>
                )}
              </div>

              {/* preview */}
              <div>
                <label htmlFor="c-preview" style={labelStyle}>
                  Preview Path *
                </label>
                <input
                  id="c-preview"
                  type="text"
                  value={form.preview}
                  onChange={(e) =>
                    setForm({ ...form, preview: e.target.value })
                  }
                  placeholder="/certificates/previews/example.png"
                  style={inputStyle(!!formErrors.preview)}
                />
                {formErrors.preview && (
                  <p style={errStyle}>{formErrors.preview}</p>
                )}
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
                  className="flex-1 px-5 py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-60"
                  style={{
                    background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_2})`,
                    color: '#0A0A0B',
                  }}
                >
                  {mutating
                    ? 'Saving…'
                    : isEditing
                      ? 'Save Changes'
                      : 'Add Certificate'}
                </button>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-3 rounded-xl text-sm #5C5C5C hover:text-white border border-[rgba(255,255,255,0.1)] transition-colors"
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
