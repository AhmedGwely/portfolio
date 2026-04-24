'use client'
import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'

const stats = [
  { value: 15, suffix: '+', label: 'AI Projects Shipped', color: '#00D4FF' },
  { value: 500, suffix: '+', label: 'Students Taught', color: '#7C3AED' },
  { value: 12, suffix: '+', label: 'Technologies Mastered', color: '#06FFA5' },
  { value: 94, suffix: '%', label: 'Best Model Accuracy', color: '#FFD700' },
]

function CounterNumber({ target, suffix, color, inView }: { target: number; suffix: string; color: string; inView: boolean }) {
  const [count, setCount] = useState(0)
  const started = useRef(false)

  useEffect(() => {
    if (!inView || started.current) return
    started.current = true

    const duration = 2000
    const start = Date.now()
    const tick = () => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [inView, target])

  return (
    <span style={{ color }} className="font-display font-extrabold text-5xl sm:text-6xl tabular-nums">
      {count}{suffix}
    </span>
  )
}

export default function Stats() {
  const { ref, inView } = useInView({ threshold: 0.3, triggerOnce: true })

  return (
    <section ref={ref} className="py-24 px-6 relative overflow-hidden">
      {/* Background accent */}
      <div className="absolute inset-0 bg-gradient-to-r from-[rgba(0,212,255,0.03)] via-[rgba(124,58,237,0.03)] to-[rgba(6,255,165,0.03)]" />

      <div className="max-w-5xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          className="text-center mb-16"
        >
          <p className="font-mono text-xs text-slate-600 uppercase tracking-widest mb-3">By the numbers</p>
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-slate-100">
            Impact that&apos;s <span className="gradient-text">measurable</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: i * 0.12 }}
              className="glass rounded-2xl p-6 text-center border hover-lift"
              style={{ borderColor: `${stat.color}20` }}
            >
              <div className="mb-2">
                <CounterNumber target={stat.value} suffix={stat.suffix} color={stat.color} inView={inView} />
              </div>
              <p className="font-body text-slate-500 text-sm mt-2">{stat.label}</p>
              <div className="mt-4 h-0.5 rounded-full mx-auto w-12" style={{ background: `linear-gradient(90deg, transparent, ${stat.color}, transparent)` }} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
