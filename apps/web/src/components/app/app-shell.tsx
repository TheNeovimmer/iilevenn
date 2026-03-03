'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ThemeToggle } from '@/components/theme-toggle'
import { cn } from '@/lib/utils'
import {
  AudioWaveform,
  LayoutDashboard,
  Library,
  Mic,
  MessageSquareText,
  LogOut,
} from 'lucide-react'
import { useAuth } from '@/lib/auth'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const nav = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Voice Library', href: '/voices/library', icon: Library },
  { label: 'My Voices', href: '/voices', icon: Mic },
  { label: 'Text to Speech', href: '/tts', icon: MessageSquareText },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  return (
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 flex w-56 flex-col border-r border-border/50 bg-card/30">
        <div className="flex h-14 items-center gap-2.5 px-5">
          <div className="flex size-7 items-center justify-center rounded-md bg-foreground">
            <AudioWaveform className="size-3.5 text-background" />
          </div>
          <span className="text-sm font-bold tracking-tight">IILeven</span>
        </div>

        <nav className="flex-1 space-y-0.5 px-3 py-3">
          {nav.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors',
                  active
                    ? 'bg-foreground/8 text-foreground'
                    : 'text-muted-foreground hover:bg-foreground/4 hover:text-foreground',
                )}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center justify-between border-t border-border/50 px-5 py-3">
          <ThemeToggle />
        </div>

        <div className="border-t border-border/50 p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13px] transition-colors hover:bg-foreground/[0.04]">
                <div className="flex size-6 items-center justify-center rounded-full bg-foreground/10 text-[11px] font-semibold uppercase">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <div className="flex-1 truncate">
                  <div className="truncate font-medium text-foreground">{user?.name}</div>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-48">
              <div className="px-2 py-1.5 text-xs text-muted-foreground">{user?.email}</div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 size-3.5" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      <main className="flex-1 pl-56">{children}</main>
    </div>
  )
}
