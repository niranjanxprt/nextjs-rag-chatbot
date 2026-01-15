/**
 * Prompts Management Hook
 * 
 * React Query hook for managing prompt templates with
 * categories, favorites, and sharing capabilities.
 */

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/lib/auth/context'
import { queryKeys } from '@/lib/react-query/queryClient'
import { toast } from 'react-hot-toast'

// Types
export interface Prompt {
  id: string
  name: string
  description: string | null
  content: string
  category: string
  tags: string[]
  is_favorite: boolean
  is_public: boolean
  user_id: string
  usage_count: number
  variables: Array<{
    name: string
    type: 'text' | 'number' | 'boolean' | 'select'
    description?: string
    required?: boolean
    default_value?: any
    options?: string[] // for select type
  }>
  metadata: {
    version?: string
    author?: string
    created_with?: string
    [key: string]: any
  }
  created_at: string
  updated_at: string
}

export interface CreatePromptData {
  name: string
  description?: string
  content: string
  category: string
  tags?: string[]
  is_favorite?: boolean
  is_public?: boolean
  variables?: Array<{
    name: string
    type: 'text' | 'number' | 'boolean' | 'select'
    description?: string
    required?: boolean
    default_value?: any
    options?: string[]
  }>
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
  variables?: Array<{
    name: string
    type: 'text' | 'number' | 'boolean' | 'select'
    description?: string
    required?: boolean
    default_value?: any
    options?: string[]
  }>
  metadata?: Record<string, any>
}

export interface PromptExecution {
  id: string
  prompt_id: string
  user_id: string
  variables_used: Record<string, any>
  generated_content: string
  execution_time_ms: number
  created_at: string
}

// API Functions
const promptsApi = {
  // Get user's prompts
  async getPrompts(params: {
    category?: string
    is_favorite?: boolean
    is_public?: boolean
    search?: string
    tags?: string[]
  } = {}): Promise<Prompt[]> {
    const searchParams = new URLSearchParams()
    
    if (params.category) searchParams.set('category', params.category)
    if (params.is_favorite !== undefined) searchParams.set('is_favorite', params.is_favorite.toString())
    if (params.is_public !== undefined) searchParams.set('is_public', params.is_public.toString())
    if (params.search) searchParams.set('search', params.search)
    if (params.tags?.length) searchParams.set('tags', params.tags.join(','))

    const response = await fetch(`/api/prompts?${searchParams}`)
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch prompts')
    }
    
    return response.json()
  },

  // Get single prompt
  async getPrompt(id: string): Promise<Prompt> {
    const response = await fetch(`/api/prompts/${id}`)
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch prompt')
    }
    
    return response.json()
  },

  // Create prompt
  async createPrompt(data: CreatePromptData): Promise<Prompt> {
    const response = await fetch('/api/prompts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create prompt')
    }
    
    return response.json()
  },

  // Update prompt
  async updatePrompt(id: string, data: UpdatePromptData): Promise<Prompt> {
    const response = await fetch(`/api/prompts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update prompt')
    }
    
    return response.json()
  },

  // Delete prompt
  async deletePrompt(id: string): Promise<void> {
    const response = await fetch(`/api/prompts/${id}`, {
      method: 'DELETE',
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete prompt')
    }
  },

  // Execute prompt with variables
  async executePrompt(id: string, variables: Record<string, any>): Promise<PromptExecution> {
    const response = await fetch(`/api/prompts/${id}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ variables }),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to execute prompt')
    }
    
    return response.json()
  },

  // Get prompt categories
  async getPromptCategories(): Promise<Array<{ category: string; count: number }>> {
    const response = await fetch('/api/prompts/categories')
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch prompt categories')
    }
    
    return response.json()
  },

  // Get popular prompts
  async getPopularPrompts(limit: number = 10): Promise<Prompt[]> {
    const response = await fetch(`/api/prompts/popular?limit=${limit}`)
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch popular prompts')
    }
    
    return response.json()
  },

  // Duplicate prompt
  async duplicatePrompt(id: string, name?: string): Promise<Prompt> {
    const response = await fetch(`/api/prompts/${id}/duplicate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to duplicate prompt')
    }
    
    return response.json()
  },
}

// Hooks
export function usePrompts(params: {
  category?: string
  is_favorite?: boolean
  is_public?: boolean
  search?: string
  tags?: string[]
} = {}) {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: queryKeys.userPrompts(user?.id || ''),
    queryFn: () => promptsApi.getPrompts(params),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function usePrompt(id: string) {
  return useQuery({
    queryKey: queryKeys.prompt(id),
    queryFn: () => promptsApi.getPrompt(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreatePrompt() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: promptsApi.createPrompt,
    onSuccess: (newPrompt) => {
      // Add to prompts list
      queryClient.setQueryData<Prompt[]>(
        queryKeys.userPrompts(user!.id),
        (old) => {
          if (!old) return [newPrompt]
          return [newPrompt, ...old]
        }
      )
      
      // Set individual prompt cache
      queryClient.setQueryData(queryKeys.prompt(newPrompt.id), newPrompt)
      
      // Invalidate categories if needed
      queryClient.invalidateQueries({ queryKey: [...queryKeys.prompts, 'categories'] })
      
      toast.success('Prompt created successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useUpdatePrompt() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePromptData }) =>
      promptsApi.updatePrompt(id, data),
    onSuccess: (updatedPrompt) => {
      // Update individual prompt cache
      queryClient.setQueryData(queryKeys.prompt(updatedPrompt.id), updatedPrompt)
      
      // Update prompts list
      queryClient.setQueryData<Prompt[]>(
        queryKeys.userPrompts(user!.id),
        (old) => {
          if (!old) return old
          return old.map(prompt =>
            prompt.id === updatedPrompt.id ? updatedPrompt : prompt
          )
        }
      )
      
      toast.success('Prompt updated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useDeletePrompt() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: promptsApi.deletePrompt,
    onSuccess: (_, deletedId) => {
      // Remove from prompts list
      queryClient.setQueryData<Prompt[]>(
        queryKeys.userPrompts(user!.id),
        (old) => {
          if (!old) return old
          return old.filter(prompt => prompt.id !== deletedId)
        }
      )
      
      // Remove individual prompt cache
      queryClient.removeQueries({ queryKey: queryKeys.prompt(deletedId) })
      
      toast.success('Prompt deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useExecutePrompt() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, variables }: { id: string; variables: Record<string, any> }) =>
      promptsApi.executePrompt(id, variables),
    onSuccess: (execution) => {
      // Update prompt usage count
      queryClient.setQueryData<Prompt>(
        queryKeys.prompt(execution.prompt_id),
        (old) => {
          if (!old) return old
          return { ...old, usage_count: old.usage_count + 1 }
        }
      )
      
      toast.success('Prompt executed successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function usePromptCategories() {
  return useQuery({
    queryKey: [...queryKeys.prompts, 'categories'],
    queryFn: promptsApi.getPromptCategories,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

export function usePopularPrompts(limit: number = 10) {
  return useQuery({
    queryKey: [...queryKeys.prompts, 'popular', limit],
    queryFn: () => promptsApi.getPopularPrompts(limit),
    staleTime: 5 * 60 * 1000,
  })
}

export function useDuplicatePrompt() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name?: string }) =>
      promptsApi.duplicatePrompt(id, name),
    onSuccess: (duplicatedPrompt) => {
      // Add to prompts list
      queryClient.setQueryData<Prompt[]>(
        queryKeys.userPrompts(user!.id),
        (old) => {
          if (!old) return [duplicatedPrompt]
          return [duplicatedPrompt, ...old]
        }
      )
      
      // Set individual prompt cache
      queryClient.setQueryData(queryKeys.prompt(duplicatedPrompt.id), duplicatedPrompt)
      
      toast.success('Prompt duplicated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

// Utility hooks
export function usePromptsByCategory() {
  const { user } = useAuth()
  const { data: prompts } = usePrompts()
  
  const promptsByCategory = prompts?.reduce((acc, prompt) => {
    const category = prompt.category || 'uncategorized'
    if (!acc[category]) acc[category] = []
    acc[category].push(prompt)
    return acc
  }, {} as Record<string, Prompt[]>)
  
  return promptsByCategory || {}
}

export function useFavoritePrompts() {
  return usePrompts({ is_favorite: true })
}

export function usePublicPrompts() {
  return usePrompts({ is_public: true })
}