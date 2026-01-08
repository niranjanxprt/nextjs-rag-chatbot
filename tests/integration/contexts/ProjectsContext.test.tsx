import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProjectsProvider, useProjects } from '@/lib/contexts/projects-context'
import type { Project } from '@/lib/types/database'

// Mock fetch
global.fetch = jest.fn()
const mockFetch = fetch as jest.MockedFunction<typeof fetch>

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage })

// Test component to access context
function TestComponent() {
  const {
    projects,
    currentProject,
    setCurrentProject,
    createProject,
    updateProject,
    deleteProject,
    isLoading,
    error,
  } = useProjects()

  return (
    <div>
      <div data-testid="loading">{isLoading ? 'loading' : 'loaded'}</div>
      <div data-testid="error">{error || 'no-error'}</div>
      <div data-testid="projects-count">{projects.length}</div>
      <div data-testid="current-project">{currentProject?.name || 'none'}</div>
      
      <button onClick={() => setCurrentProject('project-1')}>
        Set Current Project
      </button>
      
      <button
        onClick={() =>
          createProject({
            name: 'New Project',
            description: 'Test project',
            emoji: '📁',
          })
        }
      >
        Create Project
      </button>
      
      <button
        onClick={() =>
          updateProject('project-1', { name: 'Updated Project' })
        }
      >
        Update Project
      </button>
      
      <button onClick={() => deleteProject('project-1')}>
        Delete Project
      </button>
      
      {projects.map((project) => (
        <div key={project.id} data-testid={`project-${project.id}`}>
          {project.name}
        </div>
      ))}
    </div>
  )
}

const mockProjects: Project[] = [
  {
    id: 'project-1',
    name: 'Test Project 1',
    description: 'First test project',
    emoji: '📁',
    user_id: 'user-1',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'project-2',
    name: 'Test Project 2',
    description: 'Second test project',
    emoji: '📂',
    user_id: 'user-1',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
]

describe('ProjectsContext', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
  })

  describe('Initial Loading', () => {
    it('loads projects on mount', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ projects: mockProjects }),
      } as Response)

      render(
        <ProjectsProvider>
          <TestComponent />
        </ProjectsProvider>
      )

      expect(screen.getByTestId('loading')).toHaveTextContent('loading')

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
      })

      expect(screen.getByTestId('projects-count')).toHaveTextContent('2')
      expect(screen.getByTestId('project-project-1')).toHaveTextContent('Test Project 1')
    })

    it('handles loading errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      render(
        <ProjectsProvider>
          <TestComponent />
        </ProjectsProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('error')).not.toHaveTextContent('no-error')
      })

      expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
      expect(screen.getByTestId('projects-count')).toHaveTextContent('0')
    })

    it('restores current project from localStorage', async () => {
      mockLocalStorage.getItem.mockReturnValue('project-1')
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ projects: mockProjects }),
      } as Response)

      render(
        <ProjectsProvider>
          <TestComponent />
        </ProjectsProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('current-project')).toHaveTextContent('Test Project 1')
      })
    })
  })

  describe('Project CRUD Operations', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ projects: mockProjects }),
      } as Response)
    })

    it('creates a new project', async () => {
      const user = userEvent.setup()
      const newProject = {
        id: 'project-3',
        name: 'New Project',
        description: 'Test project',
        emoji: '📁',
        user_id: 'user-1',
        created_at: '2024-01-03T00:00:00Z',
        updated_at: '2024-01-03T00:00:00Z',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ project: newProject }),
      } as Response)

      render(
        <ProjectsProvider>
          <TestComponent />
        </ProjectsProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
      })

      await act(async () => {
        await user.click(screen.getByText('Create Project'))
      })

      await waitFor(() => {
        expect(screen.getByTestId('projects-count')).toHaveTextContent('3')
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'New Project',
          description: 'Test project',
          emoji: '📁',
        }),
      })
    })

    it('updates an existing project', async () => {
      const user = userEvent.setup()
      const updatedProject = { ...mockProjects[0], name: 'Updated Project' }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ project: updatedProject }),
      } as Response)

      render(
        <ProjectsProvider>
          <TestComponent />
        </ProjectsProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
      })

      await act(async () => {
        await user.click(screen.getByText('Update Project'))
      })

      await waitFor(() => {
        expect(screen.getByTestId('project-project-1')).toHaveTextContent('Updated Project')
      })
    })

    it('deletes a project', async () => {
      const user = userEvent.setup()

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      } as Response)

      render(
        <ProjectsProvider>
          <TestComponent />
        </ProjectsProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
      })

      await act(async () => {
        await user.click(screen.getByText('Delete Project'))
      })

      await waitFor(() => {
        expect(screen.getByTestId('projects-count')).toHaveTextContent('1')
      })

      expect(screen.queryByTestId('project-project-1')).not.toBeInTheDocument()
    })
  })

  describe('Current Project Management', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ projects: mockProjects }),
      } as Response)
    })

    it('sets current project', async () => {
      const user = userEvent.setup()

      render(
        <ProjectsProvider>
          <TestComponent />
        </ProjectsProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
      })

      await act(async () => {
        await user.click(screen.getByText('Set Current Project'))
      })

      expect(screen.getByTestId('current-project')).toHaveTextContent('Test Project 1')
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('currentProjectId', 'project-1')
    })

    it('clears current project when project is deleted', async () => {
      const user = userEvent.setup()
      mockLocalStorage.getItem.mockReturnValue('project-1')

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      } as Response)

      render(
        <ProjectsProvider>
          <TestComponent />
        </ProjectsProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('current-project')).toHaveTextContent('Test Project 1')
      })

      await act(async () => {
        await user.click(screen.getByText('Delete Project'))
      })

      await waitFor(() => {
        expect(screen.getByTestId('current-project')).toHaveTextContent('none')
      })

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('currentProjectId')
    })
  })

  describe('Error Handling', () => {
    it('handles API errors gracefully', async () => {
      const user = userEvent.setup()

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ projects: mockProjects }),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
        } as Response)

      render(
        <ProjectsProvider>
          <TestComponent />
        </ProjectsProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
      })

      await act(async () => {
        await user.click(screen.getByText('Create Project'))
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
          json: async () => ({ projects: mockProjects }),
        } as Response)
        .mockRejectedValueOnce(new Error('Network error'))

      render(
        <ProjectsProvider>
          <TestComponent />
        </ProjectsProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
      })

      await act(async () => {
        await user.click(screen.getByText('Update Project'))
      })

      await waitFor(() => {
        expect(screen.getByTestId('error')).not.toHaveTextContent('no-error')
      })
    })
  })

  describe('State Persistence', () => {
    it('persists current project to localStorage', async () => {
      const user = userEvent.setup()

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ projects: mockProjects }),
      } as Response)

      render(
        <ProjectsProvider>
          <TestComponent />
        </ProjectsProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
      })

      await act(async () => {
        await user.click(screen.getByText('Set Current Project'))
      })

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('currentProjectId', 'project-1')
    })

    it('handles invalid localStorage data', async () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-project-id')
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ projects: mockProjects }),
      } as Response)

      render(
        <ProjectsProvider>
          <TestComponent />
        </ProjectsProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('current-project')).toHaveTextContent('none')
      })
    })
  })
})
