'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { AudioPlayer } from './audio-player'

type JobStatus = 'pending' | 'processing' | 'completed' | 'failed'

interface AudioFileInfo {
  id: string
  fileName: string
  mimeType: string
  sizeBytes: number
  durationMs: number | null
}

interface JobStatusDisplayProps {
  status: JobStatus
  error: string | null
  audioFile: AudioFileInfo | null
  downloadUrl: string | null
}

export function JobStatusDisplay({ status, error, audioFile, downloadUrl }: JobStatusDisplayProps) {
  if (status === 'pending' || status === 'processing') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 rounded-lg border border-border/30 bg-foreground/[0.02] px-4 py-3"
      >
        <div className="relative flex size-8 items-center justify-center">
          <div className="absolute inset-0 animate-ping rounded-full bg-foreground/5" />
          <Loader2 className="size-4 animate-spin text-foreground/60" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium">
            {status === 'pending' ? 'Queued' : 'Generating audio...'}
          </div>
          <div className="mt-0.5 text-[11px] text-muted-foreground/40">
            {status === 'pending'
              ? 'Waiting in queue'
              : 'Processing your text — this may take a moment'}
          </div>
        </div>

        {/* Processing animation bars */}
        <div className="flex items-end gap-[2px]">
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              className="w-[3px] rounded-full bg-foreground/30"
              animate={{ height: ['8px', '20px', '8px'] }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.12,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      </motion.div>
    )
  }

  if (status === 'failed') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/[0.04] px-4 py-3"
      >
        <XCircle className="size-5 shrink-0 text-destructive/70" />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-destructive/90">Generation failed</div>
          {error && <div className="mt-0.5 truncate text-[11px] text-destructive/50">{error}</div>}
        </div>
      </motion.div>
    )
  }

  if (downloadUrl && audioFile) {
    return (
      <AudioPlayer
        src={downloadUrl}
        durationMs={audioFile.durationMs}
        fileName={audioFile.fileName}
        sizeBytes={audioFile.sizeBytes}
        mimeType={audioFile.mimeType}
      />
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 rounded-lg border border-border/30 bg-foreground/[0.02] px-4 py-3"
    >
      <CheckCircle2 className="size-5 shrink-0 text-emerald-500/60" />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">Audio generated</div>
        <div className="mt-0.5 text-[11px] text-muted-foreground/40">Loading audio player...</div>
      </div>
    </motion.div>
  )
}

/** Compact job card for history sidebar */
interface HistoryItemProps {
  job: {
    id: string
    status: JobStatus
    inputText?: string | null
    error: string | null
    createdAt: string
    updatedAt: string
  }
  isActive?: boolean
  onClick?: () => void
}

export function HistoryItem({ job, isActive, onClick }: HistoryItemProps) {
  const time = new Date(job.createdAt)
  const isToday = new Date().toDateString() === time.toDateString()

  const label = job.inputText
    ? job.inputText.length > 40
      ? job.inputText.slice(0, 40) + '…'
      : job.inputText
    : job.id.slice(0, 8)

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-foreground/[0.05] ${
        isActive ? 'bg-foreground/[0.06]' : ''
      }`}
    >
      <div className="flex size-6 shrink-0 items-center justify-center">
        {job.status === 'completed' && <CheckCircle2 className="size-3.5 text-emerald-500/60" />}
        {job.status === 'failed' && <XCircle className="size-3.5 text-destructive/60" />}
        {job.status === 'processing' && (
          <Loader2 className="size-3.5 animate-spin text-foreground/40" />
        )}
        {job.status === 'pending' && <div className="size-2 rounded-full bg-foreground/20" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-xs">{label}</div>
        <div className="mt-0.5 flex items-center gap-1.5">
          <span
            className={`text-[10px] ${
              job.status === 'completed'
                ? 'text-emerald-500/60'
                : job.status === 'failed'
                  ? 'text-destructive/60'
                  : 'text-muted-foreground/40'
            }`}
          >
            {job.status}
          </span>
          <span className="text-[10px] text-muted-foreground/30">
            {isToday
              ? time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : time.toLocaleDateString([], { month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>
    </button>
  )
}
