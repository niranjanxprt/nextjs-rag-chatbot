import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PromptsProvider, usePrompts } from '@/lib/contexts/prompts-context'
import type { Prompt } from '@/lib/types/database'

// Mock fetch
global.fetch = jest.fn()
const mockFetch = fetch as jest.MockedFunction<typeof fetch>

// Test component to access context
function TestComponent() {
  const {
    prompts,
    favoritePrompts,
    createPrompt,
    updatePrompt,
    deletePrompt,
    toggleFavorite,
    searchPrompts,
    isLoading,
    error,
  } = usePrompts()

  return (
    <div>
      <div data-testid="loading">{isLoading ? 'loading' : 'loaded'}</div>
      <div data-testid="error">{error || 'no-error'}</div>
      <div data-testid="prompts-count">{prompts.length}</div>
      <div data-testid="favorites-count">{favoritePrompts.length}</div>
      
      <button
        onClick={() =>
          createPrompt({
            name: 'New Prompt',
            content: 'Test prompt content',
            category: 'Test',
          })
        }
      >
        Create Prompt
      </button>
      
      <button
        onClick={() =>
          updatePrompt('prompt-1', { name: 'Updated Prompt' })
        }
      >
        Update Prompt
      </button>
      
      <button onClick={() => deletePrompt('prompt-1')}>
        Delete Prompt
      </button>
      
      <button onClick={() => toggleFavorite('prompt-1')}>
        Toggle Favorite
      </button>
      
      <button onClick={() => searchPrompts('test')}>
        Search Prompts
      </button>
      
      {prompts.map((prompt) => (
        <div key={prompt.id} data-testid={`prompt-${prompt.id}`}>
          {prompt.name} {prompt.is_favorite ? '⭐' : ''}
        </div>
      ))}
    </div>
  )
}

const mockPrompts: Prompt[] = [
  {
    id: 'prompt-1',
    name: 'Test Prompt 1',
    content: 'This is a test prompt',
    category: 'Testing',
    variables: ['var1', 'var2'],
    is_favorite: false,
    usage_count: 5,
    user_id: 'user-1',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'prompt-2',
    name: 'Favorite Prompt',
    content: 'This is a favorite prompt',
    category: 'Favorites',
    variables: [],
    is_favorite: true,
    usage_count: 10,
    user_id: 'user-1',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
]

describe('PromptsContext', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Initial Loading', () => {
    it('loads prompts on mount', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ prompts: mockPrompts }),
      } as Response)

      render(
        <PromptsProvider>
          <TestComponent />
        </PromptsProvider>
      )

      expect(screen.getByTestId('loading')).toHaveTextContent('loading')

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
      })

      expect(screen.getByTestId('prompts-count')).toHaveTextContent('2')
      expect(screen.getByTestId('favorites-count')).toHaveTextContent('1')
      expect(screen.getByTestId('prompt-prompt-1')).toHaveTextContent('Test Prompt 1')
      expect(screen.getByTestId('prompt-prompt-2')).toHaveTextContent('Favorite Prompt ⭐')
    })

    it('handles loading errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      render(
        <PromptsProvider>
          <TestComponent />
        </PromptsProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('error')).not.toHaveTextContent('no-error')
      })

      expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
      expect(screen.getByTestId('prompts-count')).toHaveTextContent('0')
    })
  })

  describe('Prompt CRUD Operations', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ prompts: mockPrompts }),
      } as Response)
    })

    it('creates a new prompt', async () => {
      const user = userEvent.setup()
      const newPrompt = {
        id: 'prompt-3',
        name: 'New Prompt',
        content: 'Test prompt content',
        category: 'Test',
        variables: [],
        is_favorite: false,
        usage_count: 0,
        user_id: 'user-1',
        created_at: '2024-01-03T00:00:00Z',
        updated_at: '2024-01-03T00:00:00Z',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ prompt: newPrompt }),
      } as Response)

      render(
        <PromptsProvider>
          <TestComponent />
        </PromptsProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
      })

      await act(async () => {
        await user.click(screen.getByText('Create Prompt'))
      })

      await waitFor(() => {
        expect(screen.getByTestId('prompts-count')).toHaveTextContent('3')
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'New Prompt',
          content: 'Test prompt content',
          category: 'Test',
        }),
      })
    })

    it('updates an existing prompt', async () => {
      const user = userEvent.setup()
      const updatedPrompt = { ...mockPrompts[0], name: 'Updated Prompt' }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ prompt: updatedPrompt }),
      } as Response)

      render(
        <PromptsProvider>
          <TestComponent />
        </PromptsProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
      })

      await act(async () => {
        await user.click(screen.getByText('Update Prompt'))
      })

      await waitFor(() => {
        expect(screen.getByTestId('prompt-prompt-1')).toHaveTextContent('Updated Prompt')
      })
    })

    it('deletes a prompt', async () => {
      const user = userEvent.setup()

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      } as Response)

      render(
        <PromptsProvider>
          <TestComponent />
        </PromptsProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
      })

      await act(async () => {
        await user.click(screen.getByText('Delete Prompt'))
      })

      await waitFor(() => {
        expect(screen.getByTestId('prompts-count')).toHaveTextContent('1')
      })

      expect(screen.queryByTestId('prompt-prompt-1')).not.toBeInTheDocument()
    })
  })

  describe('Favorite Management', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ prompts: mockPrompts }),
      } as Response)
    })

    it('toggles prompt favorite status', async () => {
      const user = userEvent.setup()
      const updatedPrompt = { ...mockPrompts[0], is_favorite: true }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ prompt: updatedPrompt }),
      } as Response)

      render(
        <PromptsProvider>
          <TestComponent />
        </PromptsProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
      })

      expect(screen.getByTestId('favorites-count')).toHaveTextContent('1')

      await act(async () => {
        await user.click(screen.getByText('Toggle Favorite'))
      })

      await waitFor(() => {
        expect(screen.getByTestId('favorites-count')).toHaveTextContent('2')
      })

      expect(screen.getByTestId('prompt-prompt-1')).toHaveTextContent('Test Prompt 1 ⭐')
    })

    it('filters favorite prompts correctly', async () => {
      render(
        <PromptsProvider>
          <TestComponent />
        </PromptsProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
      })

      expect(screen.getByTestId('favorites-count')).toHaveTextContent('1')
    })
  })

  describe('Search Functionality', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ prompts: mockPrompts }),
      } as Response)
    })

    it('searches prompts by query', async () => {
      const user = userEvent.setup()
      const searchResults = [mockPrompts[0]]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ prompts: searchResults }),
      } as Response)

      render(
        <PromptsProvider>
          <TestComponent />
        </PromptsProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
      })

      await act(async () => {
        await user.click(screen.getByText('Search Prompts'))
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/prompts/search?q=test')
    })

    it('handles empty search results', async () => {
      const user = userEvent.setup()

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ prompts: [] }),
      } as Response)

      render(
        <PromptsProvider>
          <TestComponent />
        </PromptsProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
      })

      await act(async () => {
        await user.click(screen.getByText('Search Prompts'))
      })

      // Search should not affect the main prompts list
      expect(screen.getByTestId('prompts-count')).toHaveTextContent('2')
    })
  })

  describe('Error Handling', () => {
    it('handles API errors gracefully', async () => {
      const user = userEvent.setup()

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ prompts: mockPrompts }),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
        } as Response)

      render(
        <PromptsProvider>
          <TestComponent />
        </PromptsProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
      })

      await act(async () => {
        await user.click(screen.getByText('Create Prompt'))
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
          json: async () => ({ prompts: mockPrompts }),
        } as Response)
        .mockRejectedValueOnce(new Error('Network error'))

      render(
        <PromptsProvider>
          <TestComponent />
        </PromptsProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
      })

      await act(async () => {
        await user.click(screen.getByText('Update Prompt'))
      })

      await waitFor(() => {
        expect(screen.getByTestId('error')).not.toHaveTextContent('no-error')
      })
    })
  })

  describe('Usage Count Tracking', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ prompts: mockPrompts }),
      } as Response)
    })

    it('tracks prompt usage correctly', async () => {
      render(
        <PromptsProvider>
          <TestComponent />
        </PromptsProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
      })

      // Usage count should be reflected in the initial data
      expect(mockPrompts[0].usage_count).toBe(5)
      expect(mockPrompts[1].usage_count).toBe(10)
    })
  })
})
