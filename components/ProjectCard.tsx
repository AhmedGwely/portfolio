'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Play, Github, ExternalLink } from 'lucide-react'
import VideoModal from './VideoModal'

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
    type: 'youtube' | 'tiktok' | 'mp4'
    url: string
    thumbnail?: string
  }
  badge?: string
  badgeColor?: string
}

function getYouTubeThumbnail(url: string) {
  const match = url.match(/(?:v=|youtu\.be\/|embed\/)([^&\n?#]+)/)
  return match ? `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg` : null
}

export default function ProjectCard({ project, index }: { project: ProjectData; index: number }) {
  const [modalOpen, setModalOpen] = useState(false)

  const thumbnailUrl = project.video?.thumbnail ||
    (project.video?.type === 'youtube' ? getYouTubeThumbnail(project.video.url) : null)

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="group glass glass-hover rounded-2xl overflow-hidden hover-lift border border-[rgba(0,212,255,0.08)] flex flex-col"
      >
        {/* Video/Thumbnail area */}
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
              <div className="w-full h-full bg-gradient-to-br from-[rgba(0,212,255,0.1)] to-[rgba(124,58,237,0.1)] flex items-center justify-center">
                <Play size={40} className="text-[#00D4FF] opacity-50" />
              </div>
            )}

            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors duration-300" />

            {/* Play button */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              whileHover={{ scale: 1.05 }}
            >
              <div className="w-14 h-14 rounded-full bg-[rgba(0,212,255,0.9)] flex items-center justify-center shadow-[0_0_30px_rgba(0,212,255,0.5)] group-hover:shadow-[0_0_50px_rgba(0,212,255,0.8)] transition-all duration-300">
                <Play size={22} className="text-[#030712] ml-1" fill="currentColor" />
              </div>
            </motion.div>

            {/* Badge */}
            {project.badge && (
              <div
                className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-xs font-mono font-semibold"
                style={{ background: project.badgeColor || '#00D4FF', color: '#030712' }}
              >
                {project.badge}
              </div>
            )}

            {/* Video type indicator */}
            <div className="absolute top-3 right-3 px-2 py-1 rounded glass text-xs font-mono text-slate-400 border border-[rgba(255,255,255,0.1)]">
              {project.video.type === 'youtube' ? '▶ YouTube' : project.video.type === 'tiktok' ? '♪ TikTok' : '🎬 Video'}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6 flex flex-col flex-1">
          <h3 className="font-display font-bold text-slate-100 text-xl mb-3 group-hover:text-[#00D4FF] transition-colors">
            {project.title}
          </h3>

          <div className="space-y-2 mb-4 flex-1">
            <p className="text-slate-500 text-sm font-body">
              <span className="text-[#00D4FF] font-semibold">Problem: </span>
              {project.problem}
            </p>
            <p className="text-slate-500 text-sm font-body">
              <span className="text-[#7C3AED] font-semibold">Solution: </span>
              {project.solution}
            </p>
            <p className="text-slate-500 text-sm font-body">
              <span className="text-[#06FFA5] font-semibold">Impact: </span>
              {project.impact}
            </p>
          </div>

          {/* Tech tags */}
          <div className="flex flex-wrap gap-2 mb-5">
            {project.tech.map(t => (
              <span key={t} className="tech-tag">{t}</span>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-auto">
            {project.video && (
              <button
                onClick={() => setModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[rgba(0,212,255,0.1)] border border-[rgba(0,212,255,0.3)] text-[#00D4FF] text-sm font-body hover:bg-[rgba(0,212,255,0.2)] transition-all"
              >
                <Play size={14} />
                Watch Demo
              </button>
            )}
            {project.github && (
              <a
                href={project.github}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg glass border border-[rgba(255,255,255,0.1)] text-slate-400 text-sm font-body hover:text-white hover:border-[rgba(255,255,255,0.3)] transition-all"
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
                className="flex items-center gap-2 px-4 py-2 rounded-lg glass border border-[rgba(255,255,255,0.1)] text-slate-400 text-sm font-body hover:text-white hover:border-[rgba(255,255,255,0.3)] transition-all ml-auto"
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
