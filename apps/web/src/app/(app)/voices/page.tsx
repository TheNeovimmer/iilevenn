'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { VoiceAvatar } from '@/components/voices/voice-avatar'
import { CreateVoiceDialog } from '@/components/voices/create-voice-dialog'
import { Plus, Mic, Globe } from 'lucide-react'

interface Voice {
  id: string
  name: string
  description: string | null
  category: string
  language: string
  gender: string
  accent: string | null
  isPublic: boolean
  createdAt: string
}

export default function MyVoicesPage() {
  const { accessToken } = useAuth()
  const router = useRouter()

  const [voices, setVoices] = useState<Voice[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  const fetchVoices = useCallback(async () => {
    setLoading(true)
    const res = await api<{ voices: Voice[] }>('/voices', {
      token: accessToken || undefined,
    })
    if (res.success && res.data) {
      setVoices(res.data.voices)
    }
    setLoading(false)
  }, [accessToken])

  useEffect(() => {
    let cancelled = false
    api<{ voices: Voice[] }>('/voices', {
      token: accessToken || undefined,
    }).then((res) => {
      if (!cancelled && res.success && res.data) {
        setVoices(res.data.voices)
      }
      if (!cancelled) setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [accessToken])

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Voices</h1>
          <p className="text-sm text-muted-foreground">Create and manage your custom voices</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="size-4" />
          Create Voice
        </Button>
      </div>

      {/* Voice list */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg border border-border/50 p-4">
              <Skeleton className="size-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          ))}
        </div>
      ) : voices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Mic className="mb-3 size-10 text-muted-foreground/50" />
          <p className="text-sm font-medium text-muted-foreground">No voices yet</p>
          <p className="mt-1 text-xs text-muted-foreground/70">
            Create your first custom voice to get started
          </p>
          <Button className="mt-4" onClick={() => setShowCreate(true)}>
            <Plus className="size-4" />
            Create Voice
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {voices.map((voice) => (
            <button
              key={voice.id}
              onClick={() => router.push(`/voices/${voice.id}`)}
              className="flex w-full items-center gap-3 rounded-lg border border-border/50 p-4 text-left transition-colors hover:border-border hover:bg-foreground/[0.02]"
            >
              <VoiceAvatar name={voice.name} />
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-medium">{voice.name}</h3>
                {voice.description && (
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {voice.description}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <Badge variant="secondary" className="text-[10px]">
                  {voice.category}
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  <Globe className="mr-0.5 size-2.5" />
                  {voice.language}
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  {voice.isPublic ? 'Public' : 'Private'}
                </Badge>
              </div>
            </button>
          ))}
        </div>
      )}

      <CreateVoiceDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        onCreated={(voice) => {
          router.push(`/voices/${voice.id}`)
        }}
      />
    </div>
  )
}
