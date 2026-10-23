'use client'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { Trophy, Users, Rocket, Code } from 'lucide-react'

const achievements = [
  {
    icon: <Rocket size={24} className="text-[var(--accent)]" />,
    category: 'Competition',
    title: 'Finalist — Egypt IoT & AI Challenge',
    description: 'Selected as a finalist with GallineX, a smart poultry monitoring and power-management system, with financial support from ITIDA.',
    date: '2025–2026',
    accent: 'var(--accent)',
  },
  {
    icon: <Trophy size={24} className="text-[#FFD700]" />,
    category: 'Award',
    title: '2nd Place — Industry 4.0 Transformation Marathon',
    description: 'Placed second in the Industry 4.0 Transformation Marathon.',
    date: '04/2024',
    accent: 'var(--text)',
  },
  {
    icon: <Users size={24} className="text-[var(--accent)]" />,
    category: 'Speaking',
    title: 'Conference Speaker — Opening Session',
    description: 'Delivered "AI Evolution: Narrow to General Intelligence and Beyond" at the First Student Engineering Conference on AI Applications, Mansoura University — the only student selected to present.',
    date: '01/2026',
    accent: 'var(--accent)',
  },
  {
    icon: <Users size={24} className="text-[var(--accent)]" />,
    category: 'Teaching',
    title: 'AI & Computer Vision Instructor',
    description: 'Instructor and technical program lead for a computer vision and applied machine learning curriculum at Neurobotics, and a deep learning supervisor and mentor across IEEE Mansoura, CAT Reloaded and Luminous MU.',
    date: '2024–Present',
    accent: 'var(--accent)',
  },
  {
    icon: <Code size={24} className="text-[var(--accent)]" />,
    category: 'Community',
    title: 'Head of AI Committee & Co-Founder',
    description: 'Co-founded and led the AI Committee at Momentum MU, serving as Vice Head of Training and as a public speaker for data science and AI initiatives.',
    date: '2023–2025',
    accent: 'var(--accent)',
  },
  {
    icon: <Code size={24} className="text-[var(--accent)]" />,
    category: 'Education',
    title: 'TikTok AI Education Channel',
    description: 'Growing AI education channel breaking down complex vision and AI concepts with hands-on demos — building the next generation of AI engineers.',
    date: 'Present',
    accent: 'var(--accent)',
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
            <span className="font-mono text-[var(--accent)] text-sm">05.</span>
            <span className="var(--text-dim) font-mono text-xs uppercase tracking-widest">Achievements</span>
            <div className="flex-1 h-px bg-gradient-to-r from-[rgba(62,207,142,0.12)] to-transparent" />
          </div>
          <h2 className="font-display font-medium text-4xl sm:text-5xl var(--text)">
            Milestones & <span className="gradient-text">Recognition</span>
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
                <span className="font-mono text-xs var(--text-dim)">{item.date}</span>
              </div>

              {/* Category */}
              <div className="font-mono text-xs uppercase tracking-widest mb-2" style={{ color: item.accent }}>
                {item.category}
              </div>

              {/* Title */}
              <h3 className="font-display font-medium var(--text) text-lg mb-3 leading-snug group-hover:var(--text) transition-colors">
                {item.title}
              </h3>

              {/* Description */}
              <p className="font-body var(--text-dim) text-sm leading-relaxed">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
