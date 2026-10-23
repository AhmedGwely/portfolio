'use client'

import { useCallback, useEffect, useState, type CSSProperties, type FormEvent } from 'react'

/* ──────────────────────────────────────────────────────────────────────────
   Theme constants — mirror app/admin/layout.tsx
   ────────────────────────────────────────────────────────────────────────── */
const ACCENT = '#00D4FF'
const ACCENT_2 = '#7C3AED'

const VIDEO_TYPES = ['youtube', 'tiktok', 'linkedin', 'mp4'] as const

type VideoType = (typeof VIDEO_TYPES)[number]

type Video = {
  id: number
  title: string
  type: VideoType
  url: string
  thumbnail: string
  description: string
  source: string
}

type FormState = {
  title: string
  type: VideoType
  url: string
  thumbnail: string
  description: string
  source: string
}

type Status = 'idle' | 'loading' | 'ready' | 'error'

/* ──────────────────────────────────────────────────────────────────────────
   Form helpers
   ────────────────────────────────────────────────────────────────────────── */
const emptyForm: FormState = {
  title: '',
  type: 'youtube',
  url: '',
  thumbnail: '',
  description: '',
  source: '',
}

function videoToForm(v: Video): FormState {
  return {
    title: v.title,
    type: v.type,
    url: v.url,
    thumbnail: v.thumbnail,
    description: v.description,
    source: v.source,
  }
}

function validateForm(form: FormState): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!form.title.trim()) errors.title = 'Title is required'
  if (!VIDEO_TYPES.includes(form.type)) errors.type = 'Invalid video type'
  if (!form.url.trim()) errors.url = 'URL is required'
  else {
    try {
      new URL(form.url.trim())
    } catch {
      errors.url = 'URL must be a valid URL'
    }
  }
  return errors
}

/** Badge colors per video type. */
const TYPE_COLORS: Record<VideoType, string> = {
  youtube: '#FF0000',
  tiktok: '#000000',
  linkedin: '#0A66C2',
  mp4: '#06FFA5',
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
export default function VideosAdminPage() {
  const [videos, setVideos] = useState<Video[]>([])
  const [status, setStatus] = useState<Status>('loading')
  const [error, setError] = useState('')
  const [mutating, setMutating] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [deletingId, setDeletingId] = useState<number | null>(null)

  /* ── Fetch list ── */
  const fetchVideos = useCallback(async () => {
    setStatus('loading')
    setError('')
    try {
      const res = await fetch('/api/videos')
      if (!res.ok) throw new Error(`API returned ${res.status}`)
      const data = (await res.json()) as Video[]
      setVideos(data)
      setStatus('ready')
    } catch {
      setError('Failed to load videos. Please try again.')
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    fetchVideos()
  }, [fetchVideos])

  /* ── Open modal for add or edit ── */
  function openAdd() {
    setEditingId(null)
    setForm(emptyForm)
    setFormErrors({})
    setModalOpen(true)
  }

  function openEdit(video: Video) {
    setEditingId(video.id)
    setForm(videoToForm(video))
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
        type: form.type,
        url: form.url.trim(),
        thumbnail: form.thumbnail.trim(),
        description: form.description.trim(),
        source: form.source.trim(),
      }

      const url =
        editingId !== null ? `/api/videos/${editingId}` : '/api/videos'
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
      await fetchVideos()
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
    if (!window.confirm('Are you sure you want to delete this video?')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/videos/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string
        } | null
        throw new Error(body?.error ?? `API returned ${res.status}`)
      }
      setVideos((prev) => prev.filter((v) => v.id !== id))
    } catch (err) {
      window.alert(
        err instanceof Error ? err.message : 'Failed to delete video',
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
            Videos
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage your portfolio videos.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="px-4 py-2 rounded-lg text-sm font-bold transition-all hover:shadow-[0_0_20px_rgba(0,212,255,0.35)]"
          style={{
            background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_2})`,
            color: '#0A0A0B',
          }}
        >
          + Add Video
        </button>
      </div>

      {/* Loading */}
      {status === 'loading' && (
        <div className="flex items-center justify-center py-24">
          <div
            className="text-lg animate-pulse"
            style={{ color: ACCENT }}
          >
            Loading videos…
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
            onClick={fetchVideos}
            className="mt-4 px-4 py-2 rounded-lg text-sm border transition-colors"
            style={{ borderColor: `${ACCENT}40`, color: ACCENT }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty state */}
      {status === 'ready' && videos.length === 0 && (
        <div className="rounded-xl p-16 text-center" style={glass}>
          <p className="text-slate-500 text-sm">
            No videos yet. Click &ldquo;Add Video&rdquo; to get started.
          </p>
        </div>
      )}

      {/* Table */}
      {status === 'ready' && videos.length > 0 && (
        <div className="overflow-x-auto" style={glass}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${ACCENT}18` }}>
                <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-wider text-slate-500">Title</th>
                <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-wider text-slate-500">Type</th>
                <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-wider text-slate-500">Source</th>
                <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-wider text-slate-500">Thumbnail</th>
                <th className="text-right px-4 py-3 font-mono text-xs uppercase tracking-wider text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {videos.map((video) => (
                <tr
                  key={video.id}
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <td className="px-4 py-3">
                    <div className="text-slate-200 font-medium truncate max-w-[240px]">
                      {video.title}
                    </div>
                    {video.description && (
                      <p className="text-slate-500 text-xs mt-1 truncate max-w-[240px]">
                        {video.description}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-block px-2.5 py-1 rounded-md text-[10px] font-mono uppercase tracking-wider"
                      style={{
                        background: `${TYPE_COLORS[video.type]}18`,
                        color: TYPE_COLORS[video.type] === '#000000' ? '#e2e8f0' : TYPE_COLORS[video.type],
                        border: `1px solid ${TYPE_COLORS[video.type]}40`,
                      }}
                    >
                      {video.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-slate-400 text-xs font-mono">
                      {video.source || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {video.thumbnail ? (
                      <span
                        className="text-[10px] font-mono px-2 py-1 rounded"
                        style={{
                          background: 'rgba(6,255,165,0.1)',
                          color: '#06FFA5',
                          border: '1px solid rgba(6,255,165,0.2)',
                        }}
                      >
                        Yes
                      </span>
                    ) : (
                      <span className="text-slate-600 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => openEdit(video)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                        style={{
                          border: `1px solid ${ACCENT}30`,
                          color: ACCENT,
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(video.id)}
                        disabled={deletingId === video.id}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                        style={{
                          border: '1px solid rgba(239,68,68,0.3)',
                          color: '#f87171',
                        }}
                      >
                        {deletingId === video.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
          aria-labelledby="videos-modal-title"
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
                id="videos-modal-title"
                className="font-bold text-slate-100 text-lg font-[Syne]"
              >
                {isEditing ? 'Edit Video' : 'Add Video'}
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
              {/* title */}
              <div>
                <label htmlFor="v-title" style={labelStyle}>
                  Title *
                </label>
                <input
                  id="v-title"
                  type="text"
                  value={form.title}
                  onChange={(e) =>
                    setForm({ ...form, title: e.target.value })
                  }
                  placeholder="Video title"
                  style={inputStyle(!!formErrors.title)}
                />
                {formErrors.title && (
                  <p style={errStyle}>{formErrors.title}</p>
                )}
              </div>

              {/* type */}
              <div>
                <label htmlFor="v-type" style={labelStyle}>
                  Type *
                </label>
                <select
                  id="v-type"
                  value={form.type}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      type: e.target.value as VideoType,
                    })
                  }
                  style={inputStyle(!!formErrors.type)}
                >
                  {VIDEO_TYPES.map((t) => (
                    <option key={t} value={t} style={{ background: '#0a0a14' }}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </option>
                  ))}
                </select>
                {formErrors.type && (
                  <p style={errStyle}>{formErrors.type}</p>
                )}
              </div>

              {/* url */}
              <div>
                <label htmlFor="v-url" style={labelStyle}>
                  URL *
                </label>
                <input
                  id="v-url"
                  type="text"
                  value={form.url}
                  onChange={(e) =>
                    setForm({ ...form, url: e.target.value })
                  }
                  placeholder="https://youtu.be/..."
                  style={inputStyle(!!formErrors.url)}
                />
                {formErrors.url && (
                  <p style={errStyle}>{formErrors.url}</p>
                )}
              </div>

              {/* thumbnail */}
              <div>
                <label htmlFor="v-thumbnail" style={labelStyle}>
                  Thumbnail
                </label>
                <input
                  id="v-thumbnail"
                  type="text"
                  value={form.thumbnail}
                  onChange={(e) =>
                    setForm({ ...form, thumbnail: e.target.value })
                  }
                  placeholder="https://img.youtube.com/vi/.../maxresdefault.jpg"
                  style={inputStyle()}
                />
              </div>

              {/* description */}
              <div>
                <label htmlFor="v-description" style={labelStyle}>
                  Description
                </label>
                <textarea
                  id="v-description"
                  rows={2}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Short video description"
                  style={{
                    ...inputStyle(),
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* source */}
              <div>
                <label htmlFor="v-source" style={labelStyle}>
                  Source
                </label>
                <input
                  id="v-source"
                  type="text"
                  value={form.source}
                  onChange={(e) =>
                    setForm({ ...form, source: e.target.value })
                  }
                  placeholder="YouTube"
                  style={inputStyle()}
                />
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
                    color: '#0A0A0B',
                  }}
                >
                  {mutating
                    ? 'Saving…'
                    : isEditing
                      ? 'Save Changes'
                      : 'Add Video'}
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
