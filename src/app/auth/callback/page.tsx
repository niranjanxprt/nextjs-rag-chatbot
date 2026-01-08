import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AuthCallback({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; error?: string }>
}) {
  const supabase = await createClient()
  const params = await searchParams

  if (params.error) {
    redirect('/auth/login?error=' + encodeURIComponent(params.error))
  }

  if (params.code) {
    const { error } = await supabase.auth.exchangeCodeForSession(params.code)

    if (error) {
      redirect('/auth/login?error=' + encodeURIComponent(error.message))
    }
  }

  // Successful authentication - redirect to chat
  redirect('/chat')
}
