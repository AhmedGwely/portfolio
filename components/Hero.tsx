'use client'
import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Github, Linkedin, ChevronDown, Eye, Play } from 'lucide-react'

const TYPING_STRINGS = [
  'AI Engineer',
  'Computer Vision Specialist',
  'Deep Learning Architect',
  'Intelligent Systems Builder',
]

// TikTok SVG icon
function TikTokIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V9.17a8.16 8.16 0 004.77 1.52V7.25a4.85 4.85 0 01-1-.56z"/>
    </svg>
  )
}

function Particle({ style }: { style: React.CSSProperties }) {
  return <div className="particle bg-[#00D4FF] opacity-20" style={style} />
}

export default function Hero() {
  const [typedText, setTypedText] = useState('')
  const [stringIdx, setStringIdx] = useState(0)
  const [charIdx, setCharIdx] = useState(0)
  const [deleting, setDeleting] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Typing animation
  useEffect(() => {
    const current = TYPING_STRINGS[stringIdx]
    const speed = deleting ? 40 : 90
    const timer = setTimeout(() => {
      if (!deleting) {
        setTypedText(current.slice(0, charIdx + 1))
        if (charIdx + 1 === current.length) {
          setTimeout(() => setDeleting(true), 1800)
        } else {
          setCharIdx(charIdx + 1)
        }
      } else {
        setTypedText(current.slice(0, charIdx - 1))
        if (charIdx - 1 === 0) {
          setDeleting(false)
          setStringIdx((stringIdx + 1) % TYPING_STRINGS.length)
          setCharIdx(0)
        } else {
          setCharIdx(charIdx - 1)
        }
      }
    }, speed)
    return () => clearTimeout(timer)
  }, [charIdx, deleting, stringIdx])

  // Particle canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const particles: Array<{x:number;y:number;vx:number;vy:number;r:number;alpha:number}> = []
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 1.5 + 0.3,
        alpha: Math.random() * 0.4 + 0.1,
      })
    }

    let animId: number
    function draw() {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(0,212,255,${p.alpha})`
        ctx.fill()
      })
      // Draw connections
      particles.forEach((p, i) => {
        particles.slice(i + 1).forEach(q => {
          const dist = Math.hypot(p.x - q.x, p.y - q.y)
          if (dist < 100) {
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(q.x, q.y)
            ctx.strokeStyle = `rgba(0,212,255,${0.08 * (1 - dist/100)})`
            ctx.stroke()
          }
        })
      })
      animId = requestAnimationFrame(draw)
    }
    draw()

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    window.addEventListener('resize', resize)
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize) }
  }, [])

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.12 } },
  }
  const itemVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] } },
  }

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Canvas particles */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />

      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-[radial-gradient(circle,rgba(0,212,255,0.08)_0%,transparent_70%)] blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.08)_0%,transparent_70%)] blur-3xl animate-float" style={{animationDelay:'3s'}} />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 max-w-5xl mx-auto px-6 text-center"
      >
        {/* Badge */}
        <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-[rgba(0,212,255,0.2)] mb-8">
          <span className="w-2 h-2 rounded-full bg-[#06FFA5] animate-pulse" />
          <span className="text-xs font-mono text-slate-400">Available for opportunities</span>
        </motion.div>

        {/* Name */}
        <motion.h1 variants={itemVariants} className="font-display font-extrabold leading-tight mb-4">
          <span className="block text-slate-100 text-5xl sm:text-7xl lg:text-8xl tracking-tight">Ahmed</span>
          <span className="block gradient-text text-5xl sm:text-7xl lg:text-8xl tracking-tight">Gwely</span>
        </motion.h1>

        {/* Typed role */}
        <motion.div variants={itemVariants} className="h-10 flex items-center justify-center mb-6">
          <span className="font-mono text-xl sm:text-2xl text-[#00D4FF]">
            {typedText}
            <span className="inline-block w-0.5 h-6 bg-[#00D4FF] ml-1 animate-pulse" />
          </span>
        </motion.div>

        {/* Tagline */}
        <motion.p variants={itemVariants} className="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed font-body">
          Building{' '}
          <span className="text-[#00D4FF] font-semibold">Intelligent Vision Systems</span>
          {' '}that solve real-world problems —{' '}
          from pixel to production.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div variants={itemVariants} className="flex flex-wrap gap-4 justify-center mb-12">
          <a
            href="#projects"
            className="group relative px-8 py-3.5 rounded-xl bg-[#00D4FF] text-[#030712] font-display font-bold text-sm overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,212,255,0.5)]"
          >
            <span className="relative z-10 flex items-center gap-2">
              <Eye size={16} />
              View Projects
            </span>
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
          </a>
          <a
            href="#contact"
            className="px-8 py-3.5 rounded-xl glass border border-[rgba(0,212,255,0.3)] text-[#00D4FF] font-display font-bold text-sm hover:bg-[rgba(0,212,255,0.1)] hover:border-[rgba(0,212,255,0.6)] transition-all duration-300"
          >
            Let&apos;s Talk
          </a>
        </motion.div>

        {/* Social links */}
        <motion.div variants={itemVariants} className="flex gap-6 justify-center">
          {[
            { href: 'https://github.com/AhmedGwely', icon: <Github size={20} />, label: 'GitHub' },
            { href: 'https://www.linkedin.com/in/ahmed-gwely-2589611b0/', icon: <Linkedin size={20} />, label: 'LinkedIn' },
            { href: 'https://www.tiktok.com/@ahmedgwely10', icon: <TikTokIcon size={20} />, label: 'TikTok' },
          ].map(s => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-slate-500 hover:text-[#00D4FF] transition-all duration-200 text-sm font-body group"
            >
              <span className="group-hover:scale-110 transition-transform">{s.icon}</span>
              <span className="hidden sm:inline">{s.label}</span>
            </a>
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.a
        href="#about"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-600 hover:text-[#00D4FF] transition-colors"
      >
        <span className="text-xs font-mono">scroll</span>
        <ChevronDown size={16} className="animate-bounce" />
      </motion.a>
    </section>
  )
}
