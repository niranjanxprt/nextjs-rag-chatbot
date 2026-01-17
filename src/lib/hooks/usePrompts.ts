/**
 * Prompts Management Hook
 * 
 * Convex hooks for managing prompt templates with real-time updates.
 */

'use client'

import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Id } from '../../../convex/_generated/dataModel'
import { toast } from 'react-hot-toast'

// Types
export interface Prompt {
  _id: Id<"prompts">
  user_id: Id<"users">
  name: string
  title?: string
  content: string
  description?: string
  variables?: any
  category?: string
  tags?: string[]
  is_favorite?: boolean
  is_public?: boolean
  usage_count?: number
  metadata?: any
  created_at: number
  updated_at: number
}

export interface CreatePromptData {
  name: string
  description?: string
  content: string
  category: string
  tags?: string[]
  is_favorite?: boolean
  is_public?: boolean
  variables?: any
  metadata?: Record<string, any>
}

export interface UpdatePromptData {
  name?: string
  description?: string
  content?: string
  category?: string
  tags?: string[]
  is_favorite?: boolean
  is_public?: boolean
  variables?: any
  metadata?: Record<string, any>
}

// Hooks
export function usePrompts(params: {
  category?: string
  is_favorite?: boolean
  is_public?: boolean
  search?: string
  tags?: string[]
} = {}) {
  const prompts = useQuery(api.queries.prompts.list, {})
  
  return {
    data: prompts,
    isLoading: prompts === undefined,
    error: null,
  }
}

export function usePrompt(id: Id<"prompts"> | string) {
  const prompt = useQuery(api.queries.prompts.get, { id: id as Id<"prompts"> })
  
  return {
    data: prompt,
    isLoading: prompt === undefined,
    error: null,
  }
}

export function useCreatePrompt() {
  const createMutation = useMutation(api.mutations.prompts.create)
  
  return {
    mutate: async (data: CreatePromptData) => {
      try {
        const id = await createMutation({
          title: data.name,
          content: data.content,
          category: data.category,
          is_public: data.is_public ?? false,
        })
        toast.success('Prompt created successfully')
        return id
      } catch (error: any) {
        toast.error(error.message)
        throw error
      }
    },
    mutateAsync: async (data: CreatePromptData) => {
      const id = await createMutation({
        title: data.name,
        content: data.content,
        category: data.category,
        is_public: data.is_public ?? false,
      })
      toast.success('Prompt created successfully')
      return id
    },
  }
}

export function useUpdatePrompt() {
  const updateMutation = useMutation(api.mutations.prompts.update)
  
  return {
    mutate: async ({ id, data }: { id: Id<"prompts">; data: UpdatePromptData }) => {
      try {
        await updateMutation({
          id,
          title: data.name,
          content: data.content,
          category: data.category,
        })
        toast.success('Prompt updated successfully')
      } catch (error: any) {
        toast.error(error.message)
        throw error
      }
    },
    mutateAsync: async ({ id, data }: { id: Id<"prompts">; data: UpdatePromptData }) => {
      await updateMutation({
        id,
        title: data.name,
        content: data.content,
        category: data.category,
      })
      toast.success('Prompt updated successfully')
    },
  }
}

export function useDeletePrompt() {
  const deleteMutation = useMutation(api.mutations.prompts.remove)
  
  return {
    mutate: async (id: Id<"prompts">) => {
      try {
        await deleteMutation({ id })
        toast.success('Prompt deleted successfully')
      } catch (error: any) {
        toast.error(error.message)
        throw error
      }
    },
    mutateAsync: async (id: Id<"prompts">) => {
      await deleteMutation({ id })
      toast.success('Prompt deleted successfully')
    },
  }
}

export function usePublicPrompts() {
  const prompts = useQuery(api.queries.prompts.listPublic, {})
  
  return {
    data: prompts,
    isLoading: prompts === undefined,
    error: null,
  }
}

export function useFavoritePrompts() {
  return usePrompts({ is_favorite: true })
}

export function usePromptsByCategory() {
  const prompts = useQuery(api.queries.prompts.list, {})
  
  const promptsByCategory = prompts?.reduce((acc, prompt) => {
    const category = prompt.category || 'uncategorized'
    if (!acc[category]) acc[category] = []
    acc[category].push(prompt)
    return acc
  }, {} as Record<string, Prompt[]>)
  
  return promptsByCategory || {}
}
