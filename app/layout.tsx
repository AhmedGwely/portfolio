import type { Metadata } from 'next'
import './globals.css'
import LenisSmoothScroll from '@/components/LenisSmoothScroll'
import { ScrollProgressBar } from '@/components/Navbar'

const SITE_URL = 'https://ahmed-gwely-portfolio.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Ahmed Gwely | AI Engineer — Generative AI, LLMs, AI Agents & Computer Vision',
    template: '%s | Ahmed Gwely',
  },
  description:
    'AI Engineer building practical AI systems end to end — from machine learning and computer vision to LLM-powered applications, RAG pipelines, and AI-driven automation.',
  keywords: [
    'Ahmed Gwely',
    'AI Engineer',
    'Generative AI',
    'LLM Developer',
    'AI Agents',
    'RAG Pipelines',
    'Computer Vision',
    'Deep Learning',
    'PyTorch',
    'YOLO',
    'Edge AI',
    'IoT',
    'Machine Learning',
  ],
  authors: [{ name: 'Ahmed Gwely', url: SITE_URL }],
  creator: 'Ahmed Gwely',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: 'Ahmed Gwely — AI Engineer',
    title: 'Ahmed Gwely | AI Engineer',
    description:
      'Generative AI, LLMs, AI Agents & Computer Vision — building practical AI systems end to end.',
    locale: 'en_US',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        type: 'image/png',
        alt: 'Ahmed Gwely — AI Engineer: Generative AI, LLMs, AI Agents & Computer Vision',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ahmed Gwely | AI Engineer',
    description:
      'Generative AI, LLMs, AI Agents & Computer Vision — building practical AI systems end to end.',
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
  name: 'Ahmed Gwely',
  alternateName: 'Ahmed Fathy Gwely',
  url: SITE_URL,
  jobTitle: 'AI Engineer',
  description:
    'AI Engineer working across Generative AI, LLMs, AI agents and Computer Vision — building practical AI systems end to end.',
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
