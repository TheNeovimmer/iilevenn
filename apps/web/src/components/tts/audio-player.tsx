'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play,
  Pause,
  Download,
  RotateCcw,
  Volume2,
  Volume1,
  VolumeX,
  Gauge,
  Loader2,
} from 'lucide-react'
import WaveSurfer from 'wavesurfer.js'

interface AudioPlayerProps {
  src: string
  durationMs?: number | null
  fileName?: string
  sizeBytes?: number
  mimeType?: string
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function AudioPlayer({ src, durationMs, fileName, sizeBytes, mimeType }: AudioPlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const wsRef = useRef<WaveSurfer | null>(null)

  const [ready, setReady] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(durationMs ? durationMs / 1000 : 0)
  const [volume, setVolume] = useState(0.8)
  const [prevVolume, setPrevVolume] = useState(0.8)
  const [speedIdx, setSpeedIdx] = useState(2) // index 2 = 1x
  const [error, setError] = useState(false)
  const [showVolume, setShowVolume] = useState(false)
  const volumeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    let cancelled = false

    const ws = WaveSurfer.create({
      container: containerRef.current,
      height: 64,
      barWidth: 2,
      barGap: 1.5,
      barRadius: 4,
      cursorWidth: 2,
      cursorColor: 'rgba(99, 102, 241, 0.7)',
      waveColor: 'rgba(148, 163, 184, 0.3)',
      progressColor: 'rgba(99, 102, 241, 0.6)',
      normalize: true,
      backend: 'WebAudio',
      dragToSeek: true,
      hideScrollbar: true,
      autoScroll: false,
      fillParent: true,
      minPxPerSec: 0,
    })

    ws.on('ready', () => {
      if (cancelled) return
      setReady(true)
      setDuration(ws.getDuration())
      ws.setVolume(volume)
    })

    ws.on('timeupdate', (time) => {
      if (!cancelled) setCurrentTime(time)
    })
    ws.on('play', () => {
      if (!cancelled) setPlaying(true)
    })
    ws.on('pause', () => {
      if (!cancelled) setPlaying(false)
    })
    ws.on('finish', () => {
      if (!cancelled) setPlaying(false)
    })

    ws.on('error', (err) => {
      if (cancelled || (err instanceof DOMException && err.name === 'AbortError')) return
      setError(true)
      setPlaying(false)
    })

    ws.load(src)
    wsRef.current = ws

    return () => {
      cancelled = true
      wsRef.current = null
      try {
        ws.destroy()
      } catch {
        /* already destroyed */
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src])

  const togglePlay = useCallback(() => {
    const ws = wsRef.current
    if (!ws || !ready) return
    if (ws.getDuration() > 0 && ws.getCurrentTime() >= ws.getDuration()) {
      ws.seekTo(0)
    }
    ws.playPause()
  }, [ready])

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value)
    setVolume(v)
    if (v > 0) setPrevVolume(v)
    wsRef.current?.setVolume(v)
  }, [])

  const toggleMute = useCallback(() => {
    if (volume > 0) {
      setPrevVolume(volume)
      setVolume(0)
      wsRef.current?.setVolume(0)
    } else {
      setVolume(prevVolume)
      wsRef.current?.setVolume(prevVolume)
    }
  }, [volume, prevVolume])

  const handleVolumeMouseEnter = useCallback(() => {
    if (volumeTimeout.current) clearTimeout(volumeTimeout.current)
    setShowVolume(true)
  }, [])

  const handleVolumeMouseLeave = useCallback(() => {
    volumeTimeout.current = setTimeout(() => setShowVolume(false), 400)
  }, [])

  const cycleSpeed = useCallback(() => {
    const nextIdx = (speedIdx + 1) % SPEEDS.length
    setSpeedIdx(nextIdx)
    wsRef.current?.setPlaybackRate(SPEEDS[nextIdx])
  }, [speedIdx])

  const handleDownload = useCallback(() => {
    const a = document.createElement('a')
    a.href = src
    a.download = fileName || 'audio'
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }, [src, fileName])

  const ended = !playing && currentTime > 0 && duration > 0 && currentTime >= duration - 0.1

  const VolumeIcon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="overflow-hidden rounded-xl border border-border/40 bg-gradient-to-b from-foreground/[0.02] to-transparent"
    >
      {/* Waveform area */}
      <div className="relative px-4 pt-4 pb-1">
        <AnimatePresence>
          {!ready && !error && (
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-10 flex items-center justify-center rounded-t-xl bg-background/80 backdrop-blur-sm"
            >
              <div className="flex items-center gap-2.5 text-muted-foreground/50">
                <Loader2 className="size-4 animate-spin" />
                <span className="text-xs font-medium">Loading waveform...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={containerRef} className="relative cursor-pointer" style={{ minHeight: 64 }} />

        {/* Live playback indicator */}
        <AnimatePresence>
          {playing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none absolute right-5 top-5 flex items-center gap-1.5"
            >
              <div className="flex items-end gap-[2px]">
                {[0, 1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    className="w-[2.5px] rounded-full bg-indigo-500/60"
                    animate={{ height: ['4px', '14px', '4px'] }}
                    transition={{
                      duration: 0.6,
                      repeat: Infinity,
                      delay: i * 0.1,
                      ease: 'easeInOut',
                    }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls row */}
      <div className="flex items-center gap-1 px-3 pb-3 pt-1">
        <button
          type="button"
          onClick={togglePlay}
          disabled={error || !ready}
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100"
          title={error ? 'Failed to load' : ended ? 'Replay' : playing ? 'Pause' : 'Play'}
        >
          {error ? (
            <RotateCcw className="size-4" />
          ) : ended ? (
            <RotateCcw className="size-4" />
          ) : playing ? (
            <Pause className="size-4" />
          ) : (
            <Play className="ml-0.5 size-4" />
          )}
        </button>

        <div className="ml-2 flex items-baseline gap-1 tabular-nums">
          <span className="text-sm font-medium">{formatTime(currentTime)}</span>
          <span className="text-[11px] text-muted-foreground/40">/</span>
          <span className="text-[11px] text-muted-foreground/40">{formatTime(duration)}</span>
        </div>

        <div className="flex-1" />

        {/* Speed control */}
        <button
          type="button"
          onClick={cycleSpeed}
          className="flex h-7 items-center gap-1 rounded-md px-2 text-[11px] font-medium text-muted-foreground/60 transition-colors hover:bg-foreground/[0.06] hover:text-muted-foreground"
          title="Playback speed"
        >
          <Gauge className="size-3" />
          {SPEEDS[speedIdx]}x
        </button>

        {/* Volume control */}
        <div
          className="relative flex items-center"
          onMouseEnter={handleVolumeMouseEnter}
          onMouseLeave={handleVolumeMouseLeave}
        >
          <button
            type="button"
            onClick={toggleMute}
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground/50 transition-colors hover:bg-foreground/[0.06] hover:text-muted-foreground"
            title={volume === 0 ? 'Unmute' : 'Mute'}
          >
            <VolumeIcon className="size-3.5" />
          </button>

          <AnimatePresence>
            {showVolume && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 80, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden"
              >
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={volume}
                  onChange={handleVolumeChange}
                  className="ml-1 h-1 w-[72px] cursor-pointer appearance-none rounded-full bg-foreground/10 accent-foreground/60"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Download */}
        <button
          type="button"
          onClick={handleDownload}
          className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground/40 transition-colors hover:bg-foreground/[0.06] hover:text-muted-foreground"
          title="Download"
        >
          <Download className="size-3.5" />
        </button>
      </div>

      {/* File info strip */}
      {(fileName || sizeBytes || mimeType) && (
        <div className="flex items-center gap-2 border-t border-border/20 px-4 py-1.5">
          {fileName && (
            <span className="truncate text-[11px] text-muted-foreground/40">{fileName}</span>
          )}
          {sizeBytes != null && (
            <>
              <span className="text-[11px] text-muted-foreground/20">·</span>
              <span className="text-[11px] text-muted-foreground/40">{formatBytes(sizeBytes)}</span>
            </>
          )}
          {mimeType && (
            <>
              <span className="text-[11px] text-muted-foreground/20">·</span>
              <span className="text-[11px] text-muted-foreground/40">
                {mimeType.split('/')[1]?.toUpperCase()}
              </span>
            </>
          )}
        </div>
      )}
    </motion.div>
  )
}
