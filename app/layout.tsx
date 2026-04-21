import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Ahmed Gwely | AI Engineer & Computer Vision Specialist',
  description: 'Portfolio of Ahmed Gwely — AI Engineer specializing in Computer Vision, Deep Learning, and Intelligent Vision Systems.',
  keywords: 'Ahmed Gwely, AI Engineer, Computer Vision, Deep Learning, PyTorch, YOLO, Machine Learning',
  openGraph: {
    title: 'Ahmed Gwely | AI Engineer',
    description: 'Building Intelligent Vision Systems',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="antialiased">{children}</body>
    </html>
  )
}
