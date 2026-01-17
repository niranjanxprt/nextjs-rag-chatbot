/**
 * Auth Callback Page
 * 
 * Handles authentication callbacks from Convex Auth
 * This page is called after magic link or OTP verification
 */

import { redirect } from 'next/navigation'

export default async function AuthCallback({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; token?: string }>
}) {
  const params = await searchParams

  // Handle authentication errors
  if (params.error) {
    redirect('/auth/login?error=' + encodeURIComponent(params.error))
  }

  // If we have a token, the authentication was successful
  // The token should already be set in cookies by the API route
  if (params.token) {
    redirect('/chat')
  }

  // No error and no token - redirect to login
  redirect('/auth/login')
}
