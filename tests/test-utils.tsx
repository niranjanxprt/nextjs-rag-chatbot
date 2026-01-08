import { render, RenderOptions } from '@testing-library/react'
import { ReactElement } from 'react'
import { AuthProvider } from '@/lib/auth/context'

// Mock data generators
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  created_at: new Date().toISOString(),
}

export const mockDocument = {
  id: 'test-doc-id',
  title: 'Test Document',
  content: 'This is test document content',
  user_id: mockUser.id,
  status: 'completed' as const,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

export const mockConversation = {
  id: 'test-conversation-id',
  title: 'Test Conversation',
  user_id: mockUser.id,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

export const mockMessage = {
  id: 'test-message-id',
  conversation_id: mockConversation.id,
  role: 'user' as const,
  content: 'Test message content',
  created_at: new Date().toISOString(),
}

// Test providers wrapper
interface AllTheProvidersProps {
  children: React.ReactNode
  user?: typeof mockUser | null
}

const AllTheProviders = ({ children, user = mockUser }: AllTheProvidersProps) => {
  // Mock auth context for testing
  return <div data-testid="mock-auth-provider">{children}</div>
}

// Custom render function
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & { user?: typeof mockUser | null }
) => {
  const { user, ...renderOptions } = options || {}

  return render(ui, {
    wrapper: ({ children }) => <AllTheProviders user={user}>{children}</AllTheProviders>,
    ...renderOptions,
  })
}

// Mock API responses
export const mockApiResponse = (data: any, status = 200) => {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  })
}

export const mockStreamingResponse = (chunks: string[]) => {
  const encoder = new TextEncoder()
  let index = 0

  return new ReadableStream({
    start(controller) {
      const sendChunk = () => {
        if (index < chunks.length) {
          controller.enqueue(encoder.encode(chunks[index]))
          index++
          setTimeout(sendChunk, 10) // Simulate streaming delay
        } else {
          controller.close()
        }
      }
      sendChunk()
    },
  })
}

// Database mock helpers
export const mockSupabaseClient = {
  auth: {
    getUser: jest.fn().mockResolvedValue({
      data: { user: mockUser },
      error: null,
    }),
    signInWithOtp: jest.fn().mockResolvedValue({
      data: {},
      error: null,
    }),
    signOut: jest.fn().mockResolvedValue({
      error: null,
    }),
  },
  from: jest.fn().mockReturnValue({
    select: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: mockDocument,
          error: null,
        }),
        order: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({
            data: [mockDocument],
            error: null,
          }),
        }),
      }),
      order: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue({
          data: [mockDocument],
          error: null,
        }),
      }),
    }),
    insert: jest.fn().mockResolvedValue({
      data: mockDocument,
      error: null,
    }),
    update: jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({
        data: mockDocument,
        error: null,
      }),
    }),
    delete: jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    }),
  }),
}

// OpenAI mock helpers
export const mockOpenAIClient = {
  embeddings: {
    create: jest.fn().mockResolvedValue({
      data: [
        {
          embedding: new Array(1536).fill(0.1),
        },
      ],
    }),
  },
  chat: {
    completions: {
      create: jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: 'Mock AI response',
            },
          },
        ],
      }),
    },
  },
}

// Qdrant mock helpers
export const mockQdrantClient = {
  upsert: jest.fn().mockResolvedValue({ status: 'ok' }),
  search: jest.fn().mockResolvedValue([
    {
      id: 'test-chunk-id',
      score: 0.85,
      payload: {
        content: 'Mock search result content',
        document_id: mockDocument.id,
      },
    },
  ]),
  delete: jest.fn().mockResolvedValue({ status: 'ok' }),
}

// Redis mock helpers
export const mockRedisClient = {
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue('OK'),
  del: jest.fn().mockResolvedValue(1),
  exists: jest.fn().mockResolvedValue(0),
  expire: jest.fn().mockResolvedValue(1),
}

// Test utilities
export const waitForNextTick = () => new Promise(resolve => setTimeout(resolve, 0))

export const createMockFile = (content: string, name: string, type: string) => {
  return new File([content], name, { type })
}

export const createMockFormData = (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  return formData
}

// Assertion helpers
export const expectToBeCalledWithUser = (mockFn: jest.Mock, user = mockUser) => {
  expect(mockFn).toHaveBeenCalledWith(
    expect.objectContaining({
      user_id: user.id,
    })
  )
}

export const expectToBeValidApiResponse = (response: any) => {
  expect(response).toMatchObject({
    ok: expect.any(Boolean),
    status: expect.any(Number),
    json: expect.any(Function),
  })
}

// Performance testing helpers
export const measureExecutionTime = async (fn: () => Promise<any>) => {
  const start = performance.now()
  await fn()
  const end = performance.now()
  return end - start
}

export const expectPerformanceWithin = async (fn: () => Promise<any>, maxTime: number) => {
  const duration = await measureExecutionTime(fn)
  expect(duration).toBeLessThan(maxTime)
}

// Memory leak detection
export const detectMemoryLeaks = (fn: () => void, iterations = 1000) => {
  const initialMemory = process.memoryUsage().heapUsed

  for (let i = 0; i < iterations; i++) {
    fn()
  }

  // Force garbage collection if available
  if (global.gc) {
    global.gc()
  }

  const finalMemory = process.memoryUsage().heapUsed
  const memoryIncrease = finalMemory - initialMemory

  // Memory increase should be reasonable (less than 10MB for 1000 iterations)
  expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024)
}

// Export custom render as default
export { customRender as render }
export * from '@testing-library/react'
