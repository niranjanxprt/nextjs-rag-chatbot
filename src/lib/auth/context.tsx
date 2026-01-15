'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'

interface User {
  _id: string
  email: string
  name?: string
  full_name?: string
  avatar_url?: string
  bio?: string
}

interface AuthContextType {
  user: User | null
  session: string | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Get current user from Convex
  const currentUser = useQuery(api.queries.users.current)
  
  useEffect(() => {
    // Check for session token in localStorage
    const token = localStorage.getItem('convex_token')
    setSession(token)
    setLoading(false)
  }, [])
  
  const signOut = async () => {
    try {
      // Call signout API
      await fetch('/api/auth/signout', { method: 'POST' })
      
      // Clear local storage
      localStorage.removeItem('convex_token')
      setSession(null)
      
      // Reload page to clear Convex client state
      window.location.href = '/auth/login'
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }
  
  return (
    <AuthContext.Provider value={{ 
      user: currentUser || null, 
      session, 
      loading: loading || currentUser === undefined, 
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
