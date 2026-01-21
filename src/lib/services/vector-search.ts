/**
 * Vector Search Service
 * 
 * Manages Qdrant vector database operations for semantic search
 */

import { QdrantClient } from '@qdrant/js-client-rest'
import { SearchResult, SearchFilters, SearchOptions, QdrantPoint } from '@/lib/types/rag'
import { v4 as uuidv4 } from 'uuid'

// =============================================================================
// Constants
// =============================================================================

const COLLECTION_NAME = process.env.QDRANT_COLLECTION_NAME || 'document_embeddings'
const VECTOR_SIZE = 1536
const DISTANCE_METRIC = 'Cosine'
const DEFAULT_TOP_K = 5
const DEFAULT_SCORE_THRESHOLD = 0.7

// =============================================================================
// Qdrant Client
// =============================================================================

let qdrantClient: QdrantClient | null = null

function getQdrantClient(): QdrantClient {
  if (!qdrantClient) {
    const url = process.env.QDRANT_URL
    const apiKey = process.env.QDRANT_API_KEY
    
    if (!url) {
      throw new Error('QDRANT_URL environment variable is not set')
    }
    
    if (!apiKey) {
      throw new Error('QDRANT_API_KEY environment variable is not set')
    }
    
    qdrantClient = new QdrantClient({
      url,
      apiKey,
      checkCompatibility: false, // Skip version check for cloud instances
    })
  }
  
  return qdrantClient
}

// =============================================================================
// Collection Management
// =============================================================================

/**
 * Initialize Qdrant collection with proper schema
 * @param collectionName - Name of the collection (default: document_embeddings)
 */
export async function initializeCollection(
  collectionName: string = COLLECTION_NAME
): Promise<void> {
  const client = getQdrantClient()
  
  try {
    console.log(`Checking if collection "${collectionName}" exists...`)
    
    // Check if collection exists
    const collections = await client.getCollections()
    console.log(`Found ${collections.collections.length} collections`)
    
    const exists = collections.collections.some(c => c.name === collectionName)
    
    if (exists) {
      console.log(`Collection "${collectionName}" already exists`)
      return
    }
    
    console.log(`Creating collection "${collectionName}"...`)
    
    // Create collection
    await client.createCollection(collectionName, {
      vectors: {
        size: VECTOR_SIZE,
        distance: DISTANCE_METRIC,
      },
    })
    
    console.log(`Creating payload indexes...`)
    
    // Create payload indexes for filtering
    await client.createPayloadIndex(collectionName, {
      field_name: 'user_id',
      field_schema: 'keyword',
    })
    
    await client.createPayloadIndex(collectionName, {
      field_name: 'project_id',
      field_schema: 'keyword',
    })
    
    await client.createPayloadIndex(collectionName, {
      field_name: 'document_id',
      field_schema: 'keyword',
    })
    
    console.log(`Collection "${collectionName}" created successfully`)
  } catch (error) {
    console.error('Detailed error:', error)
    if (error instanceof Error) {
      throw new Error(`Failed to initialize collection: ${error.message}`)
    }
    throw new Error('Failed to initialize collection: Unknown error')
  }
}

// =============================================================================
// Vector Storage
// =============================================================================

/**
 * Store vectors with metadata in Qdrant
 * @param vectors - Array of embedding vectors
 * @param payloads - Array of metadata payloads
 * @returns Array of Qdrant point IDs
 */
export async function storeVectors(
  vectors: number[][],
  payloads: Array<{
    chunk_id: string
    document_id: string
    user_id: string
    project_id?: string
    content: string
    document_name: string
  }>
): Promise<string[]> {
  if (vectors.length !== payloads.length) {
    throw new Error('Vectors and payloads arrays must have the same length')
  }
  
  if (vectors.length === 0) {
    return []
  }
  
  const client = getQdrantClient()
  
  try {
    // Generate UUIDs for each point
    const pointIds = vectors.map(() => uuidv4())
    
    // Prepare points for upsert
    const points = vectors.map((vector, index) => ({
      id: pointIds[index],
      vector,
      payload: payloads[index],
    }))
    
    // Upsert points to Qdrant
    await client.upsert(COLLECTION_NAME, {
      wait: true,
      points,
    })
    
    return pointIds
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to store vectors: ${error.message}`)
    }
    throw new Error('Failed to store vectors: Unknown error')
  }
}

// =============================================================================
// Semantic Search
// =============================================================================

/**
 * Search for relevant document chunks using semantic similarity
 * @param queryVector - Embedded query vector
 * @param filters - Multi-tenancy and project filters
 * @param options - Search configuration (topK, scoreThreshold)
 * @returns Relevant chunks with similarity scores and metadata
 */
export async function search(
  queryVector: number[],
  filters: SearchFilters,
  options?: SearchOptions
): Promise<SearchResult[]> {
  const client = getQdrantClient()
  const topK = options?.topK || DEFAULT_TOP_K
  const scoreThreshold = options?.scoreThreshold || DEFAULT_SCORE_THRESHOLD
  
  try {
    // Build filter conditions
    const filterConditions: any[] = [
      {
        key: 'user_id',
        match: { value: filters.user_id },
      },
    ]
    
    // Add project filter if provided
    if (filters.project_id) {
      filterConditions.push({
        key: 'project_id',
        match: { value: filters.project_id },
      })
    }
    
    // Perform search
    const searchResult = await client.search(COLLECTION_NAME, {
      vector: queryVector,
      limit: topK,
      score_threshold: scoreThreshold,
      filter: {
        must: filterConditions,
      },
      with_payload: true,
    })
    
    // Transform results
    const results: SearchResult[] = searchResult.map(result => {
      const payload = result.payload as any
      
      return {
        chunk_id: payload.chunk_id,
        document_id: payload.document_id,
        document_name: payload.document_name,
        content: payload.content,
        score: result.score,
        position: payload.position || 0,
      }
    })
    
    // Sort by score descending (should already be sorted, but ensure it)
    results.sort((a, b) => b.score - a.score)
    
    return results
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Semantic search failed: ${error.message}`)
    }
    throw new Error('Semantic search failed: Unknown error')
  }
}

// =============================================================================
// Vector Deletion
// =============================================================================

/**
 * Delete vectors associated with a document
 * @param documentId - Document ID to delete
 * @param userId - User ID for verification
 */
export async function deleteDocumentVectors(
  documentId: string,
  userId: string
): Promise<number> {
  const client = getQdrantClient()
  
  try {
    // Delete points matching document_id and user_id
    const result = await client.delete(COLLECTION_NAME, {
      wait: true,
      filter: {
        must: [
          {
            key: 'document_id',
            match: { value: documentId },
          },
          {
            key: 'user_id',
            match: { value: userId },
          },
        ],
      },
    })
    
    // Return number of deleted points (if available in result)
    return result.status === 'completed' ? 1 : 0
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to delete document vectors: ${error.message}`)
    }
    throw new Error('Failed to delete document vectors: Unknown error')
  }
}

/**
 * Delete a single vector by Qdrant point ID
 * @param pointId - Qdrant point ID (UUID)
 * @param userId - User ID for verification
 */
export async function deleteVector(
  pointId: string,
  userId: string
): Promise<void> {
  const client = getQdrantClient()
  
  try {
    // First, verify the point belongs to the user
    const points = await client.retrieve(COLLECTION_NAME, {
      ids: [pointId],
      with_payload: true,
    })
    
    if (points.length === 0) {
      throw new Error('Vector not found')
    }
    
    const payload = points[0].payload as any
    if (payload.user_id !== userId) {
      throw new Error('Unauthorized: Vector does not belong to user')
    }
    
    // Delete the point
    await client.delete(COLLECTION_NAME, {
      wait: true,
      points: [pointId],
    })
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to delete vector: ${error.message}`)
    }
    throw new Error('Failed to delete vector: Unknown error')
  }
}

// =============================================================================
// Health Check
// =============================================================================

/**
 * Check if Qdrant is available and collection exists
 * @returns True if Qdrant is healthy
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const client = getQdrantClient()
    const collections = await client.getCollections()
    const exists = collections.collections.some(c => c.name === COLLECTION_NAME)
    return exists
  } catch (error) {
    console.error('Qdrant health check failed:', error)
    return false
  }
}

// =============================================================================
// Exports
// =============================================================================

export const VectorSearchService = {
  initializeCollection,
  storeVectors,
  search,
  deleteDocumentVectors,
  deleteVector,
  healthCheck,
}
