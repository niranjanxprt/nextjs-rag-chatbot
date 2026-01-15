/**
 * Projects Management Hook
 * 
 * Convex hooks for managing projects with real-time updates.
 */

'use client'

import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Id } from '../../../convex/_generated/dataModel'
import { toast } from 'react-hot-toast'

// Types
export interface Project {
  _id: Id<"projects">
  user_id: Id<"users">
  name: string
  description?: string
  color?: string
  icon?: string
  is_default?: boolean
  is_public?: boolean
  allow_member_invite?: boolean
  max_members?: number
  created_at: number
  updated_at: number
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

// Hooks
export function useProjects() {
  const projects = useQuery(api.queries.projects.list, {})
  
  return {
    data: projects,
    isLoading: projects === undefined,
    error: null,
  }
}

export function useProject(id: Id<"projects"> | string) {
  const project = useQuery(api.queries.projects.get, { id: id as Id<"projects"> })
  
  return {
    data: project,
    isLoading: project === undefined,
    error: null,
  }
}

export function useCreateProject() {
  const createMutation = useMutation(api.mutations.projects.create)
  
  return {
    mutate: async (data: CreateProjectData) => {
      try {
        const id = await createMutation(data)
        toast.success('Project created successfully')
        return id
      } catch (error: any) {
        toast.error(error.message)
        throw error
      }
    },
    mutateAsync: async (data: CreateProjectData) => {
      const id = await createMutation(data)
      toast.success('Project created successfully')
      return id
    },
  }
}

export function useUpdateProject() {
  const updateMutation = useMutation(api.mutations.projects.update)
  
  return {
    mutate: async ({ id, data }: { id: Id<"projects">; data: UpdateProjectData }) => {
      try {
        await updateMutation({ id, ...data })
        toast.success('Project updated successfully')
      } catch (error: any) {
        toast.error(error.message)
        throw error
      }
    },
    mutateAsync: async ({ id, data }: { id: Id<"projects">; data: UpdateProjectData }) => {
      await updateMutation({ id, ...data })
      toast.success('Project updated successfully')
    },
  }
}

export function useDeleteProject() {
  const deleteMutation = useMutation(api.mutations.projects.remove)
  
  return {
    mutate: async (id: Id<"projects">) => {
      try {
        await deleteMutation({ id })
        toast.success('Project deleted successfully')
      } catch (error: any) {
        toast.error(error.message)
        throw error
      }
    },
    mutateAsync: async (id: Id<"projects">) => {
      await deleteMutation({ id })
      toast.success('Project deleted successfully')
    },
  }
}

export function useProjectMembers(projectId: Id<"projects"> | string) {
  const members = useQuery(api.queries.projects.getMembers, { projectId: projectId as Id<"projects"> })
  
  return {
    data: members,
    isLoading: members === undefined,
    error: null,
  }
}
