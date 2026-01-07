'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useAuthActions() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const signInWithMagicLink = async (email: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      
      if (error) throw error
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
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
      })
      
      if (error) throw error
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
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
        },
      })
      
      if (error) throw error
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