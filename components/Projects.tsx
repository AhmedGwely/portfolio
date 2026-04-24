'use client'
import { useState } from 'react'
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
   badgeColor: '#06FFA5',
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
    badgeColor: '#06FFA5',
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
    badgeColor: '#00D4FF',
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
    badgeColor: '#7C3AED',
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
  },
  {
    title: 'Real-Time Object Detection Pipeline',
    description: 'Production-grade object detection system built for speed and accuracy on live video streams.',
    problem: 'Generic detection models are too slow or inaccurate for real-world deployment scenarios.',
    solution: 'Fine-tuned YOLOv8 on custom datasets with TensorRT optimization for maximum inference speed.',
    impact: 'Runs at 60fps with 94% mAP — ready for edge deployment without cloud dependency.',
    tech: ['YOLOv8', 'TensorRT', 'PyTorch', 'OpenCV', 'Python'],
    github: 'https://github.com/AhmedGwely',
    video: {
      type: 'youtube',
      url: 'https://youtu.be/9v3JB-1kxgg',
      thumbnail: 'https://img.youtube.com/vi/9v3JB-1kxgg/maxresdefault.jpg',
    },
    badge: '🚀 Production',
    badgeColor: '#00D4FF',
  },
]

export default function Projects() {
  const [filter, setFilter] = useState('All')
  const { ref, inView } = useInView({ threshold: 0.05, triggerOnce: true })
  const FILTERS = ['All', 'Gesture', 'Detection', 'OCR', 'GameAI']

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
            <span className="font-mono text-[#00D4FF] text-sm">03.</span>
            <span className="text-slate-600 font-mono text-xs uppercase tracking-widest">Projects</span>
            <div className="flex-1 h-px bg-gradient-to-r from-[rgba(0,212,255,0.3)] to-transparent" />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <h2 className="font-display font-bold text-4xl sm:text-5xl text-slate-100">
              Shipped with <span className="gradient-text">Proof</span>
            </h2>
            <p className="text-slate-500 font-body text-sm max-w-sm">
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
        >
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-body font-medium transition-all duration-200 ${
                filter === f
                  ? 'bg-[#00D4FF] text-[#030712] shadow-[0_0_20px_rgba(0,212,255,0.4)]'
                  : 'glass text-slate-400 hover:text-slate-200 border border-[rgba(255,255,255,0.06)]'
              }`}
            >
              {f}
            </button>
          ))}
        </motion.div>

        {/* Project grid */}
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {allProjects.map((project, i) => (
            <ProjectCard key={project.title} project={project} index={i} />
          ))}
        </div>

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
            className="inline-flex items-center gap-2 text-slate-500 hover:text-[#00D4FF] font-body text-sm transition-colors group"
          >
            <span>View all repositories on GitHub</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </a>
        </motion.div>
      </div>
    </section>
  )
}
