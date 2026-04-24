'use client'
import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

interface VideoModalProps {
  isOpen: boolean
  onClose: () => void
  video: {
    type: 'youtube' | 'tiktok' | 'mp4'
    url: string
  }
  title: string
}

function getYouTubeId(url: string) {
  const match = url.match(/(?:v=|youtu\.be\/|embed\/)([^&\n?#]+)/)
  return match ? match[1] : url
}

function getTikTokId(url: string) {
  const match = url.match(/video\/(\d+)/)
  return match ? match[1] : null
}

export default function VideoModal({ isOpen, onClose, video, title }: VideoModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-overlay bg-black/80"
          onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="relative w-full max-w-4xl glass rounded-2xl overflow-hidden border border-[rgba(0,212,255,0.2)] shadow-[0_0_60px_rgba(0,212,255,0.15)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(0,212,255,0.1)]">
              <h3 className="font-display font-semibold text-slate-100 text-lg">{title}</h3>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg glass flex items-center justify-center text-slate-400 hover:text-white hover:bg-red-500/20 transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Video */}
            <div className="relative bg-black" style={{ paddingBottom: video.type === 'tiktok' ? '177%' : '56.25%', maxHeight: video.type === 'tiktok' ? '80vh' : undefined }}>
              {video.type === 'youtube' && (
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src={`https://www.youtube.com/embed/${getYouTubeId(video.url)}?autoplay=1&rel=0`}
                  title={title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              )}
              {video.type === 'tiktok' && (
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src={`https://www.tiktok.com/embed/v2/${getTikTokId(video.url)}`}
                  title={title}
                  frameBorder="0"
                  allow="autoplay"
                  allowFullScreen
                />
              )}
              {video.type === 'mp4' && (
                <video
                  className="absolute inset-0 w-full h-full"
                  src={video.url}
                  controls
                  autoPlay
                />
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
