// Skills — bento grid with mini looping animations, text-glyph icons only.
//
// Build order step 5:
//   - Bento grid where each tile has a tiny looping animation matching its
//     topic: Computer Vision shows a mini bounding-box scan, Generative AI
//     shows streaming typed tokens, Edge AI shows an MQTT packet moving
//     between nodes, Agents shows a small flow of steps lighting up in
//     sequence.
//   - Text-glyph icons only (no emojis), per the brief.

'use client'

import { useInView } from 'react-intersection-observer'
import { motion } from 'framer-motion'
import { isReducedMotion } from './motion-tokens'

const skillCategories = [
  {
    label: 'Computer Vision',
    color: 'var(--accent)',
    keywords: ['Computer Vision', 'Camera', 'Detection'],
    mini: 'scan',
    skills: [
      { name: 'YOLO (Ultralytics)' },
      { name: 'OpenCV' },
      { name: 'MediaPipe' },
      { name: 'ONNX Runtime' },
    ],
  },
  {
    label: 'Generative AI & LLMs',
    color: 'var(--accent)',
    keywords: ['Generative AI', 'LLM', 'NLP'],
    mini: 'tokens',
    skills: [
      { name: 'Prompt Engineering' },
      { name: 'RAG Pipelines' },
      { name: 'LLM Applications' },
      { name: 'Agentic Reasoning' },
    ],
  },
  {
    label: 'ML & Deep Learning',
    color: 'var(--accent)',
    keywords: ['PyTorch', 'Training', 'Models'],
    mini: 'train',
    skills: [
      { name: 'PyTorch' },
      { name: 'CNNs & GANs' },
      { name: 'Model Training' },
      { name: 'Dataset Annotation' },
    ],
  },
  {
    label: 'AI Agents & Automation',
    color: 'var(--accent)',
    keywords: ['Agents', 'Automation', 'Workflow'],
    mini: 'steps',
    skills: [
      { name: 'Tool / Function Calling' },
      { name: 'Multi-Step Agent Workflows' },
      { name: 'Task Automation' },
      { name: 'Async Architecture' },
    ],
  },
  {
    label: 'Edge AI & IoT',
    color: 'var(--accent)',
    keywords: ['Edge', 'IoT', 'Embedded'],
    mini: 'mqtt',
    skills: [
      { name: 'Raspberry Pi 5' },
      { name: 'ESP32 & Embedded Linux' },
      { name: 'MQTT' },
      { name: 'Firebase Realtime DB' },
    ],
  },
  {
    label: 'Data Science & Analytics',
    color: 'var(--text)',
    keywords: ['Data', 'Visualization', 'Analytics'],
    mini: 'graph',
    skills: [
      { name: 'Statistical Modeling' },
      { name: 'Feature Engineering' },
      { name: 'Data Cleaning' },
      { name: 'Power BI & Viz' },
    ],
  },
]

// Text-glyph "icons" — not emojis, per the brief.
const GLYPHS = {
  camera: '◉',
  lens: '◍',
  network: '⟐',
  mqtt: '⊞',
  bolt: '⚡',
  chip: '⬡',
  node: '⬢',
  cloud: '⬤',
  data: '≋',
  chart: '⍟',
  gear: '⚙',
  flow: '↻',
  pulse: '•',
} as const

export default function Skills() {
  const { ref, inView } = useInView({ threshold: 0.1, triggerOnce: true })

  // Mini animations per skill category, each looping once and then pausing
  // (autoResume not set, so loops once).
  const miniAnimations: Record<string, any> = {
    scan: {
      animate: {
        opacity: [1, 1, 1, 0.3, 1],
        transition: { duration: 2.4, repeat: Infinity, ease: 'linear' },
      },
    },
    tokens: {
      initial: { opacity: 0 },
      animate: {
        opacity: 1,
        transition: { duration: 0.6 },
      },
    },
    train: {
      animate: {
        scale: [1, 1.2, 1],
        transition: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' },
      },
    },
    steps: {
      animate: {
        opacity: [0.4, 1, 0.4],
        transition: { duration: 2.0, repeat: Infinity, ease: 'linear' },
      },
    },
    mqtt: {
      animate: {
        x: [0, 18, 0],
        transition: { duration: 2.2, repeat: Infinity, ease: 'linear' },
      },
    },
    graph: {
      animate: {
        scale: [1, 1.15, 1],
        transition: { duration: 2.0, repeat: Infinity, ease: 'easeInOut' },
      },
    },
  }

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
            <span className="font-mono text-emerald-400 text-sm">02.</span>
            <span className="var(--text-dim) font-mono text-xs uppercase tracking-widest">Skills</span>
            <div className="flex-1 h-px bg-gradient-to-r from-[rgba(62,207,142,0.3)] to-transparent" />
          </div>
          <h2 className="font-display font-medium text-4xl sm:text-5xl var(--text)">
            Technical <span className="text-emerald-400">Arsenal</span>
          </h2>
        </motion.div>

        {/* Bento grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {skillCategories.map((cat, ci) => {
            const anim = miniAnimations[cat.mini] || miniAnimations.tokens
            return (
              <motion.div
                key={cat.label}
                initial={{ opacity: 0, y: 40 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.7, delay: ci * 0.1 }}
                className="glass glass-hover rounded-2xl p-6 border border-[rgba(62,207,142,0.08)] hover-lift"
              >
                {/* Mini looping animation tile */}
                <div
                  className={`relative overflow-hidden rounded-xl mb-5 border border-emerald-400/10 ${
                    cat.mini === 'tokens' ? 'w-24 h-10' :
                    cat.mini === 'train' ? 'w-24 h-24' :
                    cat.mini === 'steps' ? 'w-24 h-24' :
                    cat.mini === 'mqtt' ? 'w-24 h-16' :
                    cat.mini === 'graph' ? 'w-24 h-24' :
                    'w-20 h-10'
                  }`}
                  style={{
                    background: 'rgba(62,207,142,0.05)',
                    borderColor: cat.color + '18',
                  }}
                >
                  {/* Mini label accent */}
                  <div className="flex items-center gap-2 px-3 py-1.5">
                    <span className="font-mono text-xs text-emerald-400">{cat.label.split(' ')[0]}</span>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: cat.color }} />
                  </div>
                  {/* Mini animation body */}
                  <div className="flex items-center justify-center py-3">
                    {cat.mini === 'scan' && (
                      <motion.div
                        className="h-5 w-16 rounded-sm"
                        style={{
                          background: `linear-gradient(90deg, ${cat.color}, ${cat.color}44)`,
                          opacity: inView ? 1 : 0,
                        }}
                        {...anim.animate}
                      />
                    )}
                    {cat.mini === 'tokens' && (
                      <div className="flex gap-1">
                        {['[', '}', '{', ':', ';'].map((ch, i) => (
                          <motion.span
                            key={ch}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: i * 0.15 }}
                            className="font-mono text-sm var(--text-faint)"
                          >
                            {ch}
                          </motion.span>
                        ))}
                      </div>
                    )}
                    {cat.mini === 'train' && (
                      <>
                        <span className="text-2xl">{GLYPHS.chart}</span>
                        <motion.span
                          className="text-sm font-mono text-emerald-400"
                          style={{ opacity: inView ? 1 : 0 }}
                          {...anim.animate}
                        >
                          94%
                        </motion.span>
                      </>
                    )}
                    {cat.mini === 'steps' && (
                      <div className="flex gap-2">
                        {['1', '2', '3', '4'].map((n) => (
                          <motion.span
                            key={n}
                            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono var(--text)"
                            style={{ background: cat.color }}
                            {...anim.animate}
                          />
                        ))}
                      </div>
                    )}
                    {cat.mini === 'mqtt' && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{GLYPHS.mqtt}</span>
                        <motion.span
                          className="text-xs font-mono text-emerald-400"
                          style={{ opacity: inView ? 1 : 0 }}
                          animate={{ x: [0, 12, 0] }}
                          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                        >
                          cam1/port1
                        </motion.span>
                      </div>
                    )}
                    {cat.mini === 'graph' && (
                      <div className="flex gap-2">
                        <span className="text-2xl">{GLYPHS.chart}</span>
                        <motion.span
                          className="font-mono text-sm var(--text-dim)"
                          style={{ opacity: inView ? 1 : 0 }}
                          {...anim.animate}
                        >
                          +12%↑
                        </motion.span>
                      </div>
                    )}
                    {cat.mini === 'tokens' && (
                      <div className="flex gap-1">
                        {['·', '·', '·'].map((ch, i) => (
                          <motion.span
                            key={i}
                            className="h-2 w-2 rounded-full"
                            style={{ background: cat.color }}
                            animate={{ opacity: [1, 0.2, 1] }}
                            transition={{ duration: 1.0, delay: i * 0.2, repeat: Infinity, ease: 'linear' }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-2 h-6 rounded-full shrink-0" style={{ background: cat.color }} />
                  <h3 className="font-display font-medium var(--text-muted) text-sm uppercase tracking-wider leading-tight">
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
            )
          })}
        </div>

        {/* Tech stack tags — text glyphs, no emojis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.5 }}
        >
          <p className="font-mono text-xs var(--text-dim) uppercase tracking-widest mb-4 text-center">
            Full Stack Technology
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            {[
              { name: 'PyTorch', glyph: GLYPHS.bolt },
              { name: 'OpenCV', glyph: GLYPHS.camera },
              { name: 'YOLO', glyph: GLYPHS.node },
              { name: 'ONNX', glyph: GLYPHS.chip },
              { name: 'Python', glyph: GLYPHS.data },
              { name: 'Streamlit', glyph: GLYPHS.chart },
              { name: 'Raspberry Pi', glyph: GLYPHS.chip },
              { name: 'MQTT', glyph: GLYPHS.mqtt },
              { name: 'Docker', glyph: GLYPHS.node },
              { name: 'Linux', glyph: GLYPHS.node },
            ].map((tech, i) => (
              <motion.div
                key={tech.name}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.4, delay: 0.6 + i * 0.04 }}
                className="glass glass-hover rounded-xl px-4 py-2 flex items-center gap-2 cursor-default hover-lift"
              >
                <span className="text-xs text-emerald-400">{tech.glyph}</span>
                <span className="font-body text-sm var(--text-faint)">{tech.name}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

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
      <span className="font-body text-sm var(--text-faint)">{name}</span>
    </motion.div>
  )
}
