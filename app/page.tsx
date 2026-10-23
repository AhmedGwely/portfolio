import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import About from '@/components/About'
import Skills from '@/components/Skills'
import FeaturedVideo from '@/components/FeaturedVideo'
import Projects from '@/components/Projects'
import FeaturedProjects from '@/components/FeaturedProjects'
import Certificates from '@/components/Certificates'
import Achievements from '@/components/Achievements'
import Gallery from '@/components/Gallery'
// NOTE: <Stats /> is intentionally not rendered.
// Its four figures (15+ projects, 500+ students, 12+ technologies, 94% accuracy)
// are unverified and were hidden from the public site pending confirmation.
// The component is preserved at components/Stats.tsx — see
// F:\portfolio-review\PHASE1-unverified-claims-review.md
import Contact from '@/components/Contact'
import Footer from '@/components/Footer'

export const dynamic = 'force-dynamic'

export default function Home() {
  return (
    <main className="relative min-h-screen bg-[var(--bg)] overflow-x-hidden">
      <div className="fixed inset-0 grid-bg opacity-100 pointer-events-none z-0" />
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(0,212,255,0.06)_0%,transparent_70%)]" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.06)_0%,transparent_70%)]" />
      </div>
      <div className="relative z-10">
        <Navbar />
        <Hero />
        <About />
        <Skills />
        <FeaturedVideo />
        <Projects />
        <FeaturedProjects />
        <Certificates />
        <Achievements />
        <Gallery />
        <Contact />
        <Footer />
      </div>
    </main>
  )
}
