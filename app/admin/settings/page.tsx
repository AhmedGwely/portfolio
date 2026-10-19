'use client'

import { useCallback, useEffect, useState, type CSSProperties, type FormEvent } from 'react'

/* ──────────────────────────────────────────────────────────────────────────
   Theme constants — mirror app/admin/layout.tsx
   ────────────────────────────────────────────────────────────────────────── */
const ACCENT = '#00D4FF'
const ACCENT_2 = '#7C3AED'

type SiteConfig = {
  bookingUrl: string | null
  contactEmail: string
  formspreeEndpoint: string
  siteUrl: string
  siteTitle: string
  siteDescription: string
}

type FormState = {
  siteTitle: string
  siteDescription: string
  siteUrl: string
  contactEmail: string
  bookingUrl: string
  formspreeEndpoint: string
}

type Status = 'idle' | 'loading' | 'ready' | 'error'

/* ──────────────────────────────────────────────────────────────────────────
   Form helpers
   ────────────────────────────────────────────────────────────────────────── */
const emptyForm: FormState = {
  siteTitle: '',
  siteDescription: '',
  siteUrl: '',
  contactEmail: '',
  bookingUrl: '',
  formspreeEndpoint: '',
}

function configToForm(config: SiteConfig): FormState {
  return {
    siteTitle: config.siteTitle,
    siteDescription: config.siteDescription,
    siteUrl: config.siteUrl,
    contactEmail: config.contactEmail,
    bookingUrl: config.bookingUrl ?? '',
    formspreeEndpoint: config.formspreeEndpoint,
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function isValidUrl(value: string): boolean {
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}

function validateForm(form: FormState): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!form.siteTitle.trim()) errors.siteTitle = 'Site title is required'
  if (!form.siteDescription.trim())
    errors.siteDescription = 'Site description is required'
  if (!form.contactEmail.trim()) {
    errors.contactEmail = 'Contact email is required'
  } else if (!EMAIL_RE.test(form.contactEmail.trim())) {
    errors.contactEmail = 'Contact email must be a valid email address'
  }
  if (form.siteUrl.trim() && !isValidUrl(form.siteUrl.trim()))
    errors.siteUrl = 'Site URL must be a valid URL'
  if (form.bookingUrl.trim() && !isValidUrl(form.bookingUrl.trim()))
    errors.bookingUrl = 'Booking URL must be a valid URL (or leave empty)'
  if (form.formspreeEndpoint.trim() && !isValidUrl(form.formspreeEndpoint.trim()))
    errors.formspreeEndpoint = 'Formspree endpoint must be a valid URL'
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
export default function SettingsAdminPage() {
  const [form, setForm] = useState<FormState>(emptyForm)
  const [status, setStatus] = useState<Status>('loading')
  const [error, setError] = useState('')
  const [mutating, setMutating] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState(false)

  /* ── Fetch current config ── */
  const fetchConfig = useCallback(async () => {
    setStatus('loading')
    setError('')
    try {
      const res = await fetch('/api/settings')
      if (!res.ok) throw new Error(`API returned ${res.status}`)
      const data = (await res.json()) as SiteConfig
      setForm(configToForm(data))
      setStatus('ready')
    } catch {
      setError('Failed to load settings. Please try again.')
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  /* ── Submit ── */
  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaved(false)
    const errors = validateForm(form)
    setFormErrors(errors)
    if (Object.keys(errors).length > 0) return

    setMutating(true)
    try {
      const payload = {
        siteTitle: form.siteTitle.trim(),
        siteDescription: form.siteDescription.trim(),
        siteUrl: form.siteUrl.trim(),
        contactEmail: form.contactEmail.trim(),
        bookingUrl: form.bookingUrl.trim() || null,
        formspreeEndpoint: form.formspreeEndpoint.trim(),
      }

      const res = await fetch('/api/settings', {
        method: 'PUT',
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

      setSaved(true)
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Something went wrong'
      setFormErrors({ submit: msg })
    } finally {
      setMutating(false)
    }
  }

  /* ── Render ── */
  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-2xl font-bold font-[Syne]"
          style={{ color: ACCENT }}
        >
          Settings
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Manage your site-wide configuration.
        </p>
      </div>

      {/* Loading */}
      {status === 'loading' && (
        <div className="flex items-center justify-center py-24">
          <div
            className="text-lg animate-pulse"
            style={{ color: ACCENT }}
          >
            Loading settings…
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
            onClick={fetchConfig}
            className="mt-4 px-4 py-2 rounded-lg text-sm border transition-colors"
            style={{ borderColor: `${ACCENT}40`, color: ACCENT }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Form */}
      {status === 'ready' && (
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {/* Success message */}
          {saved && (
            <div
              className="rounded-lg px-4 py-3 text-sm"
              style={{
                background: 'rgba(6,255,165,0.08)',
                border: '1px solid rgba(6,255,165,0.3)',
                color: '#06FFA5',
              }}
            >
              Settings saved successfully.
            </div>
          )}

          {/* siteTitle */}
          <div>
            <label htmlFor="s-siteTitle" style={labelStyle}>
              Site Title *
            </label>
            <input
              id="s-siteTitle"
              type="text"
              value={form.siteTitle}
              onChange={(e) =>
                setForm({ ...form, siteTitle: e.target.value })
              }
              placeholder="Ahmed Gwely | AI Engineer"
              style={inputStyle(!!formErrors.siteTitle)}
            />
            {formErrors.siteTitle && (
              <p style={errStyle}>{formErrors.siteTitle}</p>
            )}
          </div>

          {/* siteDescription */}
          <div>
            <label htmlFor="s-siteDescription" style={labelStyle}>
              Site Description *
            </label>
            <textarea
              id="s-siteDescription"
              rows={2}
              value={form.siteDescription}
              onChange={(e) =>
                setForm({ ...form, siteDescription: e.target.value })
              }
              placeholder="AI — Generative AI, LLMs, AI Agents & Computer Vision"
              style={{
                ...inputStyle(!!formErrors.siteDescription),
                resize: 'vertical',
              }}
            />
            {formErrors.siteDescription && (
              <p style={errStyle}>{formErrors.siteDescription}</p>
            )}
          </div>

          {/* siteUrl */}
          <div>
            <label htmlFor="s-siteUrl" style={labelStyle}>
              Site URL
            </label>
            <input
              id="s-siteUrl"
              type="text"
              value={form.siteUrl}
              onChange={(e) => setForm({ ...form, siteUrl: e.target.value })}
              placeholder="https://ahmed-gwely-portfolio.vercel.app"
              style={inputStyle(!!formErrors.siteUrl)}
            />
            {formErrors.siteUrl && (
              <p style={errStyle}>{formErrors.siteUrl}</p>
            )}
          </div>

          {/* contactEmail */}
          <div>
            <label htmlFor="s-contactEmail" style={labelStyle}>
              Contact Email *
            </label>
            <input
              id="s-contactEmail"
              type="email"
              value={form.contactEmail}
              onChange={(e) =>
                setForm({ ...form, contactEmail: e.target.value })
              }
              placeholder="ahmedgwbs@gmail.com"
              style={inputStyle(!!formErrors.contactEmail)}
            />
            {formErrors.contactEmail && (
              <p style={errStyle}>{formErrors.contactEmail}</p>
            )}
          </div>

          {/* bookingUrl */}
          <div>
            <label htmlFor="s-bookingUrl" style={labelStyle}>
              Booking URL
            </label>
            <input
              id="s-bookingUrl"
              type="text"
              value={form.bookingUrl}
              onChange={(e) =>
                setForm({ ...form, bookingUrl: e.target.value })
              }
              placeholder="https://calendly.com/ahmed-gwely/30min"
              style={inputStyle(!!formErrors.bookingUrl)}
            />
            {formErrors.bookingUrl ? (
              <p style={errStyle}>{formErrors.bookingUrl}</p>
            ) : (
              <p
                style={{
                  fontSize: 11,
                  color: '#64748b',
                  marginTop: 4,
                }}
              >
                Leave empty if no booking service is configured.
              </p>
            )}
          </div>

          {/* formspreeEndpoint */}
          <div>
            <label htmlFor="s-formspreeEndpoint" style={labelStyle}>
              Formspree Endpoint
            </label>
            <input
              id="s-formspreeEndpoint"
              type="text"
              value={form.formspreeEndpoint}
              onChange={(e) =>
                setForm({ ...form, formspreeEndpoint: e.target.value })
              }
              placeholder="https://formspree.io/f/xnjoeqyd"
              style={inputStyle(!!formErrors.formspreeEndpoint)}
            />
            {formErrors.formspreeEndpoint && (
              <p style={errStyle}>{formErrors.formspreeEndpoint}</p>
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

          {/* Save button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={mutating}
              className="px-8 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-60 hover:shadow-[0_0_20px_rgba(0,212,255,0.35)]"
              style={{
                background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_2})`,
                color: '#030712',
              }}
            >
              {mutating ? 'Saving…' : 'Save Settings'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
