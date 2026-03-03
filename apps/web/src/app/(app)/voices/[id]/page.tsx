'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { VoiceAvatar } from '@/components/voices/voice-avatar'
import { EditVoiceForm } from '@/components/voices/edit-voice-form'
import { SampleManager } from '@/components/voices/sample-manager'
import { ArrowLeft, Globe, Trash2, Loader2 } from 'lucide-react'

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
  updatedAt: string
}

export default function VoiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { accessToken } = useAuth()

  const [voice, setVoice] = useState<Voice | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const fetchVoice = useCallback(async () => {
    setLoading(true)
    const res = await api<{ voice: Voice }>(`/voices/${id}`, {
      token: accessToken || undefined,
    })
    if (res.success && res.data) {
      setVoice(res.data.voice)
    }
    setLoading(false)
  }, [id, accessToken])

  useEffect(() => {
    fetchVoice()
  }, [fetchVoice])

  async function handleDelete() {
    setDeleting(true)
    const res = await api(`/voices/${id}`, {
      method: 'DELETE',
      token: accessToken || undefined,
    })
    if (res.success) {
      router.push('/voices')
    }
    setDeleting(false)
  }

  if (loading) {
    return (
      <div className="p-8">
        <Skeleton className="mb-6 h-5 w-20" />
        <div className="flex items-center gap-4">
          <Skeleton className="size-14 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </div>
    )
  }

  if (!voice) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-sm text-muted-foreground">Voice not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/voices')}>
          Back to voices
        </Button>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Back link */}
      <button
        onClick={() => router.push('/voices')}
        className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        My Voices
      </button>

      {/* Header */}

      <div className="mb-8 flex items-start justify-between">
        <div className="flex items-center gap-4">
          <VoiceAvatar name={voice.name} size="lg" />
          <div>
            <h1 className="text-xl font-bold">{voice.name}</h1>
            <div className="mt-1.5 flex items-center gap-1.5">
              <Badge variant="secondary" className="text-[10px]">
                {voice.category}
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                <Globe className="mr-0.5 size-2.5" />
                {voice.language}
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                {voice.gender}
              </Badge>
              {voice.accent && (
                <Badge variant="outline" className="text-[10px]">
                  {voice.accent}
                </Badge>
              )}
              <Badge variant="outline" className="text-[10px]">
                {voice.isPublic ? 'Public' : 'Private'}
              </Badge>
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-destructive"
          onClick={() => setShowDelete(true)}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="settings">
        <TabsList>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="samples">Samples</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="mt-6 max-w-md">
          <EditVoiceForm voice={voice} onUpdated={(updated) => setVoice(updated as Voice)} />
        </TabsContent>

        <TabsContent value="samples" className="mt-6 max-w-lg">
          <SampleManager voiceId={voice.id} />
        </TabsContent>
      </Tabs>

      {/* Delete confirmation */}
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete voice</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{voice.name}&rdquo;? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDelete(false)}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={deleting} onClick={handleDelete}>
              {deleting ? <Loader2 className="size-3.5 animate-spin" /> : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
