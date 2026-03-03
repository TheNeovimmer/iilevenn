'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { VoicePicker } from '@/components/tts/voice-picker'
import { JobStatusDisplay, HistoryItem } from '@/components/tts/job-status'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Sparkles, History, Keyboard } from 'lucide-react'

type JobStatus = 'pending' | 'processing' | 'completed' | 'failed'

interface PickedVoice {
  id: string
  name: string
  description: string | null
  category: string
  language: string
  gender: string
  accent: string | null
}

interface JobData {
  id: string
  status: JobStatus
  type: string
  voiceId: string
  inputText: string | null
  error: string | null
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

interface AudioFileData {
  id: string
  fileName: string
  mimeType: string
  sizeBytes: number
  durationMs: number | null
}

const MAX_CHARS = 5000

export default function TtsPage() {
  const { accessToken } = useAuth()
  const [voice, setVoice] = useState<PickedVoice | null>(null)
  const [text, setText] = useState('')
  const [format, setFormat] = useState('mp3')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Job tracking
  const [currentJob, setCurrentJob] = useState<JobData | null>(null)
  const [currentAudioFile, setCurrentAudioFile] = useState<AudioFileData | null>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // History
  const [history, setHistory] = useState<JobData[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const historyLoadedRef = useRef(false)

  // Load history on mount
  useEffect(() => {
    if (!accessToken || historyLoadedRef.current) return
    historyLoadedRef.current = true

    const loadHistory = async () => {
      const res = await api<{ jobs: JobData[] }>('/tts?limit=20', {
        token: accessToken,
      })
      if (!res.success || !res.data) return

      setHistory(res.data.jobs)

      const lastCompleted = res.data.jobs.find((j) => j.status === 'completed')
      if (lastCompleted && !currentJob) {
        loadJobDetails(lastCompleted.id)
      }
    }
    loadHistory()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken])

  const loadJobDetails = useCallback(
    async (jobId: string) => {
      const res = await api<{
        job: JobData
        audioFile: AudioFileData | null
        downloadUrl: string | null
      }>(`/tts/${jobId}`, { token: accessToken || undefined })

      if (res.success && res.data) {
        setCurrentJob(res.data.job)
        setCurrentAudioFile(res.data.audioFile)
        setDownloadUrl(res.data.downloadUrl)
      }
    },
    [accessToken],
  )

  const pollJob = useCallback(
    async (jobId: string) => {
      const res = await api<{
        job: JobData
        audioFile: AudioFileData | null
        downloadUrl: string | null
      }>(`/tts/${jobId}`, { token: accessToken || undefined })

      if (res.success && res.data) {
        setCurrentJob(res.data.job)
        setCurrentAudioFile(res.data.audioFile)
        setDownloadUrl(res.data.downloadUrl)

        if (res.data.job.status === 'completed' || res.data.job.status === 'failed') {
          if (pollRef.current) {
            clearInterval(pollRef.current)
            pollRef.current = null
          }
          setHistory((prev) => [res.data!.job, ...prev.filter((j) => j.id !== jobId)])
        }
      }
    },
    [accessToken],
  )

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.max(200, el.scrollHeight)}px`
  }, [text])

  const isActive =
    currentJob && (currentJob.status === 'pending' || currentJob.status === 'processing')

  const handleSubmit = async () => {
    if (!voice || !text.trim() || isActive) return

    setError('')
    setSubmitting(true)
    setCurrentJob(null)
    setCurrentAudioFile(null)
    setDownloadUrl(null)

    const res = await api<{
      job: { id: string; status: JobStatus; type: string; voiceId: string; createdAt: string }
    }>('/tts', {
      method: 'POST',
      token: accessToken || undefined,
      body: JSON.stringify({
        voiceId: voice.id,
        text: text.trim(),
        outputFormat: format,
      }),
    })

    setSubmitting(false)

    if (!res.success || !res.data) {
      setError(res.error?.message || 'Failed to submit job')
      return
    }

    const jobId = res.data.job.id
    setCurrentJob({
      ...res.data.job,
      inputText: text.trim(),
      error: null,
      metadata: { outputFormat: format },
      updatedAt: res.data.job.createdAt,
    })

    pollRef.current = setInterval(() => pollJob(jobId), 1500)
  }

  const handleHistoryClick = useCallback(
    (job: JobData) => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }

      setError('')

      if (job.status === 'pending' || job.status === 'processing') {
        setCurrentJob(job)
        setCurrentAudioFile(null)
        setDownloadUrl(null)
        pollRef.current = setInterval(() => pollJob(job.id), 1500)
      } else {
        loadJobDetails(job.id)
      }

      if (job.inputText) {
        setText(job.inputText)
      }
    },
    [pollJob, loadJobDetails],
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }

  const charPercent = (text.length / MAX_CHARS) * 100

  return (
    <div className="flex h-[calc(100vh-0px)]">
      {/* Main editor area */}
      <div className="flex flex-1 flex-col">
        {/* Top toolbar */}
        <div className="flex items-center justify-between border-b border-border/30 px-6 py-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-muted-foreground/40" />
              <h1 className="text-sm font-semibold">Speech Synthesis</h1>
            </div>
            <div className="h-4 w-px bg-border/30" />
            <div className="w-[280px]">
              <VoicePicker value={voice} onChange={setVoice} token={accessToken || undefined} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger className="h-8 w-[80px] border-border/30 bg-transparent text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mp3">MP3</SelectItem>
                <SelectItem value="wav">WAV</SelectItem>
              </SelectContent>
            </Select>

            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              className={`flex size-8 items-center justify-center rounded-md transition-colors ${
                showHistory
                  ? 'bg-foreground/[0.08] text-foreground'
                  : 'text-muted-foreground/40 hover:text-muted-foreground'
              }`}
              title="Toggle history"
            >
              <History className="size-4" />
            </button>
          </div>
        </div>

        {/* Editor body */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-6 py-8">
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))}
                onKeyDown={handleKeyDown}
                placeholder="Start typing or paste the text you want to convert to speech..."
                className="w-full resize-none bg-transparent text-[15px] leading-relaxed outline-none placeholder:text-muted-foreground/20"
                style={{ minHeight: '200px' }}
              />
            </div>

            {/* Status / Result */}
            <AnimatePresence mode="wait">
              {(currentJob || error) && (
                <motion.div
                  key={currentJob?.id || 'error'}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="mt-6"
                >
                  {error ? (
                    <div className="rounded-lg border border-destructive/20 bg-destructive/[0.04] px-4 py-3 text-sm text-destructive/80">
                      {error}
                    </div>
                  ) : currentJob ? (
                    <JobStatusDisplay
                      status={currentJob.status}
                      error={currentJob.error}
                      audioFile={currentAudioFile}
                      downloadUrl={downloadUrl}
                    />
                  ) : null}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border/30 px-6 py-3">
          <div className="mx-auto flex max-w-3xl items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Character count with progress ring */}
              <div className="flex items-center gap-2">
                <svg className="size-5 -rotate-90" viewBox="0 0 20 20">
                  <circle
                    cx="10"
                    cy="10"
                    r="8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-foreground/[0.06]"
                  />
                  <circle
                    cx="10"
                    cy="10"
                    r="8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray={`${charPercent * 0.5} 50`}
                    className={charPercent > 90 ? 'text-destructive/60' : 'text-foreground/30'}
                  />
                </svg>
                <span className="text-[11px] tabular-nums text-muted-foreground">
                  {text.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}
                </span>
              </div>

              <div className="h-3.5 w-px bg-border/30" />

              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Keyboard className="size-3" />
                <span>⌘↵ to generate</span>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!voice || !text.trim() || submitting || !!isActive}
              size="sm"
              className="gap-2 px-5"
            >
              {submitting ? (
                <div className="size-3.5 animate-spin rounded-full border-2 border-background/30 border-t-background" />
              ) : (
                <Send className="size-3.5" />
              )}
              Generate
            </Button>
          </div>
        </div>
      </div>

      {/* History sidebar */}
      <AnimatePresence>
        {showHistory && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex shrink-0 flex-col overflow-hidden border-l border-border/30"
          >
            <div className="flex items-center justify-between border-b border-border/30 px-4 py-3">
              <span className="text-xs font-semibold">History</span>
              <span className="text-[10px] text-muted-foreground/30">{history.length} jobs</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {history.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground/30">No jobs yet</div>
              ) : (
                <div className="space-y-0.5">
                  {history.map((job) => (
                    <HistoryItem
                      key={job.id}
                      job={job}
                      isActive={currentJob?.id === job.id}
                      onClick={() => handleHistoryClick(job)}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  )
}
