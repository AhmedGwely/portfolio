'use client'

import { useCallback, useEffect, useState, type CSSProperties, type FormEvent } from 'react'

/* ──────────────────────────────────────────────────────────────────────────
   Theme constants — mirror app/admin/layout.tsx
   ────────────────────────────────────────────────────────────────────────── */
const ACCENT = '#00D4FF'
const ACCENT_2 = '#7C3AED'

const CATEGORIES = [
  'Computer Vision',
  'IoT & Edge',
  'AI & Machine Learning',
  'Data Science',
] as const

type Category = (typeof CATEGORIES)[number]

type VideoType = 'youtube' | 'tiktok' | 'linkedin' | 'mp4'

type ProjectVideo = {
  type: VideoType
  url: string
  thumbnail?: string
}

type Project = {
  id: number
  title: string
  description: string
  problem: string
  solution: string
  impact: string
  tech: string[]
  github: string
  live: string
  video?: ProjectVideo
  badge: string
  badgeColor: string
  category: Category
}

type FormState = {
  title: string
  description: string
  problem: string
  solution: string
  impact: string
  tech: string
  github: string
  live: string
  videoType: VideoType
  videoUrl: string
  videoThumbnail: string
  badge: string
  badgeColor: string
  category: Category
}

type Status = 'idle' | 'loading' | 'ready' | 'error'

/* ──────────────────────────────────────────────────────────────────────────
   Form helpers
   ────────────────────────────────────────────────────────────────────────── */
const emptyForm: FormState = {
  title: '',
  description: '',
  problem: '',
  solution: '',
  impact: '',
  tech: '',
  github: '',
  live: '',
  videoType: 'youtube',
  videoUrl: '',
  videoThumbnail: '',
  badge: '',
  badgeColor: '#00D4FF',
  category: 'Computer Vision',
}

function projectToForm(p: Project): FormState {
  return {
    title: p.title,
    description: p.description,
    problem: p.problem,
    solution: p.solution,
    impact: p.impact,
    tech: p.tech.join(', '),
    github: p.github,
    live: p.live,
    videoType: p.video?.type ?? 'youtube',
    videoUrl: p.video?.url ?? '',
    videoThumbnail: p.video?.thumbnail ?? '',
    badge: p.badge,
    badgeColor: p.badgeColor,
    category: p.category as Category,
  }
}

function validateForm(form: FormState): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!form.title.trim()) errors.title = 'Title is required'
  if (!form.problem.trim()) errors.problem = 'Problem is required'
  if (!form.solution.trim()) errors.solution = 'Solution is required'
  if (!form.impact.trim()) errors.impact = 'Impact is required'
  const techList = form.tech.split(',').map((t) => t.trim()).filter(Boolean)
  if (techList.length === 0) errors.tech = 'At least one technology is required'
  if (form.videoUrl.trim() && !form.videoType) errors.videoType = 'Video type is required when URL is provided'
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
export default function ProjectsAdminPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [status, setStatus] = useState<Status>('loading')
  const [error, setError] = useState('')
  const [mutating, setMutating] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [deletingId, setDeletingId] = useState<number | null>(null)

  /* ── Fetch list ── */
  const fetchProjects = useCallback(async () => {
    setStatus('loading')
    setError('')
    try {
      const res = await fetch('/api/projects')
      if (!res.ok) throw new Error(`API returned ${res.status}`)
      const data = (await res.json()) as Project[]
      setProjects(data)
      setStatus('ready')
    } catch {
      setError('Failed to load projects. Please try again.')
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  /* ── Open modal for add or edit ── */
  function openAdd() {
    setEditingId(null)
    setForm(emptyForm)
    setFormErrors({})
    setModalOpen(true)
  }

  function openEdit(project: Project) {
    setEditingId(project.id)
    setForm(projectToForm(project))
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
        description: form.description.trim(),
        problem: form.problem.trim(),
        solution: form.solution.trim(),
        impact: form.impact.trim(),
        tech: form.tech.split(',').map((t) => t.trim()).filter(Boolean),
        github: form.github.trim(),
        live: form.live.trim(),
        video: form.videoUrl.trim()
          ? {
              type: form.videoType,
              url: form.videoUrl.trim(),
              thumbnail: form.videoThumbnail.trim() || undefined,
            }
          : undefined,
        badge: form.badge.trim(),
        badgeColor: form.badgeColor.trim() || '#00D4FF',
        category: form.category,
      }

      const url =
        editingId !== null ? `/api/projects/${editingId}` : '/api/projects'
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
      await fetchProjects()
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
    if (!window.confirm('Are you sure you want to delete this project?')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string
        } | null
        throw new Error(body?.error ?? `API returned ${res.status}`)
      }
      setProjects((prev) => prev.filter((p) => p.id !== id))
    } catch (err) {
      window.alert(
        err instanceof Error ? err.message : 'Failed to delete project',
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
            Projects
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage your portfolio projects.
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
          + Add Project
        </button>
      </div>

      {/* Loading */}
      {status === 'loading' && (
        <div className="flex items-center justify-center py-24">
          <div
            className="text-lg animate-pulse"
            style={{ color: ACCENT }}
          >
            Loading projects…
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
            onClick={fetchProjects}
            className="mt-4 px-4 py-2 rounded-lg text-sm border transition-colors"
            style={{ borderColor: `${ACCENT}40`, color: ACCENT }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty state */}
      {status === 'ready' && projects.length === 0 && (
        <div className="rounded-xl p-16 text-center" style={glass}>
          <p className="text-slate-500 text-sm">
            No projects yet. Click &ldquo;Add Project&rdquo; to get started.
          </p>
        </div>
      )}

      {/* Table */}
      {status === 'ready' && projects.length > 0 && (
        <div className="overflow-x-auto" style={glass}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${ACCENT}18` }}>
                <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-wider text-slate-500">Title</th>
                <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-wider text-slate-500">Category</th>
                <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-wider text-slate-500">Tech</th>
                <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-wider text-slate-500">Video</th>
                <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-wider text-slate-500">GitHub</th>
                <th className="text-right px-4 py-3 font-mono text-xs uppercase tracking-wider text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr
                  key={project.id}
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <td className="px-4 py-3">
                    <div className="text-slate-200 font-medium truncate max-w-[200px]">
                      {project.title}
                    </div>
                    {project.badge && (
                      <span
                        className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-mono"
                        style={{
                          background: project.badgeColor || ACCENT,
                          color: '#030712',
                        }}
                      >
                        {project.badge}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="px-2 py-1 rounded-md text-[10px] font-mono uppercase tracking-wider"
                      style={{
                        background: `${ACCENT}15`,
                        color: ACCENT,
                        border: `1px solid ${ACCENT}30`,
                      }}
                    >
                      {project.category}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {project.tech.slice(0, 3).map((t) => (
                        <span
                          key={t}
                          className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/5 text-slate-400"
                        >
                          {t}
                        </span>
                      ))}
                      {project.tech.length > 3 && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/5 text-slate-500">
                          +{project.tech.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {project.video ? (
                      <span
                        className="text-[10px] font-mono px-2 py-1 rounded"
                        style={{
                          background: 'rgba(6,255,165,0.1)',
                          color: '#06FFA5',
                          border: '1px solid rgba(6,255,165,0.2)',
                        }}
                      >
                        {project.video.type}
                      </span>
                    ) : (
                      <span className="text-slate-600 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {project.github ? (
                      <a
                        href={project.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-mono hover:underline"
                        style={{ color: ACCENT }}
                      >
                        View
                      </a>
                    ) : (
                      <span className="text-slate-600 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => openEdit(project)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                        style={{
                          border: `1px solid ${ACCENT}30`,
                          color: ACCENT,
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(project.id)}
                        disabled={deletingId === project.id}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                        style={{
                          border: '1px solid rgba(239,68,68,0.3)',
                          color: '#f87171',
                        }}
                      >
                        {deletingId === project.id ? 'Deleting…' : 'Delete'}
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
          aria-labelledby="projects-modal-title"
        >
          <div
            className="w-full max-w-2xl rounded-2xl overflow-hidden my-auto"
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
                id="projects-modal-title"
                className="font-bold text-slate-100 text-lg font-[Syne]"
              >
                {isEditing ? 'Edit Project' : 'Add Project'}
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
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto" noValidate>
              {/* title */}
              <div>
                <label htmlFor="p-title" style={labelStyle}>
                  Title *
                </label>
                <input
                  id="p-title"
                  type="text"
                  value={form.title}
                  onChange={(e) =>
                    setForm({ ...form, title: e.target.value })
                  }
                  placeholder="Project title"
                  style={inputStyle(!!formErrors.title)}
                />
                {formErrors.title && (
                  <p style={errStyle}>{formErrors.title}</p>
                )}
              </div>

              {/* description */}
              <div>
                <label htmlFor="p-description" style={labelStyle}>
                  Description
                </label>
                <textarea
                  id="p-description"
                  rows={2}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Short project description"
                  style={{
                    ...inputStyle(!!formErrors.description),
                    resize: 'vertical',
                  }}
                />
                {formErrors.description && (
                  <p style={errStyle}>{formErrors.description}</p>
                )}
              </div>

              {/* problem */}
              <div>
                <label htmlFor="p-problem" style={labelStyle}>
                  Problem *
                </label>
                <textarea
                  id="p-problem"
                  rows={2}
                  value={form.problem}
                  onChange={(e) =>
                    setForm({ ...form, problem: e.target.value })
                  }
                  placeholder="What problem does this solve?"
                  style={{
                    ...inputStyle(!!formErrors.problem),
                    resize: 'vertical',
                  }}
                />
                {formErrors.problem && (
                  <p style={errStyle}>{formErrors.problem}</p>
                )}
              </div>

              {/* solution */}
              <div>
                <label htmlFor="p-solution" style={labelStyle}>
                  Solution *
                </label>
                <textarea
                  id="p-solution"
                  rows={2}
                  value={form.solution}
                  onChange={(e) =>
                    setForm({ ...form, solution: e.target.value })
                  }
                  placeholder="How did you solve it?"
                  style={{
                    ...inputStyle(!!formErrors.solution),
                    resize: 'vertical',
                  }}
                />
                {formErrors.solution && (
                  <p style={errStyle}>{formErrors.solution}</p>
                )}
              </div>

              {/* impact */}
              <div>
                <label htmlFor="p-impact" style={labelStyle}>
                  Impact *
                </label>
                <textarea
                  id="p-impact"
                  rows={2}
                  value={form.impact}
                  onChange={(e) =>
                    setForm({ ...form, impact: e.target.value })
                  }
                  placeholder="What was the impact?"
                  style={{
                    ...inputStyle(!!formErrors.impact),
                    resize: 'vertical',
                  }}
                />
                {formErrors.impact && (
                  <p style={errStyle}>{formErrors.impact}</p>
                )}
              </div>

              {/* tech */}
              <div>
                <label htmlFor="p-tech" style={labelStyle}>
                  Tech * (comma-separated)
                </label>
                <input
                  id="p-tech"
                  type="text"
                  value={form.tech}
                  onChange={(e) =>
                    setForm({ ...form, tech: e.target.value })
                  }
                  placeholder="Python, YOLOv8, OpenCV"
                  style={inputStyle(!!formErrors.tech)}
                />
                {formErrors.tech && (
                  <p style={errStyle}>{formErrors.tech}</p>
                )}
              </div>

              {/* github / live */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="p-github" style={labelStyle}>
                    GitHub
                  </label>
                  <input
                    id="p-github"
                    type="text"
                    value={form.github}
                    onChange={(e) =>
                      setForm({ ...form, github: e.target.value })
                    }
                    placeholder="https://github.com/..."
                    style={inputStyle()}
                  />
                </div>
                <div>
                  <label htmlFor="p-live" style={labelStyle}>
                    Live URL
                  </label>
                  <input
                    id="p-live"
                    type="text"
                    value={form.live}
                    onChange={(e) =>
                      setForm({ ...form, live: e.target.value })
                    }
                    placeholder="https://..."
                    style={inputStyle()}
                  />
                </div>
              </div>

              {/* video type / url */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="p-videoType" style={labelStyle}>
                    Video Type
                  </label>
                  <select
                    id="p-videoType"
                    value={form.videoType}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        videoType: e.target.value as VideoType,
                      })
                    }
                    style={inputStyle()}
                  >
                    <option value="youtube" style={{ background: '#0a0a14' }}>YouTube</option>
                    <option value="tiktok" style={{ background: '#0a0a14' }}>TikTok</option>
                    <option value="linkedin" style={{ background: '#0a0a14' }}>LinkedIn</option>
                    <option value="mp4" style={{ background: '#0a0a14' }}>MP4</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="p-videoUrl" style={labelStyle}>
                    Video URL
                  </label>
                  <input
                    id="p-videoUrl"
                    type="text"
                    value={form.videoUrl}
                    onChange={(e) =>
                      setForm({ ...form, videoUrl: e.target.value })
                    }
                    placeholder="https://youtu.be/..."
                    style={inputStyle()}
                  />
                </div>
              </div>

              {/* video thumbnail */}
              <div>
                <label htmlFor="p-videoThumbnail" style={labelStyle}>
                  Video Thumbnail
                </label>
                <input
                  id="p-videoThumbnail"
                  type="text"
                  value={form.videoThumbnail}
                  onChange={(e) =>
                    setForm({ ...form, videoThumbnail: e.target.value })
                  }
                  placeholder="https://img.youtube.com/vi/.../maxresdefault.jpg"
                  style={inputStyle()}
                />
              </div>

              {/* badge / badgeColor */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="p-badge" style={labelStyle}>
                    Badge
                  </label>
                  <input
                    id="p-badge"
                    type="text"
                    value={form.badge}
                    onChange={(e) =>
                      setForm({ ...form, badge: e.target.value })
                    }
                    placeholder="🚀 Production"
                    style={inputStyle()}
                  />
                </div>
                <div>
                  <label htmlFor="p-badgeColor" style={labelStyle}>
                    Badge Color
                  </label>
                  <input
                    id="p-badgeColor"
                    type="text"
                    value={form.badgeColor}
                    onChange={(e) =>
                      setForm({ ...form, badgeColor: e.target.value })
                    }
                    placeholder="#00D4FF"
                    style={inputStyle()}
                  />
                </div>
              </div>

              {/* category */}
              <div>
                <label htmlFor="p-category" style={labelStyle}>
                  Category *
                </label>
                <select
                  id="p-category"
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
                      : 'Add Project'}
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
