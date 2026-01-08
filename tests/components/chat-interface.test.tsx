import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider } from '@/lib/auth/context'
import ChatInterface from '@/components/chat/ChatInterface'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}))

// Mock fetch for API calls
global.fetch = jest.fn()

const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
}

const MockAuthProvider = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="mock-auth-provider">{children}</div>
)

describe('ChatInterface', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ message: 'Test response' }),
    })
  })

  it('renders chat interface correctly', () => {
    render(
      <MockAuthProvider>
        <ChatInterface />
      </MockAuthProvider>
    )

    expect(screen.getByPlaceholderText(/type your message/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument()
  })

  it('sends message when form is submitted', async () => {
    const user = userEvent.setup()

    render(
      <MockAuthProvider>
        <ChatInterface />
      </MockAuthProvider>
    )

    const input = screen.getByPlaceholderText(/type your message/i)
    const sendButton = screen.getByRole('button', { name: /send/i })

    await user.type(input, 'Hello, AI!')
    await user.click(sendButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hello, AI!' }],
        }),
      })
    })
  })

  it('displays messages in chat history', async () => {
    const user = userEvent.setup()

    render(
      <MockAuthProvider>
        <ChatInterface />
      </MockAuthProvider>
    )

    const input = screen.getByPlaceholderText(/type your message/i)
    await user.type(input, 'Test message')
    await user.click(screen.getByRole('button', { name: /send/i }))

    await waitFor(() => {
      expect(screen.getByText('Test message')).toBeInTheDocument()
    })
  })

  it('handles API errors gracefully', async () => {
    const user = userEvent.setup()
    ;(global.fetch as jest.Mock).mockRejectedValue(new Error('API Error'))

    render(
      <MockAuthProvider>
        <ChatInterface />
      </MockAuthProvider>
    )

    const input = screen.getByPlaceholderText(/type your message/i)
    await user.type(input, 'Test message')
    await user.click(screen.getByRole('button', { name: /send/i }))

    await waitFor(() => {
      expect(screen.getByText(/error occurred/i)).toBeInTheDocument()
    })
  })

  it('disables send button when input is empty', () => {
    render(
      <MockAuthProvider>
        <ChatInterface />
      </MockAuthProvider>
    )

    const sendButton = screen.getByRole('button', { name: /send/i })
    expect(sendButton).toBeDisabled()
  })

  it('enables send button when input has content', async () => {
    const user = userEvent.setup()

    render(
      <MockAuthProvider>
        <ChatInterface />
      </MockAuthProvider>
    )

    const input = screen.getByPlaceholderText(/type your message/i)
    const sendButton = screen.getByRole('button', { name: /send/i })

    await user.type(input, 'Test')
    expect(sendButton).toBeEnabled()
  })

  it('shows loading state during API call', async () => {
    const user = userEvent.setup()
    let resolvePromise: (value: any) => void
    ;(global.fetch as jest.Mock).mockReturnValue(
      new Promise(resolve => {
        resolvePromise = resolve
      })
    )

    render(
      <MockAuthProvider>
        <ChatInterface />
      </MockAuthProvider>
    )

    const input = screen.getByPlaceholderText(/type your message/i)
    await user.type(input, 'Test message')
    await user.click(screen.getByRole('button', { name: /send/i }))

    expect(screen.getByText(/sending/i)).toBeInTheDocument()

    // Resolve the promise
    resolvePromise!({
      ok: true,
      json: () => Promise.resolve({ message: 'Response' }),
    })

    await waitFor(() => {
      expect(screen.queryByText(/sending/i)).not.toBeInTheDocument()
    })
  })

  it('handles keyboard shortcuts', async () => {
    const user = userEvent.setup()

    render(
      <MockAuthProvider>
        <ChatInterface />
      </MockAuthProvider>
    )

    const input = screen.getByPlaceholderText(/type your message/i)
    await user.type(input, 'Test message')

    // Test Enter key to send
    await user.keyboard('{Enter}')

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
    })
  })
})
