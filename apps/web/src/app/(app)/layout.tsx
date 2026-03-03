'use client'

import { AppShell } from '@/components/app/app-shell'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { AuthProvider, useAuth } from '@/lib/auth'

function ProtectedGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
      </div>
    )
  }

  if (!user) return null

  return <AppShell>{children}</AppShell>
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ProtectedGuard>{children}</ProtectedGuard>
    </AuthProvider>
  )
}
