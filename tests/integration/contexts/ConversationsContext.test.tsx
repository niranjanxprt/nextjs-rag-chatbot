import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConversationsProvider, useConversations } from '@/lib/contexts/conversations-context'
import type { Conversation, Message } from '@/lib/types/database'

// Mock fetch
global.fetch = jest.fn()
const mockFetch = fetch as jest.MockedFunction<typeof fetch>

// Test component to access context
function TestComponent() {
  const {
    conversations,
    currentConversation,
    messages,
    setCurrentConversation,
    createConversation,
    updateConversation,
    deleteConversation,
    sendMessage,
    isLoading,
    error,
  } = useConversations()

  return (
    <div>
      <div data-testid="loading">{isLoading ? 'loading' : 'loaded'}</div>
      <div data-testid="error">{error || 'no-error'}</div>
      <div data-testid="conversations-count">{conversations.length}</div>
      <div data-testid="messages-count">{messages.length}</div>
      <div data-testid="current-conversation">
        {currentConversation?.title || 'none'}
      </div>
      
      <button onClick={() => setCurrentConversation('conv-1')}>
        Set Current Conversation
      </button>
      
      <button
        onClick={() =>
          createConversation({
            title: 'New Conversation',
            project_id: 'project-1',
          })
        }
      >
        Create Conversation
      </button>
      
      <button
        onClick={() =>
          updateConversation('conv-1', { title: 'Updated Conversation' })
        }
      >
        Update Conversation
      </button>
      
      <button onClick={() => deleteConversation('conv-1')}>
        Delete Conversation
      </button>
      
      <button
        onClick={() =>
          sendMessage({
            content: 'Test message',
            role: 'user',
            conversation_id: 'conv-1',
          })
        }
      >
        Send Message
      </button>
      
      {conversations.map((conversation) => (
        <div key={conversation.id} data-testid={`conversation-${conversation.id}`}>
          {conversation.title}
        </div>
      ))}
      
      {messages.map((message) => (
        <div key={message.id} data-testid={`message-${message.id}`}>
          {message.content}
        </div>
      ))}
    </div>
  )
}

const mockConversations: Conversation[] = [
  {
    id: 'conv-1',
    title: 'Test Conversation 1',
    project_id: 'project-1',
    user_id: 'user-1',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'conv-2',
    title: 'Test Conversation 2',
    project_id: 'project-1',
    user_id: 'user-1',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
]

const mockMessages: Message[] = [
  {
    id: 'msg-1',
    content: 'Hello, how are you?',
    role: 'user',
    conversation_id: 'conv-1',
    user_id: 'user-1',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'msg-2',
    content: 'I am doing well, thank you!',
    role: 'assistant',
    conversation_id: 'conv-1',
    user_id: 'user-1',
    created_at: '2024-01-01T00:01:00Z',
    updated_at: '2024-01-01T00:01:00Z',
  },
]

describe('ConversationsContext', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Initial Loading', () => {
    it('loads conversations on mount', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ conversations: mockConversations }),
      } as Response)

      render(
        <ConversationsProvider>
          <TestComponent />
        </ConversationsProvider>
      )

      expect(screen.getByTestId('loading')).toHaveTextContent('loading')

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
      })

      expect(screen.getByTestId('conversations-count')).toHaveTextContent('2')
      expect(screen.getByTestId('conversation-conv-1')).toHaveTextContent('Test Conversation 1')
    })

    it('handles loading errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      render(
        <ConversationsProvider>
          <TestComponent />
        </ConversationsProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('error')).not.toHaveTextContent('no-error')
      })

      expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
      expect(screen.getByTestId('conversations-count')).toHaveTextContent('0')
    })
  })

  describe('Conversation CRUD Operations', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ conversations: mockConversations }),
      } as Response)
    })

    it('creates a new conversation', async () => {
      const user = userEvent.setup()
      const newConversation = {
        id: 'conv-3',
        title: 'New Conversation',
        project_id: 'project-1',
        user_id: 'user-1',
        created_at: '2024-01-03T00:00:00Z',
        updated_at: '2024-01-03T00:00:00Z',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ conversation: newConversation }),
      } as Response)

      render(
        <ConversationsProvider>
          <TestComponent />
        </ConversationsProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
      })

      await act(async () => {
        await user.click(screen.getByText('Create Conversation'))
      })

      await waitFor(() => {
        expect(screen.getByTestId('conversations-count')).toHaveTextContent('3')
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'New Conversation',
          project_id: 'project-1',
        }),
      })
    })

    it('updates an existing conversation', async () => {
      const user = userEvent.setup()
      const updatedConversation = { ...mockConversations[0], title: 'Updated Conversation' }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ conversation: updatedConversation }),
      } as Response)

      render(
        <ConversationsProvider>
          <TestComponent />
        </ConversationsProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
      })

      await act(async () => {
        await user.click(screen.getByText('Update Conversation'))
      })

      await waitFor(() => {
        expect(screen.getByTestId('conversation-conv-1')).toHaveTextContent('Updated Conversation')
      })
    })

    it('deletes a conversation', async () => {
      const user = userEvent.setup()

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      } as Response)

      render(
        <ConversationsProvider>
          <TestComponent />
        </ConversationsProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
      })

      await act(async () => {
        await user.click(screen.getByText('Delete Conversation'))
      })

      await waitFor(() => {
        expect(screen.getByTestId('conversations-count')).toHaveTextContent('1')
      })

      expect(screen.queryByTestId('conversation-conv-1')).not.toBeInTheDocument()
    })
  })

  describe('Current Conversation Management', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ conversations: mockConversations }),
      } as Response)
    })

    it('sets current conversation and loads messages', async () => {
      const user = userEvent.setup()

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ messages: mockMessages }),
      } as Response)

      render(
        <ConversationsProvider>
          <TestComponent />
        </ConversationsProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
      })

      await act(async () => {
        await user.click(screen.getByText('Set Current Conversation'))
      })

      await waitFor(() => {
        expect(screen.getByTestId('current-conversation')).toHaveTextContent('Test Conversation 1')
        expect(screen.getByTestId('messages-count')).toHaveTextContent('2')
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/conversations/conv-1/messages')
    })

    it('clears messages when conversation is deleted', async () => {
      const user = userEvent.setup()

      // First set current conversation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ messages: mockMessages }),
      } as Response)

      render(
        <ConversationsProvider>
          <TestComponent />
        </ConversationsProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
      })

      await act(async () => {
        await user.click(screen.getByText('Set Current Conversation'))
      })

      await waitFor(() => {
        expect(screen.getByTestId('messages-count')).toHaveTextContent('2')
      })

      // Then delete the conversation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      } as Response)

      await act(async () => {
        await user.click(screen.getByText('Delete Conversation'))
      })

      await waitFor(() => {
        expect(screen.getByTestId('current-conversation')).toHaveTextContent('none')
        expect(screen.getByTestId('messages-count')).toHaveTextContent('0')
      })
    })
  })

  describe('Message Management', () => {
    beforeEach(async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ conversations: mockConversations }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ messages: mockMessages }),
        } as Response)
    })

    it('sends a message and updates the conversation', async () => {
      const user = userEvent.setup()
      const newMessage = {
        id: 'msg-3',
        content: 'Test message',
        role: 'user' as const,
        conversation_id: 'conv-1',
        user_id: 'user-1',
        created_at: '2024-01-01T00:02:00Z',
        updated_at: '2024-01-01T00:02:00Z',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: newMessage }),
      } as Response)

      render(
        <ConversationsProvider>
          <TestComponent />
        </ConversationsProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
      })

      // Set current conversation first
      await act(async () => {
        await user.click(screen.getByText('Set Current Conversation'))
      })

      await waitFor(() => {
        expect(screen.getByTestId('messages-count')).toHaveTextContent('2')
      })

      // Send message
      await act(async () => {
        await user.click(screen.getByText('Send Message'))
      })

      await waitFor(() => {
        expect(screen.getByTestId('messages-count')).toHaveTextContent('3')
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/conversations/conv-1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: 'Test message',
          role: 'user',
          conversation_id: 'conv-1',
        }),
      })
    })

    it('handles message sending errors', async () => {
      const user = userEvent.setup()

      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      render(
        <ConversationsProvider>
          <TestComponent />
        </ConversationsProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
      })

      await act(async () => {
        await user.click(screen.getByText('Set Current Conversation'))
      })

      await act(async () => {
        await user.click(screen.getByText('Send Message'))
      })

      await waitFor(() => {
        expect(screen.getByTestId('error')).not.toHaveTextContent('no-error')
      })
    })
  })

  describe('Error Handling', () => {
    it('handles API errors gracefully', async () => {
      const user = userEvent.setup()

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ conversations: mockConversations }),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
        } as Response)

      render(
        <ConversationsProvider>
          <TestComponent />
        </ConversationsProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
      })

      await act(async () => {
        await user.click(screen.getByText('Create Conversation'))
      })

      await waitFor(() => {
        expect(screen.getByTestId('error')).not.toHaveTextContent('no-error')
      })
    })

    it('handles network errors', async () => {
      const user = userEvent.setup()

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ conversations: mockConversations }),
        } as Response)
        .mockRejectedValueOnce(new Error('Network error'))

      render(
        <ConversationsProvider>
          <TestComponent />
        </ConversationsProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
      })

      await act(async () => {
        await user.click(screen.getByText('Update Conversation'))
      })

      await waitFor(() => {
        expect(screen.getByTestId('error')).not.toHaveTextContent('no-error')
      })
    })
  })

  describe('Real-time Updates', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ conversations: mockConversations }),
      } as Response)
    })

    it('updates conversation list when new conversation is created', async () => {
      const user = userEvent.setup()
      const newConversation = {
        id: 'conv-3',
        title: 'New Conversation',
        project_id: 'project-1',
        user_id: 'user-1',
        created_at: '2024-01-03T00:00:00Z',
        updated_at: '2024-01-03T00:00:00Z',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ conversation: newConversation }),
      } as Response)

      render(
        <ConversationsProvider>
          <TestComponent />
        </ConversationsProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('conversations-count')).toHaveTextContent('2')
      })

      await act(async () => {
        await user.click(screen.getByText('Create Conversation'))
      })

      await waitFor(() => {
        expect(screen.getByTestId('conversations-count')).toHaveTextContent('3')
        expect(screen.getByTestId('conversation-conv-3')).toHaveTextContent('New Conversation')
      })
    })
  })
})
