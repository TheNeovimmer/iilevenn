'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Check } from 'lucide-react'

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

interface EditVoiceFormProps {
  voice: Voice
  onUpdated: (voice: Voice) => void
}

export function EditVoiceForm({ voice, onUpdated }: EditVoiceFormProps) {
  const { accessToken } = useAuth()

  const [name, setName] = useState(voice.name)
  const [description, setDescription] = useState(voice.description || '')
  const [language, setLanguage] = useState(voice.language)
  const [gender, setGender] = useState(voice.gender)
  const [accent, setAccent] = useState(voice.accent || '')
  const [isPublic, setIsPublic] = useState(voice.isPublic)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  // Reset form when voice changes
  useEffect(() => {
    setName(voice.name)
    setDescription(voice.description || '')
    setLanguage(voice.language)
    setGender(voice.gender)
    setAccent(voice.accent || '')
    setIsPublic(voice.isPublic)
  }, [voice])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setSaved(false)

    const res = await api<{ voice: Voice }>(`/voices/${voice.id}`, {
      method: 'PUT',
      token: accessToken || undefined,
      body: JSON.stringify({
        name,
        description: description || undefined,
        language,
        gender,
        accent: accent || null,
        isPublic,
      }),
    })

    if (res.success && res.data) {
      onUpdated(res.data.voice)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="edit-name">Name</Label>
        <Input id="edit-name" required value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-desc">Description</Label>
        <Textarea
          id="edit-desc"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe this voice..."
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
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
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-accent">Accent</Label>
        <Input
          id="edit-accent"
          value={accent}
          onChange={(e) => setAccent(e.target.value)}
          placeholder="e.g. american, british"
        />
      </div>

      <div className="flex items-center justify-between rounded-md border border-border/50 px-3 py-2">
        <Label htmlFor="edit-public" className="text-sm font-normal">
          Make voice public
        </Label>
        <Switch id="edit-public" checked={isPublic} onCheckedChange={setIsPublic} />
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : saved ? (
          <>
            <Check className="size-3.5" />
            Saved
          </>
        ) : (
          'Save changes'
        )}
      </Button>
    </form>
  )
}
