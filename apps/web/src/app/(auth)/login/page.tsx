import type { Metadata } from 'next'
import { AuthLayout } from '@/components/auth/auth-layout'
import { LoginForm } from '@/components/auth/login-form'

export const metadata: Metadata = {
  title: 'Sign in — IILeven',
}

export default function LoginPage() {
  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your account to continue">
      <LoginForm />
    </AuthLayout>
  )
}
