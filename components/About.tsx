'use client'
import { useInView } from 'react-intersection-observer'
import { motion } from 'framer-motion'
import { Brain, Code2, Cpu, MessageSquare } from 'lucide-react'

const highlights = [
  {
    icon: <Brain size={22} className="text-[var(--accent)]" />,
    title: 'Computer Vision',
    desc: 'Real-time detection, tracking and classification with YOLO, CNNs and Transformers — from custom dataset annotation through to ONNX deployment.',
  },
  {
    icon: <Cpu size={22} className="text-[var(--accent)]" />,
    title: 'Generative AI & LLMs',
    desc: 'LLM application development, prompt engineering and RAG pipelines, with training and certification from NVIDIA and Oracle.',
  },
  {
    icon: <Code2 size={22} className="text-[var(--accent)]" />,
    title: 'AI Systems & Edge',
    desc: 'End-to-end pipelines — ingestion to inference to messaging — deployed on Raspberry Pi, ESP32 and MQTT for real-time edge AI.',
  },
  {
    icon: <MessageSquare size={22} className="text-[var(--accent)]" />,
    title: 'Teaching & Communication',
    desc: 'Instructor and mentor across Samsung Innovation Campus, IEEE, CAT Reloaded and Neurobotics — making complex AI concepts accessible.',
  },
]

export default function About() {
  const { ref, inView } = useInView({ threshold: 0.2, triggerOnce: true })

  return (
    <section id="about" ref={ref} className="py-32 px-6 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Section header */}
        <div className="flex items-center gap-4 mb-4">
          <span className="font-mono text-[var(--accent)] text-sm">01.</span>
          <span className="var(--text-dim) font-mono text-xs uppercase tracking-widest">About Me</span>
          <div className="flex-1 h-px bg-gradient-to-r from-[rgba(62,207,142,0.12)] to-transparent" />
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Left: Text */}
          <div>
            <h2 className="font-display font-medium text-4xl sm:text-5xl var(--text) mb-6 leading-tight">
              Building AI that{' '}
              <span className="gradient-text">ships</span>
            </h2>
            <div className="space-y-4 var(--text-dim) font-body leading-relaxed text-base">
              <p>
                I&apos;m <span className="var(--text-muted) font-medium">Ahmed Gwely</span>, an AI Engineer working across the full lifecycle of intelligent systems — training and evaluating models, integrating them into real applications, and deploying them where they actually run.
              </p>
              <p>
                My foundation is <span className="text-[var(--accent)]">Computer Vision</span>: real-time detection, tracking and classification built on custom datasets, then optimized for edge inference. I&apos;ve shipped that end to end — a video and sensor pipeline running in production for water-station automation, and YOLO-based monitoring deployed on a Raspberry Pi 5.
              </p>
              <p>
                Alongside vision, I work in <span className="text-[var(--accent)]">Generative AI and LLMs</span> — prompt engineering, retrieval-augmented generation and agentic, tool-based workflows — backed by NVIDIA and Oracle certifications and applied in local-first assistant work.
              </p>
              <p>
                Beyond building, I care deeply about <span className="text-[var(--accent)]">teaching and sharing knowledge</span>. As an instructor and mentor across Samsung Innovation Campus, IEEE and university programs, I break down cutting-edge AI into concepts anyone can grasp — because great technology only matters if it&apos;s understood.
              </p>
              <p>
                I&apos;m driven by one question: <em className="var(--text-faint)">&ldquo;What does this AI system actually solve?&rdquo;</em>
              </p>
            </div>

            {/* Quick facts */}
            <div className="mt-8 grid grid-cols-2 gap-4">
              {[
                ['Focus', 'AI · CV · GenAI · Edge'],
                ['Stack', 'Python · PyTorch · OpenCV'],
                ['Location', 'Egypt 🇪🇬'],
                ['Status', '🟢 Open to Work'],
              ].map(([k, v]) => (
                <div key={k} className="glass rounded-lg p-3 border border-[rgba(62,207,142,0.12)]">
                  <div className="font-mono text-[10px] var(--text-dim) uppercase tracking-widest mb-1">{k}</div>
                  <div className="font-body text-sm var(--text-faint)">{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Highlight cards */}
          <div className="grid grid-cols-1 gap-4">
            {highlights.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: 40 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.7, delay: 0.1 * i, ease: [0.16, 1, 0.3, 1] }}
                className="glass glass-hover rounded-xl p-5 flex gap-4 items-start hover-lift cursor-default"
              >
                <div className="w-10 h-10 rounded-lg bg-[rgba(62,207,142,0.12)] border border-[rgba(62,207,142,0.45)] flex items-center justify-center shrink-0">
                  {item.icon}
                </div>
                <div>
                  <h3 className="font-display font-medium var(--text) mb-1">{item.title}</h3>
                  <p className="var(--text-dim) text-sm leading-relaxed font-body">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  )
}
