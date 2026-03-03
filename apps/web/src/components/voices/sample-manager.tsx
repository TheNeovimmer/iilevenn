'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/lib/auth'
import { api, uploadFile } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Upload, Trash2, Loader2, FileAudio, Mic } from 'lucide-react'
import { VoiceRecorder } from './voice-recorder'

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

interface SampleManagerProps {
  voiceId: string
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function SampleManager({ voiceId }: SampleManagerProps) {
  const { accessToken } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)

  const [samples, setSamples] = useState<VoiceSample[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleRecordingUploaded = useCallback((sample: VoiceSample) => {
    setSamples((prev) => [...prev, sample])
  }, [])

  const fetchSamples = useCallback(async () => {
    setLoading(true)
    const res = await api<{ samples: VoiceSample[] }>(`/voices/${voiceId}/samples`, {
      token: accessToken || undefined,
    })
    if (res.success && res.data) {
      setSamples(res.data.samples)
    }
    setLoading(false)
  }, [voiceId, accessToken])

  useEffect(() => {
    fetchSamples()
  }, [fetchSamples])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const res = await uploadFile<{ sample: VoiceSample }>(
      `/voices/${voiceId}/samples`,
      file,
      accessToken || undefined,
    )

    if (res.success && res.data) {
      setSamples((prev) => [...prev, res.data!.sample])
    }

    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleDelete(sampleId: string) {
    setDeletingId(sampleId)
    const res = await api(`/voices/${voiceId}/samples/${sampleId}`, {
      method: 'DELETE',
      token: accessToken || undefined,
    })
    if (res.success) {
      setSamples((prev) => prev.filter((s) => s.id !== sampleId))
    }
    setDeletingId(null)
  }

  return (
    <div>
      {/* Voice recorder */}
      <VoiceRecorder voiceId={voiceId} onUploaded={handleRecordingUploaded} />
      <div className="space-y-4">
        {/* Upload area */}
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border p-6">
          <Upload className="size-8 text-muted-foreground/50" />
          <div className="text-center">
            <p className="text-sm font-medium">Audio Samples</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              MP3, WAV, OGG, FLAC, MP4, WebM — max 50 MB
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="size-3.5" />
                Choose file
              </>
            )}
          </Button>
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            accept="audio/mpeg,audio/wav,audio/ogg,audio/flac,audio/mp4,audio/webm"
            onChange={handleUpload}
          />
        </div>

        {/* Sample list */}
        {loading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-md border border-border/50 p-3"
              >
                <Skeleton className="size-8 rounded" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : samples.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <Mic className="mb-2 size-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No samples yet</p>
            <p className="mt-0.5 text-xs text-muted-foreground/70">
              Upload audio files to use for voice cloning
            </p>
          </div>
        ) : (
          <div>
            {samples.map((sample) => (
              <div
                key={sample.id}
                className="flex items-center gap-3 rounded-md border border-border/50 p-3"
              >
                <div className="flex size-8 items-center justify-center rounded bg-foreground/[0.06]">
                  <FileAudio className="size-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{sample.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(sample.sizeBytes)}
                    {sample.durationMs ? ` · ${(sample.durationMs / 1000).toFixed(1)}s` : ''}
                    {' · '}
                    {sample.mimeType.split('/')[1]?.toUpperCase()}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground hover:text-destructive"
                  disabled={deletingId === sample.id}
                  onClick={() => handleDelete(sample.id)}
                >
                  {deletingId === sample.id ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="size-3.5" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
