'use client'
import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import ProjectCard, { ProjectData } from './ProjectCard'

const allProjects: ProjectData[] = [


  {
   title: 'Water Station Automation — AI + IoT',
   description: 'End-to-end CV pipeline: custom YOLO model trained from scratch, deployed with real-time inference and MQTT IoT integration.',
   problem: 'Water filling stations had no automated monitoring — no way to detect trucks, pipes, or fill status in real time.',
   solution: 'Built a full pipeline: collected & annotated custom dataset → fine-tuned YOLO (Truck, waterpipe, filling, filled) → real-time OpenCV inference → MQTT protocol broadcasting results live to IoT devices.',
   impact: 'Live AI detections now trigger real-time automated actions across subscribed IoT devices on topic cam1/port1 — zero manual monitoring needed.',
   tech: ['Python', 'YOLOv8', 'OpenCV', 'MQTT', 'IoT', 'Custom Dataset'],
   github: 'https://github.com/AhmedGwely',
   video: {
    type: 'youtube',
    url: 'https://youtu.be/z5086ay7q60',
    thumbnail: 'https://img.youtube.com/vi/z5086ay7q60/maxresdefault.jpg',
   },
   badge: '🏭 AI + IoT',
   badgeColor: 'var(--accent)',
   category: 'IoT & Edge',
  },
  {
    title: 'Sign Language Recognition with ML Classifier',
    description: 'Real-time sign language detection using computer vision and machine learning classifiers.',
    problem: 'Deaf and hard-of-hearing individuals face communication barriers with people who don\'t know sign language.',
    solution: 'Built a real-time sign language classifier using MediaPipe hand landmarks + ML classifier to recognize gestures instantly.',
    impact: 'Recognizes sign language letters in real-time — bridging communication gaps with accessible AI.',
    tech: ['Python', 'MediaPipe', 'Scikit-learn', 'OpenCV', 'NumPy'],
    github: 'https://github.com/AhmedGwely',
    video: {
      type: 'youtube',
      url: 'https://youtu.be/h96VBPSGO2k',
      thumbnail: 'https://img.youtube.com/vi/h96VBPSGO2k/maxresdefault.jpg',
    },
    badge: '♿ Accessibility',
    badgeColor: 'var(--accent)',
    category: 'Computer Vision',
  },
  {
    title: 'Hand Gestures with 3D Shapes',
    description: 'Control and interact with 3D shapes in real-time using hand gestures detected via computer vision.',
    problem: 'Traditional mouse/keyboard interaction is limiting for 3D visualization and creative applications.',
    solution: 'Mapped MediaPipe hand keypoints to 3D shape controls — rotate, scale, and move objects with your hands.',
    impact: 'Touchless 3D interaction demo with zero hardware cost — runs on any webcam.',
    tech: ['Python', 'MediaPipe', 'OpenCV', 'NumPy', 'Math3D'],
    github: 'https://github.com/AhmedGwely',
    video: {
      type: 'youtube',
      url: 'https://youtu.be/9v3JB-1kxgg',
      thumbnail: 'https://img.youtube.com/vi/9v3JB-1kxgg/maxresdefault.jpg',
    },
    badge: '🖐 Gesture Control',
    badgeColor: 'var(--accent)',
    category: 'Computer Vision',
  },
  {
    title: 'Temple Run Controlled by Body Movements',
    description: 'Play Temple Run using only your body movements — no keyboard or touch needed.',
    problem: 'Games require physical controllers — what if your whole body was the controller?',
    solution: 'Used OpenCV + MediaPipe pose estimation to map body poses to game commands in real-time.',
    impact: 'Full game control with just a webcam — jump, slide, and turn using body poses.',
    tech: ['Python', 'OpenCV', 'MediaPipe', 'PyAutoGUI', 'Pose Estimation'],
    github: 'https://github.com/AhmedGwely',
    video: {
      type: 'youtube',
      url: 'https://youtu.be/Z_daZ8G1Qls',
      thumbnail: 'https://img.youtube.com/vi/Z_daZ8G1Qls/maxresdefault.jpg',
    },
    badge: '🎮 GameAI',
    badgeColor: 'var(--accent)',
    category: 'Computer Vision',
  },
  {
    title: 'Emotion Detection with Computer Vision',
    description: 'Real-time facial emotion recognition system detecting human feelings from webcam feed.',
    problem: 'Understanding user emotions in real-time is critical for adaptive interfaces and HCI research.',
    solution: 'Trained a CNN emotion classifier on FER dataset, integrated with OpenCV face detection pipeline.',
    impact: 'Detects 7 emotions in real-time — happy, sad, angry, surprised, fear, disgust, neutral.',
    tech: ['Python', 'CNN', 'OpenCV', 'TensorFlow', 'FER Dataset'],
    github: 'https://github.com/AhmedGwely',
    video: {
      type: 'tiktok',
      url: 'https://www.tiktok.com/@ahmedgwely10/video/7473293180511735047',
    },
    badge: '😊 Emotion AI',
    badgeColor: '#FF6B6B',
    category: 'Computer Vision',
  },
  {
    title: 'Text Recognition with Computer Vision (OCR)',
    description: 'Automated text extraction from images and real-world scenes using computer vision.',
    problem: 'Extracting text from images manually is slow — documents, signs, and screens need automation.',
    solution: 'Built an OCR pipeline using OpenCV preprocessing + deep text detection for robust recognition.',
    impact: 'Accurately reads text from complex real-world scenes, handwriting, and printed documents.',
    tech: ['Python', 'OpenCV', 'OCR', 'Tesseract', 'Image Processing'],
    github: 'https://github.com/AhmedGwely',
    video: {
      type: 'tiktok',
      url: 'https://www.tiktok.com/@ahmedgwely10/video/7400084419186396437',
    },
    badge: '📝 OCR',
    badgeColor: '#FFD700',
    category: 'Computer Vision',
  },
  {
    title: 'Real-Time Object Detection Pipeline',
    description: 'Production-grade object detection system built for speed and accuracy on live video streams.',
    problem: 'Generic detection models are too slow or inaccurate for real-world deployment scenarios.',
    solution: 'Fine-tuned YOLOv8 on custom datasets with TensorRT optimization for maximum inference speed.',
    impact: 'Fine-tuned YOLOv8 with TensorRT optimization for high-throughput inference — suitable for edge deployment without cloud dependency.',
    tech: ['YOLOv8', 'TensorRT', 'PyTorch', 'OpenCV', 'Python'],
    github: 'https://github.com/AhmedGwely',
    video: {
      type: 'youtube',
      url: 'https://youtu.be/9v3JB-1kxgg',
      thumbnail: 'https://img.youtube.com/vi/9v3JB-1kxgg/maxresdefault.jpg',
    },
    badge: '🚀 Production',
    badgeColor: 'var(--accent)',
    category: 'Computer Vision',
  },
]

/** Filter definitions. Only categories that at least one real project belongs to. */
const PROJECT_FILTERS = [
  { key: 'All', label: 'All' },
  { key: 'Computer Vision', label: 'Computer Vision' },
  { key: 'IoT & Edge', label: 'IoT & Edge AI' },
] as const

export default function Projects() {
  const [filter, setFilter] = useState<string>('All')
  const { ref, inView } = useInView({ threshold: 0.05, triggerOnce: true })
  const [projects, setProjects] = useState<ProjectData[]>(allProjects)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const ctrl = new AbortController()
    fetch('/api/projects', { signal: ctrl.signal })
      .then((res) => {
        if (!res.ok) throw new Error()
        return res.json() as Promise<ProjectData[]>
      })
      .then((data) => {
        if (data.length > 0) setProjects(data)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
    return () => ctrl.abort()
  }, [])

  // The actual filtering — previously the state was set but never applied.
  const visibleProjects = useMemo(
    () => (filter === 'All' ? projects : projects.filter(p => p.category === filter)),
    [filter, projects]
  )

  // Live counts per filter, derived from the real data.
  const counts = useMemo(() => {
    const map: Record<string, number> = { All: projects.length }
    for (const f of PROJECT_FILTERS) {
      if (f.key === 'All') continue
      map[f.key] = projects.filter(p => p.category === f.key).length
    }
    return map
  }, [projects])

  // Loading state
  if (loading) {
    return (
      <section id="projects" ref={ref} className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="glass rounded-2xl p-12 text-center" style={{ border: '1px solid rgba(62,207,142,0.12)' }}>
            <div className="w-8 h-8 mx-auto mb-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'rgba(0,212,255,0.25)', borderTopColor: 'transparent' }} />
            <p className="font-body #5C5C5C text-sm">Loading projects…</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="projects" ref={ref} className="py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="mb-12"
        >
          <div className="flex items-center gap-4 mb-4">
            <span className="font-mono text-[#3ECF8E] text-sm">03.</span>
            <span className="#5C5C5C font-mono text-xs uppercase tracking-widest">Projects</span>
            <div className="flex-1 h-px bg-gradient-to-r from-[rgba(62,207,142,0.12)] to-transparent" />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <h2 className="font-display font-semibold text-4xl sm:text-5xl #EDEDED">
              Shipped with <span className="gradient-text">Proof</span>
            </h2>
            <p className="#5C5C5C font-body text-sm max-w-sm">
              Every project includes a real demo video. Click any card to watch it in action.
            </p>
          </div>
        </motion.div>

        {/* Filter tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex gap-2 flex-wrap mb-10"
          role="group"
          aria-label="Filter projects by category"
        >
          {PROJECT_FILTERS.map(f => {
            const active = filter === f.key
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                aria-pressed={active}
                className={`px-4 py-2 rounded-lg text-sm font-body font-medium transition-all duration-200 ${
                  active
                    ? 'text-[#3ECF8E] text-[#0A0A0B] shadow-[0_0_20px_rgba(62,207,142,0.45)]'
                    : 'glass #5C5C5C hover:#9B9B9B border border-[rgba(255,255,255,0.06)]'
                }`}
              >
                {f.label}
                <span className={`ml-1.5 text-[10px] ${active ? 'opacity-70' : 'opacity-50'}`}>
                  ({counts[f.key] ?? 0})
                </span>
              </button>
            )
          })}
        </motion.div>

        {/* Project grid — horizontal scroll on desktop, normal grid on mobile */}
        {visibleProjects.length > 0 ? (
          <div className="flex gap-6 overflow-x-auto pb-4 px-6 sm:px-0">
            <div className="flex gap-6 min-w-max">
              {visibleProjects.map((project, i) => (
                <ProjectCard key={project.title} project={project} index={i} />
              ))}
            </div>
          </div>
        ) : (
          <div className="glass rounded-2xl p-12 text-center border border-[rgba(62,207,142,0.12)]">
            <p className="font-body #5C5C5C text-sm">
              No projects in this category yet.
            </p>
            <button
              onClick={() => setFilter('All')}
              className="mt-4 px-4 py-2 rounded-lg text-sm font-body text-[#3ECF8E] border border-[rgba(62,207,142,0.12)] hover:bg-[rgba(62,207,142,0.12)] transition-all"
            >
              Show all projects
            </button>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.8 }}
          className="text-center mt-12"
        >
          <a
            href="https://github.com/AhmedGwely"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 #5C5C5C hover:text-[#3ECF8E] font-body text-sm transition-colors group"
          >
            <span>View all repositories on GitHub</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </a>
        </motion.div>
      </div>
    </section>
  )
}
