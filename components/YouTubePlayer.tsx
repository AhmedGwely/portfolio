'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  Gauge, Settings2, RotateCcw, RotateCw, Info, ExternalLink,
} from 'lucide-react'

/* ──────────────────────────────────────────────────────────────────────────
   Minimal typings for the YouTube IFrame Player API.
   Declared locally so we don't add a dependency for a handful of methods.
   ────────────────────────────────────────────────────────────────────────── */
type YTPlayer = {
  playVideo(): void
  pauseVideo(): void
  seekTo(seconds: number, allowSeekAhead: boolean): void
  getCurrentTime(): number
  getDuration(): number
  getVideoLoadedFraction(): number
  getPlaybackRate(): number
  setPlaybackRate(rate: number): void
  getAvailablePlaybackRates(): number[]
  getPlaybackQuality(): string
  getAvailableQualityLevels(): string[]
  setVolume(v: number): void
  getVolume(): number
  mute(): void
  unMute(): void
  isMuted(): boolean
  getPlayerState(): number
  getIframe(): HTMLIFrameElement
  destroy(): void
}

type YTNamespace = {
  Player: new (el: HTMLElement | string, opts: Record<string, unknown>) => YTPlayer
  PlayerState: { UNSTARTED: number; ENDED: number; PLAYING: number; PAUSED: number; BUFFERING: number; CUED: number }
}

declare global {
  interface Window {
    YT?: YTNamespace
    onYouTubeIframeAPIReady?: () => void
  }
}

/* ── Singleton API loader ───────────────────────────────────────────────── */
let apiPromise: Promise<void> | null = null

function loadYouTubeApi(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (window.YT?.Player) return Promise.resolve()
  if (apiPromise) return apiPromise

  apiPromise = new Promise<void>((resolve) => {
    const previous = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      if (typeof previous === 'function') previous()
      resolve()
    }
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const s = document.createElement('script')
      s.src = 'https://www.youtube.com/iframe_api'
      s.async = true
      document.head.appendChild(s)
    }
  })
  return apiPromise
}

const QUALITY_LABEL: Record<string, string> = {
  highres: '4K+', hd2160: '2160p', hd1440: '1440p', hd1080: '1080p',
  hd720: '720p', large: '480p', medium: '360p', small: '240p', tiny: '144p',
  auto: 'Auto', default: 'Auto', unknown: 'Auto',
}

function fmt(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) sec = 0
  const s = Math.floor(sec % 60)
  const m = Math.floor((sec / 60) % 60)
  const h = Math.floor(sec / 3600)
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m)
  return `${h > 0 ? h + ':' : ''}${mm}:${String(s).padStart(2, '0')}`
}

const SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]

type Props = {
  videoId: string
  title: string
  watchUrl: string
  accent?: string
  accent2?: string
  accent3?: string
}

export default function YouTubePlayer({
  videoId,
  title,
  watchUrl,
  accent = 'var(--accent)',
  accent2 = 'var(--accent)',
  accent3 = 'var(--accent)',
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<YTPlayer | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [ready, setReady] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [buffering, setBuffering] = useState(false)
  const [ended, setEnded] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)
  const [loaded, setLoaded] = useState(0)
  const [rate, setRate] = useState(1)
  const [quality, setQuality] = useState('auto')
  const [volume, setVolume] = useState(100)
  const [muted, setMuted] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [speedOpen, setSpeedOpen] = useState(false)
  const [qualityOpen, setQualityOpen] = useState(false)
  const [uiVisible, setUiVisible] = useState(true)
  const [seeking, setSeeking] = useState(false)

  /* ── Create the player once ──────────────────────────────────────────── */
  useEffect(() => {
    let disposed = false

    loadYouTubeApi().then(() => {
      if (disposed || !hostRef.current || !window.YT) return
      const host = document.createElement('div')
      host.style.width = '100%'
      host.style.height = '100%'
      hostRef.current.appendChild(host)

      playerRef.current = new window.YT.Player(host, {
        videoId,
        width: '100%',
        height: '100%',
        playerVars: {
          autoplay: 1,
          controls: 0,          // we render our own bar
          disablekb: 1,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          iv_load_policy: 3,
        },
        events: {
          onReady: (e: { target: YTPlayer }) => {
            if (disposed) return
            setReady(true)
            try {
              const r = e.target.getAvailablePlaybackRates?.()
              if (r?.length) setRate(e.target.getPlaybackRate())
              setVolume(e.target.getVolume())
              setDuration(e.target.getDuration())
            } catch { /* ignore */ }
          },
          onStateChange: (e: { data: number; target: YTPlayer }) => {
            if (disposed) return
            const S = window.YT!.PlayerState
            if (e.data === S.PLAYING) { setPlaying(true); setBuffering(false); setEnded(false) }
            else if (e.data === S.PAUSED) { setPlaying(false); setBuffering(false) }
            else if (e.data === S.BUFFERING) setBuffering(true)
            else if (e.data === S.ENDED) { setPlaying(false); setEnded(true); setUiVisible(true) }
            try { setDuration(e.target.getDuration()) } catch { /* ignore */ }
          },
          onPlaybackRateChange: (e: { data: number }) => { if (!disposed) setRate(e.data) },
          onPlaybackQualityChange: (e: { data: string }) => { if (!disposed) setQuality(e.data) },
          onError: () => { if (!disposed) setBuffering(false) },
        },
      })
    })

    return () => {
      disposed = true
      try { playerRef.current?.destroy() } catch { /* ignore */ }
      playerRef.current = null
    }
  }, [videoId])

  /* ── Poll progress ───────────────────────────────────────────────────── */
  useEffect(() => {
    if (!ready) return
    const id = setInterval(() => {
      const p = playerRef.current
      if (!p || seeking) return
      try {
        setCurrent(p.getCurrentTime() ?? 0)
        setLoaded(p.getVideoLoadedFraction() ?? 0)
        const d = p.getDuration()
        if (d && d !== duration) setDuration(d)
      } catch { /* ignore */ }
    }, 250)
    return () => clearInterval(id)
  }, [ready, seeking, duration])

  /* ── Fullscreen state ────────────────────────────────────────────────── */
  useEffect(() => {
    const onFs = () => setFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFs)
    return () => document.removeEventListener('fullscreenchange', onFs)
  }, [])

  /* ── Auto-hide the bar while playing ─────────────────────────────────── */
  const poke = useCallback(() => {
    setUiVisible(true)
    if (hideTimer.current) clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => {
      const st = playerRef.current?.getPlayerState?.()
      const isPlaying = st === (window.YT?.PlayerState.PLAYING ?? 1)
      if (isPlaying && !speedOpen && !qualityOpen) setUiVisible(false)
    }, 2800)
  }, [speedOpen, qualityOpen])

  useEffect(() => {
    if (playing && !speedOpen && !qualityOpen) poke()
    else { setUiVisible(true); if (hideTimer.current) clearTimeout(hideTimer.current) }
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current) }
  }, [playing, speedOpen, qualityOpen, poke])

  /* ── Actions ─────────────────────────────────────────────────────────── */
  const toggle = () => {
    const p = playerRef.current
    if (!p) return
    if (playing) p.pauseVideo()
    else { p.playVideo(); if (ended) p.seekTo(0, true) }
    poke()
  }

  const seekTo = (t: number) => {
    const p = playerRef.current
    if (!p) return
    p.seekTo(t, true)
    setCurrent(t)
  }

  const nudge = (delta: number) => {
    const p = playerRef.current
    if (!p) return
    seekTo(Math.max(0, Math.min(duration || 0, (p.getCurrentTime() ?? 0) + delta)))
    poke()
  }

  const changeRate = (r: number) => {
    playerRef.current?.setPlaybackRate(r)
    setRate(r)
    setSpeedOpen(false)
  }

  const toggleMute = () => {
    const p = playerRef.current
    if (!p) return
    if (muted) { p.unMute(); setMuted(false) } else { p.mute(); setMuted(true) }
  }

  const changeVolume = (v: number) => {
    const p = playerRef.current
    if (!p) return
    p.setVolume(v)
    setVolume(v)
    if (v === 0) { p.mute(); setMuted(true) }
    else if (muted) { p.unMute(); setMuted(false) }
  }

  const toggleFullscreen = async () => {
    const el = wrapRef.current
    if (!el) return
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else await el.requestFullscreen()
    } catch { /* ignore */ }
  }

  /* ── Keyboard shortcuts ──────────────────────────────────────────────── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!wrapRef.current) return
      const el = wrapRef.current
      const active = document.activeElement
      if (active && el.contains(active) === false && active !== document.body) return
      switch (e.key) {
        case ' ': case 'k': e.preventDefault(); toggle(); break
        case 'ArrowRight': e.preventDefault(); nudge(5); break
        case 'ArrowLeft': e.preventDefault(); nudge(-5); break
        case 'm': toggleMute(); break
        case 'f': toggleFullscreen(); break
        default: break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, muted, duration])

  const pct = duration > 0 ? (current / duration) * 100 : 0
  const bufPct = Math.max(0, Math.min(100, loaded * 100))
  const qualityLevels = ready ? (playerRef.current?.getAvailableQualityLevels?.() ?? []) : []

  const glass = 'rgba(8,10,18,0.82)'
  const chip = 'flex items-center justify-center rounded-lg transition-colors duration-150 hover:bg-white/10 #9B9B9B'

  return (
    <div
      ref={wrapRef}
      className="absolute inset-0 select-none group/player"
      onMouseMove={poke}
      onMouseLeave={() => { if (playing && !speedOpen && !qualityOpen) setUiVisible(false) }}
    >
      {/* Player mount */}
      <div ref={hostRef} className="absolute inset-0 [&>iframe]:w-full [&>iframe]:h-full" />

      {/* Click-to-toggle surface (sits under the bar) */}
      {ready && (
        <button
          type="button"
          aria-label={playing ? 'Pause' : 'Play'}
          onClick={toggle}
          className="absolute inset-0 w-full h-full cursor-pointer bg-transparent"
          style={{ bottom: uiVisible ? 76 : 0 }}
        />
      )}

      {/* Buffering spinner */}
      <AnimatePresence>
        {buffering && !ended && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <span
              className="w-14 h-14 rounded-full border-2 border-transparent animate-spin"
              style={{ borderTopColor: accent, borderRightColor: `${accent}55` }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Replay overlay */}
      <AnimatePresence>
        {ended && (
          <motion.button
            type="button"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => { playerRef.current?.seekTo(0, true); playerRef.current?.playVideo() }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/65 cursor-pointer"
          >
            <span
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${accent}, ${accent2})`, boxShadow: `0 0 45px ${accent}70` }}
            >
              <RotateCcw size={30} className="text-[#0A0A0B]" />
            </span>
            <span className="font-mono text-xs uppercase tracking-[0.2em] #64748B">Replay</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Control bar ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {ready && uiVisible && (
          <motion.div
            ref={barRef}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.22 }}
            className="absolute left-0 right-0 bottom-0 px-3 pb-3 pt-8"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.88), rgba(0,0,0,0.45) 55%, transparent)' }}
          >
            {/* Progress */}
            <div className="flex items-center gap-3 mb-2">
              <span className="font-mono text-[11px] #64748B tabular-nums shrink-0 w-[42px] text-right">
                {fmt(current)}
              </span>

              <div className="relative flex-1 h-4 flex items-center group/track">
                {/* track */}
                <div className="absolute left-0 right-0 h-1 rounded-full bg-white/15 overflow-hidden">
                  <div className="absolute left-0 top-0 h-full bg-white/25" style={{ width: `${bufPct}%` }} />
                </div>
                {/* fill */}
                <div
                  className="absolute left-0 h-1 rounded-full pointer-events-none"
                  style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${accent}, ${accent2})` }}
                />
                {/* thumb */}
                <div
                  className="absolute w-3 h-3 rounded-full pointer-events-none opacity-0 group-hover/track:opacity-100 transition-opacity"
                  style={{ left: `calc(${pct}% - 6px)`, background: accent, boxShadow: `0 0 12px ${accent}` }}
                />
                <input
                  type="range"
                  min={0}
                  max={duration || 0}
                  step={0.1}
                  value={current}
                  aria-label="Video progress"
                  onChange={(e) => { setSeeking(true); setCurrent(Number(e.target.value)) }}
                  onMouseUp={(e) => { seekTo(Number((e.target as HTMLInputElement).value)); setSeeking(false) }}
                  onTouchEnd={(e) => { seekTo(Number((e.target as HTMLInputElement).value)); setSeeking(false) }}
                  onKeyUp={(e) => { seekTo(Number((e.target as HTMLInputElement).value)); setSeeking(false) }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>

              <span className="font-mono text-[11px] #5C5C5C tabular-nums shrink-0 w-[42px]">
                {fmt(duration)}
              </span>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-1.5">
              <button type="button" onClick={toggle} className={`${chip} w-9 h-9`} aria-label={playing ? 'Pause' : 'Play'}>
                {playing ? <Pause size={17} /> : <Play size={17} fill="currentColor" />}
              </button>

              <button type="button" onClick={() => nudge(-10)} className={`${chip} w-9 h-9`} aria-label="Back 10 seconds">
                <RotateCcw size={16} />
              </button>
              <button type="button" onClick={() => nudge(10)} className={`${chip} w-9 h-9`} aria-label="Forward 10 seconds">
                <RotateCw size={16} />
              </button>

              {/* Volume */}
              <div className="flex items-center gap-1 group/vol">
                <button type="button" onClick={toggleMute} className={`${chip} w-9 h-9`} aria-label={muted ? 'Unmute' : 'Mute'}>
                  {muted || volume === 0 ? <VolumeX size={17} /> : <Volume2 size={17} />}
                </button>
                <input
                  type="range" min={0} max={100} value={muted ? 0 : volume}
                  aria-label="Volume"
                  onChange={(e) => changeVolume(Number(e.target.value))}
                  className="w-0 group-hover/vol:w-20 transition-all duration-300 h-1 rounded-full cursor-pointer accent-[#3ECF8E]"
                  style={{ accentColor: accent }}
                />
              </div>

              <div className="flex-1" />

              {/* Speed — fully functional */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => { setSpeedOpen(v => !v); setQualityOpen(false) }}
                  className={`${chip} h-9 px-2.5 gap-1.5 font-mono text-xs`}
                  aria-label="Playback speed"
                  aria-expanded={speedOpen}
                >
                  <Gauge size={15} />
                  {rate === 1 ? '1x' : `${rate}x`}
                </button>

                <AnimatePresence>
                  {speedOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="absolute bottom-11 right-0 rounded-xl overflow-hidden py-1 min-w-[112px] z-20"
                      style={{ background: glass, border: `1px solid ${accent}35`, backdropFilter: 'blur(14px)' }}
                    >
                      <div className="px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest #5C5C5C">
                        Speed
                      </div>
                      {SPEEDS.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => changeRate(s)}
                          className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-mono transition-colors hover:bg-white/10"
                          style={{ color: rate === s ? accent : '#cbd5e1' }}
                        >
                          <span>{s}x</span>
                          {rate === s && <span className="w-1.5 h-1.5 rounded-full" style={{ background: accent }} />}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Quality — read-only indicator (YouTube owns adaptive quality) */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => { setQualityOpen(v => !v); setSpeedOpen(false) }}
                  className={`${chip} h-9 px-2.5 gap-1.5 font-mono text-xs`}
                  aria-label="Video quality"
                  aria-expanded={qualityOpen}
                >
                  <Settings2 size={15} />
                  {QUALITY_LABEL[quality] ?? quality.toUpperCase()}
                </button>

                <AnimatePresence>
                  {qualityOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="absolute bottom-11 right-0 rounded-xl p-3.5 w-[248px] z-20"
                      style={{
                        background: glass,
                        border: `1px solid ${accent}35`,
                        backdropFilter: 'blur(14px)',
                      }}
                    >
                      <div className="flex items-start gap-2 mb-2.5">
                        <Info size={13} style={{ color: accent }} className="mt-0.5 shrink-0" />
                        <p className="text-[11px] leading-relaxed #64748B">
                          YouTube manages video quality automatically and no longer allows
                          third-party players to set it. It adapts to your connection and screen.
                        </p>
                      </div>

                      <div className="flex items-center justify-between rounded-lg px-2.5 py-2 mb-2.5"
                        style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <span className="font-mono text-[10px] uppercase tracking-widest #5C5C5C">
                          Now playing
                        </span>
                        <span className="font-mono text-xs" style={{ color: accent3 }}>
                          {QUALITY_LABEL[quality] ?? quality.toUpperCase()}
                        </span>
                      </div>

                      {qualityLevels.length > 0 && (
                        <div className="mb-2.5">
                          <div className="font-mono text-[10px] uppercase tracking-widest #5C5C5C mb-1">
                            Available
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {qualityLevels.map(q => (
                              <span key={q} className="font-mono text-[10px] px-1.5 py-0.5 rounded"
                                style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8' }}>
                                {QUALITY_LABEL[q] ?? q}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <a
                        href={watchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg font-mono text-[11px] transition-colors"
                        style={{ background: `${accent}1f`, border: `1px solid ${accent}45`, color: accent }}
                      >
                        Change quality on YouTube
                        <ExternalLink size={11} />
                      </a>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button type="button" onClick={toggleFullscreen} className={`${chip} w-9 h-9`} aria-label="Fullscreen">
                {fullscreen ? <Minimize size={17} /> : <Maximize size={17} />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
