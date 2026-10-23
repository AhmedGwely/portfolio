// ProjectCard — 3D tilt card with cursor spotlight + magnetic actions.
//
// Build order step 4: Cards (spotlight + tilt), buttons (magnetic).

'use client'

import { useState, useCallback } from 'react'
import { motion, useMotionValue, useSpring, animate } from 'framer-motion'
import { Play, Github, ExternalLink } from 'lucide-react'
import VideoModal from './VideoModal'
import { isReducedMotion, isCursorDesktop } from './motion-tokens'

export interface ProjectData {
  title: string
  description?: string
  problem: string
  solution: string
  impact: string
  tech: string[]
  github?: string
  live?: string
  video?: {
    type: 'youtube' | 'tiktok' | 'mp4' | 'linkedin'
    url: string
    thumbnail?: string
  }
  badge?: string
  badgeColor?: string
  category?: string
}

function getYouTubeThumbnail(url: string) {
  const match = url.match(/(?:v=|youtu\.be\/|embed\/)([^&\n?#]+)/)
  return match ? `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg` : null
}

export default function ProjectCard({ project, index }: { project: ProjectData; index: number }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [hovered, setHovered] = useState(false)

  // Tilt state — desktop only.
  const tiltX = useMotionValue(0)
  const tiltY = useMotionValue(0)
  const springX = useSpring(tiltX, { damping: 0.15, stiffness: 0.06 })
  const springY = useSpring(tiltY, { damping: 0.15, stiffness: 0.06 })
  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isReducedMotion() || !isCursorDesktop()) return
      const el = e.currentTarget
      const rect = el.getBoundingClientRect()
      const cx = (e.clientX - rect.left) / rect.width
      const cy = (e.clientY - rect.top) / rect.height
      // max ~7 degrees tilt
      animate(springX, (cy - 0.5) * 0.09)
      animate(springY, (cx - 0.5) * 0.09)
    },
    [springX, springY]
  )

  const onMouseLeave = useCallback(() => {
    if (isReducedMotion() || !isCursorDesktop()) return
    animate(springX, 0, { duration: 200, ease: [0.22, 1, 0.36, 1] })
    animate(springY, 0, { duration: 200, ease: [0.22, 1, 0.36, 1] })
  }, [springX, springY])

  const thumbnailUrl = project.video?.thumbnail ||
    (project.video?.type === 'youtube' ? getYouTubeThumbnail(project.video.url) : null)

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        className="group relative overflow-hidden rounded-2xl border border-[rgba(62,207,142,0.12)] transition-shadow duration-300 hover:shadow-[0_8px_32px_rgba(62,207,142,0.12)]"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Cursor spotlight layer — desktop only, behind the card */}
        {isCursorDesktop() && (
          <div className="pointer-events-none absolute inset-0 rounded-2xl">
            <div
              className="absolute rounded-2xl"
              style={{
                background: 'radial-gradient(circle, rgba(62,207,142,0.08), transparent 70%)',
                width: '300px',
                height: '300px',
                borderRadius: '50%',
                transform: 'translate(-50%, -50%)',
                opacity: hovered ? 0.6 : 0.15,
              }}
            />
          </div>
        )}

        {project.video && (
          <div
            className="relative cursor-pointer overflow-hidden"
            style={{ aspectRatio: '16/9' }}
            onClick={() => setModalOpen(true)}
          >
            {thumbnailUrl ? (
              <img
                src={thumbnailUrl}
                alt={project.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[rgba(62,207,142,0.12)] to-[rgba(124,58,237,0.1)] flex items-center justify-center">
                <Play size={40} className="text-[var(--accent)] opacity-50" />
              </div>
            )}

            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors duration-300" />

            {/* Play button */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              whileHover={{ scale: 1.05 }}
            >
              <div className="w-14 h-14 rounded-full bg-[rgba(62,207,142,0.9)] flex items-center justify-center shadow-[0_0_30px_rgba(62,207,142,0.5)]">
                <Play size={22} className="text-[var(--bg)] ml-1" fill="currentColor" />
              </div>
            </motion.div>

            {/* Badge */}
            {project.badge && (
              <div
                className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-xs font-mono font-medium"
                style={{ background: project.badgeColor || 'var(--accent)', color: 'var(--bg)' }}
              >
                {project.badge}
              </div>
            )}

            {/* Video type indicator */}
            <div className="absolute top-3 right-3 px-2 py-1 rounded glass text-xs font-mono var(--text-dim) border border-[rgba(255,255,255,0.1)]">
              {project.video.type === 'youtube' ? '▶ YouTube' : project.video.type === 'tiktok' ? '♪ TikTok' : project.video.type === 'linkedin' ? 'in LinkedIn' : 'Video'}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6 flex flex-col flex-1">
          <h3 className="font-display font-medium var(--text) text-xl mb-3">
            {project.title}
          </h3>

          <div className="space-y-2 mb-4 flex-1">
            <p className="var(--text-dim) text-sm font-body">
              <span className="text-[var(--accent)] font-medium">Problem: </span>
              {project.problem}
            </p>
            <p className="var(--text-dim) text-sm font-body">
              <span className="text-[var(--accent)] font-medium">Solution: </span>
              {project.solution}
            </p>
            <p className="var(--text-dim) text-sm font-body">
              <span className="text-[var(--accent)] font-medium">Impact: </span>
              {project.impact}
            </p>
          </div>

          {/* Tech tags */}
          <div className="flex flex-wrap gap-2 mb-5">
            {project.tech.map(t => (
              <span key={t} className="tech-tag">{t}</span>
            ))}
          </div>

          {/* Actions — magnetic buttons */}
          <div className="flex gap-3 mt-auto">
            {project.video && (
              <motion.button
                onClick={() => setModalOpen(true)}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[rgba(62,207,142,0.15)] border border-[rgba(62,207,142,0.35)] text-[var(--accent)] text-sm font-body transition-all"
              >
                <Play size={14} />
                Watch Demo
              </motion.button>
            )}
            {project.github && (
              <a
                href={project.github}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg glass border border-[rgba(255,255,255,0.1)] var(--text-dim) text-sm font-body hover:var(--text) hover:border-[rgba(255,255,255,0.3)] transition-all"
              >
                <Github size={14} />
                Code
              </a>
            )}
            {project.live && (
              <a
                href={project.live}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg glass border border-[rgba(255,255,255,0.1)] var(--text-dim) text-sm font-body hover:var(--text) hover:border-[rgba(255,255,255,0.3)] transition-all ml-auto"
              >
                <ExternalLink size={14} />
                Live
              </a>
            )}
          </div>
        </div>
      </motion.div>

      {project.video && (
        <VideoModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          video={project.video}
          title={project.title}
        />
      )}
    </>
  )
}
