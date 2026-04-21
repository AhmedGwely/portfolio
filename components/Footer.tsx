'use client'
import { motion } from 'framer-motion'
import { Github, Linkedin, ArrowUp } from 'lucide-react'

function TikTokIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V9.17a8.16 8.16 0 004.77 1.52V7.25a4.85 4.85 0 01-1-.56z"/>
    </svg>
  )
}

const navLinks = [
  { href: '#about', label: 'About' },
  { href: '#skills', label: 'Skills' },
  { href: '#projects', label: 'Projects' },
  { href: '#featured', label: 'Featured' },
  { href: '#achievements', label: 'Achievements' },
  { href: '#contact', label: 'Contact' },
]

export default function Footer() {
  return (
    <footer className="relative border-t border-[rgba(0,212,255,0.08)] py-12 px-6 overflow-hidden">
      {/* Glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-24 bg-[radial-gradient(ellipse_at_bottom,rgba(0,212,255,0.06),transparent_70%)]" />

      <div className="max-w-6xl mx-auto relative">
        {/* Top row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-8 mb-10">
          {/* Logo */}
          <a href="#" className="font-display font-bold text-2xl">
            <span className="gradient-text">AG</span>
            <span className="text-slate-600 font-mono text-sm ml-2">// AI Engineer</span>
          </a>

          {/* Nav links */}
          <nav className="flex flex-wrap gap-6 justify-center">
            {navLinks.map(link => (
              <a
                key={link.href}
                href={link.href}
                className="font-body text-sm text-slate-600 hover:text-[#00D4FF] transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Social icons */}
          <div className="flex gap-4">
            {[
              { href: 'https://github.com/AhmedGwely', icon: <Github size={18} /> },
              { href: 'https://www.linkedin.com/in/ahmed-gwely-2589611b0/', icon: <Linkedin size={18} /> },
              { href: 'https://www.tiktok.com/@ahmedgwely10', icon: <TikTokIcon size={18} /> },
            ].map((s, i) => (
              <a
                key={i}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg glass border border-[rgba(255,255,255,0.06)] flex items-center justify-center text-slate-600 hover:text-[#00D4FF] hover:border-[rgba(0,212,255,0.3)] transition-all"
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-[rgba(0,212,255,0.15)] to-transparent mb-8" />

        {/* Bottom row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-mono text-xs text-slate-700">
            © {new Date().getFullYear()} Ahmed Gwely. Designed &amp; built with{' '}
            <span className="text-[#00D4FF]">Next.js</span> +{' '}
            <span className="text-[#7C3AED]">Framer Motion</span>.
          </p>

          <div className="flex items-center gap-6">
            <span className="font-mono text-xs text-slate-700">
              <span className="text-[#06FFA5]">▲</span> Deployed on Vercel
            </span>

            {/* Back to top */}
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center gap-2 font-mono text-xs text-slate-600 hover:text-[#00D4FF] transition-colors group"
            >
              Back to top
              <ArrowUp size={12} className="group-hover:-translate-y-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}
