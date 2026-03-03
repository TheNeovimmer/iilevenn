'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'

interface Voice {
  id: string
  name: string
  description: string | null
  category: string
  language: string
  gender: string
  accent: string | null
  isPublic: boolean
}

interface CreateVoiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (voice: Voice) => void
}

export function CreateVoiceDialog({ open, onOpenChange, onCreated }: CreateVoiceDialogProps) {
  const { accessToken } = useAuth()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('custom')
  const [language, setLanguage] = useState('en')
  const [gender, setGender] = useState('female')
  const [accent, setAccent] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function reset() {
    setName('')
    setDescription('')
    setCategory('custom')
    setLanguage('en')
    setGender('female')
    setAccent('')
    setIsPublic(true)
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await api<{ voice: Voice }>('/voices', {
      method: 'POST',
      token: accessToken || undefined,
      body: JSON.stringify({
        name,
        description: description || undefined,
        category,
        language,
        gender,
        accent: accent || undefined,
        isPublic,
      }),
    })

    if (res.success && res.data) {
      onCreated(res.data.voice)
      reset()
      onOpenChange(false)
    } else {
      setError(res.error?.message || 'Failed to create voice')
    }

    setLoading(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset()
        onOpenChange(v)
      }}
    >
      <DialogContent className="max-w-md">
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create a voice</DialogTitle>
            <DialogDescription>Add a new custom voice to your collection.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="voice-name">Name</Label>
              <Input
                id="voice-name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My custom voice"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="voice-desc">Description</Label>
              <Textarea
                id="voice-desc"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A warm, expressive voice..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">Custom</SelectItem>
                    <SelectItem value="cloned">Cloned</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                    <SelectItem value="ja">Japanese</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="neutral">Neutral</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="voice-accent">Accent</Label>
                <Input
                  id="voice-accent"
                  value={accent}
                  onChange={(e) => setAccent(e.target.value)}
                  placeholder="e.g. american"
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-md border border-border/50 px-3 py-2">
              <Label htmlFor="voice-public" className="text-sm font-normal">
                Make voice public
              </Label>
              <Switch id="voice-public" checked={isPublic} onCheckedChange={setIsPublic} />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : 'Create voice'}
            </Button>
          </form>
        </DialogContent>
      </DialogContent>
    </Dialog>
  )
}
