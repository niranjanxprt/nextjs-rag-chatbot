import { initializeLangfuse, getLangfuseClient, trackChatCompletion, trackEmbedding, trackSearch } from '@/lib/services/langfuse'

// Mock Langfuse
jest.mock('langfuse', () => ({
  Langfuse: jest.fn().mockImplementation(() => ({
    trace: jest.fn().mockReturnValue({
      generation: jest.fn().mockReturnValue({
        end: jest.fn(),
      }),
      span: jest.fn().mockReturnValue({
        end: jest.fn(),
      }),
      update: jest.fn(),
      end: jest.fn(),
    }),
    flush: jest.fn().mockResolvedValue(undefined),
  })),
}))

// Mock console methods
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation()
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation()
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation()

describe('Langfuse Service', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
    mockConsoleLog.mockRestore()
    mockConsoleWarn.mockRestore()
    mockConsoleError.mockRestore()
  })

  describe('initializeLangfuse', () => {
    it('returns null when environment variables are not set', () => {
      delete process.env.LANGFUSE_PUBLIC_KEY
      delete process.env.LANGFUSE_SECRET_KEY

      const client = initializeLangfuse()

      expect(client).toBeNull()
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        'Langfuse is not configured. Set LANGFUSE_PUBLIC_KEY and LANGFUSE_SECRET_KEY environment variables.'
      )
    })

    it('initializes Langfuse client with environment variables', () => {
      process.env.LANGFUSE_PUBLIC_KEY = 'test-public-key'
      process.env.LANGFUSE_SECRET_KEY = 'test-secret-key'

      const client = initializeLangfuse()

      expect(client).toBeDefined()
      expect(mockConsoleLog).toHaveBeenCalledWith('Langfuse initialized successfully')
    })

    it('uses custom base URL when provided', () => {
      process.env.LANGFUSE_PUBLIC_KEY = 'test-public-key'
      process.env.LANGFUSE_SECRET_KEY = 'test-secret-key'
      process.env.LANGFUSE_BASE_URL = 'https://custom.langfuse.com'

      const client = initializeLangfuse()

      expect(client).toBeDefined()
    })

    it('returns existing client on subsequent calls', () => {
      process.env.LANGFUSE_PUBLIC_KEY = 'test-public-key'
      process.env.LANGFUSE_SECRET_KEY = 'test-secret-key'

      const client1 = initializeLangfuse()
      const client2 = initializeLangfuse()

      expect(client1).toBe(client2)
    })

    it('handles initialization errors gracefully', () => {
      process.env.LANGFUSE_PUBLIC_KEY = 'test-public-key'
      process.env.LANGFUSE_SECRET_KEY = 'test-secret-key'

      const { Langfuse } = require('langfuse')
      Langfuse.mockImplementationOnce(() => {
        throw new Error('Initialization failed')
      })

      const client = initializeLangfuse()

      expect(client).toBeNull()
      expect(mockConsoleError).toHaveBeenCalledWith('Failed to initialize Langfuse:', expect.any(Error))
    })
  })

  describe('getLangfuseClient', () => {
    it('returns null when Langfuse is not configured', () => {
      delete process.env.LANGFUSE_PUBLIC_KEY
      delete process.env.LANGFUSE_SECRET_KEY

      const client = getLangfuseClient()

      expect(client).toBeNull()
    })

    it('returns initialized client', () => {
      process.env.LANGFUSE_PUBLIC_KEY = 'test-public-key'
      process.env.LANGFUSE_SECRET_KEY = 'test-secret-key'

      const client = getLangfuseClient()

      expect(client).toBeDefined()
    })
  })

  describe('trackChatCompletion', () => {
    beforeEach(() => {
      process.env.LANGFUSE_PUBLIC_KEY = 'test-public-key'
      process.env.LANGFUSE_SECRET_KEY = 'test-secret-key'
    })

    it('tracks chat completion successfully', async () => {
      const mockTrace = {
        generation: jest.fn().mockReturnValue({
          end: jest.fn(),
        }),
        update: jest.fn(),
        end: jest.fn(),
      }

      const { Langfuse } = require('langfuse')
      const mockClient = new Langfuse()
      mockClient.trace.mockReturnValue(mockTrace)

      const params = {
        messages: [{ role: 'user', content: 'Hello' }],
        response: 'Hi there!',
        model: 'gpt-4',
        userId: 'user-123',
        conversationId: 'conv-456',
        metadata: { source: 'test' },
      }

      await trackChatCompletion(params)

      expect(mockClient.trace).toHaveBeenCalledWith({
        name: 'chat-completion',
        userId: 'user-123',
        sessionId: 'conv-456',
        metadata: { source: 'test' },
      })

      expect(mockTrace.generation).toHaveBeenCalledWith({
        name: 'chat-completion',
        model: 'gpt-4',
        input: [{ role: 'user', content: 'Hello' }],
        output: 'Hi there!',
      })
    })

    it('handles tracking errors gracefully', async () => {
      const { Langfuse } = require('langfuse')
      const mockClient = new Langfuse()
      mockClient.trace.mockImplementation(() => {
        throw new Error('Tracking failed')
      })

      const params = {
        messages: [{ role: 'user', content: 'Hello' }],
        response: 'Hi there!',
        model: 'gpt-4',
        userId: 'user-123',
        conversationId: 'conv-456',
      }

      await expect(trackChatCompletion(params)).resolves.not.toThrow()
      expect(mockConsoleError).toHaveBeenCalledWith('Failed to track chat completion:', expect.any(Error))
    })

    it('does nothing when Langfuse is not configured', async () => {
      delete process.env.LANGFUSE_PUBLIC_KEY
      delete process.env.LANGFUSE_SECRET_KEY

      const params = {
        messages: [{ role: 'user', content: 'Hello' }],
        response: 'Hi there!',
        model: 'gpt-4',
        userId: 'user-123',
        conversationId: 'conv-456',
      }

      await trackChatCompletion(params)

      // Should not throw or cause issues
      expect(mockConsoleError).not.toHaveBeenCalled()
    })
  })

  describe('trackEmbedding', () => {
    beforeEach(() => {
      process.env.LANGFUSE_PUBLIC_KEY = 'test-public-key'
      process.env.LANGFUSE_SECRET_KEY = 'test-secret-key'
    })

    it('tracks embedding generation successfully', async () => {
      const mockTrace = {
        generation: jest.fn().mockReturnValue({
          end: jest.fn(),
        }),
        update: jest.fn(),
        end: jest.fn(),
      }

      const { Langfuse } = require('langfuse')
      const mockClient = new Langfuse()
      mockClient.trace.mockReturnValue(mockTrace)

      const params = {
        input: 'Text to embed',
        model: 'text-embedding-3-small',
        userId: 'user-123',
        metadata: { documentId: 'doc-456' },
      }

      await trackEmbedding(params)

      expect(mockClient.trace).toHaveBeenCalledWith({
        name: 'embedding-generation',
        userId: 'user-123',
        metadata: { documentId: 'doc-456' },
      })

      expect(mockTrace.generation).toHaveBeenCalledWith({
        name: 'embedding-generation',
        model: 'text-embedding-3-small',
        input: 'Text to embed',
      })
    })

    it('handles tracking errors gracefully', async () => {
      const { Langfuse } = require('langfuse')
      const mockClient = new Langfuse()
      mockClient.trace.mockImplementation(() => {
        throw new Error('Tracking failed')
      })

      const params = {
        input: 'Text to embed',
        model: 'text-embedding-3-small',
        userId: 'user-123',
      }

      await expect(trackEmbedding(params)).resolves.not.toThrow()
      expect(mockConsoleError).toHaveBeenCalledWith('Failed to track embedding:', expect.any(Error))
    })
  })

  describe('trackSearch', () => {
    beforeEach(() => {
      process.env.LANGFUSE_PUBLIC_KEY = 'test-public-key'
      process.env.LANGFUSE_SECRET_KEY = 'test-secret-key'
    })

    it('tracks search operation successfully', async () => {
      const mockTrace = {
        span: jest.fn().mockReturnValue({
          end: jest.fn(),
        }),
        update: jest.fn(),
        end: jest.fn(),
      }

      const { Langfuse } = require('langfuse')
      const mockClient = new Langfuse()
      mockClient.trace.mockReturnValue(mockTrace)

      const params = {
        query: 'search query',
        results: [
          { id: '1', score: 0.9, content: 'Result 1' },
          { id: '2', score: 0.8, content: 'Result 2' },
        ],
        userId: 'user-123',
        metadata: { projectId: 'proj-456' },
      }

      await trackSearch(params)

      expect(mockClient.trace).toHaveBeenCalledWith({
        name: 'vector-search',
        userId: 'user-123',
        metadata: { projectId: 'proj-456' },
      })

      expect(mockTrace.span).toHaveBeenCalledWith({
        name: 'vector-search',
        input: 'search query',
        output: {
          resultCount: 2,
          topScore: 0.9,
          results: [
            { id: '1', score: 0.9, content: 'Result 1' },
            { id: '2', score: 0.8, content: 'Result 2' },
          ],
        },
      })
    })

    it('handles empty results', async () => {
      const mockTrace = {
        span: jest.fn().mockReturnValue({
          end: jest.fn(),
        }),
        update: jest.fn(),
        end: jest.fn(),
      }

      const { Langfuse } = require('langfuse')
      const mockClient = new Langfuse()
      mockClient.trace.mockReturnValue(mockTrace)

      const params = {
        query: 'search query',
        results: [],
        userId: 'user-123',
      }

      await trackSearch(params)

      expect(mockTrace.span).toHaveBeenCalledWith({
        name: 'vector-search',
        input: 'search query',
        output: {
          resultCount: 0,
          topScore: 0,
          results: [],
        },
      })
    })

    it('handles tracking errors gracefully', async () => {
      const { Langfuse } = require('langfuse')
      const mockClient = new Langfuse()
      mockClient.trace.mockImplementation(() => {
        throw new Error('Tracking failed')
      })

      const params = {
        query: 'search query',
        results: [],
        userId: 'user-123',
      }

      await expect(trackSearch(params)).resolves.not.toThrow()
      expect(mockConsoleError).toHaveBeenCalledWith('Failed to track search:', expect.any(Error))
    })
  })

  describe('Integration', () => {
    it('works with real-world usage patterns', async () => {
      process.env.LANGFUSE_PUBLIC_KEY = 'test-public-key'
      process.env.LANGFUSE_SECRET_KEY = 'test-secret-key'

      const mockTrace = {
        generation: jest.fn().mockReturnValue({ end: jest.fn() }),
        span: jest.fn().mockReturnValue({ end: jest.fn() }),
        update: jest.fn(),
        end: jest.fn(),
      }

      const { Langfuse } = require('langfuse')
      const mockClient = new Langfuse()
      mockClient.trace.mockReturnValue(mockTrace)

      // Simulate a complete RAG workflow
      await trackSearch({
        query: 'What is RAG?',
        results: [{ id: '1', score: 0.9, content: 'RAG is...' }],
        userId: 'user-123',
      })

      await trackChatCompletion({
        messages: [{ role: 'user', content: 'What is RAG?' }],
        response: 'RAG stands for Retrieval-Augmented Generation...',
        model: 'gpt-4',
        userId: 'user-123',
        conversationId: 'conv-456',
      })

      expect(mockClient.trace).toHaveBeenCalledTimes(2)
      expect(mockTrace.span).toHaveBeenCalledTimes(1)
      expect(mockTrace.generation).toHaveBeenCalledTimes(1)
    })
  })
})
