'use client'

import { useState } from 'react'

export function useAuthActions() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const signInWithMagicLink = async (email: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/magic-link/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to send magic link')
      }

      return { success: true }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }

  const signInWithOTP = async (email: string, token: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: token }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to verify OTP')
      }

      const data = await response.json()
      
      // Store session token
      if (data.token) {
        localStorage.setItem('convex_token', data.token)
        document.cookie = `convex_token=${data.token}; path=/; max-age=604800` // 7 days
      }

      return { success: true }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }

  const requestOTP = async (email: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to send OTP')
      }

      return { success: true }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }

  return {
    signInWithMagicLink,
    signInWithOTP,
    requestOTP,
    loading,
    error,
    clearError: () => setError(null),
  }
}
