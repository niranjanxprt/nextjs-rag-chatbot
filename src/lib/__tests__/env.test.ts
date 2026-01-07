import { z } from 'zod'

// Mock the environment validation to avoid importing the actual env
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  OPENAI_API_KEY: z.string().min(1, 'OpenAI API key is required'),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'Supabase service role key is required'),
  QDRANT_URL: z.string().url('Invalid Qdrant URL'),
  QDRANT_API_KEY: z.string().min(1, 'Qdrant API key is required'),
  QDRANT_COLLECTION_NAME: z.string().default('documents'),
  UPSTASH_REDIS_REST_URL: z.string().url('Invalid Upstash Redis URL'),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1, 'Upstash Redis token is required'),
  LANGFUSE_PUBLIC_KEY: z.string().optional(),
  LANGFUSE_SECRET_KEY: z.string().optional(),
  LANGFUSE_BASE_URL: z.string().url().optional(),
})

describe('Environment Configuration', () => {
  const validEnv = {
    NODE_ENV: 'test' as const,
    OPENAI_API_KEY: 'sk-test-key',
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
    QDRANT_URL: 'https://test.qdrant.io',
    QDRANT_API_KEY: 'test-qdrant-key',
    QDRANT_COLLECTION_NAME: 'documents',
    UPSTASH_REDIS_REST_URL: 'https://test.upstash.io',
    UPSTASH_REDIS_REST_TOKEN: 'test-redis-token',
  }

  it('should validate correct environment variables', () => {
    const result = envSchema.safeParse(validEnv)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.NODE_ENV).toBe('test')
      expect(result.data.QDRANT_COLLECTION_NAME).toBe('documents')
    }
  })

  it('should fail validation with missing required variables', () => {
    const invalidEnv = { ...validEnv }
    delete (invalidEnv as any).OPENAI_API_KEY
    
    const result = envSchema.safeParse(invalidEnv)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.errors[0].path).toContain('OPENAI_API_KEY')
    }
  })

  it('should fail validation with invalid URLs', () => {
    const invalidEnv = {
      ...validEnv,
      NEXT_PUBLIC_SUPABASE_URL: 'not-a-url'
    }
    
    const result = envSchema.safeParse(invalidEnv)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('Invalid Supabase URL')
    }
  })

  it('should use default values for optional fields', () => {
    const minimalEnv = {
      OPENAI_API_KEY: 'sk-test-key',
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
      QDRANT_URL: 'https://test.qdrant.io',
      QDRANT_API_KEY: 'test-qdrant-key',
      UPSTASH_REDIS_REST_URL: 'https://test.upstash.io',
      UPSTASH_REDIS_REST_TOKEN: 'test-redis-token',
    }
    
    const result = envSchema.safeParse(minimalEnv)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.NODE_ENV).toBe('development')
      expect(result.data.QDRANT_COLLECTION_NAME).toBe('documents')
    }
  })

  it('should handle optional Langfuse configuration', () => {
    const envWithLangfuse = {
      ...validEnv,
      LANGFUSE_PUBLIC_KEY: 'pk-test',
      LANGFUSE_SECRET_KEY: 'sk-test',
      LANGFUSE_BASE_URL: 'https://cloud.langfuse.com'
    }
    
    const result = envSchema.safeParse(envWithLangfuse)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.LANGFUSE_PUBLIC_KEY).toBe('pk-test')
      expect(result.data.LANGFUSE_BASE_URL).toBe('https://cloud.langfuse.com')
    }
  })
})