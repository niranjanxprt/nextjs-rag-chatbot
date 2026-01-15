/**
 * Projects Management Hook
 * 
 * React Query hook for managing projects with full CRUD operations,
 * member management, and proper caching.
 */

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/lib/auth/context'
import { queryKeys } from '@/lib/react-query/queryClient'
import { toast } from 'react-hot-toast'

// Types
export interface Project {
  id: string
  name: string
  description: string | null
  user_id: string
  is_public: boolean
  allow_member_invite: boolean
  max_members: number
  color?: string
  icon?: string
  is_default?: boolean
  created_at: string
  updated_at: string
  _count?: {
    members: number
    documents: number
    conversations: number
  }
}

export interface ProjectMember {
  id: string
  project_id: string
  user_id: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  permissions: {
    read: boolean
    write: boolean
    admin: boolean
  }
  invited_by: string | null
  joined_at: string
  created_at: string
  updated_at: string
  profiles: {
    id: string
    email: string
    full_name: string | null
    avatar_url: string | null
  }
}

export interface CreateProjectData {
  name: string
  description?: string
  is_public?: boolean
  allow_member_invite?: boolean
  max_members?: number
}

export interface UpdateProjectData {
  name?: string
  description?: string
  is_public?: boolean
  allow_member_invite?: boolean
  max_members?: number
}

// API Functions
const projectsApi = {
  // Get user's projects
  async getProjects(): Promise<Project[]> {
    const response = await fetch('/api/projects')
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch projects')
    }
    
    return response.json()
  },

  // Get single project
  async getProject(id: string): Promise<Project> {
    const response = await fetch(`/api/projects/${id}`)
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch project')
    }
    
    return response.json()
  },

  // Create project
  async createProject(data: CreateProjectData): Promise<Project> {
    const response = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create project')
    }
    
    return response.json()
  },

  // Update project
  async updateProject(id: string, data: UpdateProjectData): Promise<Project> {
    const response = await fetch(`/api/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update project')
    }
    
    return response.json()
  },

  // Delete project
  async deleteProject(id: string): Promise<void> {
    const response = await fetch(`/api/projects/${id}`, {
      method: 'DELETE',
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete project')
    }
  },

  // Get project members
  async getProjectMembers(projectId: string): Promise<ProjectMember[]> {
    const response = await fetch(`/api/projects/${projectId}/members`)
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch project members')
    }
    
    return response.json()
  },
}

// Hooks
export function useProjects() {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: queryKeys.projects,
    queryFn: projectsApi.getProjects,
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useProject(id: string) {
  return useQuery({
    queryKey: queryKeys.project(id),
    queryFn: () => projectsApi.getProject(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: projectsApi.createProject,
    onSuccess: (newProject) => {
      // Add to projects list
      queryClient.setQueryData<Project[]>(queryKeys.projects, (old) => {
        if (!old) return [newProject]
        return [newProject, ...old]
      })
      
      // Set individual project cache
      queryClient.setQueryData(queryKeys.project(newProject.id), newProject)
      
      toast.success('Project created successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useUpdateProject() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProjectData }) =>
      projectsApi.updateProject(id, data),
    onSuccess: (updatedProject) => {
      // Update individual project cache
      queryClient.setQueryData(queryKeys.project(updatedProject.id), updatedProject)
      
      // Update projects list
      queryClient.setQueryData<Project[]>(queryKeys.projects, (old) => {
        if (!old) return old
        return old.map(project =>
          project.id === updatedProject.id ? updatedProject : project
        )
      })
      
      toast.success('Project updated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useDeleteProject() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: projectsApi.deleteProject,
    onSuccess: (_, deletedId) => {
      // Remove from projects list
      queryClient.setQueryData<Project[]>(queryKeys.projects, (old) => {
        if (!old) return old
        return old.filter(project => project.id !== deletedId)
      })
      
      // Remove individual project cache
      queryClient.removeQueries({ queryKey: queryKeys.project(deletedId) })
      
      // Remove related caches
      queryClient.removeQueries({ queryKey: queryKeys.projectMembers(deletedId) })
      queryClient.removeQueries({ queryKey: queryKeys.projectDocuments(deletedId) })
      queryClient.removeQueries({ queryKey: queryKeys.projectConversations(deletedId) })
      
      toast.success('Project deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useProjectMembers(projectId: string) {
  return useQuery({
    queryKey: queryKeys.projectMembers(projectId),
    queryFn: () => projectsApi.getProjectMembers(projectId),
    enabled: !!projectId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}