'use client'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { Trophy, Users, Rocket, Code } from 'lucide-react'

const achievements = [
  {
    icon: <Trophy size={24} className="text-[#FFD700]" />,
    category: 'Competition',
    title: 'Top Performer — AI Hackathon',
    description: 'Built a real-time fire detection system in 48 hours using YOLO + thermal imaging. Finished in the top 5% of 300+ teams.',
    date: '2023',
    accent: '#FFD700',
  },
  {
    icon: <Users size={24} className="text-[#00D4FF]" />,
    category: 'Teaching',
    title: 'AI & CV Instructor — 500+ Students',
    description: 'Taught computer vision fundamentals and practical deep learning to 500+ students across bootcamps and online platforms. 4.9★ rating.',
    date: '2022–Present',
    accent: '#00D4FF',
  },
  {
    icon: <Rocket size={24} className="text-[#06FFA5]" />,
    category: 'Deployment',
    title: 'Production AI System — Smart City',
    description: 'Deployed multi-camera traffic intelligence system in a live city pilot program. Processing 24/7 with 99.5% uptime.',
    date: '2023',
    accent: '#06FFA5',
  },
  {
    icon: <Code size={24} className="text-[#7C3AED]" />,
    category: 'Open Source',
    title: 'TikTok AI Education Channel',
    description: 'Growing AI education channel breaking down complex vision concepts with hands-on demos. Building the next generation of AI engineers.',
    date: '2023–Present',
    accent: '#7C3AED',
  },
  {
    icon: <Trophy size={24} className="text-[#FF6B6B]" />,
    category: 'Research',
    title: 'Custom Dataset — 10K+ Images',
    description: 'Curated and annotated proprietary industrial defect detection dataset. Trained models outperform ImageNet pretrained baselines by 12%.',
    date: '2023',
    accent: '#FF6B6B',
  },
  {
    icon: <Users size={24} className="text-[#06FFA5]" />,
    category: 'Community',
    title: 'Computer Vision Study Group Lead',
    description: 'Founded and led weekly CV study group with 50+ active members. Covered CVPR papers, implementation workshops, and project showcases.',
    date: '2022–Present',
    accent: '#06FFA5',
  },
]

export default function Achievements() {
  const { ref, inView } = useInView({ threshold: 0.1, triggerOnce: true })

  return (
    <section id="achievements" ref={ref} className="py-32 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          className="mb-16"
        >
          <div className="flex items-center gap-4 mb-4">
            <span className="font-mono text-[#00D4FF] text-sm">05.</span>
            <span className="text-slate-600 font-mono text-xs uppercase tracking-widest">Achievements</span>
            <div className="flex-1 h-px bg-gradient-to-r from-[rgba(0,212,255,0.3)] to-transparent" />
          </div>
          <h2 className="font-display font-bold text-4xl sm:text-5xl text-slate-100">
            Milestones & <span className="gradient-text">Impact</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {achievements.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="glass glass-hover rounded-2xl p-6 hover-lift group"
              style={{ borderColor: `${item.accent}15` }}
            >
              {/* Top row */}
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ background: `${item.accent}15`, border: `1px solid ${item.accent}30` }}
                >
                  {item.icon}
                </div>
                <span className="font-mono text-xs text-slate-600">{item.date}</span>
              </div>

              {/* Category */}
              <div className="font-mono text-xs uppercase tracking-widest mb-2" style={{ color: item.accent }}>
                {item.category}
              </div>

              {/* Title */}
              <h3 className="font-display font-semibold text-slate-100 text-lg mb-3 leading-snug group-hover:text-white transition-colors">
                {item.title}
              </h3>

              {/* Description */}
              <p className="font-body text-slate-500 text-sm leading-relaxed">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
