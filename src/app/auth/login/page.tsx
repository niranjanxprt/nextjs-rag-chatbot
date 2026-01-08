import { PasswordlessLoginForm } from '@/components/auth/PasswordlessLoginForm'
import { AuthLayout } from '@/components/layouts/AuthLayout'

export default function LoginPage() {
  return (
    <AuthLayout title="Sign In" description="Access your personalized document-based AI assistant">
      <PasswordlessLoginForm />
    </AuthLayout>
  )
}
