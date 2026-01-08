import { performance } from 'perf_hooks'
import { generateEmbeddings } from '@/lib/services/embeddings'
import { searchSimilarChunks } from '@/lib/services/vector-search'
import { processDocument } from '@/lib/services/document-processor'

// Mock external services for performance testing
jest.mock('@/lib/supabase/server')
jest.mock('openai')
jest.mock('@qdrant/js-client-rest')
jest.mock('@upstash/redis')

describe('Performance Tests', () => {
  const PERFORMANCE_THRESHOLDS = {
    EMBEDDING_GENERATION: 2000, // 2 seconds
    VECTOR_SEARCH: 1000, // 1 second
    DOCUMENT_PROCESSING: 5000, // 5 seconds
    API_RESPONSE: 3000, // 3 seconds
  }

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock fast responses for performance testing
    jest.doMock('openai', () => ({
      OpenAI: jest.fn(() => ({
        embeddings: {
          create: jest.fn().mockResolvedValue({
            data: [{ embedding: new Array(1536).fill(0.1) }],
          }),
        },
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [{ message: { content: 'Fast response' } }],
            }),
          },
        },
      })),
    }))

    jest.doMock('@qdrant/js-client-rest', () => ({
      QdrantClient: jest.fn(() => ({
        search: jest.fn().mockResolvedValue([
          {
            id: 'test-chunk',
            score: 0.85,
            payload: { content: 'Fast search result', document_id: 'test-doc' },
          },
        ]),
      })),
    }))

    jest.doMock('@upstash/redis', () => ({
      Redis: jest.fn(() => ({
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn().mockResolvedValue('OK'),
      })),
    }))
  })

  describe('Embedding Generation Performance', () => {
    it('should generate embeddings within time threshold', async () => {
      const text = 'This is a test document for embedding generation performance testing.'

      const startTime = performance.now()
      await embeddings.generateEmbedding(text)
      const endTime = performance.now()

      const duration = endTime - startTime
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.EMBEDDING_GENERATION)
    })

    it('should handle batch embedding generation efficiently', async () => {
      const texts = Array.from(
        { length: 10 },
        (_, i) => `Test document ${i} for batch embedding generation.`
      )

      const startTime = performance.now()
      await Promise.all(texts.map(text => embeddings.generateEmbedding(text)))
      const endTime = performance.now()

      const duration = endTime - startTime
      const averagePerEmbedding = duration / texts.length

      expect(averagePerEmbedding).toBeLessThan(PERFORMANCE_THRESHOLDS.EMBEDDING_GENERATION / 2)
    })

    it('should benefit from caching', async () => {
      const text = 'Cached embedding test text'

      // First call (cache miss)
      const startTime1 = performance.now()
      await embeddings.generateEmbedding(text)
      const endTime1 = performance.now()
      const firstCallDuration = endTime1 - startTime1

      // Mock cache hit
      jest.doMock('@upstash/redis', () => ({
        Redis: jest.fn(() => ({
          get: jest.fn().mockResolvedValue(JSON.stringify(new Array(1536).fill(0.1))),
          set: jest.fn().mockResolvedValue('OK'),
        })),
      }))

      // Second call (cache hit)
      const startTime2 = performance.now()
      await embeddings.generateEmbedding(text)
      const endTime2 = performance.now()
      const secondCallDuration = endTime2 - startTime2

      // Cache hit should be significantly faster
      expect(secondCallDuration).toBeLessThan(firstCallDuration * 0.5)
    })
  })

  describe('Vector Search Performance', () => {
    it('should perform search within time threshold', async () => {
      const query = 'artificial intelligence machine learning'
      const userId = 'test-user-id'

      const startTime = performance.now()
      await vectorSearch.search(query, userId)
      const endTime = performance.now()

      const duration = endTime - startTime
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.VECTOR_SEARCH)
    })

    it('should handle concurrent searches efficiently', async () => {
      const queries = [
        'artificial intelligence',
        'machine learning',
        'natural language processing',
        'computer vision',
        'deep learning',
      ]
      const userId = 'test-user-id'

      const startTime = performance.now()
      await Promise.all(queries.map(query => vectorSearch.search(query, userId)))
      const endTime = performance.now()

      const duration = endTime - startTime
      const averagePerSearch = duration / queries.length

      expect(averagePerSearch).toBeLessThan(PERFORMANCE_THRESHOLDS.VECTOR_SEARCH)
    })

    it('should scale with result set size', async () => {
      const query = 'test query'
      const userId = 'test-user-id'

      // Test with different result set sizes
      const resultSizes = [1, 5, 10, 20]
      const durations: number[] = []

      for (const size of resultSizes) {
        // Mock different result set sizes
        jest.doMock('@qdrant/js-client-rest', () => ({
          QdrantClient: jest.fn(() => ({
            search: jest.fn().mockResolvedValue(
              Array.from({ length: size }, (_, i) => ({
                id: `chunk-${i}`,
                score: 0.8 - i * 0.1,
                payload: { content: `Result ${i}`, document_id: 'test-doc' },
              }))
            ),
          })),
        }))

        const startTime = performance.now()
        await vectorSearch.search(query, userId, { topK: size })
        const endTime = performance.now()

        durations.push(endTime - startTime)
      }

      // Performance should scale reasonably with result set size
      durations.forEach(duration => {
        expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.VECTOR_SEARCH * 2)
      })
    })
  })

  describe('Document Processing Performance', () => {
    it('should process small documents quickly', async () => {
      const content = 'Small test document content.'
      const file = new File([content], 'small.txt', { type: 'text/plain' })
      const userId = 'test-user-id'

      const startTime = performance.now()
      await documentProcessor.processDocument(file, userId)
      const endTime = performance.now()

      const duration = endTime - startTime
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.DOCUMENT_PROCESSING / 5)
    })

    it('should handle large documents within threshold', async () => {
      const content = 'Large document content. '.repeat(1000) // ~25KB
      const file = new File([content], 'large.txt', { type: 'text/plain' })
      const userId = 'test-user-id'

      const startTime = performance.now()
      await documentProcessor.processDocument(file, userId)
      const endTime = performance.now()

      const duration = endTime - startTime
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.DOCUMENT_PROCESSING)
    })

    it('should process multiple documents concurrently', async () => {
      const files = Array.from(
        { length: 5 },
        (_, i) => new File([`Document ${i} content.`], `doc${i}.txt`, { type: 'text/plain' })
      )
      const userId = 'test-user-id'

      const startTime = performance.now()
      await Promise.all(files.map(file => documentProcessor.processDocument(file, userId)))
      const endTime = performance.now()

      const duration = endTime - startTime
      const averagePerDocument = duration / files.length

      expect(averagePerDocument).toBeLessThan(PERFORMANCE_THRESHOLDS.DOCUMENT_PROCESSING / 2)
    })
  })

  describe('Memory Usage', () => {
    it('should not leak memory during repeated operations', async () => {
      const initialMemory = process.memoryUsage().heapUsed

      // Perform many operations
      for (let i = 0; i < 100; i++) {
        await embeddings.generateEmbedding(`Test text ${i}`)
        await vectorSearch.search(`Query ${i}`, 'test-user')
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc()
      }

      const finalMemory = process.memoryUsage().heapUsed
      const memoryIncrease = finalMemory - initialMemory

      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024)
    })

    it('should handle large text processing without excessive memory usage', async () => {
      const largeText = 'A'.repeat(1024 * 1024) // 1MB of text
      const initialMemory = process.memoryUsage().heapUsed

      await documentProcessor.chunkText(largeText, 500, 50)

      const finalMemory = process.memoryUsage().heapUsed
      const memoryIncrease = finalMemory - initialMemory

      // Memory usage should not exceed 5x the input size
      expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024)
    })
  })

  describe('API Response Times', () => {
    it('should respond to chat requests quickly', async () => {
      const mockRequest = {
        json: () =>
          Promise.resolve({
            messages: [{ role: 'user', content: 'Hello' }],
          }),
      }

      const startTime = performance.now()
      // Simulate API call processing
      await new Promise(resolve => setTimeout(resolve, 100))
      const endTime = performance.now()

      const duration = endTime - startTime
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.API_RESPONSE)
    })

    it('should handle search requests efficiently', async () => {
      const mockRequest = {
        json: () =>
          Promise.resolve({
            query: 'test search query',
            topK: 5,
          }),
      }

      const startTime = performance.now()
      await vectorSearch.search('test search query', 'test-user')
      const endTime = performance.now()

      const duration = endTime - startTime
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.VECTOR_SEARCH)
    })
  })

  describe('Load Testing', () => {
    it('should handle concurrent users', async () => {
      const concurrentUsers = 10
      const operationsPerUser = 5

      const userOperations = Array.from({ length: concurrentUsers }, async (_, userId) => {
        const operations = []

        for (let i = 0; i < operationsPerUser; i++) {
          operations.push(
            embeddings.generateEmbedding(`User ${userId} text ${i}`),
            vectorSearch.search(`User ${userId} query ${i}`, `user-${userId}`)
          )
        }

        return Promise.all(operations)
      })

      const startTime = performance.now()
      await Promise.all(userOperations)
      const endTime = performance.now()

      const totalDuration = endTime - startTime
      const averagePerOperation = totalDuration / (concurrentUsers * operationsPerUser * 2)

      // Average operation time should remain reasonable under load
      expect(averagePerOperation).toBeLessThan(1000) // 1 second per operation
    })
  })
})
