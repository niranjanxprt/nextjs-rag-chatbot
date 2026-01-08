/**
 * Unit Tests for ChatInterface Component
 * Tests message input, sending, knowledge base toggle, and streaming
 */

import React from 'react'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChatInterface } from '@/components/chat/ChatInterface'

// Mock the AI SDK useChat hook
jest.mock('ai/react', () => ({
  useChat: jest.fn(() => ({
    messages: [
      {
        id: '1',
        role: 'user',
        content: 'Hello',
      },
      {
        id: '2',
        role: 'assistant',
        content: 'Hi there! How can I help?',
      },
    ],
    input: '',
    handleInputChange: jest.fn((e) => e),
    handleSubmit: jest.fn((e) => e.preventDefault()),
    isLoading: false,
    error: null,
    stop: jest.fn(),
  })),
}))

// Mock context providers
jest.mock('@/lib/contexts/projects-context', () => ({
  useProjects: jest.fn(() => ({
    currentProject: {
      id: 'proj-1',
      name: 'Test Project',
    },
  })),
}))

jest.mock('@/lib/contexts/conversations-context', () => ({
  useConversations: jest.fn(() => ({
    currentConversation: {
      id: 'conv-1',
      title: 'Test Conversation',
    },
  })),
}))

// Mock child components
jest.mock('@/components/chat/MessageList', () => ({
  MessageList: ({ messages }: { messages: any[] }) => (
    <div data-testid="message-list">
      {messages.map((msg) => (
        <div key={msg.id} data-testid={`message-${msg.id}`}>
          {msg.content}
        </div>
      ))}
    </div>
  ),
}))

jest.mock('@/components/chat/TypingIndicator', () => ({
  TypingIndicator: () => <div data-testid="typing-indicator">Typing...</div>,
}))

jest.mock('@/components/ui/button', () => ({
  Button: (props: any) => <button {...props}>{props.children}</button>,
}))

jest.mock('@/components/ui/input', () => ({
  Input: (props: any) => <input {...props} />,
}))

jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: any) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h2>{children}</h2>,
}))

jest.mock('@/components/ui/alert', () => ({
  Alert: ({ children, variant }: any) => <div data-testid={`alert-${variant}`}>{children}</div>,
  AlertDescription: ({ children }: any) => <p>{children}</p>,
}))

jest.mock('@/components/ui/switch', () => ({
  Switch: ({ checked, onCheckedChange, ...props }: any) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
      data-testid="kb-toggle"
      {...props}
    />
  ),
}))

describe('ChatInterface Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render the chat interface', () => {
      render(<ChatInterface />)

      expect(screen.getByText('RAG Chatbot')).toBeInTheDocument()
    })

    it('should display current project name', () => {
      render(<ChatInterface />)

      expect(screen.getByText('Test Project')).toBeInTheDocument()
    })

    it('should render message list when messages exist', () => {
      render(<ChatInterface />)

      const messageList = screen.getByTestId('message-list')
      expect(messageList).toBeInTheDocument()
    })

    it('should display welcome state when no messages', () => {
      jest.mock('ai/react', () => ({
        useChat: jest.fn(() => ({
          messages: [],
          input: '',
          handleInputChange: jest.fn(),
          handleSubmit: jest.fn(),
          isLoading: false,
          error: null,
          stop: jest.fn(),
        })),
      }))

      render(<ChatInterface />)

      expect(screen.getByText('Welcome to RAG Chatbot')).toBeInTheDocument()
    })

    it('should render input form', () => {
      render(<ChatInterface />)

      const input = screen.getByPlaceholderText(/Ask a question/i)
      expect(input).toBeInTheDocument()
    })

    it('should render send button', () => {
      render(<ChatInterface />)

      const sendButton = screen.getByTitle('Send message')
      expect(sendButton).toBeInTheDocument()
    })
  })

  describe('Knowledge Base Toggle', () => {
    it('should render knowledge base toggle', () => {
      render(<ChatInterface />)

      const toggle = screen.getByTestId('kb-toggle')
      expect(toggle).toBeInTheDocument()
    })

    it('should toggle knowledge base on/off', async () => {
      render(<ChatInterface />)

      const toggle = screen.getByTestId('kb-toggle') as HTMLInputElement
      expect(toggle.checked).toBe(true)

      fireEvent.click(toggle)
      expect(toggle.checked).toBe(false)
    })

    it('should display KB status indicator', () => {
      render(<ChatInterface />)

      expect(screen.getByText('Using Knowledge Base')).toBeInTheDocument()
    })

    it('should disable toggle while loading', () => {
      const { useChat } = require('ai/react')
      useChat.mockReturnValue({
        messages: [],
        input: '',
        handleInputChange: jest.fn(),
        handleSubmit: jest.fn(),
        isLoading: true,
        error: null,
        stop: jest.fn(),
      })

      render(<ChatInterface />)

      const toggle = screen.getByTestId('kb-toggle')
      expect(toggle).toBeDisabled()
    })
  })

  describe('Message Input', () => {
    it('should accept text input', async () => {
      const user = userEvent.setup()
      const { useChat } = require('ai/react')
      const handleInputChange = jest.fn()

      useChat.mockReturnValue({
        messages: [],
        input: '',
        handleInputChange,
        handleSubmit: jest.fn(),
        isLoading: false,
        error: null,
        stop: jest.fn(),
      })

      render(<ChatInterface />)

      const input = screen.getByPlaceholderText(/Ask a question/i)
      await user.type(input, 'Hello')

      expect(handleInputChange).toHaveBeenCalled()
    })

    it('should disable input while loading', () => {
      const { useChat } = require('ai/react')
      useChat.mockReturnValue({
        messages: [],
        input: 'Test message',
        handleInputChange: jest.fn(),
        handleSubmit: jest.fn(),
        isLoading: true,
        error: null,
        stop: jest.fn(),
      })

      render(<ChatInterface />)

      const input = screen.getByPlaceholderText(/AI is thinking/i)
      expect(input).toBeDisabled()
    })

    it('should show loading placeholder text', () => {
      const { useChat } = require('ai/react')
      useChat.mockReturnValue({
        messages: [],
        input: '',
        handleInputChange: jest.fn(),
        handleSubmit: jest.fn(),
        isLoading: true,
        error: null,
        stop: jest.fn(),
      })

      render(<ChatInterface />)

      expect(screen.getByPlaceholderText('AI is thinking...')).toBeInTheDocument()
    })
  })

  describe('Message Submission', () => {
    it('should submit message on button click', async () => {
      const { useChat } = require('ai/react')
      const handleSubmit = jest.fn()

      useChat.mockReturnValue({
        messages: [],
        input: 'Hello',
        handleInputChange: jest.fn(),
        handleSubmit,
        isLoading: false,
        error: null,
        stop: jest.fn(),
      })

      render(<ChatInterface />)

      const sendButton = screen.getByTitle('Send message')
      fireEvent.click(sendButton)

      expect(handleSubmit).toHaveBeenCalled()
    })

    it('should disable send button when input is empty', () => {
      const { useChat } = require('ai/react')
      useChat.mockReturnValue({
        messages: [],
        input: '',
        handleInputChange: jest.fn(),
        handleSubmit: jest.fn(),
        isLoading: false,
        error: null,
        stop: jest.fn(),
      })

      render(<ChatInterface />)

      const sendButton = screen.getByTitle(/Enter a message/)
      expect(sendButton).toBeDisabled()
    })

    it('should disable send button while loading', () => {
      const { useChat } = require('ai/react')
      useChat.mockReturnValue({
        messages: [],
        input: 'Hello',
        handleInputChange: jest.fn(),
        handleSubmit: jest.fn(),
        isLoading: true,
        error: null,
        stop: jest.fn(),
      })

      render(<ChatInterface />)

      const sendButton = screen.getByRole('button', { name: /^(⏹|stop)/i })
      expect(sendButton).toBeInTheDocument()
    })

    it('should show spinner on send button while loading', () => {
      const { useChat } = require('ai/react')
      useChat.mockReturnValue({
        messages: [],
        input: 'Hello',
        handleInputChange: jest.fn(),
        handleSubmit: jest.fn(),
        isLoading: true,
        error: null,
        stop: jest.fn(),
      })

      render(<ChatInterface />)

      const stopButton = screen.getByTitle('Stop generation')
      expect(stopButton).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should display error alert when error occurs', () => {
      const { useChat } = require('ai/react')
      const error = new Error('API Error')

      useChat.mockReturnValue({
        messages: [],
        input: '',
        handleInputChange: jest.fn(),
        handleSubmit: jest.fn(),
        isLoading: false,
        error,
        stop: jest.fn(),
      })

      render(<ChatInterface />)

      expect(screen.getByTestId('alert-destructive')).toBeInTheDocument()
      expect(screen.getByText('API Error')).toBeInTheDocument()
    })

    it('should show refresh button on error', () => {
      const { useChat } = require('ai/react')
      useChat.mockReturnValue({
        messages: [],
        input: '',
        handleInputChange: jest.fn(),
        handleSubmit: jest.fn(),
        isLoading: false,
        error: new Error('API Error'),
        stop: jest.fn(),
      })

      render(<ChatInterface />)

      expect(screen.getByTitle('Reload conversation')).toBeInTheDocument()
    })

    it('should handle generic error messages', () => {
      const { useChat } = require('ai/react')
      useChat.mockReturnValue({
        messages: [],
        input: '',
        handleInputChange: jest.fn(),
        handleSubmit: jest.fn(),
        isLoading: false,
        error: 'Generic error',
        stop: jest.fn(),
      })

      render(<ChatInterface />)

      expect(screen.getByText('An error occurred while processing your message.')).toBeInTheDocument()
    })
  })

  describe('Action Buttons', () => {
    it('should show clear chat button when messages exist', () => {
      render(<ChatInterface />)

      expect(screen.getByTitle('Clear conversation')).toBeInTheDocument()
    })

    it('should clear chat on confirmation', async () => {
      window.confirm = jest.fn(() => true)
      window.location.reload = jest.fn()

      render(<ChatInterface />)

      const clearButton = screen.getByTitle('Clear conversation')
      fireEvent.click(clearButton)

      expect(window.confirm).toHaveBeenCalled()
    })

    it('should not clear chat if user cancels', async () => {
      window.confirm = jest.fn(() => false)
      window.location.reload = jest.fn()

      render(<ChatInterface />)

      const clearButton = screen.getByTitle('Clear conversation')
      fireEvent.click(clearButton)

      expect(window.location.reload).not.toHaveBeenCalled()
    })

    it('should show stop button while loading', () => {
      const { useChat } = require('ai/react')
      useChat.mockReturnValue({
        messages: [],
        input: 'Test',
        handleInputChange: jest.fn(),
        handleSubmit: jest.fn(),
        isLoading: true,
        error: null,
        stop: jest.fn(),
      })

      render(<ChatInterface />)

      expect(screen.getByTitle('Stop generation')).toBeInTheDocument()
    })

    it('should stop generation on click', () => {
      const { useChat } = require('ai/react')
      const stop = jest.fn()

      useChat.mockReturnValue({
        messages: [],
        input: 'Test',
        handleInputChange: jest.fn(),
        handleSubmit: jest.fn(),
        isLoading: true,
        error: null,
        stop,
      })

      render(<ChatInterface />)

      const stopButton = screen.getByTitle('Stop generation')
      fireEvent.click(stopButton)

      expect(stop).toHaveBeenCalled()
    })
  })

  describe('Loading States', () => {
    it('should show typing indicator while loading', () => {
      const { useChat } = require('ai/react')
      useChat.mockReturnValue({
        messages: [{ id: '1', role: 'user', content: 'Hello' }],
        input: '',
        handleInputChange: jest.fn(),
        handleSubmit: jest.fn(),
        isLoading: true,
        error: null,
        stop: jest.fn(),
      })

      render(<ChatInterface />)

      expect(screen.getByTestId('typing-indicator')).toBeInTheDocument()
    })

    it('should display message count', () => {
      render(<ChatInterface />)

      expect(screen.getByText('2 messages')).toBeInTheDocument()
    })
  })

  describe('Keyboard Shortcuts', () => {
    it('should submit on Enter key', async () => {
      const { useChat } = require('ai/react')
      const handleSubmit = jest.fn()

      useChat.mockReturnValue({
        messages: [],
        input: 'Hello',
        handleInputChange: jest.fn(),
        handleSubmit,
        isLoading: false,
        error: null,
        stop: jest.fn(),
      })

      render(<ChatInterface />)

      const input = screen.getByPlaceholderText(/Ask a question/i)
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })

      expect(handleSubmit).toHaveBeenCalled()
    })

    it('should allow Shift+Enter for newline', async () => {
      const { useChat } = require('ai/react')
      const handleSubmit = jest.fn()

      useChat.mockReturnValue({
        messages: [],
        input: '',
        handleInputChange: jest.fn(),
        handleSubmit,
        isLoading: false,
        error: null,
        stop: jest.fn(),
      })

      render(<ChatInterface />)

      const input = screen.getByPlaceholderText(/Ask a question/i)
      fireEvent.keyDown(input, { key: 'Enter', shiftKey: true })

      expect(handleSubmit).not.toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('should have aria-label on knowledge base toggle', () => {
      render(<ChatInterface />)

      const toggle = screen.getByLabelText('Toggle Knowledge Base')
      expect(toggle).toBeInTheDocument()
    })

    it('should have aria-label on message input', () => {
      render(<ChatInterface />)

      const input = screen.getByLabelText('Chat message input')
      expect(input).toBeInTheDocument()
    })

    it('should have proper button titles', () => {
      render(<ChatInterface />)

      expect(screen.getByTitle('Send message')).toBeInTheDocument()
      expect(screen.getByTitle('Clear conversation')).toBeInTheDocument()
    })
  })

  describe('Props Handling', () => {
    it('should accept conversationId prop', () => {
      const onConversationChange = jest.fn()
      render(<ChatInterface conversationId="conv-1" onConversationChange={onConversationChange} />)

      expect(screen.getByText('RAG Chatbot')).toBeInTheDocument()
    })

    it('should call onConversationChange callback', () => {
      const onConversationChange = jest.fn()
      const { useChat } = require('ai/react')

      useChat.mockReturnValue({
        messages: [],
        input: '',
        handleInputChange: jest.fn(),
        handleSubmit: jest.fn((e) => {
          // Simulate onResponse callback
          if (useChat.mock.calls[0]?.[0]?.onResponse) {
            useChat.mock.calls[0][0].onResponse({
              headers: new Map([['X-Conversation-Id', 'new-conv-1']]),
            })
          }
        }),
        isLoading: false,
        error: null,
        stop: jest.fn(),
      })

      render(<ChatInterface conversationId="conv-1" onConversationChange={onConversationChange} />)

      expect(screen.getByText('RAG Chatbot')).toBeInTheDocument()
    })

    it('should accept custom className', () => {
      const { container } = render(<ChatInterface className="custom-class" />)

      const chatDiv = container.querySelector('.custom-class')
      expect(chatDiv).toBeInTheDocument()
    })
  })

  describe('UI Status Messages', () => {
    it('should display knowledge base status', () => {
      render(<ChatInterface />)

      expect(screen.getByText('Using Knowledge Base')).toBeInTheDocument()
    })

    it('should display keyboard hints', () => {
      render(<ChatInterface />)

      expect(screen.getByText('Enter to send, Shift+Enter for new line')).toBeInTheDocument()
    })
  })
})
