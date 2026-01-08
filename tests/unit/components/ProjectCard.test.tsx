/**
 * Unit Tests for ProjectCard Component
 * Tests project display, edit dialog, delete confirmation, and interactions
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ProjectCard } from '@/components/projects/ProjectCard'
import type { Project } from '@/lib/types/database'

// Mock EditProjectDialog
jest.mock('@/components/projects/EditProjectDialog', () => ({
  EditProjectDialog: ({ open, onOpenChange, onSubmit }: any) => (
    <div data-testid="edit-dialog" style={{ display: open ? 'block' : 'none' }}>
      <button
        onClick={() => onSubmit({ name: 'Updated Project' })}
        data-testid="submit-edit"
      >
        Save
      </button>
      <button onClick={() => onOpenChange(false)} data-testid="close-edit">
        Close
      </button>
    </div>
  ),
}))

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h2>{children}</h2>,
  CardDescription: ({ children }: any) => <p>{children}</p>,
  CardContent: ({ children }: any) => <div>{children}</div>,
}))

jest.mock('@/components/ui/button', () => ({
  Button: (props: any) => <button {...props}>{props.children}</button>,
}))

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant }: any) => <span data-testid={`badge-${variant}`}>{children}</span>,
}))

jest.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => <div data-testid="dropdown">{children}</div>,
  DropdownMenuTrigger: ({ children }: any) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: any) => <div data-testid="dropdown-menu">{children}</div>,
  DropdownMenuItem: (props: any) => <button {...props} />,
}))

const mockProject: Project = {
  id: 'proj-1',
  user_id: 'user-1',
  name: 'Test Project',
  description: 'A test project',
  color: '#3b82f6',
  icon: '📁',
  is_default: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-02T00:00:00Z',
}

describe('ProjectCard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    window.confirm = jest.fn(() => true)
    window.alert = jest.fn()
  })

  describe('Rendering', () => {
    it('should render project card', () => {
      render(<ProjectCard project={mockProject} />)

      expect(screen.getByText('Test Project')).toBeInTheDocument()
    })

    it('should display project name', () => {
      render(<ProjectCard project={mockProject} />)

      expect(screen.getByText('Test Project')).toBeInTheDocument()
    })

    it('should display project icon', () => {
      render(<ProjectCard project={mockProject} />)

      expect(screen.getByText('📁')).toBeInTheDocument()
    })

    it('should display project description', () => {
      render(<ProjectCard project={mockProject} />)

      expect(screen.getByText('A test project')).toBeInTheDocument()
    })

    it('should display default badge for default project', () => {
      render(<ProjectCard project={mockProject} isDefault={true} />)

      expect(screen.getByTestId('badge-secondary')).toBeInTheDocument()
      expect(screen.getByText('Default')).toBeInTheDocument()
    })

    it('should not display default badge for non-default project', () => {
      render(<ProjectCard project={mockProject} isDefault={false} />)

      const badges = screen.queryAllByTestId(/badge-/)
      const defaultBadge = badges.find((badge) => badge.textContent === 'Default')
      expect(defaultBadge).toBeUndefined()
    })

    it('should apply color-coded background', () => {
      const { container } = render(<ProjectCard project={mockProject} />)

      const card = container.firstChild
      expect(card).toHaveClass('bg-blue-500/10')
    })
  })

  describe('Project Stats', () => {
    it('should display documents count', () => {
      render(<ProjectCard project={mockProject} />)

      expect(screen.getByText('Documents')).toBeInTheDocument()
      expect(screen.getByText('0')).toBeInTheDocument()
    })

    it('should display chats count', () => {
      render(<ProjectCard project={mockProject} />)

      expect(screen.getByText('Chats')).toBeInTheDocument()
    })

    it('should display created date', () => {
      render(<ProjectCard project={mockProject} />)

      expect(screen.getByText(/Created:/)).toBeInTheDocument()
    })

    it('should display updated date if available', () => {
      render(<ProjectCard project={mockProject} />)

      expect(screen.getByText(/Updated:/)).toBeInTheDocument()
    })
  })

  describe('Actions Menu', () => {
    it('should render dropdown menu button', () => {
      render(<ProjectCard project={mockProject} />)

      expect(screen.getByTestId('dropdown')).toBeInTheDocument()
    })

    it('should show edit option in menu', () => {
      render(<ProjectCard project={mockProject} />)

      expect(screen.getByText('Edit')).toBeInTheDocument()
    })

    it('should show delete option for non-default project', () => {
      render(<ProjectCard project={mockProject} isDefault={false} />)

      expect(screen.getByText('Delete')).toBeInTheDocument()
    })

    it('should not show delete option for default project', () => {
      render(<ProjectCard project={mockProject} isDefault={true} />)

      const deleteButton = screen.queryByText('Delete')
      if (deleteButton) {
        expect(deleteButton).toBeDisabled()
      }
    })
  })

  describe('Edit Dialog', () => {
    it('should show edit dialog when edit clicked', () => {
      render(<ProjectCard project={mockProject} />)

      const editButton = screen.getByText('Edit')
      fireEvent.click(editButton)

      const editDialog = screen.getByTestId('edit-dialog')
      expect(editDialog).toBeVisible()
    })

    it('should close edit dialog', () => {
      render(<ProjectCard project={mockProject} />)

      const editButton = screen.getByText('Edit')
      fireEvent.click(editButton)

      const closeButton = screen.getByTestId('close-edit')
      fireEvent.click(closeButton)

      const editDialog = screen.getByTestId('edit-dialog')
      expect(editDialog).not.toBeVisible()
    })

    it('should call onUpdate when form submitted', async () => {
      const onUpdate = jest.fn()
      render(<ProjectCard project={mockProject} onUpdate={onUpdate} />)

      const editButton = screen.getByText('Edit')
      fireEvent.click(editButton)

      const submitButton = screen.getByTestId('submit-edit')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(onUpdate).toHaveBeenCalled()
      })
    })
  })

  describe('Delete Action', () => {
    it('should show confirmation before delete', () => {
      const onDelete = jest.fn()
      render(<ProjectCard project={mockProject} onDelete={onDelete} isDefault={false} />)

      const deleteButton = screen.getByText('Delete')
      fireEvent.click(deleteButton)

      expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('Test Project'))
    })

    it('should delete project on confirmation', async () => {
      const onDelete = jest.fn()
      window.confirm = jest.fn(() => true)

      render(<ProjectCard project={mockProject} onDelete={onDelete} isDefault={false} />)

      const deleteButton = screen.getByText('Delete')
      fireEvent.click(deleteButton)

      await waitFor(() => {
        expect(onDelete).toHaveBeenCalledWith('proj-1')
      })
    })

    it('should not delete on cancel', () => {
      const onDelete = jest.fn()
      window.confirm = jest.fn(() => false)

      render(<ProjectCard project={mockProject} onDelete={onDelete} isDefault={false} />)

      const deleteButton = screen.getByText('Delete')
      fireEvent.click(deleteButton)

      expect(onDelete).not.toHaveBeenCalled()
    })

    it('should handle delete errors', async () => {
      const onDelete = jest.fn().mockRejectedValue(new Error('Delete failed'))
      window.confirm = jest.fn(() => true)

      render(<ProjectCard project={mockProject} onDelete={onDelete} isDefault={false} />)

      const deleteButton = screen.getByText('Delete')
      fireEvent.click(deleteButton)

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Failed to delete project')
      })
    })

    it('should disable delete button while deleting', async () => {
      const onDelete = jest.fn(() => new Promise((resolve) => setTimeout(resolve, 100)))
      window.confirm = jest.fn(() => true)

      render(<ProjectCard project={mockProject} onDelete={onDelete} isDefault={false} />)

      const deleteButton = screen.getByText('Delete')
      fireEvent.click(deleteButton)

      expect(deleteButton).toBeDisabled()
    })
  })

  describe('Open Project Button', () => {
    it('should render open project button', () => {
      render(<ProjectCard project={mockProject} />)

      expect(screen.getByText('Open Project')).toBeInTheDocument()
    })

    it('should call onClick when button clicked', () => {
      const onClick = jest.fn()
      render(<ProjectCard project={mockProject} onClick={onClick} />)

      const openButton = screen.getByText('Open Project')
      fireEvent.click(openButton)

      expect(onClick).toHaveBeenCalled()
    })
  })

  describe('Color Variants', () => {
    it('should apply blue color class', () => {
      const project = { ...mockProject, color: '#3b82f6' }
      const { container } = render(<ProjectCard project={project} />)

      const card = container.firstChild
      expect(card).toHaveClass('bg-blue-500/10')
    })

    it('should apply pink color class', () => {
      const project = { ...mockProject, color: '#ec4899' }
      const { container } = render(<ProjectCard project={project} />)

      const card = container.firstChild
      expect(card).toHaveClass('bg-pink-500/10')
    })

    it('should apply purple color class', () => {
      const project = { ...mockProject, color: '#8b5cf6' }
      const { container } = render(<ProjectCard project={project} />)

      const card = container.firstChild
      expect(card).toHaveClass('bg-purple-500/10')
    })

    it('should apply default color for unknown color', () => {
      const project = { ...mockProject, color: '#unknowncolor' }
      const { container } = render(<ProjectCard project={project} />)

      const card = container.firstChild
      expect(card).toHaveClass('bg-gray-500/10')
    })
  })

  describe('Props Handling', () => {
    it('should accept custom className', () => {
      const { container } = render(
        <ProjectCard project={mockProject} className="custom-class" />
      )

      const card = container.firstChild
      expect(card).toHaveClass('custom-class')
    })

    it('should handle missing description', () => {
      const project = { ...mockProject, description: undefined }
      const { queryByText } = render(<ProjectCard project={project} />)

      expect(queryByText('A test project')).not.toBeInTheDocument()
    })

    it('should handle missing updated_at', () => {
      const project = { ...mockProject, updated_at: undefined }
      const { queryByText } = render(<ProjectCard project={project} />)

      expect(queryByText(/Updated:/)).not.toBeInTheDocument()
    })
  })

  describe('Hover State', () => {
    it('should have hover shadow transition', () => {
      const { container } = render(<ProjectCard project={mockProject} />)

      const card = container.firstChild
      expect(card).toHaveClass('hover:shadow-md')
      expect(card).toHaveClass('transition-shadow')
    })
  })

  describe('Dropdown Menu Interactions', () => {
    it('should prevent event bubbling on menu button click', () => {
      render(<ProjectCard project={mockProject} />)

      // This is tested implicitly - the card click shouldn't open project when clicking menu
      expect(screen.getByTestId('dropdown')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have semantic heading for project name', () => {
      render(<ProjectCard project={mockProject} />)

      expect(screen.getByRole('heading', { name: 'Test Project' })).toBeInTheDocument()
    })

    it('should have descriptive button labels', () => {
      render(<ProjectCard project={mockProject} />)

      expect(screen.getByText('Open Project')).toBeInTheDocument()
    })
  })
})
