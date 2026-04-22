'use client'
import { useInView } from 'react-intersection-observer'
import { motion } from 'framer-motion'

const skillCategories = [
  {
    label: 'Programming',
    color: '#00D4FF',
    skills: [
      { name: 'Python', level: 95 },
      { name: 'C++', level: 72 },
      { name: 'SQL', level: 65 },
    ],
  },
  {
    label: 'AI / Deep Learning',
    color: '#7C3AED',
    skills: [
      { name: 'Computer Vision', level: 95 },
      { name: 'CNNs & Object Detection', level: 92 },
      { name: 'Transformers & ViT', level: 80 },
      { name: 'Model Optimization', level: 78 },
    ],
  },
  {
    label: 'Tools & Frameworks',
    color: '#06FFA5',
    skills: [
      { name: 'PyTorch', level: 90 },
      { name: 'OpenCV', level: 93 },
      { name: 'TensorFlow / Keras', level: 80 },
      { name: 'Git & Docker', level: 82 },
    ],
  },
]

const techStack = [
  { name: 'PyTorch', icon: '🔥' },
  { name: 'OpenCV', icon: '👁' },
  { name: 'YOLO', icon: '🎯' },
  { name: 'TensorFlow', icon: '📦' },
  { name: 'Python', icon: '🐍' },
  { name: 'C++', icon: '⚡' },
  { name: 'Docker', icon: '🐳' },
  { name: 'FastAPI', icon: '🚀' },
  { name: 'Numpy', icon: '🔢' },
  { name: 'Scikit-learn', icon: '🧪' },
  { name: 'Git', icon: '🌿' },
  { name: 'Linux', icon: '🐧' },
]

function SkillBar({ name, level, color, inView, delay }: {
  name: string; level: number; color: string; inView: boolean; delay: number
}) {
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1.5">
        <span className="font-body text-sm text-slate-300">{name}</span>
        <span className="font-mono text-xs text-slate-500">{level}%</span>
      </div>
      <div className="h-1.5 bg-[rgba(255,255,255,0.05)] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={inView ? { width: `${level}%` } : { width: 0 }}
          transition={{ duration: 1.2, delay, ease: [0.16, 1, 0.3, 1] }}
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}99, ${color})` }}
        />
      </div>
    </div>
  )
}

export default function Skills() {
  const { ref, inView } = useInView({ threshold: 0.15, triggerOnce: true })

  return (
    <section id="skills" ref={ref} className="py-32 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="mb-16"
        >
          <div className="flex items-center gap-4 mb-4">
            <span className="font-mono text-[#00D4FF] text-sm">02.</span>
            <span className="text-slate-600 font-mono text-xs uppercase tracking-widest">Skills</span>
            <div className="flex-1 h-px bg-gradient-to-r from-[rgba(0,212,255,0.3)] to-transparent" />
          </div>
          <h2 className="font-display font-bold text-4xl sm:text-5xl text-slate-100">
            Technical <span className="gradient-text">Arsenal</span>
          </h2>
        </motion.div>

        {/* Skill bars grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {skillCategories.map((cat, ci) => (
            <motion.div
              key={cat.label}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: ci * 0.15 }}
              className="glass rounded-2xl p-6 border border-[rgba(0,212,255,0.08)]"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-2 h-6 rounded-full" style={{ background: cat.color }} />
                <h3 className="font-display font-semibold text-slate-200 text-sm uppercase tracking-wider">
                  {cat.label}
                </h3>
              </div>
              {cat.skills.map((skill, si) => (
                <SkillBar
                  key={skill.name}
                  name={skill.name}
                  level={skill.level}
                  color={cat.color}
                  inView={inView}
                  delay={0.2 + si * 0.1 + ci * 0.1}
                />
              ))}
            </motion.div>
          ))}
        </div>

        {/* Tech stack tags */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.5 }}
        >
          <p className="font-mono text-xs text-slate-600 uppercase tracking-widest mb-4 text-center">
            Full Stack Technology
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            {techStack.map((tech, i) => (
              <motion.div
                key={tech.name}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.4, delay: 0.6 + i * 0.04 }}
                className="glass glass-hover rounded-xl px-4 py-2 flex items-center gap-2 cursor-default hover-lift"
              >
                <span>{tech.icon}</span>
                <span className="font-body text-sm text-slate-300">{tech.name}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
