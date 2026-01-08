import { NextRequest } from 'next/server'
import { POST } from '@/app/api/chat/route'
import { createClient } from '@/lib/supabase/server'

// Mock external dependencies
jest.mock('@/lib/supabase/server')
jest.mock('openai')
jest.mock('@upstash/redis')

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>

describe('/api/chat', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Mock Supabase client
    mockCreateClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null,
        }),
      },
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
        insert: jest.fn().mockResolvedValue({
          data: { id: 'test-conversation-id' },
          error: null,
        }),
      }),
    } as any)
  })

  describe('POST /api/chat', () => {
    it('should return 401 for unauthenticated requests', async () => {
      mockCreateClient.mockReturnValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: { message: 'Not authenticated' },
          }),
        },
      } as any)

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hello' }],
        }),
      })

      const response = await POST(request)
      expect(response.status).toBe(401)
    })

    it('should validate request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [], // Invalid: empty messages
        }),
      })

      const response = await POST(request)
      expect(response.status).toBe(400)
    })

    it('should handle chat request with valid input', async () => {
      // Mock OpenAI response
      const mockOpenAI = {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [
                {
                  message: {
                    content: 'Hello! How can I help you?',
                  },
                },
              ],
            }),
          },
        },
      }

      jest.doMock('openai', () => ({
        OpenAI: jest.fn(() => mockOpenAI),
      }))

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hello' }],
        }),
      })

      const response = await POST(request)
      expect(response.status).toBe(200)
    })

    it('should handle streaming responses', async () => {
      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue('data: {"content": "Hello"}\n\n')
          controller.close()
        },
      })

      const mockOpenAI = {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue(mockStream),
          },
        },
      }

      jest.doMock('openai', () => ({
        OpenAI: jest.fn(() => mockOpenAI),
      }))

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hello' }],
          stream: true,
        }),
      })

      const response = await POST(request)
      expect(response.headers.get('content-type')).toBe('text/event-stream')
    })

    it('should handle errors gracefully', async () => {
      const mockOpenAI = {
        chat: {
          completions: {
            create: jest.fn().mockRejectedValue(new Error('OpenAI API error')),
          },
        },
      }

      jest.doMock('openai', () => ({
        OpenAI: jest.fn(() => mockOpenAI),
      }))

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hello' }],
        }),
      })

      const response = await POST(request)
      expect(response.status).toBe(500)
    })
  })
})
