/**
 * Comprehensive Caching Service
 * 
 * Multi-layer caching strategy with Redis, Next.js cache, and in-memory caching
 * for optimal performance across different data types and access patterns
 */

import { Redis } from '@upstash/redis'
import { unstable_cache } from 'next/cache'
import { createHash } from 'crypto'

// =============================================================================
// Types
// =============================================================================

export interface CacheOptions {
  ttl?: number // Time to live in seconds
  tags?: string[] // Cache tags for invalidation
  revalidate?: number // Next.js revalidation time
  useMemory?: boolean // Use in-memory cache
  useRedis?: boolean // Use Redis cache
  useNextCache?: boolean // Use Next.js cache
  namespace?: string // Cache namespace
}

export interface CacheStats {
  hits: number
  misses: number
  sets: number
  deletes: number
  errors: number
}

export interface CacheEntry<T> {
  value: T
  timestamp: number
  ttl: number
  tags?: string[]
}

// =============================================================================
// Configuration
// =============================================================================

const CACHE_CONFIG = {
  defaultTTL: 300, // 5 minutes
  maxMemoryEntries: 1000,
  memoryCleanupInterval: 60000, // 1 minute
  keyPrefix: 'rag_cache:',
  statsKey: 'cache_stats',
  
  // Cache namespaces
  namespaces: {
    embeddings: 'embeddings',
    search: 'search',
    documents: 'documents',
    conversations: 'conversations',
    auth: 'auth',
    api: 'api'
  },
  
  // Default TTLs by namespace
  namespaceTTLs: {
    embeddings: 3600, // 1 hour
    search: 300, // 5 minutes
    documents: 1800, // 30 minutes
    conversations: 86400, // 24 hours
    auth: 900, // 15 minutes
    api: 60 // 1 minute
  }
}

// =============================================================================
// Initialize Services
// =============================================================================

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
})

// In-memory cache
const memoryCache = new Map<string, CacheEntry<any>>()
let cacheStats: CacheStats = {
  hits: 0,
  misses: 0,
  sets: 0,
  deletes: 0,
  errors: 0
}

// =============================================================================
// Error Handling
// =============================================================================

export class CacheError extends Error {
  constructor(
    message: string,
    public operation: string,
    public key?: string
  ) {
    super(message)
    this.name = 'CacheError'
  }
}

// =============================================================================
// Utility Functions
// =============================================================================

function generateCacheKey(
  key: string, 
  namespace?: string, 
  additionalContext?: Record<string, any>
): string {
  const parts = [CACHE_CONFIG.keyPrefix]
  
  if (namespace) {
    parts.push(namespace)
  }
  
  parts.push(key)
  
  if (additionalContext) {
    const contextHash = createHash('sha256')
      .update(JSON.stringify(additionalContext))
      .digest('hex')
      .substring(0, 8)
    parts.push(contextHash)
  }
  
  return parts.join(':')
}

function isExpired(entry: CacheEntry<any>): boolean {
  return Date.now() > entry.timestamp + (entry.ttl * 1000)
}

function cleanupMemoryCache(): void {
  const now = Date.now()
  let cleanedCount = 0
  
  for (const [key, entry] of memoryCache.entries()) {
    if (isExpired(entry)) {
      memoryCache.delete(key)
      cleanedCount++
    }
  }
  
  // If still too many entries, remove oldest ones
  if (memoryCache.size > CACHE_CONFIG.maxMemoryEntries) {
    const entries = Array.from(memoryCache.entries())
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
    
    const toRemove = memoryCache.size - CACHE_CONFIG.maxMemoryEntries
    for (let i = 0; i < toRemove; i++) {
      memoryCache.delete(entries[i][0])
      cleanedCount++
    }
  }
  
  if (cleanedCount > 0) {
    console.log(`Cleaned up ${cleanedCount} expired cache entries`)
  }
}

// Start memory cleanup interval
setInterval(cleanupMemoryCache, CACHE_CONFIG.memoryCleanupInterval)

// =============================================================================
// Core Cache Functions
// =============================================================================

export async function get<T>(
  key: string, 
  options: CacheOptions = {}
): Promise<T | null> {
  const {
    namespace,
    useMemory = true,
    useRedis = true
  } = options
  
  const cacheKey = generateCacheKey(key, namespace)
  
  try {
    // Try memory cache first
    if (useMemory) {
      const memoryEntry = memoryCache.get(cacheKey)
      if (memoryEntry && !isExpired(memoryEntry)) {
        cacheStats.hits++
        return memoryEntry.value as T
      }
    }
    
    // Try Redis cache
    if (useRedis) {
      const redisValue = await redis.get(cacheKey)
      if (redisValue !== null) {
        cacheStats.hits++
        
        // Store in memory cache for faster access
        if (useMemory) {
          const ttl = options.ttl || CACHE_CONFIG.namespaceTTLs[namespace as keyof typeof CACHE_CONFIG.namespaceTTLs] || CACHE_CONFIG.defaultTTL
          memoryCache.set(cacheKey, {
            value: redisValue,
            timestamp: Date.now(),
            ttl,
            tags: options.tags
          })
        }
        
        return redisValue as T
      }
    }
    
    cacheStats.misses++
    return null
    
  } catch (error) {
    cacheStats.errors++
    console.error('Cache get error:', error)
    throw new CacheError(
      error instanceof Error ? error.message : 'Cache get failed',
      'get',
      cacheKey
    )
  }
}

export async function set<T>(
  key: string, 
  value: T, 
  options: CacheOptions = {}
): Promise<void> {
  const {
    ttl,
    namespace,
    tags,
    useMemory = true,
    useRedis = true
  } = options
  
  const cacheKey = generateCacheKey(key, namespace)
  const cacheTTL = ttl || CACHE_CONFIG.namespaceTTLs[namespace as keyof typeof CACHE_CONFIG.namespaceTTLs] || CACHE_CONFIG.defaultTTL
  
  try {
    // Store in memory cache
    if (useMemory) {
      memoryCache.set(cacheKey, {
        value,
        timestamp: Date.now(),
        ttl: cacheTTL,
        tags
      })
    }
    
    // Store in Redis cache
    if (useRedis) {
      await redis.setex(cacheKey, cacheTTL, value)
      
      // Store tags for invalidation
      if (tags && tags.length > 0) {
        for (const tag of tags) {
          const tagKey = `${CACHE_CONFIG.keyPrefix}tag:${tag}`
          await redis.sadd(tagKey, cacheKey)
          await redis.expire(tagKey, cacheTTL)
        }
      }
    }
    
    cacheStats.sets++
    
  } catch (error) {
    cacheStats.errors++
    console.error('Cache set error:', error)
    throw new CacheError(
      error instanceof Error ? error.message : 'Cache set failed',
      'set',
      cacheKey
    )
  }
}

export async function del(
  key: string, 
  options: CacheOptions = {}
): Promise<void> {
  const { namespace } = options
  const cacheKey = generateCacheKey(key, namespace)
  
  try {
    // Remove from memory cache
    memoryCache.delete(cacheKey)
    
    // Remove from Redis cache
    await redis.del(cacheKey)
    
    cacheStats.deletes++
    
  } catch (error) {
    cacheStats.errors++
    console.error('Cache delete error:', error)
    throw new CacheError(
      error instanceof Error ? error.message : 'Cache delete failed',
      'delete',
      cacheKey
    )
  }
}

export async function invalidateByTag(tag: string): Promise<number> {
  try {
    const tagKey = `${CACHE_CONFIG.keyPrefix}tag:${tag}`
    const keys = await redis.smembers(tagKey)
    
    if (keys.length === 0) {
      return 0
    }
    
    // Remove from memory cache
    for (const key of keys) {
      memoryCache.delete(key)
    }
    
    // Remove from Redis cache
    await redis.del(...keys)
    await redis.del(tagKey)
    
    console.log(`Invalidated ${keys.length} cache entries with tag: ${tag}`)
    return keys.length
    
  } catch (error) {
    cacheStats.errors++
    console.error('Cache tag invalidation error:', error)
    throw new CacheError(
      error instanceof Error ? error.message : 'Cache tag invalidation failed',
      'invalidateByTag',
      tag
    )
  }
}

export async function invalidateByPattern(pattern: string): Promise<number> {
  try {
    const searchPattern = generateCacheKey(pattern)
    const keys = await redis.keys(searchPattern)
    
    if (keys.length === 0) {
      return 0
    }
    
    // Remove from memory cache
    for (const key of keys) {
      memoryCache.delete(key)
    }
    
    // Remove from Redis cache
    await redis.del(...keys)
    
    console.log(`Invalidated ${keys.length} cache entries matching pattern: ${pattern}`)
    return keys.length
    
  } catch (error) {
    cacheStats.errors++
    console.error('Cache pattern invalidation error:', error)
    throw new CacheError(
      error instanceof Error ? error.message : 'Cache pattern invalidation failed',
      'invalidateByPattern',
      pattern
    )
  }
}

// =============================================================================
// Next.js Cache Integration
// =============================================================================

export function createNextCacheWrapper<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  options: CacheOptions & {
    keyGenerator?: (...args: T) => string
  } = {}
) {
  const {
    ttl,
    tags = [],
    revalidate,
    keyGenerator,
    namespace
  } = options
  
  return unstable_cache(
    fn,
    keyGenerator ? undefined : [fn.name],
    {
      revalidate: revalidate || ttl,
      tags: tags.map(tag => `${namespace || 'default'}:${tag}`)
    }
  )
}

// =============================================================================
// High-Level Cache Functions
// =============================================================================

export const embeddings = {
  async get(text: string): Promise<number[] | null> {
    const key = createHash('sha256').update(text).digest('hex')
    return get<number[]>(key, { 
      namespace: CACHE_CONFIG.namespaces.embeddings,
      ttl: CACHE_CONFIG.namespaceTTLs.embeddings
    })
  },
  
  async set(text: string, embedding: number[]): Promise<void> {
    const key = createHash('sha256').update(text).digest('hex')
    return set(key, embedding, { 
      namespace: CACHE_CONFIG.namespaces.embeddings,
      ttl: CACHE_CONFIG.namespaceTTLs.embeddings,
      tags: ['embeddings']
    })
  },
  
  async invalidateAll(): Promise<number> {
    return invalidateByTag('embeddings')
  }
}

export const search = {
  async get(query: string, options: any): Promise<any | null> {
    const key = createHash('sha256')
      .update(JSON.stringify({ query, options }))
      .digest('hex')
    return get(key, { 
      namespace: CACHE_CONFIG.namespaces.search,
      ttl: CACHE_CONFIG.namespaceTTLs.search
    })
  },
  
  async set(query: string, options: any, results: any): Promise<void> {
    const key = createHash('sha256')
      .update(JSON.stringify({ query, options }))
      .digest('hex')
    return set(key, results, { 
      namespace: CACHE_CONFIG.namespaces.search,
      ttl: CACHE_CONFIG.namespaceTTLs.search,
      tags: ['search', `user:${options.userId}`]
    })
  },
  
  async invalidateForUser(userId: string): Promise<number> {
    return invalidateByTag(`user:${userId}`)
  },
  
  async invalidateAll(): Promise<number> {
    return invalidateByTag('search')
  }
}

export const documents = {
  async get(documentId: string): Promise<any | null> {
    return get(documentId, { 
      namespace: CACHE_CONFIG.namespaces.documents,
      ttl: CACHE_CONFIG.namespaceTTLs.documents
    })
  },
  
  async set(documentId: string, document: any): Promise<void> {
    return set(documentId, document, { 
      namespace: CACHE_CONFIG.namespaces.documents,
      ttl: CACHE_CONFIG.namespaceTTLs.documents,
      tags: ['documents', `user:${document.user_id}`]
    })
  },
  
  async invalidate(documentId: string): Promise<void> {
    return del(documentId, { namespace: CACHE_CONFIG.namespaces.documents })
  },
  
  async invalidateForUser(userId: string): Promise<number> {
    return invalidateByTag(`user:${userId}`)
  }
}

// =============================================================================
// Cache Statistics and Monitoring
// =============================================================================

export async function getStats(): Promise<CacheStats & {
  memorySize: number
  redisInfo?: any
}> {
  try {
    // Get Redis info if available
    let redisInfo
    try {
      // Redis info is not available in Upstash Redis REST API
      // redisInfo = await redis.info()
      redisInfo = { status: 'connected' }
    } catch (error) {
      console.warn('Could not get Redis info:', error)
    }
    
    return {
      ...cacheStats,
      memorySize: memoryCache.size,
      redisInfo
    }
  } catch (error) {
    console.error('Error getting cache stats:', error)
    return {
      ...cacheStats,
      memorySize: memoryCache.size
    }
  }
}

export function resetStats(): void {
  cacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    errors: 0
  }
}

export async function clearAll(): Promise<void> {
  try {
    // Clear memory cache
    memoryCache.clear()
    
    // Clear Redis cache (all keys with our prefix)
    const keys = await redis.keys(`${CACHE_CONFIG.keyPrefix}*`)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
    
    console.log(`Cleared all cache entries (${keys.length} Redis keys)`)
    
  } catch (error) {
    console.error('Error clearing cache:', error)
    throw new CacheError(
      error instanceof Error ? error.message : 'Cache clear failed',
      'clearAll'
    )
  }
}

// =============================================================================
// Cache Warming
// =============================================================================

export async function warmCache(warmingFunctions: Array<() => Promise<void>>): Promise<void> {
  console.log('Starting cache warming...')
  
  const results = await Promise.allSettled(warmingFunctions.map(fn => fn()))
  
  const successful = results.filter(r => r.status === 'fulfilled').length
  const failed = results.filter(r => r.status === 'rejected').length
  
  console.log(`Cache warming completed: ${successful} successful, ${failed} failed`)
  
  if (failed > 0) {
    const errors = results
      .filter(r => r.status === 'rejected')
      .map(r => (r as PromiseRejectedResult).reason)
    
    console.error('Cache warming errors:', errors)
  }
}

// =============================================================================
// Middleware for API Routes
// =============================================================================

export function withCache<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  options: CacheOptions & {
    keyGenerator: (...args: T) => string
  }
) {
  return async (...args: T): Promise<R> => {
    const cacheKey = options.keyGenerator(...args)
    
    // Try to get from cache
    const cached = await get<R>(cacheKey, options)
    if (cached !== null) {
      return cached
    }
    
    // Execute function and cache result
    const result = await fn(...args)
    await set(cacheKey, result, options)
    
    return result
  }
}