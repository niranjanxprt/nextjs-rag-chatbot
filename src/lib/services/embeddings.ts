/**
 * Embedding Generation Service
 * 
 * Handles OpenAI embedding generation with rate limiting,
 * batch processing, and comprehensive caching
 */

import { OpenAI } from 'openai'
import { embeddings as embeddingCache } from './cache'
import { createHash } from 'crypto'

// =============================================================================
// Types
// =============================================================================

export interface EmbeddingResult {
  embedding: number[]
  tokenCount: number
  cached: boolean
}

export interface BatchEmbeddingResult {
  embeddings: number[][]
  tokenCounts: number[]
  totalTokens: number
  cached: number
  generated: number
}

export interface EmbeddingOptions {
  model?: string
  dimensions?: number
  useCache?: boolean
  cacheTTL?: number
}

// =============================================================================
// Configuration
// =============================================================================

const EMBEDDING_CONFIG = {
  model: 'text-embedding-3-small',
  dimensions: 1536,
  maxTokens: 8191, // Model limit
  batchSize: 100, // OpenAI batch limit
  rateLimitDelay: 100, // ms between requests
  maxRetries: 3,
  retryDelay: 1000, // ms
  cachePrefix: 'embedding:',
  cacheTTL: 3600 // 1 hour in seconds
}

// =============================================================================
// Initialize Services
// =============================================================================

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})

// =============================================================================
// Error Handling
// =============================================================================

export class EmbeddingError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message)
    this.name = 'EmbeddingError'
  }
}

function handleOpenAIError(error: any): never {
  console.error('OpenAI embedding error:', error)
  
  if (error.status === 429) {
    throw new EmbeddingError('Rate limit exceeded', 'RATE_LIMIT', 429)
  }
  
  if (error.status === 401) {
    throw new EmbeddingError('Invalid API key', 'INVALID_API_KEY', 401)
  }
  
  if (error.status === 400) {
    throw new EmbeddingError('Invalid request', 'INVALID_REQUEST', 400)
  }
  
  throw new EmbeddingError(
    error.message || 'OpenAI API error',
    error.code,
    error.status
  )
}

// =============================================================================
// Utility Functions
// =============================================================================

function generateCacheKey(text: string, model: string, dimensions: number): string {
  const hash = createHash('sha256')
    .update(`${text}:${model}:${dimensions}`)
    .digest('hex')
  return `${EMBEDDING_CONFIG.cachePrefix}${hash}`
}

function estimateTokenCount(text: string): number {
  // Rough estimation: 1 token ≈ 4 characters for English text
  // This is simplified - in production, use tiktoken for accuracy
  return Math.ceil(text.length / 4)
}

function validateText(text: string): void {
  if (!text || text.trim().length === 0) {
    throw new EmbeddingError('Text cannot be empty')
  }
  
  const tokenCount = estimateTokenCount(text)
  if (tokenCount > EMBEDDING_CONFIG.maxTokens) {
    throw new EmbeddingError(
      `Text too long: ${tokenCount} tokens (max: ${EMBEDDING_CONFIG.maxTokens})`
    )
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// =============================================================================
// Cache Functions
// =============================================================================

async function getCachedEmbedding(
  text: string,
  model: string,
  dimensions: number
): Promise<EmbeddingResult | null> {
  try {
    const cached = await embeddingCache.get(text)
    
    if (cached) {
      return {
        embedding: cached,
        tokenCount: estimateTokenCount(text),
        cached: true
      }
    }
    
    return null
  } catch (error) {
    console.error('Cache retrieval error:', error)
    return null // Don't fail on cache errors
  }
}

async function setCachedEmbedding(
  text: string,
  model: string,
  dimensions: number,
  result: EmbeddingResult,
  ttl: number
): Promise<void> {
  try {
    await embeddingCache.set(text, result.embedding)
  } catch (error) {
    console.error('Cache storage error:', error)
    // Don't fail on cache errors
  }
}

// =============================================================================
// Core Embedding Functions
// =============================================================================

async function generateEmbeddingWithRetry(
  text: string,
  options: EmbeddingOptions,
  retryCount = 0
): Promise<EmbeddingResult> {
  try {
    const response = await openai.embeddings.create({
      model: options.model || EMBEDDING_CONFIG.model,
      input: text,
      dimensions: options.dimensions || EMBEDDING_CONFIG.dimensions
    })
    
    const embedding = response.data[0].embedding
    const tokenCount = response.usage.total_tokens
    
    return {
      embedding,
      tokenCount,
      cached: false
    }
    
  } catch (error) {
    if (retryCount < EMBEDDING_CONFIG.maxRetries) {
      console.log(`Retrying embedding generation (attempt ${retryCount + 1})`)
      await sleep(EMBEDDING_CONFIG.retryDelay * (retryCount + 1))
      return generateEmbeddingWithRetry(text, options, retryCount + 1)
    }
    
    handleOpenAIError(error)
  }
}

// =============================================================================
// Public API
// =============================================================================

export async function generateEmbedding(
  text: string,
  options: EmbeddingOptions = {}
): Promise<EmbeddingResult> {
  validateText(text)
  
  const {
    model = EMBEDDING_CONFIG.model,
    dimensions = EMBEDDING_CONFIG.dimensions,
    useCache = true,
    cacheTTL = EMBEDDING_CONFIG.cacheTTL
  } = options
  
  // Check cache first
  if (useCache) {
    const cached = await getCachedEmbedding(text, model, dimensions)
    if (cached) {
      console.log('Embedding cache hit')
      return cached
    }
  }
  
  // Generate new embedding
  console.log('Generating new embedding')
  const result = await generateEmbeddingWithRetry(text, { model, dimensions })
  
  // Cache the result
  if (useCache) {
    await setCachedEmbedding(text, model, dimensions, result, cacheTTL)
  }
  
  return result
}

export async function generateEmbeddings(
  texts: string[],
  options: EmbeddingOptions = {}
): Promise<BatchEmbeddingResult> {
  if (texts.length === 0) {
    throw new EmbeddingError('No texts provided')
  }
  
  // Validate all texts
  texts.forEach(validateText)
  
  const {
    model = EMBEDDING_CONFIG.model,
    dimensions = EMBEDDING_CONFIG.dimensions,
    useCache = true,
    cacheTTL = EMBEDDING_CONFIG.cacheTTL
  } = options
  
  const embeddings: number[][] = []
  const tokenCounts: number[] = []
  let totalTokens = 0
  let cached = 0
  let generated = 0
  
  // Process in batches
  for (let i = 0; i < texts.length; i += EMBEDDING_CONFIG.batchSize) {
    const batch = texts.slice(i, i + EMBEDDING_CONFIG.batchSize)
    const batchResults: EmbeddingResult[] = []
    const uncachedTexts: string[] = []
    const uncachedIndices: number[] = []
    
    // Check cache for each text in batch
    if (useCache) {
      for (let j = 0; j < batch.length; j++) {
        const cachedResult = await getCachedEmbedding(batch[j], model, dimensions)
        if (cachedResult) {
          batchResults[j] = cachedResult
          cached++
        } else {
          uncachedTexts.push(batch[j])
          uncachedIndices.push(j)
        }
      }
    } else {
      uncachedTexts.push(...batch)
      uncachedIndices.push(...batch.map((_, idx) => idx))
    }
    
    // Generate embeddings for uncached texts
    if (uncachedTexts.length > 0) {
      try {
        const response = await openai.embeddings.create({
          model,
          input: uncachedTexts,
          dimensions
        })
        
        // Process results
        for (let j = 0; j < uncachedTexts.length; j++) {
          const embedding = response.data[j].embedding
          const tokenCount = estimateTokenCount(uncachedTexts[j])
          
          const result: EmbeddingResult = {
            embedding,
            tokenCount,
            cached: false
          }
          
          batchResults[uncachedIndices[j]] = result
          generated++
          
          // Cache the result
          if (useCache) {
            await setCachedEmbedding(
              uncachedTexts[j],
              model,
              dimensions,
              result,
              cacheTTL
            )
          }
        }
        
        totalTokens += response.usage.total_tokens
        
      } catch (error) {
        handleOpenAIError(error)
      }
      
      // Rate limiting delay between batches
      if (i + EMBEDDING_CONFIG.batchSize < texts.length) {
        await sleep(EMBEDDING_CONFIG.rateLimitDelay)
      }
    }
    
    // Add batch results to final arrays
    batchResults.forEach(result => {
      embeddings.push(result.embedding)
      tokenCounts.push(result.tokenCount)
      if (result.cached) {
        totalTokens += result.tokenCount
      }
    })
  }
  
  console.log(`Generated embeddings: ${generated} new, ${cached} cached`)
  
  return {
    embeddings,
    tokenCounts,
    totalTokens,
    cached,
    generated
  }
}

// =============================================================================
// Utility Functions
// =============================================================================

export async function clearEmbeddingCache(pattern?: string): Promise<number> {
  try {
    return await embeddingCache.invalidateAll()
  } catch (error) {
    console.error('Error clearing embedding cache:', error)
    throw new EmbeddingError('Failed to clear cache')
  }
}

export async function getEmbeddingCacheStats(): Promise<{
  totalKeys: number
  estimatedSize: string
}> {
  try {
    // This would need to be implemented in the cache service
    // For now, return basic stats
    return {
      totalKeys: 0,
      estimatedSize: '0KB'
    }
  } catch (error) {
    console.error('Error getting cache stats:', error)
    return { totalKeys: 0, estimatedSize: '0KB' }
  }
}

export function validateEmbeddingDimensions(
  embedding: number[],
  expectedDimensions: number = EMBEDDING_CONFIG.dimensions
): boolean {
  return embedding.length === expectedDimensions
}

export function calculateCosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new EmbeddingError('Vectors must have the same dimensions')
  }
  
  let dotProduct = 0
  let normA = 0
  let normB = 0
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}