'use client'

import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Library, Mic, MessageSquareText, ArrowRight, AudioWaveform } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'

const quickActions = [
  {
    title: 'Voice Library',
    description: 'Browse community voices',
    href: '/voices/library',
    icon: Library,
  },
  {
    title: 'My Voices',
    description: 'Manage your custom voices',
    href: '/voices',
    icon: Mic,
  },
  {
    title: 'Text to Speech',
    description: 'Generate speech from text',
    href: '/tts',
    icon: MessageSquareText,
  },
]

export default function DashboardPage() {
  const { user } = useAuth()

  return (
    <div className="p-8">
      {/* Hero */}
      <div className="relative mb-10 overflow-hidden rounded-xl border border-border/50 bg-card/50 px-8 py-10">
        <div className="relative z-10">
          <h1 className="text-2xl font-bold">Welcome back, {user?.name?.split(' ')[0]}</h1>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Generate lifelike speech, clone voices, and build audio experiences with AI.
          </p>
          <div className="mt-5 flex gap-3">
            <Button asChild>
              <Link href="/tts">
                <MessageSquareText className="size-4" />
                Generate Speech
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/voices/library">
                Browse Voices
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Decorative waveform */}
        <div className="absolute -right-4 top-1/2 -translate-y-1/2 opacity-[0.04]">
          <AudioWaveform className="size-48" />
        </div>
      </div>

      {/* Quick actions */}
      <h2 className="mb-4 text-sm font-medium text-muted-foreground">Quick Actions</h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {quickActions.map(({ title, description, href, icon: Icon }) => (
          <Link key={href} href={href}>
            <Card className="transition-colors hover:border-border hover:bg-foreground/[0.02]">
              <CardHeader>
                <div className="flex size-10 items-center justify-center rounded-lg bg-foreground/[0.08]">
                  <Icon className="size-5 text-foreground" />
                </div>
                <CardTitle className="text-base">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
