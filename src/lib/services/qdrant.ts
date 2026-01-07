/**
 * Qdrant Vector Database Service
 * 
 * Handles vector storage, search, and management operations
 * with proper error handling and connection pooling
 */

import { QdrantClient } from '@qdrant/js-client-rest'
import { v4 as uuidv4 } from 'uuid'

// =============================================================================
// Types
// =============================================================================

export interface VectorPoint {
  id: string
  vector: number[]
  payload: {
    document_id: string
    user_id: string
    chunk_index: number
    content: string
    filename: string
    created_at: string
  }
}

export interface SearchOptions {
  userId: string
  topK?: number
  threshold?: number
  filter?: Record<string, any>
}

export interface SearchResult {
  id: string
  score: number
  payload: VectorPoint['payload']
}

export interface CollectionInfo {
  name: string
  vectorsCount: number
  status: string
}

// =============================================================================
// Configuration
// =============================================================================

const QDRANT_CONFIG = {
  url: process.env.QDRANT_URL!,
  apiKey: process.env.QDRANT_API_KEY!,
  collectionName: process.env.QDRANT_COLLECTION_NAME || 'documents',
  vectorSize: 1536, // text-embedding-3-small dimension
  distance: 'Cosine' as const,
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000 // 1 second
}

// =============================================================================
// Error Handling
// =============================================================================

export class QdrantError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message)
    this.name = 'QdrantError'
  }
}

function handleQdrantError(error: any): never {
  console.error('Qdrant error:', error)
  
  if (error.response) {
    throw new QdrantError(
      error.response.data?.message || 'Qdrant API error',
      error.response.data?.code,
      error.response.status
    )
  }
  
  if (error.code === 'ECONNREFUSED') {
    throw new QdrantError('Cannot connect to Qdrant server', 'CONNECTION_REFUSED')
  }
  
  if (error.code === 'ETIMEDOUT') {
    throw new QdrantError('Qdrant request timeout', 'TIMEOUT')
  }
  
  throw new QdrantError(
    error.message || 'Unknown Qdrant error',
    error.code
  )
}

// =============================================================================
// Qdrant Client Singleton
// =============================================================================

class QdrantService {
  private client: QdrantClient
  private isInitialized = false

  constructor() {
    this.client = new QdrantClient({
      url: QDRANT_CONFIG.url,
      apiKey: QDRANT_CONFIG.apiKey,
      timeout: QDRANT_CONFIG.timeout
    })
  }

  // =============================================================================
  // Initialization
  // =============================================================================

  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      console.log('Initializing Qdrant connection...')
      
      // Test connection
      await this.client.getCollections()
      
      // Ensure collection exists
      await this.ensureCollection()
      
      this.isInitialized = true
      console.log('Qdrant connection initialized successfully')
      
    } catch (error) {
      console.error('Failed to initialize Qdrant:', error)
      handleQdrantError(error)
    }
  }

  private async ensureCollection(): Promise<void> {
    try {
      const collections = await this.client.getCollections()
      const collectionExists = collections.collections.some(
        col => col.name === QDRANT_CONFIG.collectionName
      )

      if (!collectionExists) {
        console.log(`Creating collection: ${QDRANT_CONFIG.collectionName}`)
        
        await this.client.createCollection(QDRANT_CONFIG.collectionName, {
          vectors: {
            size: QDRANT_CONFIG.vectorSize,
            distance: QDRANT_CONFIG.distance
          },
          optimizers_config: {
            default_segment_number: 2,
            max_segment_size: 20000,
            memmap_threshold: 20000,
            indexing_threshold: 20000,
            flush_interval_sec: 5,
            max_optimization_threads: 1
          },
          replication_factor: 1,
          write_consistency_factor: 1
        })
        
        console.log('Collection created successfully')
      } else {
        console.log('Collection already exists')
      }
    } catch (error) {
      console.error('Error ensuring collection:', error)
      handleQdrantError(error)
    }
  }

  // =============================================================================
  // Vector Operations
  // =============================================================================

  async upsertPoints(points: VectorPoint[]): Promise<void> {
    await this.initialize()

    try {
      const qdrantPoints: any[] = points.map(point => ({
        id: point.id,
        vector: point.vector,
        payload: point.payload
      }))

      const operation: any = {
        points: qdrantPoints
      }

      await this.client.upsert(QDRANT_CONFIG.collectionName, operation)
      
      console.log(`Upserted ${points.length} points to Qdrant`)
      
    } catch (error) {
      console.error('Error upserting points:', error)
      handleQdrantError(error)
    }
  }

  async searchSimilar(
    queryVector: number[],
    options: SearchOptions
  ): Promise<SearchResult[]> {
    await this.initialize()

    try {
      const { userId, topK = 5, threshold = 0.7, filter = {} } = options

      // Build filter for user's documents
      const searchFilter: any = {
        must: [
          {
            key: 'user_id',
            match: { value: userId }
          },
          ...Object.entries(filter).map(([key, value]) => ({
            key,
            match: { value }
          }))
        ]
      }

      const searchParams: any = {
        vector: queryVector,
        limit: topK,
        score_threshold: threshold,
        filter: searchFilter,
        with_payload: true,
        with_vector: false
      }

      const results = await this.client.search(
        QDRANT_CONFIG.collectionName,
        searchParams
      )

      return results.map(result => ({
        id: result.id as string,
        score: result.score,
        payload: result.payload as VectorPoint['payload']
      }))
      
    } catch (error) {
      console.error('Error searching vectors:', error)
      handleQdrantError(error)
    }
  }

  async deletePoints(pointIds: string[]): Promise<void> {
    await this.initialize()

    try {
      await this.client.delete(QDRANT_CONFIG.collectionName, {
        points: pointIds
      })
      
      console.log(`Deleted ${pointIds.length} points from Qdrant`)
      
    } catch (error) {
      console.error('Error deleting points:', error)
      handleQdrantError(error)
    }
  }

  async deleteByFilter(filter: Record<string, any>): Promise<void> {
    await this.initialize()

    try {
      const deleteFilter: any = {
        must: Object.entries(filter).map(([key, value]) => ({
          key,
          match: { value }
        }))
      }

      await this.client.delete(QDRANT_CONFIG.collectionName, {
        filter: deleteFilter
      })
      
      console.log('Deleted points by filter:', filter)
      
    } catch (error) {
      console.error('Error deleting by filter:', error)
      handleQdrantError(error)
    }
  }

  // =============================================================================
  // Collection Management
  // =============================================================================

  async getCollectionInfo(): Promise<CollectionInfo> {
    await this.initialize()

    try {
      const info = await this.client.getCollection(QDRANT_CONFIG.collectionName)
      
      return {
        name: QDRANT_CONFIG.collectionName,
        vectorsCount: (info as any).vectors_count || 0,
        status: info.status
      }
      
    } catch (error) {
      console.error('Error getting collection info:', error)
      handleQdrantError(error)
    }
  }

  async recreateCollection(): Promise<void> {
    await this.initialize()

    try {
      console.log('Recreating collection...')
      
      // Delete existing collection
      try {
        await this.client.deleteCollection(QDRANT_CONFIG.collectionName)
      } catch (error) {
        // Collection might not exist, continue
        console.log('Collection did not exist, creating new one')
      }
      
      // Create new collection
      await this.client.createCollection(QDRANT_CONFIG.collectionName, {
        vectors: {
          size: QDRANT_CONFIG.vectorSize,
          distance: QDRANT_CONFIG.distance
        }
      })
      
      console.log('Collection recreated successfully')
      
    } catch (error) {
      console.error('Error recreating collection:', error)
      handleQdrantError(error)
    }
  }

  // =============================================================================
  // Health Check
  // =============================================================================

  async healthCheck(): Promise<boolean> {
    try {
      await this.client.getCollections()
      return true
    } catch (error) {
      console.error('Qdrant health check failed:', error)
      return false
    }
  }

  // =============================================================================
  // Utility Methods
  // =============================================================================

  async countUserVectors(userId: string): Promise<number> {
    await this.initialize()

    try {
      const result = await this.client.count(QDRANT_CONFIG.collectionName, {
        filter: {
          must: [
            {
              key: 'user_id',
              match: { value: userId }
            }
          ]
        }
      })
      
      return result.count
      
    } catch (error) {
      console.error('Error counting user vectors:', error)
      handleQdrantError(error)
    }
  }

  async getUserDocuments(userId: string): Promise<string[]> {
    await this.initialize()

    try {
      // This is a simplified approach - in production, you might want to use scroll API
      const results = await this.client.search(QDRANT_CONFIG.collectionName, {
        vector: new Array(QDRANT_CONFIG.vectorSize).fill(0), // Dummy vector
        limit: 1000, // Adjust based on needs
        filter: {
          must: [
            {
              key: 'user_id',
              match: { value: userId }
            }
          ]
        },
        with_payload: true,
        with_vector: false
      })

      const documentIds = new Set<string>()
      results.forEach(result => {
        if (result.payload?.document_id) {
          documentIds.add(result.payload.document_id as string)
        }
      })

      return Array.from(documentIds)
      
    } catch (error) {
      console.error('Error getting user documents:', error)
      handleQdrantError(error)
    }
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

const qdrantService = new QdrantService()

export default qdrantService

// =============================================================================
// Convenience Functions
// =============================================================================

export async function initializeQdrant(): Promise<void> {
  return qdrantService.initialize()
}

export async function upsertVectors(points: VectorPoint[]): Promise<void> {
  return qdrantService.upsertPoints(points)
}

export async function searchVectors(
  queryVector: number[],
  options: SearchOptions
): Promise<SearchResult[]> {
  return qdrantService.searchSimilar(queryVector, options)
}

export async function deleteVectors(pointIds: string[]): Promise<void> {
  return qdrantService.deletePoints(pointIds)
}

export async function deleteVectorsByFilter(filter: Record<string, any>): Promise<void> {
  return qdrantService.deleteByFilter(filter)
}

export async function getQdrantHealth(): Promise<boolean> {
  return qdrantService.healthCheck()
}

export async function getQdrantInfo(): Promise<CollectionInfo> {
  return qdrantService.getCollectionInfo()
}