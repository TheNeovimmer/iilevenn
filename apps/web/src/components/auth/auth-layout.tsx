'use client'

import { AudioWaveform } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'

interface AuthLayoutProps {
  title: string
  subtitle: string
  children: React.ReactNode
}

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen">
      {/* Left — Form side */}
      <div className="flex flex-1 flex-col justify-center px-6 lg:px-8">
        <div className="absolute right-4 top-4">
          <ThemeToggle />
        </div>

        <div className="mx-auto w-full max-w-[400px]">
          {/* Logo */}
          <div className="mb-8 flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-foreground">
              <AudioWaveform className="size-4 text-background" />
            </div>
            <span className="text-base font-bold tracking-tight">IILeven</span>
          </div>

          {/* Heading */}

          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          </div>

          {/* Form content */}
          {children}
        </div>
      </div>

      {/* Right — Visual side (hidden on mobile) */}
      <div className="relative hidden flex-1 overflow-hidden bg-zinc-950 lg:block">
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        {/* Waveform visualization */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex items-center gap-[3px]">
            {Array.from({ length: 48 }).map((_, i) => {
              const center = 24
              const dist = Math.abs(i - center) / center
              const height = Math.max(8, (1 - dist * 0.7) * Math.sin((i / 48) * Math.PI) * 120)
              return (
                <div
                  key={i}
                  className="w-[3px] rounded-full bg-white/20"
                  style={{ height: `${height}px` }}
                />
              )
            })}
          </div>
        </div>

        {/* Quote */}
        <div className="absolute bottom-12 left-12 right-12">
          <blockquote className="text-sm leading-relaxed text-white/40">
            &ldquo;The human voice is the most perfect instrument of all.&rdquo;
          </blockquote>
          <p className="mt-2 text-xs text-white/25">— Arvo Pärt</p>
        </div>
      </div>
    </div>
  )
}
