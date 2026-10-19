'use client'

import { useEffect, useState, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface NavItem {
  label: string
  href: string
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/admin' },
  { label: 'Gallery', href: '/admin/gallery' },
  { label: 'Projects', href: '/admin/projects' },
  { label: 'Videos', href: '/admin/videos' },
  { label: 'Certificates', href: '/admin/certificates' },
  { label: 'Settings', href: '/admin/settings' },
]

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [authenticated, setAuthenticated] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/verify')
        if (res.ok) {
          setAuthenticated(true)
        } else {
          router.push('/admin-login')
        }
      } catch {
        router.push('/admin-login')
      } finally {
        setChecking(false)
      }
    }
    checkAuth()
  }, [router])

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // ignore network errors on logout
    }
    router.push('/admin-login')
  }

  if (checking || !authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a14]">
        <div className="text-[#00D4FF] text-lg animate-pulse">Loading…</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a14] text-gray-200 flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-[#00D4FF]/10 bg-[#0D1117]/50 flex flex-col">
        <div className="p-6 border-b border-[#00D4FF]/10">
          <h2 className="text-lg font-bold font-[Syne] text-[#00D4FF]">Admin CMS</h2>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href
            return (
              <a
                key={item.href}
                href={item.href}
                className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.label}
              </a>
            )
          })}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <header className="h-14 border-b border-[#00D4FF]/10 bg-[#0D1117]/50 flex items-center justify-between px-6">
          <a
            href="/"
            className="text-sm text-gray-400 hover:text-[#00D4FF] transition-colors"
          >
            ← View Site
          </a>

          <button
            onClick={handleLogout}
            className="px-4 py-1.5 rounded-lg border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/10 transition-colors"
          >
            Logout
          </button>
        </header>

        {/* Content area */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
