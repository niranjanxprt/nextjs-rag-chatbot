/**
 * Projects Context Provider
 *
 * Manages global project state and provides CRUD operations for projects
 */

'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import type { Project, ProjectInsert, ProjectUpdate } from '@/lib/types/database'

// =============================================================================
// Types
// =============================================================================

interface ProjectsContextType {
  projects: Project[]
  currentProject: Project | null
  setCurrentProject: (id: string) => void
  createProject: (data: ProjectInsert) => Promise<Project>
  updateProject: (id: string, data: ProjectUpdate) => Promise<Project>
  deleteProject: (id: string) => Promise<void>
  isLoading: boolean
  error: string | null
}

// =============================================================================
// Context & Provider
// =============================================================================

const ProjectsContext = createContext<ProjectsContextType | null>(null)

export function ProjectsProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([])
  const [currentProject, setCurrentProjectState] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load projects on mount
  useEffect(() => {
    loadProjects()
  }, [])

  async function loadProjects() {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/projects')

      if (!response.ok) {
        throw new Error(`Failed to load projects: ${response.statusText}`)
      }

      const data = await response.json()
      const fetchedProjects = data.projects || []

      setProjects(fetchedProjects)

      // Restore current project from localStorage or use default
      const storedId = localStorage.getItem('currentProjectId')
      const currentFromStorage = fetchedProjects.find((p: Project) => p.id === storedId)
      const defaultProject = fetchedProjects.find((p: Project) => p.is_default)
      const fallback = fetchedProjects[0] || null

      const toSet = currentFromStorage || defaultProject || fallback
      setCurrentProjectState(toSet)

      if (toSet) {
        localStorage.setItem('currentProjectId', toSet.id)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load projects'
      setError(message)
      console.error('Error loading projects:', err)
    } finally {
      setIsLoading(false)
    }
  }

  function setCurrentProject(id: string) {
    const project = projects.find(p => p.id === id)
    if (project) {
      setCurrentProjectState(project)
      localStorage.setItem('currentProjectId', id)
    }
  }

  async function createProject(data: ProjectInsert): Promise<Project> {
    try {
      setError(null)

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Failed to create project`)
      }

      const result = await response.json()
      const newProject = result.project

      setProjects(prev => [...prev, newProject])

      return newProject
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create project'
      setError(message)
      throw err
    }
  }

  async function updateProject(id: string, data: ProjectUpdate): Promise<Project> {
    try {
      setError(null)

      const response = await fetch(`/api/projects/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Failed to update project`)
      }

      const result = await response.json()
      const updated = result.project

      setProjects(prev => prev.map(p => (p.id === id ? updated : p)))

      // Update current project if it was modified
      if (currentProject?.id === id) {
        setCurrentProjectState(updated)
      }

      return updated
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update project'
      setError(message)
      throw err
    }
  }

  async function deleteProject(id: string): Promise<void> {
    try {
      setError(null)

      // Prevent deleting default project
      const projectToDelete = projects.find(p => p.id === id)
      if (projectToDelete?.is_default) {
        throw new Error('Cannot delete the default project')
      }

      const response = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Failed to delete project`)
      }

      setProjects(prev => prev.filter(p => p.id !== id))

      // Switch to another project if current was deleted
      if (currentProject?.id === id) {
        const defaultProject = projects.find(p => p.is_default && p.id !== id)
        const fallback = projects.find(p => p.id !== id)
        const toSet = defaultProject || fallback || null
        setCurrentProjectState(toSet)
        if (toSet) {
          localStorage.setItem('currentProjectId', toSet.id)
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete project'
      setError(message)
      throw err
    }
  }

  const value: ProjectsContextType = {
    projects,
    currentProject,
    setCurrentProject,
    createProject,
    updateProject,
    deleteProject,
    isLoading,
    error,
  }

  return <ProjectsContext.Provider value={value}>{children}</ProjectsContext.Provider>
}

// =============================================================================
// Hook
// =============================================================================

export function useProjects() {
  const context = useContext(ProjectsContext)
  if (!context) {
    throw new Error('useProjects must be used within ProjectsProvider')
  }
  return context
}
