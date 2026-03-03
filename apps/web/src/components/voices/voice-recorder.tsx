'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Mic, Square, Play, Pause, Trash2, RotateCcw, Loader2, AlertCircle } from 'lucide-react'
import WaveSurfer from 'wavesurfer.js'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth'
import { uploadFile } from '@/lib/api'
import { useVoiceRecorder } from '@/hooks/use-voice-recorder'

interface VoiceSample {
  id: string
  voiceId: string
  fileName: string
  mimeType: string
  sizeBytes: number
  durationMs: number | null
  storagePath: string
  createdAt: string
}

interface VoiceRecorderProps {
  voiceId: string
  onUploaded: (sample: VoiceSample) => void
}

function formatTime(ms: number): string {
  const totalSecs = Math.floor(ms / 1000)
  const mins = Math.floor(totalSecs / 60)
  const secs = totalSecs % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function VoiceRecorder({ voiceId, onUploaded }: VoiceRecorderProps) {
  const { accessToken } = useAuth()
  const {
    state,
    audioBlob,
    elapsedMs,
    analyserNode,
    error,
    startRecording,
    stopRecording,
    discard,
  } = useVoiceRecorder()

  const [uploading, setUploading] = useState(false)

  const handleUse = useCallback(async () => {
    if (!audioBlob) return
    setUploading(true)

    const file = new File([audioBlob], `recording-${Date.now()}.wav`, {
      type: 'audio/wav',
    })

    const res = await uploadFile<{ sample: VoiceSample }>(
      `/voices/${voiceId}/samples`,
      file,
      accessToken || undefined,
    )

    if (res.success && res.data) {
      onUploaded(res.data.sample)
      discard()
    }
    setUploading(false)
  }, [audioBlob, voiceId, accessToken, onUploaded, discard])

  return (
    <AnimatePresence mode="wait">
      {error && (
        <ErrorState key="error" message={error} onRetry={startRecording} onDismiss={discard} />
      )}

      {!error && state === 'idle' && <IdleState key="idle" onRecord={startRecording} />}

      {state === 'requesting' && <RequestingState key="requesting" />}

      {state === 'recording' && (
        <RecordingState
          key="recording"
          elapsedMs={elapsedMs}
          analyserNode={analyserNode}
          onStop={stopRecording}
        />
      )}

      {state === 'recorded' && audioBlob && (
        <RecordedState
          key="recorded"
          audioBlob={audioBlob}
          elapsedMs={elapsedMs}
          onDiscard={discard}
          onReRecord={startRecording}
          onUse={handleUse}
          uploading={uploading}
        />
      )}
    </AnimatePresence>
  )
}

// --- Recorded State (WaveSurfer preview) ---
function RecordedState({
  audioBlob,
  elapsedMs,
  onDiscard,
  onReRecord,
  onUse,
  uploading,
}: {
  audioBlob: Blob
  elapsedMs: number
  onDiscard: () => void
  onReRecord: () => void
  onUse: () => void
  uploading: boolean
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<WaveSurfer | null>(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return
    let cancelled = false

    const ws = WaveSurfer.create({
      container: containerRef.current,
      height: 48,
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
    })
    ws.on('timeupdate', (t) => {
      if (!cancelled) setCurrentTime(t)
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
    })

    const url = URL.createObjectURL(audioBlob)
    ws.load(url)
    wsRef.current = ws

    return () => {
      cancelled = true
      wsRef.current = null
      URL.revokeObjectURL(url)
      try {
        ws.destroy()
      } catch {
        /* already destroyed */
      }
    }
  }, [audioBlob])

  const togglePlay = useCallback(() => {
    const ws = wsRef.current
    if (!ws || !ready) return
    if (ws.getCurrentTime() >= ws.getDuration()) ws.seekTo(0)
    ws.playPause()
  }, [ready])

  const durationMs = duration * 1000 || elapsedMs

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden rounded-xl border border-border/40 bg-gradient-to-b from-foreground/[0.02] to-transparent"
    >
      {/* Waveform */}
      <div className="relative px-4 pt-4 pb-1">
        <AnimatePresence>
          {!ready && (
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm"
            >
              <div className="flex items-center gap-2.5 text-muted-foreground/50">
                <Loader2 className="size-4 animate-spin" />
                <span className="text-xs font-medium">Processing...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={containerRef} className="cursor-pointer" style={{ minHeight: 48 }} />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1 px-3 pb-2 pt-1">
        <button
          type="button"
          onClick={togglePlay}
          disabled={!ready}
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition-all hover:scale-105 active:scale-95 disabled:opacity-30"
        >
          {playing ? <Pause className="size-3.5" /> : <Play className="ml-0.5 size-3.5" />}
        </button>
        <div className="ml-2 flex items-baseline gap-1 tabular-nums">
          <span className="text-sm font-medium">{formatTime(currentTime * 1000)}</span>
          <span className="text-[11px] text-muted-foreground/40">/</span>
          <span className="text-[11px] text-muted-foreground/40">{formatTime(durationMs)}</span>
        </div>
      </div>

      {/* Info strip */}
      <div className="flex items-center gap-2 border-t border-border/20 px-4 py-1.5">
        <span className="text-[11px] text-muted-foreground/40">WAV</span>
        <span className="text-[11px] text-muted-foreground/20">·</span>
        <span className="text-[11px] text-muted-foreground/40">{formatBytes(audioBlob.size)}</span>
        <span className="text-[11px] text-muted-foreground/20">·</span>
        <span className="text-[11px] text-muted-foreground/40">{formatTime(durationMs)}</span>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 border-t border-border/20 px-4 py-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onDiscard}
          disabled={uploading}
          className="gap-1.5 text-xs text-muted-foreground/60"
        >
          <Trash2 className="size-3" />
          Discard
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onReRecord}
          disabled={uploading}
          className="gap-1.5 border-border/50 text-xs"
        >
          <RotateCcw className="size-3" />
          Re-record
        </Button>
        <div className="flex-1" />
        <Button size="sm" onClick={onUse} disabled={uploading} className="gap-1.5 text-xs">
          {uploading ? <Loader2 className="size-3.5 animate-spin" /> : <Mic className="size-3.5" />}
          {uploading ? 'Uploading...' : 'Use this recording'}
        </Button>
      </div>
    </motion.div>
  )
}

// --- Idle State ---
function IdleState({ onRecord }: { onRecord: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onRecord}
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="flex w-full flex-col items-center justify-center rounded-lg border border-dashed border-border/50 py-8 transition-colors hover:border-border hover:bg-foreground/[0.01]"
    >
      <Mic className="mb-2 size-6 text-muted-foreground/20" />
      <span className="text-xs font-medium text-muted-foreground/50">Record a voice sample</span>
      <span className="mt-1 text-[10px] text-muted-foreground/30">
        Up to 5 minutes · saves as WAV
      </span>
    </motion.button>
  )
}

// --- Live waveform via AnalyserNode (rolling amplitude bars) ---
function LiveWaveform({ analyserNode }: { analyserNode: AnalyserNode | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const historyRef = useRef<number[]>([])
  const smoothedRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !analyserNode) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Handle retina / hi-DPI displays
    const dpr = window.devicePixelRatio || 1
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.scale(dpr, dpr)
    }
    resizeCanvas()

    const observer = new ResizeObserver(resizeCanvas)
    observer.observe(canvas)

    const bufferLength = analyserNode.fftSize
    const dataArray = new Float32Array(bufferLength)

    const BAR_W = 2.5
    const GAP = 1.5

    const draw = () => {
      animRef.current = requestAnimationFrame(draw)

      // Get time-domain data and compute RMS amplitude
      analyserNode.getFloatTimeDomainData(dataArray)
      let sum = 0
      for (let i = 0; i < bufferLength; i++) sum += dataArray[i] * dataArray[i]
      const rms = Math.sqrt(sum / bufferLength)

      // Smooth the value to avoid jitter
      smoothedRef.current += (rms - smoothedRef.current) * 0.3
      const level = Math.min(1, smoothedRef.current * 4) // boost for visibility

      // Push to rolling history
      const rect = canvas.getBoundingClientRect()
      const w = rect.width
      const h = rect.height
      const maxBars = Math.ceil(w / (BAR_W + GAP))
      historyRef.current.push(level)
      if (historyRef.current.length > maxBars) {
        historyRef.current = historyRef.current.slice(-maxBars)
      }

      ctx.clearRect(0, 0, w, h)

      const history = historyRef.current
      const startX = w - history.length * (BAR_W + GAP)

      for (let i = 0; i < history.length; i++) {
        const val = history[i]
        const barH = Math.max(2, val * (h - 4))
        const x = startX + i * (BAR_W + GAP)
        const y = (h - barH) / 2

        // Fade older bars slightly
        const age = 1 - (history.length - 1 - i) / maxBars
        const alpha = 0.25 + age * 0.45

        ctx.fillStyle = `rgba(99, 102, 241, ${alpha})`
        ctx.beginPath()
        ctx.roundRect(x, y, BAR_W, barH, 1)
        ctx.fill()
      }
    }

    draw()
    return () => {
      cancelAnimationFrame(animRef.current)
      observer.disconnect()
    }
  }, [analyserNode])

  return <canvas ref={canvasRef} className="h-12 w-full rounded-md" />
}

// --- Recording State ---
function RecordingState({
  elapsedMs,
  analyserNode,
  onStop,
}: {
  elapsedMs: number
  analyserNode: AnalyserNode | null
  onStop: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden rounded-xl border border-border/40 bg-gradient-to-b from-foreground/[0.02] to-transparent"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-3 pb-2">
        <span className="relative flex size-2.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex size-2.5 rounded-full bg-red-500" />
        </span>
        <span className="text-xs font-semibold tracking-wide text-red-500/80">REC</span>
        <span className="text-sm font-medium tabular-nums text-foreground/80">
          {formatTime(elapsedMs)}
        </span>
        <div className="flex-1" />
        <Button
          size="sm"
          variant="outline"
          onClick={onStop}
          className="gap-1.5 border-border/50 text-xs"
        >
          <Square className="size-3 fill-current" />
          Stop
        </Button>
      </div>

      {/* Live waveform canvas */}
      <div className="px-4 pb-3">
        <LiveWaveform analyserNode={analyserNode} />
      </div>
    </motion.div>
  )
}

// --- Requesting (microphone permission) ---
function RequestingState() {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="flex items-center justify-center gap-2 rounded-lg border border-border/40 py-8"
    >
      <Loader2 className="size-4 animate-spin text-muted-foreground/50" />
      <span className="text-xs font-medium text-muted-foreground/50">
        Requesting microphone access...
      </span>
    </motion.div>
  )
}

// --- Error State ---
function ErrorState({
  message,
  onRetry,
  onDismiss,
}: {
  message: string
  onRetry: () => void
  onDismiss: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden rounded-xl border border-destructive/30 bg-destructive/[0.04]"
    >
      <div className="flex items-start gap-3 px-4 py-3">
        <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive/60" />
        <div className="flex-1">
          <p className="text-sm font-medium text-destructive/80">Recording failed</p>
          <p className="mt-0.5 text-xs text-destructive/50">{message}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 border-t border-destructive/10 px-4 py-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="text-xs text-muted-foreground/60"
        >
          Dismiss
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="gap-1.5 border-destructive/20 text-xs text-destructive/70"
        >
          <RotateCcw className="size-3" />
          Retry
        </Button>
      </div>
    </motion.div>
  )
}
