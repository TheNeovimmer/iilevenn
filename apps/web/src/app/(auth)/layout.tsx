import { AuthProvider } from '@/lib/auth'

export default function AuthGroupLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}
