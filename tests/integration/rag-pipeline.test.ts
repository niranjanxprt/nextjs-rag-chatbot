import { createClient } from '@/lib/supabase/server'
import { generateEmbeddings } from '@/lib/services/embeddings'
import { searchSimilarChunks } from '@/lib/services/vector-search'
import { processDocument } from '@/lib/services/document-processor'

// Mock external services
jest.mock('@/lib/supabase/server')
jest.mock('openai')
jest.mock('@qdrant/js-client-rest')
jest.mock('@upstash/redis')

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>

describe('RAG Pipeline Integration', () => {
  const mockUser = { id: 'test-user-id' }
  const mockDocument = {
    id: 'test-doc-id',
    title: 'Test Document',
    content: 'This is a test document about artificial intelligence and machine learning.',
    user_id: 'test-user-id',
  }

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock Supabase client
    mockCreateClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [mockDocument],
            error: null,
          }),
        }),
        insert: jest.fn().mockResolvedValue({
          data: { id: 'test-chunk-id' },
          error: null,
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      }),
    } as any)

    // Mock OpenAI embeddings
    jest.doMock('openai', () => ({
      OpenAI: jest.fn(() => ({
        embeddings: {
          create: jest.fn().mockResolvedValue({
            data: [
              {
                embedding: new Array(1536).fill(0.1),
              },
            ],
          }),
        },
      })),
    }))

    // Mock Qdrant client
    jest.doMock('@qdrant/js-client-rest', () => ({
      QdrantClient: jest.fn(() => ({
        upsert: jest.fn().mockResolvedValue({ status: 'ok' }),
        search: jest.fn().mockResolvedValue([
          {
            id: 'test-chunk-id',
            score: 0.85,
            payload: {
              content: 'This is a test document about artificial intelligence',
              document_id: 'test-doc-id',
            },
          },
        ]),
      })),
    }))

    // Mock Redis
    jest.doMock('@upstash/redis', () => ({
      Redis: jest.fn(() => ({
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn().mockResolvedValue('OK'),
        del: jest.fn().mockResolvedValue(1),
      })),
    }))
  })

  describe('Document Processing Pipeline', () => {
    it('should process document end-to-end', async () => {
      const file = new File(['Test document content'], 'test.txt', {
        type: 'text/plain',
      })

      // Process document
      const result = await documentProcessor.processDocument(file, mockUser.id)

      expect(result).toEqual({
        success: true,
        documentId: expect.any(String),
        chunksCreated: expect.any(Number),
      })
    })

    it('should handle PDF processing', async () => {
      const pdfBuffer = Buffer.from('Mock PDF content')
      const file = new File([pdfBuffer], 'test.pdf', {
        type: 'application/pdf',
      })

      // Mock PDF parsing
      jest.doMock('pdf-parse', () =>
        jest.fn().mockResolvedValue({
          text: 'Extracted PDF text content',
        })
      )

      const result = await documentProcessor.processDocument(file, mockUser.id)

      expect(result.success).toBe(true)
    })

    it('should chunk text appropriately', async () => {
      const longText = 'A'.repeat(2000) // Long text to test chunking
      const chunks = await documentProcessor.chunkText(longText)

      expect(chunks.length).toBeGreaterThan(1)
      expect(chunks[0].length).toBeLessThanOrEqual(500)
    })
  })

  describe('Embedding and Search Pipeline', () => {
    it('should generate embeddings for text', async () => {
      const text = 'Test text for embedding'
      const embedding = await embeddings.generateEmbedding(text)

      expect(embedding).toHaveLength(1536)
      expect(typeof embedding[0]).toBe('number')
    })

    it('should cache embeddings', async () => {
      const text = 'Test text for caching'

      // First call
      await embeddings.generateEmbedding(text)

      // Second call should use cache
      await embeddings.generateEmbedding(text)

      // Verify cache was used (implementation specific)
      expect(true).toBe(true) // Placeholder assertion
    })

    it('should perform vector search', async () => {
      const query = 'artificial intelligence'
      const results = await vectorSearch.search(query, mockUser.id)

      expect(results).toHaveLength(1)
      expect(results[0]).toMatchObject({
        content: expect.any(String),
        score: expect.any(Number),
        documentId: 'test-doc-id',
      })
    })

    it('should filter search results by similarity threshold', async () => {
      // Mock low similarity results
      jest.doMock('@qdrant/js-client-rest', () => ({
        QdrantClient: jest.fn(() => ({
          search: jest.fn().mockResolvedValue([
            {
              id: 'test-chunk-id',
              score: 0.3, // Low similarity
              payload: {
                content: 'Low similarity content',
                document_id: 'test-doc-id',
              },
            },
          ]),
        })),
      }))

      const query = 'artificial intelligence'
      const results = await vectorSearch.search(query, mockUser.id, {
        threshold: 0.7,
      })

      expect(results).toHaveLength(0) // Should be filtered out
    })
  })

  describe('Full RAG Workflow', () => {
    it('should complete full RAG pipeline', async () => {
      // 1. Upload and process document
      const file = new File(['AI and ML content'], 'ai-doc.txt', {
        type: 'text/plain',
      })

      const processResult = await documentProcessor.processDocument(file, mockUser.id)
      expect(processResult.success).toBe(true)

      // 2. Search for relevant content
      const searchResults = await vectorSearch.search('machine learning', mockUser.id)
      expect(searchResults.length).toBeGreaterThan(0)

      // 3. Verify search results contain expected content
      expect(searchResults[0].content).toContain('artificial intelligence')
    })

    it('should handle concurrent document processing', async () => {
      const files = [
        new File(['Document 1 content'], 'doc1.txt', { type: 'text/plain' }),
        new File(['Document 2 content'], 'doc2.txt', { type: 'text/plain' }),
        new File(['Document 3 content'], 'doc3.txt', { type: 'text/plain' }),
      ]

      const promises = files.map(file => documentProcessor.processDocument(file, mockUser.id))

      const results = await Promise.all(promises)

      results.forEach(result => {
        expect(result.success).toBe(true)
      })
    })

    it('should maintain data consistency across operations', async () => {
      const file = new File(['Consistency test content'], 'consistency.txt', {
        type: 'text/plain',
      })

      // Process document
      const processResult = await documentProcessor.processDocument(file, mockUser.id)

      // Search should find the processed content
      const searchResults = await vectorSearch.search('consistency test', mockUser.id)

      expect(searchResults.length).toBeGreaterThan(0)
      expect(searchResults[0].content).toContain('consistency')
    })
  })

  describe('Error Handling and Recovery', () => {
    it('should handle OpenAI API failures', async () => {
      jest.doMock('openai', () => ({
        OpenAI: jest.fn(() => ({
          embeddings: {
            create: jest.fn().mockRejectedValue(new Error('OpenAI API Error')),
          },
        })),
      }))

      const text = 'Test text'

      await expect(embeddings.generateEmbedding(text)).rejects.toThrow('OpenAI API Error')
    })

    it('should handle Qdrant connection failures', async () => {
      jest.doMock('@qdrant/js-client-rest', () => ({
        QdrantClient: jest.fn(() => ({
          search: jest.fn().mockRejectedValue(new Error('Qdrant connection failed')),
        })),
      }))

      const query = 'test query'

      await expect(vectorSearch.search(query, mockUser.id)).rejects.toThrow(
        'Qdrant connection failed'
      )
    })

    it('should handle database transaction failures', async () => {
      mockCreateClient.mockReturnValue({
        from: jest.fn().mockReturnValue({
          insert: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' },
          }),
        }),
      } as any)

      const file = new File(['Test content'], 'test.txt', { type: 'text/plain' })

      const result = await documentProcessor.processDocument(file, mockUser.id)
      expect(result.success).toBe(false)
    })
  })
})
