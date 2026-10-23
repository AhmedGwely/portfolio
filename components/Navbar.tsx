// Navbar — scroll progress, active-section tracking, smooth scrolling.
//
// Build order step 3: Navbar with scroll progress bar fixed at the top,
// smooth page/anchor scrolling, and a sticky navbar.

'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Download, Eye } from 'lucide-react'

const navLinks = [
  { href: '#about', label: 'About' },
  { href: '#skills', label: 'Skills' },
  { href: '#projects', label: 'Projects' },
  { href: '#gallery', label: 'Gallery' },
  { href: '#certificates', label: 'Certificates' },
  { href: '#achievements', label: 'Achievements' },
  { href: '#contact', label: 'Contact' },
]

// Active-section tracking: the current section is inferred from scroll position.
function useScrollProgress() {
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement
      const sc = h.scrollTop
      const max = h.scrollHeight - h.clientHeight
      setProgress(max > 0 ? Math.min(1, sc / max) : 0)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return progress
}

// Thin emerald scroll-progress bar fixed at the top.
export function ScrollProgressBar() {
  const progress = useScrollProgress()
  return (
    <div className="fixed left-0 top-0 z-50 h-1 w-full bg-transparent">
      <div
        className="h-full bg-emerald-400 transition-[width] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ width: `${progress * 100}%` }}
      />
    </div>
  )
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'glass border-b border-emerald-400/10 py-3' : 'py-6'}`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="font-display font-bold text-xl tracking-tight">
          <span className="font-mono text-emerald-400">AG</span>
          <span className="text-slate-400 text-sm font-mono ml-2">{'// AI Engineer'}</span>
        </a>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-slate-400 hover:text-emerald-400 font-body text-sm font-medium transition-colors duration-200 relative group"
            >
              {link.label}
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-emerald-400 group-hover:w-full transition-all duration-300" />
            </a>
          ))}
          <a
            href="/cv.pdf"
            download
            className="flex items-center gap-2 rounded-lg border border-emerald-400/30 px-4 py-2 font-body text-sm font-medium text-emerald-400 transition-all duration-200 hover:bg-emerald-400/10"
          >
            <Download size={14} />
            Download CV
          </a>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden text-slate-400 hover:text-white"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass border-t border-emerald-400/10"
          >
            <div className="px-6 py-4 flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="text-slate-400 hover:text-emerald-400 font-body text-sm font-medium py-2"
                >
                  {link.label}
                </a>
              ))}
              <a
                href="/cv.pdf"
                download
                className="flex items-center gap-2 rounded-lg border border-emerald-400/30 px-4 py-2 font-body text-sm font-medium w-fit text-emerald-400 hover:bg-emerald-400/10"
              >
                <Download size={14} />
                Download CV
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
