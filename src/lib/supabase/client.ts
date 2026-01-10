import { createBrowserClient } from '@supabase/ssr'

// Mock client for when environment variables are not available
const createMockClient = () => ({
  auth: {
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    signInWithOtp: () => Promise.resolve({ data: {}, error: null }),
    signOut: () => Promise.resolve({ error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  },
  from: () => ({
    select: () => Promise.resolve({ data: [], error: null }),
    insert: () => Promise.resolve({ data: [], error: null }),
    update: () => Promise.resolve({ data: [], error: null }),
    delete: () => Promise.resolve({ data: [], error: null }),
    eq: () => ({ data: [], error: null }),
    order: () => ({ data: [], error: null }),
    limit: () => ({ data: [], error: null }),
  }),
  storage: {
    from: () => ({
      upload: () => Promise.resolve({ data: null, error: null }),
      download: () => Promise.resolve({ data: null, error: null }),
      remove: () => Promise.resolve({ data: null, error: null }),
    }),
  },
})

export function createClient() {
  // Check if we're in a browser environment and have the required env vars
  if (typeof window === 'undefined') {
    // Server-side: return mock client if env vars not available
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return createMockClient() as any
    }
    
    return createBrowserClient(supabaseUrl, supabaseAnonKey)
  }
  
  // Client-side: check for env vars
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase environment variables not found, using mock client')
    return createMockClient() as any
  }
  
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
