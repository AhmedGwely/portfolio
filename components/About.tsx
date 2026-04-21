'use client'
import { useInView } from 'react-intersection-observer'
import { motion } from 'framer-motion'
import { Brain, Code2, Cpu, MessageSquare } from 'lucide-react'

const highlights = [
  {
    icon: <Brain size={22} className="text-[#00D4FF]" />,
    title: 'Computer Vision',
    desc: 'Designing real-time detection, segmentation, and classification systems using YOLO, CNNs, and Transformers.',
  },
  {
    icon: <Cpu size={22} className="text-[#7C3AED]" />,
    title: 'AI Systems at Scale',
    desc: 'Deploying models from research prototypes to production environments with measurable real-world impact.',
  },
  {
    icon: <Code2 size={22} className="text-[#06FFA5]" />,
    title: 'Engineering Depth',
    desc: 'Proficient in Python and C++, with deep expertise in PyTorch, TensorFlow, and OpenCV pipelines.',
  },
  {
    icon: <MessageSquare size={22} className="text-[#00D4FF]" />,
    title: 'Teaching & Communication',
    desc: 'Passionate about making complex AI concepts accessible through clear explanations and real demos.',
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
          <span className="font-mono text-[#00D4FF] text-sm">01.</span>
          <span className="text-slate-600 font-mono text-xs uppercase tracking-widest">About Me</span>
          <div className="flex-1 h-px bg-gradient-to-r from-[rgba(0,212,255,0.3)] to-transparent" />
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Left: Text */}
          <div>
            <h2 className="font-display font-bold text-4xl sm:text-5xl text-slate-100 mb-6 leading-tight">
              Turning pixels into{' '}
              <span className="gradient-text">intelligence</span>
            </h2>
            <div className="space-y-4 text-slate-400 font-body leading-relaxed text-base">
              <p>
                I&apos;m <span className="text-slate-200 font-semibold">Ahmed Gwely</span>, an AI Engineer focused on Computer Vision systems that do more than just work — they perform under real-world conditions.
              </p>
              <p>
                My work spans the full pipeline: from <span className="text-[#00D4FF]">training deep learning models</span> on custom datasets, to optimizing inference for edge deployment, to building APIs that integrate vision AI into production apps.
              </p>
              <p>
                Beyond building, I care deeply about <span className="text-[#7C3AED]">teaching and sharing knowledge</span>. On TikTok and through content, I break down cutting-edge AI into concepts anyone can grasp — because great technology only matters if it&apos;s understood.
              </p>
              <p>
                I&apos;m driven by one question: <em className="text-slate-300">&ldquo;What does this AI system actually solve?&rdquo;</em>
              </p>
            </div>

            {/* Quick facts */}
            <div className="mt-8 grid grid-cols-2 gap-4">
              {[
                ['Focus', 'Computer Vision & DL'],
                ['Stack', 'Python · PyTorch · OpenCV'],
                ['Location', 'Egypt 🇪🇬'],
                ['Status', '🟢 Open to Work'],
              ].map(([k, v]) => (
                <div key={k} className="glass rounded-lg p-3 border border-[rgba(0,212,255,0.08)]">
                  <div className="font-mono text-[10px] text-slate-600 uppercase tracking-widest mb-1">{k}</div>
                  <div className="font-body text-sm text-slate-300">{v}</div>
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
                <div className="w-10 h-10 rounded-lg bg-[rgba(0,212,255,0.08)] border border-[rgba(0,212,255,0.15)] flex items-center justify-center shrink-0">
                  {item.icon}
                </div>
                <div>
                  <h3 className="font-display font-semibold text-slate-100 mb-1">{item.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed font-body">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  )
}
