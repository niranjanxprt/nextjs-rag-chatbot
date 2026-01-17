/**
 * Supabase Client Configuration
 * 
 * Provides Supabase client instance for passwordless authentication.
 * This client is used for magic link and OTP authentication flows.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Environment variables for Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validate required environment variables
if (!supabaseUrl) {
  console.warn('VITE_SUPABASE_URL is not set. Passwordless authentication will not be available.')
}

if (!supabaseAnonKey) {
  console.warn('VITE_SUPABASE_ANON_KEY is not set. Passwordless authentication will not be available.')
}

// Create Supabase client instance
export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
)

/**
 * Check if Supabase is properly configured
 */
export const isSupabaseConfigured = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey && 
           supabaseUrl !== 'https://placeholder.supabase.co' && 
           supabaseAnonKey !== 'placeholder-key')
}

/**
 * Get Supabase configuration status
 */
export const getSupabaseConfig = () => {
  return {
    configured: isSupabaseConfigured(),
    url: supabaseUrl,
    hasAnonKey: !!supabaseAnonKey
  }
}

/**
 * Supabase Authentication Service
 * 
 * Provides methods for passwordless authentication using Supabase.
 */
export class SupabaseAuthService {
  private client: SupabaseClient

  constructor(client: SupabaseClient = supabase) {
    this.client = client
  }

  /**
   * Check if passwordless authentication is available
   */
  isAvailable(): boolean {
    return isSupabaseConfigured()
  }

  /**
   * Send magic link to user's email
   */
  async sendMagicLink(email: string, redirectTo?: string): Promise<{ error: any }> {
    if (!this.isAvailable()) {
      return { error: { message: 'Supabase is not configured' } }
    }

    try {
      const { error } = await this.client.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectTo || `${window.location.origin}/auth/callback`
        }
      })

      return { error }
    } catch (err) {
      console.error('Magic link error:', err)
      return { error: err }
    }
  }

  /**
   * Send OTP code to user's email
   */
  async sendOTP(email: string): Promise<{ error: any }> {
    if (!this.isAvailable()) {
      return { error: { message: 'Supabase is not configured' } }
    }

    try {
      const { error } = await this.client.auth.signInWithOtp({
        email
      })

      return { error }
    } catch (err) {
      console.error('OTP error:', err)
      return { error: err }
    }
  }

  /**
   * Verify OTP code
   */
  async verifyOTP(email: string, token: string): Promise<{ data: any; error: any }> {
    if (!this.isAvailable()) {
      return { data: null, error: { message: 'Supabase is not configured' } }
    }

    try {
      const { data, error } = await this.client.auth.verifyOtp({
        email,
        token,
        type: 'email'
      })

      return { data, error }
    } catch (err) {
      console.error('OTP verification error:', err)
      return { data: null, error: err }
    }
  }

  /**
   * Get current session
   */
  async getSession(): Promise<{ data: any; error: any }> {
    if (!this.isAvailable()) {
      return { data: null, error: { message: 'Supabase is not configured' } }
    }

    try {
      const { data, error } = await this.client.auth.getSession()
      return { data, error }
    } catch (err) {
      console.error('Get session error:', err)
      return { data: null, error: err }
    }
  }

  /**
   * Sign out user
   */
  async signOut(): Promise<{ error: any }> {
    if (!this.isAvailable()) {
      return { error: null } // No error if not configured
    }

    try {
      const { error } = await this.client.auth.signOut()
      return { error }
    } catch (err) {
      console.error('Sign out error:', err)
      return { error: err }
    }
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    if (!this.isAvailable()) {
      return { data: { subscription: { unsubscribe: () => {} } } }
    }

    return this.client.auth.onAuthStateChange(callback)
  }
}

// Export singleton instance
export const supabaseAuth = new SupabaseAuthService(supabase)

// Export types for TypeScript
export type { SupabaseClient } from '@supabase/supabase-js'