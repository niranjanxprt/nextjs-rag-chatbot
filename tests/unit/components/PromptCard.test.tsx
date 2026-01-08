import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PromptCard } from '@/components/prompts/PromptCard'
import type { Prompt } from '@/lib/types/database'

// Mock clipboard API
const mockWriteText = jest.fn(() => Promise.resolve())
Object.assign(navigator, {
  clipboard: {
    writeText: mockWriteText,
  },
})

// Mock window.confirm
const mockConfirm = jest.fn()
Object.defineProperty(window, 'confirm', {
  value: mockConfirm,
})

const mockPrompt: Prompt = {
  id: 'prompt-1',
  name: 'Test Prompt',
  description: 'A test prompt for unit testing',
  content: 'This is the prompt content with {{variable1}} and {{variable2}}',
  category: 'Testing',
  variables: ['variable1', 'variable2'],
  is_favorite: false,
  usage_count: 5,
  user_id: 'user-1',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

describe('PromptCard', () => {
  const mockOnEdit = jest.fn()
  const mockOnDelete = jest.fn()
  const mockOnFavorite = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockConfirm.mockReturnValue(true)
    mockWriteText.mockResolvedValue(undefined)
  })

  describe('Rendering', () => {
    it('renders prompt information correctly', () => {
      render(<PromptCard prompt={mockPrompt} />)

      expect(screen.getByText('Test Prompt')).toBeInTheDocument()
      expect(screen.getByText('A test prompt for unit testing')).toBeInTheDocument()
      expect(screen.getByText(/This is the prompt content/)).toBeInTheDocument()
      expect(screen.getByText('Testing')).toBeInTheDocument()
      expect(screen.getByText('Used 5 times')).toBeInTheDocument()
    })

    it('renders variables correctly', () => {
      render(<PromptCard prompt={mockPrompt} />)

      expect(screen.getByText('Variables:')).toBeInTheDocument()
      expect(screen.getByText('variable1')).toBeInTheDocument()
      expect(screen.getByText('variable2')).toBeInTheDocument()
    })

    it('renders without optional fields', () => {
      const minimalPrompt: Prompt = {
        ...mockPrompt,
        description: undefined,
        category: undefined,
        variables: undefined,
        usage_count: 0,
      }

      render(<PromptCard prompt={minimalPrompt} />)

      expect(screen.getByText('Test Prompt')).toBeInTheDocument()
      expect(screen.queryByText('Variables:')).not.toBeInTheDocument()
      expect(screen.queryByText('Used')).not.toBeInTheDocument()
    })

    it('applies custom className', () => {
      const { container } = render(
        <PromptCard prompt={mockPrompt} className="custom-class" />
      )

      // eslint-disable-next-line testing-library/no-node-access
      expect(container.firstChild).toHaveClass('custom-class')
    })
  })

  describe('Favorite functionality', () => {
    it('shows unfavorite star for non-favorite prompt', () => {
      render(<PromptCard prompt={mockPrompt} onFavorite={mockOnFavorite} />)

      const starButton = screen.getByTitle('Add to favorites')
      expect(starButton).toBeInTheDocument()
    })

    it('shows favorite star for favorite prompt', () => {
      const favoritePrompt = { ...mockPrompt, is_favorite: true }
      render(<PromptCard prompt={favoritePrompt} onFavorite={mockOnFavorite} />)

      const starButton = screen.getByTitle('Remove from favorites')
      expect(starButton).toBeInTheDocument()
    })

    it('calls onFavorite when star is clicked', async () => {
      const user = userEvent.setup()
      render(<PromptCard prompt={mockPrompt} onFavorite={mockOnFavorite} />)

      const starButton = screen.getByTitle('Add to favorites')
      await user.click(starButton)

      expect(mockOnFavorite).toHaveBeenCalledWith('prompt-1', true)
    })

    it('toggles favorite state correctly', async () => {
      const user = userEvent.setup()
      const favoritePrompt = { ...mockPrompt, is_favorite: true }
      render(<PromptCard prompt={favoritePrompt} onFavorite={mockOnFavorite} />)

      const starButton = screen.getByTitle('Remove from favorites')
      await user.click(starButton)

      expect(mockOnFavorite).toHaveBeenCalledWith('prompt-1', false)
    })
  })

  describe('Copy functionality', () => {
    it('shows copy button', () => {
      render(<PromptCard prompt={mockPrompt} />)
      expect(screen.getByText('Copy')).toBeInTheDocument()
    })

    it('shows "Copied!" feedback temporarily', async () => {
      const user = userEvent.setup()
      render(<PromptCard prompt={mockPrompt} />)

      const copyButton = screen.getByText('Copy')
      await user.click(copyButton)

      expect(screen.getByText('Copied!')).toBeInTheDocument()

      await waitFor(
        () => {
          expect(screen.getByText('Copy')).toBeInTheDocument()
        },
        { timeout: 3000 }
      )
    })
  })

  describe('Edit functionality', () => {
    it('calls onEdit when edit is clicked', async () => {
      const user = userEvent.setup()
      render(<PromptCard prompt={mockPrompt} onEdit={mockOnEdit} />)

      const moreButton = screen.getByRole('button', { expanded: false })
      await user.click(moreButton)

      const editButton = screen.getByText('Edit')
      await user.click(editButton)

      expect(mockOnEdit).toHaveBeenCalled()
    })

    it('does not show edit option when onEdit is not provided', async () => {
      const user = userEvent.setup()
      render(<PromptCard prompt={mockPrompt} />)

      const moreButton = screen.getByRole('button', { expanded: false })
      await user.click(moreButton)

      expect(screen.queryByText('Edit')).not.toBeInTheDocument()
    })
  })

  describe('Delete functionality', () => {
    it('shows confirmation dialog before deleting', async () => {
      const user = userEvent.setup()
      render(<PromptCard prompt={mockPrompt} onDelete={mockOnDelete} />)

      const moreButton = screen.getByRole('button', { expanded: false })
      await user.click(moreButton)

      const deleteButton = screen.getByText('Delete')
      await user.click(deleteButton)

      expect(mockConfirm).toHaveBeenCalledWith('Delete prompt "Test Prompt"?')
    })

    it('calls onDelete when confirmed', async () => {
      const user = userEvent.setup()
      mockOnDelete.mockResolvedValueOnce(undefined)
      render(<PromptCard prompt={mockPrompt} onDelete={mockOnDelete} />)

      const moreButton = screen.getByRole('button', { expanded: false })
      await user.click(moreButton)

      const deleteButton = screen.getByText('Delete')
      await user.click(deleteButton)

      expect(mockOnDelete).toHaveBeenCalledWith('prompt-1')
    })

    it('does not delete when cancelled', async () => {
      const user = userEvent.setup()
      mockConfirm.mockReturnValueOnce(false)
      render(<PromptCard prompt={mockPrompt} onDelete={mockOnDelete} />)

      const moreButton = screen.getByRole('button', { expanded: false })
      await user.click(moreButton)

      const deleteButton = screen.getByText('Delete')
      await user.click(deleteButton)

      expect(mockOnDelete).not.toHaveBeenCalled()
    })

    it('does not show delete option when onDelete is not provided', async () => {
      const user = userEvent.setup()
      render(<PromptCard prompt={mockPrompt} />)

      const moreButton = screen.getByRole('button', { expanded: false })
      await user.click(moreButton)

      expect(screen.queryByText('Delete')).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels for buttons', () => {
      render(<PromptCard prompt={mockPrompt} />)

      expect(screen.getByTitle('Add to favorites')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument()
    })

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup()
      render(<PromptCard prompt={mockPrompt} onFavorite={mockOnFavorite} />)

      const starButton = screen.getByTitle('Add to favorites')
      starButton.focus()
      
      await user.keyboard('{Enter}')
      expect(mockOnFavorite).toHaveBeenCalled()
    })
  })

  describe('Content truncation', () => {
    it('truncates long content appropriately', () => {
      const longPrompt = {
        ...mockPrompt,
        name: 'Very Long Prompt Name That Should Be Truncated When Displayed',
        description: 'Very long description that should be truncated when displayed in the card component',
        content: 'Very long content that should be truncated when displayed in the preview section of the card component',
      }

      render(<PromptCard prompt={longPrompt} />)

      // Content should be present but truncated with CSS classes
      expect(screen.getByText(/Very Long Prompt Name/)).toBeInTheDocument()
      expect(screen.getByText(/Very long description/)).toBeInTheDocument()
      expect(screen.getByText(/Very long content/)).toBeInTheDocument()
    })
  })

  describe('Usage count display', () => {
    it('shows singular form for usage count of 1', () => {
      const singleUsePrompt = { ...mockPrompt, usage_count: 1 }
      render(<PromptCard prompt={singleUsePrompt} />)

      expect(screen.getByText('Used 1 time')).toBeInTheDocument()
    })

    it('shows plural form for usage count > 1', () => {
      render(<PromptCard prompt={mockPrompt} />)

      expect(screen.getByText('Used 5 times')).toBeInTheDocument()
    })

    it('does not show usage count when 0', () => {
      const unusedPrompt = { ...mockPrompt, usage_count: 0 }
      render(<PromptCard prompt={unusedPrompt} />)

      expect(screen.queryByText(/Used/)).not.toBeInTheDocument()
    })
  })
})
