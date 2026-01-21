/**
 * Embedding Service
 * 
 * Generates vector embeddings using OpenAI and manages vector storage
 */

import OpenAI from 'openai'
import { ChunkWithId, EmbeddingMetadata, EmbeddingResult } from '@/lib/types/rag'

// =============================================================================
// Constants
// =============================================================================

const EMBEDDING_MODEL = 'text-embedding-3-small'
const EMBEDDING_DIMENSIONS = 1536
const DEFAULT_BATCH_SIZE = 100
const MAX_RETRIES = 3
const RETRY_DELAYS = [1000, 2000, 4000] // Exponential backoff in milliseconds

// =============================================================================
// OpenAI Client
// =============================================================================

let openaiClient: OpenAI | null = null

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY
    
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set')
    }
    
    openaiClient = new OpenAI({ apiKey })
  }
  
  return openaiClient
}

// =============================================================================
// Embedding Generation
// =============================================================================

/**
 * Generate embedding for a single query
 * @param query - User query text
 * @returns 1536-dimensional embedding vector
 */
export async function embedQuery(query: string): Promise<number[]> {
  if (!query || query.trim().length === 0) {
    throw new Error('Query text cannot be empty')
  }
  
  const client = getOpenAIClient()
  
  try {
    const response = await retryWithBackoff(async () => {
      return await client.embeddings.create({
        model: EMBEDDING_MODEL,
        input: query.trim(),
        encoding_format: 'float',
      })
    })
    
    const embedding = response.data[0].embedding
    
    // Validate dimensions
    if (embedding.length !== EMBEDDING_DIMENSIONS) {
      throw new Error(
        `Invalid embedding dimensions: expected ${EMBEDDING_DIMENSIONS}, got ${embedding.length}`
      )
    }
    
    // Normalize vector
    return normalizeVector(embedding)
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to generate query embedding: ${error.message}`)
    }
    throw new Error('Failed to generate query embedding: Unknown error')
  }
}

/**
 * Batch embed multiple texts with retry logic
 * @param texts - Array of text strings
 * @param batchSize - Number of texts per batch (default: 100)
 * @returns Array of embedding vectors
 */
export async function batchEmbed(
  texts: string[],
  batchSize: number = DEFAULT_BATCH_SIZE
): Promise<number[][]> {
  if (!texts || texts.length === 0) {
    return []
  }
  
  const client = getOpenAIClient()
  const embeddings: number[][] = []
  
  // Process in batches
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize)
    
    try {
      const response = await retryWithBackoff(async () => {
        return await client.embeddings.create({
          model: EMBEDDING_MODEL,
          input: batch.map(text => text.trim()),
          encoding_format: 'float',
        })
      })
      
      // Extract and normalize embeddings
      const batchEmbeddings = response.data.map(item => {
        if (item.embedding.length !== EMBEDDING_DIMENSIONS) {
          throw new Error(
            `Invalid embedding dimensions: expected ${EMBEDDING_DIMENSIONS}, got ${item.embedding.length}`
          )
        }
        return normalizeVector(item.embedding)
      })
      
      embeddings.push(...batchEmbeddings)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Batch embedding failed at index ${i}: ${error.message}`)
      }
      throw new Error(`Batch embedding failed at index ${i}: Unknown error`)
    }
  }
  
  return embeddings
}

/**
 * Generate embeddings for multiple text chunks
 * @param chunks - Array of text chunks to embed
 * @param metadata - Metadata to attach to each embedding
 * @returns Array of embedding results with Qdrant point IDs
 */
export async function embedChunks(
  chunks: ChunkWithId[],
  metadata: EmbeddingMetadata
): Promise<{ embeddings: number[][]; chunks: ChunkWithId[] }> {
  if (!chunks || chunks.length === 0) {
    return { embeddings: [], chunks: [] }
  }
  
  try {
    // Extract text content from chunks
    const texts = chunks.map(chunk => chunk.content)
    
    // Generate embeddings in batches
    const embeddings = await batchEmbed(texts, DEFAULT_BATCH_SIZE)
    
    // Validate we got the right number of embeddings
    if (embeddings.length !== chunks.length) {
      throw new Error(
        `Embedding count mismatch: expected ${chunks.length}, got ${embeddings.length}`
      )
    }
    
    return { embeddings, chunks }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to embed chunks: ${error.message}`)
    }
    throw new Error('Failed to embed chunks: Unknown error')
  }
}

// =============================================================================
// Vector Normalization
// =============================================================================

/**
 * Normalize vector to unit length
 * @param vector - Input vector
 * @returns Normalized vector with magnitude 1.0
 */
export function normalizeVector(vector: number[]): number[] {
  // Calculate magnitude (L2 norm)
  const magnitude = Math.sqrt(
    vector.reduce((sum, val) => sum + val * val, 0)
  )
  
  // Avoid division by zero
  if (magnitude === 0) {
    return vector
  }
  
  // Normalize: v / ||v||
  return vector.map(val => val / magnitude)
}

/**
 * Calculate vector magnitude (L2 norm)
 * @param vector - Input vector
 * @returns Magnitude of the vector
 */
export function vectorMagnitude(vector: number[]): number {
  return Math.sqrt(
    vector.reduce((sum, val) => sum + val * val, 0)
  )
}

// =============================================================================
// Retry Logic
// =============================================================================

/**
 * Retry a function with exponential backoff
 * @param fn - Async function to retry
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @returns Result of the function
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = MAX_RETRIES
): Promise<T> {
  let lastError: Error | null = null
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')
      
      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break
      }
      
      // Wait before retrying (exponential backoff)
      const delay = RETRY_DELAYS[attempt] || RETRY_DELAYS[RETRY_DELAYS.length - 1]
      await sleep(delay)
      
      console.warn(
        `Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms delay`,
        { error: lastError.message }
      )
    }
  }
  
  throw new Error(
    `Failed after ${maxRetries} retries: ${lastError?.message || 'Unknown error'}`
  )
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// =============================================================================
// Exports
// =============================================================================

export const EmbeddingService = {
  embedQuery,
  batchEmbed,
  embedChunks,
  normalizeVector,
  vectorMagnitude,
}
