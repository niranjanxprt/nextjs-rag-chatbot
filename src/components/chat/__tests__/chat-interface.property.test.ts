import fc from 'fast-check'

interface MockMessage {
  id: string
  conversationId: string
  role: 'user' | 'assistant'
  content: string
  userId: string
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

interface MockConversation {
  id: string
  title: string
  userId: string
  messages: MockMessage[]
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

class MockConversationService {
  private conversations = new Map<string, MockConversation>()

  async createConversation(title: string, userId: string): Promise<MockConversation> {
    const conversation: MockConversation = {
      id: `conv-${Date.now()}-${Math.random()}`,
      title,
      userId,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }

    this.conversations.set(conversation.id, conversation)
    return conversation
  }

  async addMessage(
    conversationId: string,
    role: MockMessage['role'],
    content: string,
    userId: string
  ): Promise<MockMessage> {
    if (!content || content.trim().length === 0) {
      throw new Error('Message content cannot be empty')
    }

    const message: MockMessage = {
      id: `msg-${Date.now()}-${Math.random()}`,
      conversationId,
      role,
      content,
      userId,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    return message
  }

  async getConversation(id: string, userId: string): Promise<MockConversation | null> {
    const conversation = this.conversations.get(id)
    if (!conversation || conversation.userId !== userId) {
      return null
    }
    return conversation
  }
}

describe('Chat Interface Property Tests', () => {
  let mockService: MockConversationService

  beforeEach(() => {
    mockService = new MockConversationService()
  })

  describe('conversation creation', () => {
    test('creates conversations with valid data', async () => {
      await fc.assert(fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.string({ minLength: 1 }),
        async (title, userId) => {
          const conversation = await mockService.createConversation(title, userId)
          
          expect(conversation.title).toBe(title)
          expect(conversation.userId).toBe(userId)
          expect(conversation.id).toBeDefined()
        }
      ), { numRuns: 5 })
    })
  })

  describe('message handling', () => {
    test('adds valid messages', async () => {
      await fc.assert(fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 500 }),
        fc.constantFrom('user' as const, 'assistant' as const),
        fc.string({ minLength: 1 }),
        async (content, role, userId) => {
          const conversation = await mockService.createConversation('Test', userId)
          const message = await mockService.addMessage(conversation.id, role, content, userId)
          
          expect(message.content).toBe(content)
          expect(message.role).toBe(role)
        }
      ), { numRuns: 5 })
    })

    test('rejects empty content', async () => {
      await fc.assert(fc.asyncProperty(
        fc.constantFrom('user' as const, 'assistant' as const),
        fc.string({ minLength: 1 }),
        async (role, userId) => {
          const conversation = await mockService.createConversation('Test', userId)
          
          await expect(
            mockService.addMessage(conversation.id, role, '', userId)
          ).rejects.toThrow('Message content cannot be empty')
        }
      ), { numRuns: 5 })
    })
  })
})
