/**
 * Vector Search Engine
 *
 * Combines embedding generation, vector search, result reranking,
 * and caching for optimal RAG performance
 */

import { generateEmbedding } from './embeddings'
import { searchVectors, type SearchResult as QdrantSearchResult } from './qdrant'
import { search as searchCache } from './cache'
import { createHash } from 'crypto'
import type { DocumentChunk, Document } from '@/lib/types/database'
import { getDocumentChunks } from '@/lib/database/queries'

// =============================================================================
// Types
// =============================================================================

export interface SearchOptions {
  userId: string
  topK?: number
  threshold?: number
  includeMetadata?: boolean
  useCache?: boolean
  cacheTTL?: number
  rerankResults?: boolean
  documentIds?: string[]
}

export interface SearchResult {
  id: string
  documentId: string
  chunkIndex: number
  content: string
  filename: string
  score: number
  relevanceScore?: number
  metadata?: {
    tokenCount?: number
    createdAt?: string
    chunkId?: string
  }
}

export interface SearchResponse {
  results: SearchResult[]
  totalResults: number
  searchTime: number
  cached: boolean
  query: string
  options: SearchOptions
}

export interface HybridSearchOptions extends SearchOptions {
  keywordWeight?: number
  semanticWeight?: number
  recencyWeight?: number
}

// =============================================================================
// Configuration
// =============================================================================

const SEARCH_CONFIG = {
  defaultTopK: 5,
  defaultThreshold: 0.7,
  maxTopK: 50,
  cachePrefix: 'search:',
  cacheTTL: 300, // 5 minutes
  rerankingEnabled: true,
  hybridSearchEnabled: true,
  maxQueryLength: 1000,
}

// =============================================================================
// Initialize Services
// =============================================================================

// Redis initialization removed - using centralized cache service

// =============================================================================
// Error Handling
// =============================================================================

export class VectorSearchError extends Error {
  constructor(
    message: string,
    public code?: string
  ) {
    super(message)
    this.name = 'VectorSearchError'
  }
}

// =============================================================================
// Utility Functions
// =============================================================================

function generateSearchCacheKey(query: string, options: SearchOptions): string {
  const optionsHash = createHash('sha256')
    .update(
      JSON.stringify({
        userId: options.userId,
        topK: options.topK,
        threshold: options.threshold,
        documentIds: options.documentIds?.sort(),
      })
    )
    .digest('hex')

  const queryHash = createHash('sha256').update(query).digest('hex')

  return `${SEARCH_CONFIG.cachePrefix}${queryHash}:${optionsHash}`
}

function validateSearchQuery(query: string): void {
  if (!query || query.trim().length === 0) {
    throw new VectorSearchError('Search query cannot be empty')
  }

  if (query.length > SEARCH_CONFIG.maxQueryLength) {
    throw new VectorSearchError(
      `Query too long: ${query.length} characters (max: ${SEARCH_CONFIG.maxQueryLength})`
    )
  }
}

function validateSearchOptions(options: SearchOptions): void {
  if (!options.userId) {
    throw new VectorSearchError('User ID is required')
  }

  if (options.topK && (options.topK < 1 || options.topK > SEARCH_CONFIG.maxTopK)) {
    throw new VectorSearchError(`topK must be between 1 and ${SEARCH_CONFIG.maxTopK}`)
  }

  if (options.threshold && (options.threshold < 0 || options.threshold > 1)) {
    throw new VectorSearchError('threshold must be between 0 and 1')
  }
}

// =============================================================================
// Cache Functions
// =============================================================================

async function getCachedSearchResults(
  query: string,
  options: SearchOptions
): Promise<SearchResponse | null> {
  if (!options.useCache) return null

  try {
    return await searchCache.get(query, options)
  } catch (error) {
    console.error('Search cache retrieval error:', error)
    return null
  }
}

async function setCachedSearchResults(
  query: string,
  options: SearchOptions,
  results: SearchResponse
): Promise<void> {
  if (!options.useCache) return

  try {
    await searchCache.set(query, options, results)
  } catch (error) {
    console.error('Search cache storage error:', error)
  }
}

// =============================================================================
// Result Processing Functions
// =============================================================================

function convertQdrantResults(
  qdrantResults: QdrantSearchResult[],
  includeMetadata: boolean = true
): SearchResult[] {
  return qdrantResults.map(result => ({
    id: result.id,
    documentId: result.payload.document_id,
    chunkIndex: result.payload.chunk_index,
    content: result.payload.content,
    filename: result.payload.filename,
    score: result.score,
    metadata: includeMetadata
      ? {
          createdAt: result.payload.created_at,
          chunkId: result.id,
        }
      : undefined,
  }))
}

function calculateRelevanceScore(result: SearchResult, query: string): number {
  // Simple relevance scoring based on:
  // 1. Semantic similarity (score from vector search)
  // 2. Query term frequency in content
  // 3. Content length (prefer more substantial chunks)

  const semanticScore = result.score

  // Calculate query term frequency
  const queryTerms = query.toLowerCase().split(/\s+/)
  const content = result.content.toLowerCase()
  const termMatches = queryTerms.filter(term => content.includes(term)).length
  const termFrequencyScore = termMatches / queryTerms.length

  // Content length score (normalized)
  const contentLengthScore = Math.min(result.content.length / 1000, 1)

  // Weighted combination
  return semanticScore * 0.7 + termFrequencyScore * 0.2 + contentLengthScore * 0.1
}

function rerankResults(results: SearchResult[], query: string): SearchResult[] {
  if (!SEARCH_CONFIG.rerankingEnabled) return results

  // Calculate relevance scores
  const rerankedResults = results.map(result => ({
    ...result,
    relevanceScore: calculateRelevanceScore(result, query),
  }))

  // Sort by relevance score (descending)
  rerankedResults.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))

  return rerankedResults
}

function deduplicateResults(results: SearchResult[]): SearchResult[] {
  const seen = new Set<string>()
  return results.filter(result => {
    const key = `${result.documentId}:${result.chunkIndex}`
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}

// =============================================================================
// Core Search Functions
// =============================================================================

export async function searchDocuments(
  query: string,
  options: SearchOptions
): Promise<SearchResponse> {
  const startTime = Date.now()

  // Validate inputs
  validateSearchQuery(query)
  validateSearchOptions(options)

  // Set defaults
  const searchOptions: SearchOptions = {
    topK: SEARCH_CONFIG.defaultTopK,
    threshold: SEARCH_CONFIG.defaultThreshold,
    includeMetadata: true,
    useCache: true,
    cacheTTL: SEARCH_CONFIG.cacheTTL,
    rerankResults: true,
    ...options,
  }

  // Check cache first
  const cachedResults = await getCachedSearchResults(query, searchOptions)
  if (cachedResults) {
    console.log('Search cache hit')
    return cachedResults
  }

  try {
    // Generate query embedding
    console.log('Generating query embedding...')
    const embeddingResult = await generateEmbedding(query, {
      useCache: true,
    })

    // Build search filter
    const searchFilter: Record<string, any> = {}
    if (searchOptions.documentIds && searchOptions.documentIds.length > 0) {
      searchFilter.document_id = searchOptions.documentIds
    }

    // Perform vector search
    console.log('Performing vector search...')
    const qdrantResults = await searchVectors(embeddingResult.embedding, {
      userId: searchOptions.userId,
      topK: searchOptions.topK,
      threshold: searchOptions.threshold,
      filter: searchFilter,
    })

    // Convert and process results
    let results = convertQdrantResults(qdrantResults, searchOptions.includeMetadata)

    // Deduplicate results
    results = deduplicateResults(results)

    // Rerank results if enabled
    if (searchOptions.rerankResults) {
      console.log('Reranking results...')
      results = rerankResults(results, query)
    }

    const searchTime = Date.now() - startTime

    const response: SearchResponse = {
      results,
      totalResults: results.length,
      searchTime,
      cached: false,
      query,
      options: searchOptions,
    }

    // Cache the results
    await setCachedSearchResults(query, searchOptions, response)

    console.log(`Search completed in ${searchTime}ms, found ${results.length} results`)

    return response
  } catch (error) {
    console.error('Vector search error:', error)
    throw new VectorSearchError(error instanceof Error ? error.message : 'Search failed')
  }
}

// =============================================================================
// Hybrid Search (Semantic + Keyword)
// =============================================================================

export async function hybridSearch(
  query: string,
  options: HybridSearchOptions
): Promise<SearchResponse> {
  // For now, this is primarily semantic search with enhanced reranking
  // In a full implementation, you might combine with keyword search (e.g., Elasticsearch)

  const {
    keywordWeight = 0.3,
    semanticWeight = 0.7,
    recencyWeight = 0.1,
    ...searchOptions
  } = options

  // Perform semantic search
  const semanticResults = await searchDocuments(query, {
    ...searchOptions,
    rerankResults: false, // We'll do custom reranking
  })

  // Enhanced reranking with hybrid scoring
  const hybridResults = semanticResults.results.map(result => {
    const semanticScore = result.score * semanticWeight

    // Simple keyword matching score
    const queryTerms = query.toLowerCase().split(/\s+/)
    const content = result.content.toLowerCase()
    const keywordMatches = queryTerms.filter(term => content.includes(term)).length
    const keywordScore = (keywordMatches / queryTerms.length) * keywordWeight

    // Recency score (newer documents get slight boost)
    const createdAt = new Date(result.metadata?.createdAt || 0)
    const daysSinceCreation = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
    const recencyScore = Math.max(0, 1 - daysSinceCreation / 365) * recencyWeight

    const hybridScore = semanticScore + keywordScore + recencyScore

    return {
      ...result,
      relevanceScore: hybridScore,
    }
  })

  // Sort by hybrid score
  hybridResults.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))

  return {
    ...semanticResults,
    results: hybridResults,
  }
}

// =============================================================================
// Specialized Search Functions
// =============================================================================

export async function searchInDocument(
  query: string,
  documentId: string,
  userId: string,
  options: Omit<SearchOptions, 'userId' | 'documentIds'> = {}
): Promise<SearchResponse> {
  return searchDocuments(query, {
    ...options,
    userId,
    documentIds: [documentId],
  })
}

export async function searchSimilarChunks(
  chunkContent: string,
  userId: string,
  options: Omit<SearchOptions, 'userId'> = {}
): Promise<SearchResponse> {
  return searchDocuments(chunkContent, {
    ...options,
    userId,
    threshold: 0.8, // Higher threshold for similarity search
    topK: 10,
  })
}

export async function getRelatedDocuments(
  documentId: string,
  userId: string,
  options: Omit<SearchOptions, 'userId' | 'documentIds'> = {}
): Promise<SearchResponse> {
  try {
    // Get a sample chunk from the document to use as query
    const chunks = await getDocumentChunks(documentId)
    if (chunks.length === 0) {
      throw new VectorSearchError('Document has no chunks')
    }

    // Use the first chunk as the query
    const sampleChunk = chunks[0]

    return searchDocuments(sampleChunk.content, {
      ...options,
      userId,
      threshold: 0.6,
      topK: 20,
    })
  } catch (error) {
    console.error('Error finding related documents:', error)
    throw new VectorSearchError('Failed to find related documents')
  }
}

// =============================================================================
// Utility Functions
// =============================================================================

export async function clearSearchCache(userId?: string): Promise<number> {
  try {
    if (userId) {
      return await searchCache.invalidateForUser(userId)
    } else {
      return await searchCache.invalidateAll()
    }
  } catch (error) {
    console.error('Error clearing search cache:', error)
    throw new VectorSearchError('Failed to clear search cache')
  }
}

export async function getSearchCacheStats(): Promise<{
  totalKeys: number
  estimatedSize: string
}> {
  try {
    // This would need to be implemented in the cache service
    // For now, return basic stats
    return {
      totalKeys: 0,
      estimatedSize: '0KB',
    }
  } catch (error) {
    console.error('Error getting search cache stats:', error)
    return { totalKeys: 0, estimatedSize: '0KB' }
  }
}

export function formatSearchResults(results: SearchResult[]): string {
  return results
    .map(
      (result, index) =>
        `${index + 1}. ${result.filename} (Score: ${result.score.toFixed(3)})\n` +
        `   ${result.content.substring(0, 200)}...`
    )
    .join('\n\n')
}
