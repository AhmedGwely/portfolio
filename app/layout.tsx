import type { Metadata } from 'next'
import './globals.css'
import LenisSmoothScroll from '@/components/LenisSmoothScroll'
import { ScrollProgressBar } from '@/components/Navbar'

const SITE_URL = 'https://ahmed-gwely-portfolio.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Ahmed Fathy Gwely | AI Engineer — Computer Vision, Generative AI, LLMs & Edge AI',
    template: '%s | Ahmed Fathy Gwely',
  },
  description:
    'AI Engineer building practical systems end to end — computer vision, generative AI, LLM applications, RAG pipelines, and edge AI deployed where they actually run.',
  keywords: [
    'Ahmed Fathy Gwely',
    'Ahmed Gwely',
    'AI Engineer',
    'Generative AI',
    'LLM Developer',
    'AI Agents',
    'RAG Pipelines',
    'Computer Vision',
    'Edge AI',
    'Deep Learning',
    'PyTorch',
    'YOLO',
    'IoT',
    'Machine Learning',
  ],
  authors: [{ name: 'Ahmed Fathy Gwely', url: SITE_URL }],
  creator: 'Ahmed Fathy Gwely',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: 'Ahmed Fathy Gwely — AI Engineer',
    title: 'Ahmed Fathy Gwely | AI Engineer',
    description:
      'AI Engineer — Computer Vision, Generative AI, LLMs and Edge AI. Building practical AI systems end to end.',
    locale: 'en_US',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        type: 'image/png',
        alt: 'Ahmed Fathy Gwely — AI Engineer: Computer Vision, Generative AI, LLMs & Edge AI',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ahmed Fathy Gwely | AI Engineer',
    description:
      'AI Engineer — Computer Vision, Generative AI, LLMs and Edge AI. Building practical AI systems end to end.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

/**
 * Person structured data.
 * Only verified information is included — no unverified metrics, employers,
 * or credentials. jobTitle, alumniOf, knowsAbout, and the sameAs profile links
 * all trace to the CV and the portfolio's own links.
 */
const personJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Ahmed Fathy Gwely',
  alternateName: 'Ahmed Gwely',
  url: SITE_URL,
  jobTitle: 'AI Engineer',
  description:
    'AI Engineer working across Computer Vision, Generative AI, LLMs, AI agents and Edge AI — building practical AI systems end to end.',
  knowsAbout: [
    'Artificial Intelligence',
    'Generative AI',
    'Large Language Models',
    'Retrieval-Augmented Generation',
    'AI Agents',
    'Computer Vision',
    'Deep Learning',
    'Machine Learning',
    'Edge AI',
    'Internet of Things',
    'Data Science',
  ],
  alumniOf: {
    '@type': 'CollegeOrUniversity',
    name: 'Mansoura University',
  },
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'EG',
  },
  sameAs: [
    'https://github.com/AhmedGwely',
    'https://www.linkedin.com/in/ahmed-gwely-2589611b0/',
    'https://www.tiktok.com/@ahmedgwely10',
    'https://www.youtube.com/@AhmedGwely',
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="antialiased">
        <LenisSmoothScroll />
        <ScrollProgressBar />
        {children}
        <script
          type="application/ld+json"
          // Static, developer-authored object — no user input is interpolated.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
      </body>
    </html>
  )
}
