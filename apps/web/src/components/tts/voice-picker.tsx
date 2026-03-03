'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { api, qs } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { VoiceAvatar } from '@/components/voices/voice-avatar'
import { AnimatePresence, motion } from 'framer-motion'
import { Search, Check, ChevronDown } from 'lucide-react'

interface PickedVoice {
  id: string
  name: string
  description: string | null
  category: string
  language: string
  gender: string
  accent: string | null
}

interface VoicePickerProps {
  value: PickedVoice | null
  onChange: (voice: PickedVoice) => void
  token?: string
}

export function VoicePicker({ value, onChange, token }: VoicePickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [voices, setVoices] = useState<PickedVoice[]>([])
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const fetchVoices = useCallback(async () => {
    setLoading(true)
    const query = qs({ search: search || undefined, limit: 8 })
    const res = await api<{ items: PickedVoice[] }>(`/library${query}`, {
      token: token || undefined,
    })
    if (res.success && res.data) {
      setVoices(res.data.items)
    }
    setLoading(false)
  }, [search, token])

  useEffect(() => {
    if (!open) return
    const timeout = setTimeout(fetchVoices, search ? 250 : 0)
    return () => clearTimeout(timeout)
  }, [open, fetchVoices, search])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-10 w-full items-center gap-2.5 rounded-lg border border-border/50 bg-transparent px-3 text-left text-sm transition-colors hover:border-border"
      >
        {value ? (
          <VoiceAvatar name={value.name} size="xs" />
        ) : (
          <div className="flex size-6 items-center justify-center rounded-full bg-foreground/[0.06]">
            <div className="size-3 rounded-full bg-foreground/20" />
          </div>
        )}
        <span
          className={`flex-1 truncate ${value ? 'text-foreground' : 'text-muted-foreground/40'}`}
        >
          {value ? value.name : 'Choose a voice'}
        </span>
        {value && (
          <span className="text-[10px] text-muted-foreground/50">
            {value.language} · {value.gender}
          </span>
        )}
        <ChevronDown
          className={`size-3.5 text-muted-foreground/40 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full z-50 mt-1.5 w-full overflow-hidden rounded-lg border border-border/50 bg-card shadow-xl shadow-black/20"
          >
            <div className="border-b border-border/30 px-3 py-2">
              <div className="relative">
                <Search className="absolute left-0 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/30" />
                <input
                  ref={inputRef}
                  placeholder="Search voices..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-7 w-full bg-transparent pl-5 text-sm outline-none placeholder:text-muted-foreground/30"
                />
              </div>
            </div>

            <div className="max-h-[260px] overflow-y-auto py-1">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="size-4 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground/60" />
                </div>
              ) : voices.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground/40">
                  No voices found
                </div>
              ) : (
                voices.map((voice) => {
                  const selected = value?.id === voice.id
                  return (
                    <button
                      key={voice.id}
                      type="button"
                      onClick={() => {
                        onChange(voice)
                        setOpen(false)
                        setSearch('')
                      }}
                      className={`flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-foreground/[0.04] ${selected ? 'bg-foreground/[0.03]' : ''}`}
                    >
                      <div className="relative">
                        <VoiceAvatar name={voice.name} size="sm" />
                        {selected && (
                          <div className="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-foreground">
                            <Check className="size-2.5 text-background" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{voice.name}</div>
                        {voice.description && (
                          <div className="mt-0.5 truncate text-[11px] text-muted-foreground/50">
                            {voice.description}
                          </div>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <Badge
                          variant="outline"
                          className="border-border/30 px-1.5 py-0 text-[9px] font-normal text-muted-foreground/50"
                        >
                          {voice.language}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="border-border/30 px-1.5 py-0 text-[9px] font-normal text-muted-foreground/50"
                        >
                          {voice.gender}
                        </Badge>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
