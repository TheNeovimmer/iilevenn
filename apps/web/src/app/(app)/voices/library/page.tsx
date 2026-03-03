'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuth } from '@/lib/auth'
import { api, qs } from '@/lib/api'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { VoiceAvatar } from '@/components/voices/voice-avatar'
import { Search, Globe, Mic } from 'lucide-react'

interface LibraryVoice {
  id: string
  name: string
  description: string | null
  category: string
  language: string
  gender: string
  accent: string | null
  previewUrl: string | null
  metadata: Record<string, unknown>
  createdAt: string
}

interface PaginatedData {
  items: LibraryVoice[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export default function VoiceLibraryPage() {
  const { accessToken } = useAuth()
  const [voices, setVoices] = useState<LibraryVoice[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [language, setLanguage] = useState('')
  const [gender, setGender] = useState('')
  const [category, setCategory] = useState('')

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(
      async () => {
        setLoading(true)
        const query = qs({
          search: search || undefined,
          language: language || undefined,
          gender: gender || undefined,
          category: category || undefined,
        })
        const res = await api<PaginatedData>(`/library${query}`, {
          token: accessToken || undefined,
        })
        if (res.success && res.data) {
          setVoices(res.data.items)
          setTotal(res.data.total)
        }
        setLoading(false)
      },
      search ? 300 : 0,
    )

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [search, language, gender, category, accessToken])

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Voice Library</h1>
        <p className="text-sm text-muted-foreground">
          Browse {total > 0 ? `${total} public` : 'public'} voices ready to use
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search voices..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-9"
          />
        </div>

        <Select value={language} onValueChange={(v) => setLanguage(v === 'all' ? '' : v)}>
          <SelectTrigger className="h-9 w-[130px]">
            <SelectValue placeholder="Language" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All languages</SelectItem>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="es">Spanish</SelectItem>
            <SelectItem value="fr">French</SelectItem>
            <SelectItem value="de">German</SelectItem>
            <SelectItem value="ja">Japanese</SelectItem>
          </SelectContent>
        </Select>

        <Select value={gender} onValueChange={(v) => setGender(v === 'all' ? '' : v)}>
          <SelectTrigger className="h-9 w-[120px]">
            <SelectValue placeholder="Gender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All genders</SelectItem>
            <SelectItem value="male">Male</SelectItem>
            <SelectItem value="female">Female</SelectItem>
            <SelectItem value="neutral">Neutral</SelectItem>
          </SelectContent>
        </Select>

        <Select value={category} onValueChange={(v) => setCategory(v === 'all' ? '' : v)}>
          <SelectTrigger className="h-9 w-[130px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            <SelectItem value="premade">Premade</SelectItem>
            <SelectItem value="cloned">Cloned</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Voice grid */}
      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg border border-border/50 p-4">
              <Skeleton className="size-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      ) : voices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Mic className="mb-3 size-10 text-muted-foreground/50" />
          <p className="text-sm font-medium text-muted-foreground">No voices found</p>
          <p className="mt-1 text-xs text-muted-foreground/70">
            Try adjusting your search or filters
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {voices.map((voice) => (
            <div
              key={voice.id}
              className="group flex items-start gap-3 rounded-lg border border-border/50 p-4 transition-colors hover:border-border hover:bg-foreground/[0.02]"
            >
              <VoiceAvatar name={voice.name} />
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-medium">{voice.name}</h3>
                {voice.description && (
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                    {voice.description}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap gap-1.5">
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
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
