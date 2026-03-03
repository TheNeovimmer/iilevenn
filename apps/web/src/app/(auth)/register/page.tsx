import type { Metadata } from 'next'
import { AuthLayout } from '@/components/auth/auth-layout'
import { RegisterForm } from '@/components/auth/register-form'

export const metadata: Metadata = {
  title: 'Create account — IILeven',
}

export default function RegisterPage() {
  return (
    <AuthLayout title="Create an account" subtitle="Start generating lifelike speech in seconds">
      <RegisterForm />
    </AuthLayout>
  )
}
