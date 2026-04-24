'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { Play, Github } from 'lucide-react'
import VideoModal from './VideoModal'

const featured = [
  {
    title: 'Sign Language Recognition',
    headline: 'Making AI speak the language of the deaf',
    description: 'A real-time sign language classifier powered by MediaPipe hand landmark detection and a trained ML classifier. No expensive hardware — just a webcam and computer vision. Built to make communication more accessible for the deaf and hard-of-hearing community.',
    tech: ['Python', 'MediaPipe', 'Scikit-learn', 'OpenCV', 'NumPy'],
    github: 'https://github.com/AhmedGwely',
    video: {
      type: 'youtube' as const,
      url: 'https://youtu.be/h96VBPSGO2k',
      thumbnail: 'https://img.youtube.com/vi/h96VBPSGO2k/maxresdefault.jpg',
    },
    stats: [
      { label: 'Real-Time', value: '✓' },
      { label: 'Hardware', value: 'Webcam' },
      { label: 'Framework', value: 'MediaPipe' },
    ],
    accent: '#06FFA5',
  },
  {
    title: 'Temple Run — Body as Controller',
    headline: 'Your body is the keyboard',
    description: 'Full game control using only pose estimation — no keyboard, no mouse, no controller. OpenCV captures the webcam feed, MediaPipe extracts full-body pose landmarks in real-time, and custom logic maps body positions to game inputs. Jump by jumping. Duck by ducking.',
    tech: ['Python', 'OpenCV', 'MediaPipe', 'PyAutoGUI', 'Pose Estimation'],
    github: 'https://github.com/AhmedGwely',
    video: {
      type: 'youtube' as const,
      url: 'https://youtu.be/Z_daZ8G1Qls',
      thumbnail: 'https://img.youtube.com/vi/Z_daZ8G1Qls/maxresdefault.jpg',
    },
    stats: [
      { label: 'Input Device', value: 'Body' },
      { label: 'Latency', value: 'Real-Time' },
      { label: 'Controller', value: 'None' },
    ],
    accent: '#7C3AED',
  },
  {
    title: 'Hand Gestures → 3D Shape Control',
    headline: 'Touch-free 3D interaction with bare hands',
    description: 'Interact with 3D shapes using nothing but your hands. MediaPipe tracks 21 hand keypoints per frame, which are mapped to 3D transformations — rotate, scale, and position objects with natural hand movements. A glimpse into the future of touchless interfaces.',
    tech: ['Python', 'MediaPipe', 'OpenCV', 'NumPy', '3D Math'],
    github: 'https://github.com/AhmedGwely',
    video: {
      type: 'youtube' as const,
      url: 'https://youtu.be/9v3JB-1kxgg',
      thumbnail: 'https://img.youtube.com/vi/9v3JB-1kxgg/maxresdefault.jpg',
    },
    stats: [
      { label: 'Keypoints', value: '21/hand' },
      { label: 'Input', value: 'Gestures' },
      { label: 'Display', value: '3D Live' },
    ],
    accent: '#00D4FF',
  },
]

function FeaturedCard({ project, index }: { project: typeof featured[0]; index: number }) {
  const [modalOpen, setModalOpen] = useState(false)
  const { ref, inView } = useInView({ threshold: 0.1, triggerOnce: true })
  const isReversed = index % 2 === 1

  return (
    <>
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 60 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className={`flex flex-col lg:flex-row ${isReversed ? 'lg:flex-row-reverse' : ''} gap-8 items-center`}
      >
        {/* Video side */}
        <div className="w-full lg:w-3/5">
          <div
            className="relative rounded-2xl overflow-hidden cursor-pointer group"
            style={{ aspectRatio: '16/9', border: `1px solid ${project.accent}30` }}
            onClick={() => setModalOpen(true)}
          >
            <img
              src={project.video.thumbnail}
              alt={project.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

            {/* Hover tint */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
              style={{ background: `linear-gradient(135deg, ${project.accent}10, transparent)` }}
            />

            {/* Play button */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{
                  background: `${project.accent}E6`,
                  boxShadow: `0 0 40px ${project.accent}60`,
                }}
              >
                <Play size={30} className="text-[#030712] ml-1.5" fill="currentColor" />
              </motion.div>
            </div>

            {/* Stats bar */}
            <div className="absolute bottom-0 left-0 right-0 px-6 py-4 flex gap-6">
              {project.stats.map(s => (
                <div key={s.label}>
                  <div className="font-display font-bold text-xl" style={{ color: project.accent }}>{s.value}</div>
                  <div className="font-mono text-xs text-slate-400">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Text side */}
        <div className="w-full lg:w-2/5 px-2">
          <div className="font-mono text-xs uppercase tracking-widest mb-3" style={{ color: project.accent }}>
            Featured Project
          </div>
          <h3 className="font-display font-bold text-3xl sm:text-4xl text-slate-100 mb-2 leading-tight">
            {project.title}
          </h3>
          <p className="font-body text-lg font-medium text-slate-400 mb-4 italic">
            &ldquo;{project.headline}&rdquo;
          </p>
          <p className="font-body text-slate-500 text-sm leading-relaxed mb-6">
            {project.description}
          </p>
          <div className="flex flex-wrap gap-2 mb-8">
            {project.tech.map(t => (
              <span key={t} className="tech-tag">{t}</span>
            ))}
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-body font-semibold text-sm transition-all duration-300"
              style={{
                background: `${project.accent}20`,
                border: `1px solid ${project.accent}50`,
                color: project.accent,
              }}
            >
              <Play size={16} />
              Watch Demo
            </button>
            <a
              href={project.github}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-3 rounded-xl glass border border-[rgba(255,255,255,0.1)] text-slate-400 font-body text-sm hover:text-white hover:border-[rgba(255,255,255,0.3)] transition-all"
            >
              <Github size={16} />
              Code
            </a>
          </div>
        </div>
      </motion.div>

      <VideoModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        video={project.video}
        title={project.title}
      />
    </>
  )
}

export default function FeaturedProjects() {
  const { ref, inView } = useInView({ threshold: 0.05, triggerOnce: true })

  return (
    <section id="featured" ref={ref} className="py-32 px-6 bg-[rgba(0,212,255,0.015)]">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          className="mb-20"
        >
          <div className="flex items-center gap-4 mb-4">
            <span className="font-mono text-[#00D4FF] text-sm">04.</span>
            <span className="text-slate-600 font-mono text-xs uppercase tracking-widest">Spotlight</span>
            <div className="flex-1 h-px bg-gradient-to-r from-[rgba(0,212,255,0.3)] to-transparent" />
          </div>
          <h2 className="font-display font-bold text-4xl sm:text-5xl text-slate-100">
            Featured <span className="gradient-text">Work</span>
          </h2>
        </motion.div>

        <div className="space-y-28">
          {featured.map((project, i) => (
            <FeaturedCard key={project.title} project={project} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
