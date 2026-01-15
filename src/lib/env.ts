import { z } from 'zod'

// Client-side environment variables (available in browser)
const clientEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  // Convex (new backend)
  NEXT_PUBLIC_CONVEX_URL: z.string().url('Invalid Convex URL'),
  // Supabase (deprecated - will be removed after migration)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL').optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key is required').optional(),
})

// Server-side environment variables (only available on server)
const serverEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  // Convex (new backend)
  NEXT_PUBLIC_CONVEX_URL: z.string().url('Invalid Convex URL'),
  CONVEX_DEPLOYMENT: z.string().min(1, 'Convex deployment is required'),
  CONVEX_TOKEN: z.string().optional(), // Optional - for server-side operations
  // Supabase (deprecated - will be removed after migration)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL').optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key is required').optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'Supabase service role key is required').optional(),
  // OpenAI
  OPENAI_API_KEY: z.string().min(1, 'OpenAI API key is required'),
  // Qdrant
  QDRANT_URL: z.string().url('Invalid Qdrant URL'),
  QDRANT_API_KEY: z.string().min(1, 'Qdrant API key is required'),
  QDRANT_COLLECTION_NAME: z.string().default('documents'),
  // Upstash Redis
  UPSTASH_REDIS_REST_URL: z.string().url('Invalid Upstash Redis URL'),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1, 'Upstash Redis token is required'),
  // Resend (for Convex Auth)
  AUTH_RESEND_KEY: z.string().optional(), // Will be required once auth is implemented
  // Langfuse (optional)
  LANGFUSE_PUBLIC_KEY: z.string().optional(),
  LANGFUSE_SECRET_KEY: z.string().optional(),
  LANGFUSE_BASE_URL: z.string().url().optional(),
})

export type ClientEnv = z.infer<typeof clientEnvSchema>
export type ServerEnv = z.infer<typeof serverEnvSchema>

function validateClientEnv(): ClientEnv {
  try {
    return clientEnvSchema.parse({
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors
        .map(err => `${err.path.join('.')}: ${err.message}`)
        .join('\n')
      throw new Error(`Client environment validation failed:\n${missingVars}`)
    }
    throw error
  }
}

function validateServerEnv(): ServerEnv {
  try {
    return serverEnvSchema.parse({
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
      CONVEX_DEPLOYMENT: process.env.CONVEX_DEPLOYMENT,
      CONVEX_TOKEN: process.env.CONVEX_TOKEN,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      QDRANT_URL: process.env.QDRANT_URL,
      QDRANT_API_KEY: process.env.QDRANT_API_KEY,
      QDRANT_COLLECTION_NAME: process.env.QDRANT_COLLECTION_NAME,
      UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
      UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
      AUTH_RESEND_KEY: process.env.AUTH_RESEND_KEY,
      LANGFUSE_PUBLIC_KEY: process.env.LANGFUSE_PUBLIC_KEY,
      LANGFUSE_SECRET_KEY: process.env.LANGFUSE_SECRET_KEY,
      LANGFUSE_BASE_URL: process.env.LANGFUSE_BASE_URL,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors
        .map(err => `${err.path.join('.')}: ${err.message}`)
        .join('\n')
      throw new Error(`Server environment validation failed:\n${missingVars}`)
    }
    throw error
  }
}

// Get client environment (safe for browser)
export function getClientEnv(): ClientEnv {
  // On client side, validate client env
  if (typeof window !== 'undefined') {
    return validateClientEnv()
  }
  // On server side, just return the public vars without validation
  return {
    NODE_ENV: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
    NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL || '',
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  }
}

// Get server environment (server-only, will throw if called from browser)
export function getServerEnv(): ServerEnv {
  if (typeof window !== 'undefined') {
    throw new Error('Server environment cannot be accessed from the browser!')
  }
  return validateServerEnv()
}

// Lazy-loaded cached environments (only loaded when needed)
let cachedClientEnv: ClientEnv | null = null
let cachedServerEnv: ServerEnv | null = null

// Getter functions for cached access
export function getCachedClientEnv(): ClientEnv | null {
  if (cachedClientEnv === null && typeof window !== 'undefined') {
    cachedClientEnv = getClientEnv()
  }
  return cachedClientEnv
}

export function getCachedServerEnv(): ServerEnv | null {
  if (cachedServerEnv === null && typeof window === 'undefined') {
    cachedServerEnv = getServerEnv()
  }
  return cachedServerEnv
}
