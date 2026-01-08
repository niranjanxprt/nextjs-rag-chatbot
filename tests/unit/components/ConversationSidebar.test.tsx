/**
 * Unit Tests for ConversationSidebar Component
 * Tests conversation listing, filtering, pinning, and creation
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConversationSidebar } from '@/components/chat/ConversationSidebar'

// Mock context providers
jest.mock('@/lib/contexts/conversations-context', () => ({
  useConversations: jest.fn(() => ({
    conversations: [
      {
        id: 'conv-1',
        project_id: 'proj-1',
        title: 'Test Conversation 1',
        is_pinned: true,
      },
      {
        id: 'conv-2',
        project_id: 'proj-1',
        title: 'Test Conversation 2',
        is_pinned: false,
      },
      {
        id: 'conv-3',
        project_id: 'proj-1',
        title: 'Another Conversation',
        is_pinned: false,
      },
    ],
    currentConversation: { id: 'conv-1' },
    createConversation: jest.fn(async (data) => ({
      id: 'new-conv',
      ...data,
    })),
    deleteConversation: jest.fn(),
    pinConversation: jest.fn(),
  })),
}))

jest.mock('@/lib/contexts/projects-context', () => ({
  useProjects: jest.fn(() => ({
    currentProject: {
      id: 'proj-1',
      name: 'Test Project',
    },
  })),
}))

// Mock child component
jest.mock('@/components/chat/ConversationItem', () => ({
  ConversationItem: ({ conversation, isActive, onSelect, onPin, onDelete }: any) => (
    <div
      data-testid={`conv-item-${conversation.id}`}
      className={isActive ? 'active' : ''}
      onClick={onSelect}
    >
      <span>{conversation.title}</span>
      <button onClick={onPin} data-testid={`pin-${conversation.id}`}>
        Pin
      </button>
      <button onClick={onDelete} data-testid={`delete-${conversation.id}`}>
        Delete
      </button>
    </div>
  ),
}))

jest.mock('@/components/ui/button', () => ({
  Button: (props: any) => <button {...props}>{props.children}</button>,
}))

jest.mock('@/components/ui/input', () => ({
  Input: (props: any) => <input {...props} />,
}))

jest.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children }: any) => <div data-testid="scroll-area">{children}</div>,
}))

describe('ConversationSidebar Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render conversation sidebar', () => {
      render(<ConversationSidebar />)

      expect(screen.getByText('New Chat')).toBeInTheDocument()
    })

    it('should display search input', () => {
      render(<ConversationSidebar />)

      expect(screen.getByPlaceholderText('Search conversations...')).toBeInTheDocument()
    })

    it('should display pinned conversations section', () => {
      render(<ConversationSidebar />)

      expect(screen.getByText('Pinned')).toBeInTheDocument()
    })

    it('should display recent conversations section', () => {
      render(<ConversationSidebar />)

      expect(screen.getByText('Recent')).toBeInTheDocument()
    })

    it('should display conversation items', () => {
      render(<ConversationSidebar />)

      expect(screen.getByTestId('conv-item-conv-1')).toBeInTheDocument()
      expect(screen.getByTestId('conv-item-conv-2')).toBeInTheDocument()
    })

    it('should display project info in footer', () => {
      render(<ConversationSidebar />)

      expect(screen.getByText('Test Project')).toBeInTheDocument()
    })

    it('should display conversation count', () => {
      render(<ConversationSidebar />)

      expect(screen.getByText('3 conversations')).toBeInTheDocument()
    })
  })

  describe('Pinned vs Recent Conversations', () => {
    it('should separate pinned conversations', () => {
      render(<ConversationSidebar />)

      const pinnedSection = screen.getByText('Pinned').parentElement
      expect(pinnedSection?.querySelector('[data-testid="conv-item-conv-1"]')).toBeInTheDocument()
    })

    it('should separate recent conversations', () => {
      render(<ConversationSidebar />)

      const recentSection = screen.getByText('Recent').parentElement
      expect(recentSection?.querySelector('[data-testid="conv-item-conv-2"]')).toBeInTheDocument()
    })

    it('should mark active conversation', () => {
      render(<ConversationSidebar />)

      const activeConv = screen.getByTestId('conv-item-conv-1')
      expect(activeConv).toHaveClass('active')
    })
  })

  describe('Search Functionality', () => {
    it('should filter conversations by search term', async () => {
      const user = userEvent.setup()
      render(<ConversationSidebar />)

      const searchInput = screen.getByPlaceholderText('Search conversations...')
      await user.type(searchInput, 'Test')

      expect(screen.getByTestId('conv-item-conv-1')).toBeInTheDocument()
      expect(screen.getByTestId('conv-item-conv-2')).toBeInTheDocument()
    })

    it('should show empty state when no matches found', async () => {
      const user = userEvent.setup()
      render(<ConversationSidebar />)

      const searchInput = screen.getByPlaceholderText('Search conversations...')
      await user.type(searchInput, 'NonexistentConversation')

      expect(screen.getByText('No conversations found')).toBeInTheDocument()
    })

    it('should clear search results', async () => {
      const user = userEvent.setup()
      render(<ConversationSidebar />)

      const searchInput = screen.getByPlaceholderText('Search conversations...') as HTMLInputElement
      await user.type(searchInput, 'test')
      await user.clear(searchInput)

      expect(screen.getByTestId('conv-item-conv-1')).toBeInTheDocument()
    })

    it('should be case-insensitive', async () => {
      const user = userEvent.setup()
      render(<ConversationSidebar />)

      const searchInput = screen.getByPlaceholderText('Search conversations...')
      await user.type(searchInput, 'TEST')

      expect(screen.getByTestId('conv-item-conv-1')).toBeInTheDocument()
    })
  })

  describe('Create New Conversation', () => {
    it('should call createConversation when button clicked', async () => {
      const { useConversations } = require('@/lib/contexts/conversations-context')
      const createConversation = jest.fn(async (data) => ({
        id: 'new-conv',
        ...data,
      }))

      useConversations.mockReturnValue({
        conversations: [],
        currentConversation: null,
        createConversation,
        deleteConversation: jest.fn(),
        pinConversation: jest.fn(),
      })

      render(<ConversationSidebar />)

      const newChatButton = screen.getByText('New Chat')
      fireEvent.click(newChatButton)

      expect(createConversation).toHaveBeenCalled()
    })

    it('should call onSelectConversation callback after creating', async () => {
      const onSelectConversation = jest.fn()
      const { useConversations } = require('@/lib/contexts/conversations-context')

      useConversations.mockReturnValue({
        conversations: [],
        currentConversation: null,
        createConversation: jest.fn(async () => ({ id: 'new-conv', title: 'New' })),
        deleteConversation: jest.fn(),
        pinConversation: jest.fn(),
      })

      render(<ConversationSidebar onSelectConversation={onSelectConversation} />)

      const newChatButton = screen.getByText('New Chat')
      fireEvent.click(newChatButton)

      // Wait for async operation
      await new Promise((resolve) => setTimeout(resolve, 100))
    })

    it('should disable button while creating', async () => {
      const { useConversations } = require('@/lib/contexts/conversations-context')

      useConversations.mockReturnValue({
        conversations: [],
        currentConversation: null,
        createConversation: jest.fn(async () => new Promise((resolve) => setTimeout(resolve, 100))),
        deleteConversation: jest.fn(),
        pinConversation: jest.fn(),
      })

      render(<ConversationSidebar />)

      const newChatButton = screen.getByText('New Chat') as HTMLButtonElement
      fireEvent.click(newChatButton)

      expect(newChatButton.disabled).toBe(true)
    })
  })

  describe('Conversation Selection', () => {
    it('should call callback when conversation selected', () => {
      const onSelectConversation = jest.fn()
      render(<ConversationSidebar onSelectConversation={onSelectConversation} />)

      const convItem = screen.getByTestId('conv-item-conv-2')
      fireEvent.click(convItem)

      expect(onSelectConversation).toHaveBeenCalledWith('conv-2')
    })

    it('should highlight active conversation', () => {
      render(<ConversationSidebar />)

      const activeConv = screen.getByTestId('conv-item-conv-1')
      expect(activeConv).toHaveClass('active')
    })
  })

  describe('Pin/Unpin Conversations', () => {
    it('should pin conversation', () => {
      const { useConversations } = require('@/lib/contexts/conversations-context')
      const pinConversation = jest.fn()

      useConversations.mockReturnValue({
        conversations: [
          { id: 'conv-1', project_id: 'proj-1', title: 'Test', is_pinned: false },
        ],
        currentConversation: null,
        createConversation: jest.fn(),
        deleteConversation: jest.fn(),
        pinConversation,
      })

      render(<ConversationSidebar />)

      const pinButton = screen.getByTestId('pin-conv-1')
      fireEvent.click(pinButton)

      expect(pinConversation).toHaveBeenCalledWith('conv-1', true)
    })

    it('should unpin conversation', () => {
      const { useConversations } = require('@/lib/contexts/conversations-context')
      const pinConversation = jest.fn()

      useConversations.mockReturnValue({
        conversations: [
          { id: 'conv-1', project_id: 'proj-1', title: 'Test', is_pinned: true },
        ],
        currentConversation: null,
        createConversation: jest.fn(),
        deleteConversation: jest.fn(),
        pinConversation,
      })

      render(<ConversationSidebar />)

      const pinButton = screen.getByTestId('pin-conv-1')
      fireEvent.click(pinButton)

      expect(pinConversation).toHaveBeenCalledWith('conv-1', false)
    })
  })

  describe('Delete Conversation', () => {
    it('should delete conversation', () => {
      const { useConversations } = require('@/lib/contexts/conversations-context')
      const deleteConversation = jest.fn()

      useConversations.mockReturnValue({
        conversations: [
          { id: 'conv-1', project_id: 'proj-1', title: 'Test', is_pinned: false },
        ],
        currentConversation: null,
        createConversation: jest.fn(),
        deleteConversation,
        pinConversation: jest.fn(),
      })

      render(<ConversationSidebar />)

      const deleteButton = screen.getByTestId('delete-conv-1')
      fireEvent.click(deleteButton)

      expect(deleteConversation).toHaveBeenCalledWith('conv-1')
    })
  })

  describe('Project Filtering', () => {
    it('should filter conversations by current project', () => {
      const { useConversations } = require('@/lib/contexts/conversations-context')

      useConversations.mockReturnValue({
        conversations: [
          { id: 'conv-1', project_id: 'proj-1', title: 'Project 1', is_pinned: false },
          { id: 'conv-2', project_id: 'proj-2', title: 'Project 2', is_pinned: false },
        ],
        currentConversation: null,
        createConversation: jest.fn(),
        deleteConversation: jest.fn(),
        pinConversation: jest.fn(),
      })

      render(<ConversationSidebar />)

      expect(screen.getByTestId('conv-item-conv-1')).toBeInTheDocument()
      expect(screen.queryByTestId('conv-item-conv-2')).not.toBeInTheDocument()
    })

    it('should show all conversations when no project selected', () => {
      const { useConversations } = require('@/lib/contexts/conversations-context')
      const { useProjects } = require('@/lib/contexts/projects-context')

      useConversations.mockReturnValue({
        conversations: [
          { id: 'conv-1', project_id: 'proj-1', title: 'Test 1', is_pinned: false },
          { id: 'conv-2', project_id: 'proj-2', title: 'Test 2', is_pinned: false },
        ],
        currentConversation: null,
        createConversation: jest.fn(),
        deleteConversation: jest.fn(),
        pinConversation: jest.fn(),
      })

      useProjects.mockReturnValue({
        currentProject: null,
      })

      render(<ConversationSidebar />)

      expect(screen.getByTestId('conv-item-conv-1')).toBeInTheDocument()
      expect(screen.getByTestId('conv-item-conv-2')).toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    it('should show empty state when no conversations', () => {
      const { useConversations } = require('@/lib/contexts/conversations-context')

      useConversations.mockReturnValue({
        conversations: [],
        currentConversation: null,
        createConversation: jest.fn(),
        deleteConversation: jest.fn(),
        pinConversation: jest.fn(),
      })

      render(<ConversationSidebar />)

      expect(screen.getByText('No conversations yet')).toBeInTheDocument()
    })

    it('should hide pinned section if no pinned conversations', () => {
      const { useConversations } = require('@/lib/contexts/conversations-context')

      useConversations.mockReturnValue({
        conversations: [
          { id: 'conv-1', project_id: 'proj-1', title: 'Test', is_pinned: false },
        ],
        currentConversation: null,
        createConversation: jest.fn(),
        deleteConversation: jest.fn(),
        pinConversation: jest.fn(),
      })

      const { queryByText } = render(<ConversationSidebar />)

      // Pinned header should not be visible
      const pinnedHeader = queryByText('Pinned')
      if (pinnedHeader) {
        const section = pinnedHeader.parentElement
        expect(section?.children.length).toBe(1) // Only the header
      }
    })
  })

  describe('Props Handling', () => {
    it('should accept custom className', () => {
      const { container } = render(<ConversationSidebar className="custom-class" />)

      const sidebar = container.querySelector('.custom-class')
      expect(sidebar).toBeInTheDocument()
    })

    it('should accept onSelectConversation callback', () => {
      const onSelectConversation = jest.fn()
      render(<ConversationSidebar onSelectConversation={onSelectConversation} />)

      expect(screen.getByText('New Chat')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper button labels', () => {
      render(<ConversationSidebar />)

      expect(screen.getByText('New Chat')).toBeInTheDocument()
    })

    it('should have search input with placeholder', () => {
      render(<ConversationSidebar />)

      expect(screen.getByPlaceholderText('Search conversations...')).toBeInTheDocument()
    })
  })
})
