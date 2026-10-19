'use client'
import { useInView } from 'react-intersection-observer'
import { motion } from 'framer-motion'

const skillCategories = [
  {
    label: 'Generative AI & LLMs',
    color: '#7C3AED',
    skills: [
      { name: 'Prompt Engineering' },
      { name: 'RAG Pipelines' },
      { name: 'LLM Application Development' },
      { name: 'Agentic / Tool-Based Reasoning' },
    ],
  },
  {
    label: 'AI Agents & Automation',
    color: '#00D4FF',
    skills: [
      { name: 'Tool / Function Calling' },
      { name: 'Multi-Step Agent Workflows' },
      { name: 'Task Automation Pipelines' },
      { name: 'Async Architecture' },
    ],
  },
  {
    label: 'Machine Learning & Deep Learning',
    color: '#06FFA5',
    skills: [
      { name: 'PyTorch (Ultralytics)' },
      { name: 'CNNs & GANs' },
      { name: 'Model Training & Evaluation' },
      { name: 'Dataset Annotation (Roboflow)' },
    ],
  },
  {
    label: 'Computer Vision',
    color: '#00D4FF',
    skills: [
      { name: 'YOLO (Ultralytics)' },
      { name: 'OpenCV' },
      { name: 'MediaPipe' },
      { name: 'ONNX / ONNX Runtime' },
    ],
  },
  {
    label: 'IoT & Edge AI',
    color: '#06FFA5',
    skills: [
      { name: 'Raspberry Pi 5' },
      { name: 'ESP32 & Embedded Linux' },
      { name: 'MQTT' },
      { name: 'Firebase Realtime DB' },
    ],
  },
  {
    label: 'Data Science & Analytics',
    color: '#7C3AED',
    skills: [
      { name: 'Statistical Modeling' },
      { name: 'Feature Engineering' },
      { name: 'Data Cleaning & Preprocessing' },
      { name: 'Power BI & Visualization' },
    ],
  },
]

const techStack = [
  { name: 'PyTorch', icon: '🔥' },
  { name: 'OpenCV', icon: '👁' },
  { name: 'YOLO', icon: '🎯' },
  { name: 'ONNX', icon: '⚙️' },
  { name: 'Python', icon: '🐍' },
  { name: 'Streamlit', icon: '📊' },
  { name: 'Raspberry Pi', icon: '🍓' },
  { name: 'ESP32', icon: '📡' },
  { name: 'MQTT', icon: '🔗' },
  { name: 'Firebase', icon: '🔥' },
  { name: 'Roboflow', icon: '🏷️' },
  { name: 'Git', icon: '🌿' },
  { name: 'Docker', icon: '🐳' },
  { name: 'Linux', icon: '🐧' },
]

function SkillItem({ name, color, inView, delay }: {
  name: string; color: string; inView: boolean; delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      className="mb-3 flex items-center gap-2.5"
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
      <span className="font-body text-sm text-slate-300">{name}</span>
    </motion.div>
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

        {/* Skill categories grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {skillCategories.map((cat, ci) => (
            <motion.div
              key={cat.label}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: ci * 0.1 }}
              className="glass glass-hover rounded-2xl p-6 border border-[rgba(0,212,255,0.08)] hover-lift"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-2 h-6 rounded-full shrink-0" style={{ background: cat.color }} />
                <h3 className="font-display font-semibold text-slate-200 text-sm uppercase tracking-wider leading-tight">
                  {cat.label}
                </h3>
              </div>
              {cat.skills.map((skill, si) => (
                <SkillItem
                  key={skill.name}
                  name={skill.name}
                  color={cat.color}
                  inView={inView}
                  delay={0.15 + si * 0.07 + ci * 0.06}
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
