'use client'

import { useEffect, useState, type CSSProperties } from 'react'

/* ──────────────────────────────────────────────────────────────────────────
   Theme constants — mirror app/admin/layout.tsx
   ────────────────────────────────────────────────────────────────────────── */
const ACCENT = '#3ECF8E'
const ACCENT_2 = '#3ECF8E'

/* ── Types ──────────────────────────────────────────────────────────────── */

type GalleryImage = {
  id: number
  src: string
  caption: string
  alt: string
  category: string
  width: number
  height: number
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
  video?: { type: string; url: string; thumbnail?: string }
  badge: string
  badgeColor: string
  category: string
}

type Video = {
  id: number
  title: string
  type: string
  url: string
  thumbnail: string
  description: string
  source: string
}

type Certificate = {
  id: number
  title: string
  issuer: string
  category: string
  color: string
  emoji: string
  file: string
  preview: string
  type: 'pdf' | 'image'
}

type SiteConfig = {
  bookingUrl: string | null
  contactEmail: string
  formspreeEndpoint: string
  siteUrl: string
  siteTitle: string
  siteDescription: string
}

type DashboardData = {
  gallery: GalleryImage[]
  projects: Project[]
  videos: Video[]
  certificates: Certificate[]
  settings: SiteConfig | null
}

/* ── Inline styles (glass morphism / dark cyberpunk) ───────────────────── */

const glass: CSSProperties = {
  background: 'rgba(13,17,23,0.7)',
  border: `1px solid ${ACCENT}18`,
  backdropFilter: 'blur(12px)',
  borderRadius: 12,
}

const sectionTitle: CSSProperties = {
  fontFamily: 'monospace',
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.15em',
  color: '#64748b',
  marginBottom: 12,
}

/* ── Stat card ─────────────────────────────────────────────────────────── */

function StatCard({
  label,
  count,
  href,
  icon,
  accent,
}: {
  label: string
  count: number
  href: string
  icon: string
  accent: string
}) {
  return (
    <a
      href={href}
      className="block p-5 transition-all hover:scale-[1.02] group"
      style={{
        ...glass,
        borderColor: `${accent}25`,
        textDecoration: 'none',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span style={{ fontSize: 24 }}>{icon}</span>
        <span
          className="text-3xl font-bold font-[Syne]"
          style={{ color: accent }}
        >
          {count}
        </span>
      </div>
      <p
        className="text-sm font-medium"
        style={{ color: '#cbd5e1' }}
      >
        {label}
      </p>
      <p
        className="text-xs mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ color: accent }}
      >
        Manage →
      </p>
    </a>
  )
}

/* ── Quick action button ───────────────────────────────────────────────── */

function QuickAction({
  label,
  href,
  icon,
}: {
  label: string
  href: string
  icon: string
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:shadow-[0_0_16px_rgba(0,212,255,0.25)]"
      style={{
        background: `linear-gradient(135deg, ${ACCENT}12, ${ACCENT_2}12)`,
        border: `1px solid ${ACCENT}30`,
        color: '#e2e8f0',
        textDecoration: 'none',
      }}
    >
      <span>{icon}</span>
      {label}
    </a>
  )
}

/* ── Recent item row ───────────────────────────────────────────────────── */

function RecentItem({
  title,
  subtitle,
  accent,
}: {
  title: string
  subtitle?: string
  accent: string
}) {
  return (
    <div
      className="flex items-center gap-3 py-2.5"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
    >
      <div
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ background: accent }}
      />
      <div className="flex-1 min-w-0">
        <p
          className="text-sm truncate"
          style={{ color: '#e2e8f0' }}
        >
          {title}
        </p>
        {subtitle && (
          <p
            className="text-xs truncate font-mono"
            style={{ color: '#64748b' }}
          >
            {subtitle}
          </p>
        )}
      </div>
    </div>
  )
}

/* ── Main component ────────────────────────────────────────────────────── */

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchAll() {
      setLoading(true)
      setError('')
      try {
        const [galleryRes, projectsRes, videosRes, certsRes, settingsRes] =
          await Promise.all([
            fetch('/api/gallery'),
            fetch('/api/projects'),
            fetch('/api/videos'),
            fetch('/api/certificates'),
            fetch('/api/settings'),
          ])

        if (!galleryRes.ok) throw new Error(`Gallery API returned ${galleryRes.status}`)
        if (!projectsRes.ok) throw new Error(`Projects API returned ${projectsRes.status}`)
        if (!videosRes.ok) throw new Error(`Videos API returned ${videosRes.status}`)
        if (!certsRes.ok) throw new Error(`Certificates API returned ${certsRes.status}`)

        const gallery = (await galleryRes.json()) as GalleryImage[]
        const projects = (await projectsRes.json()) as Project[]
        const videos = (await videosRes.json()) as Video[]
        const certificates = (await certsRes.json()) as Certificate[]
        const settings = settingsRes.ok
          ? ((await settingsRes.json()) as SiteConfig)
          : null

        setData({ gallery, projects, videos, certificates, settings })
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load dashboard data',
        )
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  /* ── Loading state ── */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <div
          className="w-12 h-12 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: `${ACCENT}30`, borderTopColor: ACCENT }}
        />
        <p className="text-sm animate-pulse" style={{ color: ACCENT }}>
          Loading dashboard…
        </p>
      </div>
    )
  }

  /* ── Error state ── */
  if (error || !data) {
    return (
      <div
        className="rounded-xl p-8 text-center max-w-md mx-auto mt-12"
        style={{ ...glass, border: '1px solid rgba(255,107,107,0.3)' }}
      >
        <p className="text-slate-400 text-sm">{error || 'Failed to load data'}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 rounded-lg text-sm border transition-colors"
          style={{ borderColor: `${ACCENT}40`, color: ACCENT }}
        >
          Retry
        </button>
      </div>
    )
  }

  /* ── Derived data ── */
  const recentGallery = data.gallery.slice(-5).reverse()
  const recentProjects = data.projects.slice(-5).reverse()
  const recentVideos = data.videos.slice(-5).reverse()
  const recentCertificates = data.certificates.slice(-5).reverse()

  const totalItems =
    data.gallery.length +
    data.projects.length +
    data.videos.length +
    data.certificates.length

  /* ── Render ── */
  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-3xl font-bold font-[Syne] bg-clip-text text-transparent"
          style={{
            backgroundImage: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_2})`,
          }}
        >
          Dashboard
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Overview of your portfolio content.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Gallery Images"
          count={data.gallery.length}
          href="/admin/gallery"
          icon="🖼"
          accent={ACCENT}
        />
        <StatCard
          label="Projects"
          count={data.projects.length}
          href="/admin/projects"
          icon="🚀"
          accent={ACCENT_2}
        />
        <StatCard
          label="Videos"
          count={data.videos.length}
          href="/admin/videos"
          icon="🎬"
          accent="#06FFA5"
        />
        <StatCard
          label="Certificates"
          count={data.certificates.length}
          href="/admin/certificates"
          icon="🏆"
          accent="#FFD700"
        />
      </div>

      {/* Quick actions */}
      <div className="mb-8">
        <h2 style={sectionTitle}>Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <QuickAction label="Add Image" href="/admin/gallery" icon="+" />
          <QuickAction label="Add Project" href="/admin/projects" icon="+" />
          <QuickAction label="Add Video" href="/admin/videos" icon="+" />
          <QuickAction label="Add Certificate" href="/admin/certificates" icon="+" />
          <QuickAction label="Site Settings" href="/admin/settings" icon="⚙" />
        </div>
      </div>

      {/* Recent activity */}
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Gallery */}
        <div className="p-5" style={glass}>
          <h2 style={sectionTitle}>Recent Gallery</h2>
          {recentGallery.length > 0 ? (
            recentGallery.map((img) => (
              <RecentItem
                key={img.id}
                title={img.caption}
                subtitle={img.category}
                accent={ACCENT}
              />
            ))
          ) : (
            <p className="text-slate-600 text-sm py-2">No images yet.</p>
          )}
        </div>

        {/* Projects */}
        <div className="p-5" style={glass}>
          <h2 style={sectionTitle}>Recent Projects</h2>
          {recentProjects.length > 0 ? (
            recentProjects.map((p) => (
              <RecentItem
                key={p.id}
                title={p.title}
                subtitle={p.category}
                accent={ACCENT_2}
              />
            ))
          ) : (
            <p className="text-slate-600 text-sm py-2">No projects yet.</p>
          )}
        </div>

        {/* Videos */}
        <div className="p-5" style={glass}>
          <h2 style={sectionTitle}>Recent Videos</h2>
          {recentVideos.length > 0 ? (
            recentVideos.map((v) => (
              <RecentItem
                key={v.id}
                title={v.title}
                subtitle={v.type}
                accent="#06FFA5"
              />
            ))
          ) : (
            <p className="text-slate-600 text-sm py-2">No videos yet.</p>
          )}
        </div>

        {/* Certificates */}
        <div className="p-5" style={glass}>
          <h2 style={sectionTitle}>Recent Certificates</h2>
          {recentCertificates.length > 0 ? (
            recentCertificates.map((c) => (
              <RecentItem
                key={c.id}
                title={c.title}
                subtitle={c.issuer}
                accent="#FFD700"
              />
            ))
          ) : (
            <p className="text-slate-600 text-sm py-2">No certificates yet.</p>
          )}
        </div>
      </div>

      {/* Summary footer */}
      <div
        className="mt-8 p-4 text-center"
        style={{ ...glass, border: 'none', background: 'rgba(13,17,23,0.3)' }}
      >
        <p className="text-xs font-mono" style={{ color: '#475569' }}>
          Total items:{' '}
          <span style={{ color: ACCENT }}>{totalItems}</span>
          {' · '}
          Site:{' '}
          <span style={{ color: ACCENT_2 }}>
            {data.settings?.siteTitle || 'Unnamed'}
          </span>
        </p>
      </div>
    </div>
  )
}
