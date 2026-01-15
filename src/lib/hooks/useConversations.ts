/**
 * Conversations Management Hook
 * 
 * React Query hook for managing conversations with proper caching,
 * optimistic updates, and error handling.
 */

'use client'

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { useAuth } from '@/lib/auth/context'
import { queryKeys } from '@/lib/react-query/queryClient'
import { toast } from 'react-hot-toast'

// Types
export interface Conversation {
  id: string
  title: string
  user_id: string
  project_id: string | null
  is_shared: boolean
  share_token: string | null
  metadata: Record<string, any>
  created_at: string
  updated_at: string
  projects?: {
    id: string
    name: string
  } | null
}

export interface CreateConversationData {
  title: string
  project_id?: string
  is_shared?: boolean
  metadata?: Record<string, any>
}

export interface UpdateConversationData {
  title?: string
  is_shared?: boolean
  metadata?: Record<string, any>
}

export interface ConversationsResponse {
  conversations: Conversation[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

// API Functions
const conversationsApi = {
  // Get conversations with pagination and filters
  async getConversations(params: {
    project_id?: string
    limit?: number
    offset?: number
    search?: string
  } = {}): Promise<ConversationsResponse> {
    const searchParams = new URLSearchParams()
    
    if (params.project_id) searchParams.set('project_id', params.project_id)
    if (params.limit) searchParams.set('limit', params.limit.toString())
    if (params.offset) searchParams.set('offset', params.offset.toString())
    if (params.search) searchParams.set('search', params.search)

    const response = await fetch(`/api/conversations?${searchParams}`)
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch conversations')
    }
    
    return response.json()
  },

  // Get single conversation
  async getConversation(id: string): Promise<Conversation> {
    const response = await fetch(`/api/conversations/${id}`)
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch conversation')
    }
    
    return response.json()
  },

  // Create conversation
  async createConversation(data: CreateConversationData): Promise<Conversation> {
    const response = await fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create conversation')
    }
    
    return response.json()
  },

  // Update conversation
  async updateConversation(id: string, data: UpdateConversationData): Promise<Conversation> {
    const response = await fetch(`/api/conversations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update conversation')
    }
    
    return response.json()
  },

  // Delete conversation
  async deleteConversation(id: string): Promise<void> {
    const response = await fetch(`/api/conversations/${id}`, {
      method: 'DELETE',
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete conversation')
    }
  },

  // Bulk delete conversations
  async deleteConversations(ids: string[]): Promise<void> {
    const response = await fetch('/api/conversations', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversation_ids: ids }),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete conversations')
    }
  },

  // Bulk update conversations
  async updateConversations(ids: string[], updates: UpdateConversationData): Promise<Conversation[]> {
    const response = await fetch('/api/conversations', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversation_ids: ids, updates }),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update conversations')
    }
    
    const result = await response.json()
    return result.conversations
  },
}

// Hooks
export function useConversations(params: {
  project_id?: string
  search?: string
  limit?: number
} = {}) {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: queryKeys.userConversations(user?.id || ''),
    queryFn: () => conversationsApi.getConversations(params),
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export function useInfiniteConversations(params: {
  project_id?: string
  search?: string
  limit?: number
} = {}) {
  const { user } = useAuth()
  const limit = params.limit || 20
  
  return useInfiniteQuery({
    queryKey: [...queryKeys.userConversations(user?.id || ''), 'infinite', params],
    queryFn: ({ pageParam = 0 }) => 
      conversationsApi.getConversations({
        ...params,
        limit,
        offset: pageParam * limit,
      }),
    initialPageParam: 0,
    enabled: !!user?.id,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.pagination.hasMore ? allPages.length : undefined
    },
    staleTime: 2 * 60 * 1000,
  })
}

export function useConversation(id: string) {
  return useQuery({
    queryKey: queryKeys.conversation(id),
    queryFn: () => conversationsApi.getConversation(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useCreateConversation() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: conversationsApi.createConversation,
    onSuccess: (newConversation) => {
      // Add to conversations list
      queryClient.setQueryData<ConversationsResponse>(
        queryKeys.userConversations(user!.id),
        (old) => {
          if (!old) return { conversations: [newConversation], pagination: { total: 1, limit: 50, offset: 0, hasMore: false } }
          return {
            ...old,
            conversations: [newConversation, ...old.conversations],
            pagination: { ...old.pagination, total: old.pagination.total + 1 }
          }
        }
      )
      
      // Set individual conversation cache
      queryClient.setQueryData(queryKeys.conversation(newConversation.id), newConversation)
      
      // Invalidate infinite queries
      queryClient.invalidateQueries({ 
        queryKey: [...queryKeys.userConversations(user!.id), 'infinite'] 
      })
      
      toast.success('Conversation created successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useUpdateConversation() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateConversationData }) =>
      conversationsApi.updateConversation(id, data),
    onSuccess: (updatedConversation) => {
      // Update individual conversation cache
      queryClient.setQueryData(queryKeys.conversation(updatedConversation.id), updatedConversation)
      
      // Update conversations list
      queryClient.setQueryData<ConversationsResponse>(
        queryKeys.userConversations(user!.id),
        (old) => {
          if (!old) return old
          return {
            ...old,
            conversations: old.conversations.map(conv =>
              conv.id === updatedConversation.id ? updatedConversation : conv
            )
          }
        }
      )
      
      // Invalidate infinite queries
      queryClient.invalidateQueries({ 
        queryKey: [...queryKeys.userConversations(user!.id), 'infinite'] 
      })
      
      toast.success('Conversation updated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useDeleteConversation() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: conversationsApi.deleteConversation,
    onSuccess: (_, deletedId) => {
      // Remove from conversations list
      queryClient.setQueryData<ConversationsResponse>(
        queryKeys.userConversations(user!.id),
        (old) => {
          if (!old) return old
          return {
            ...old,
            conversations: old.conversations.filter(conv => conv.id !== deletedId),
            pagination: { ...old.pagination, total: old.pagination.total - 1 }
          }
        }
      )
      
      // Remove individual conversation cache
      queryClient.removeQueries({ queryKey: queryKeys.conversation(deletedId) })
      
      // Invalidate infinite queries
      queryClient.invalidateQueries({ 
        queryKey: [...queryKeys.userConversations(user!.id), 'infinite'] 
      })
      
      toast.success('Conversation deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useDeleteConversations() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: conversationsApi.deleteConversations,
    onSuccess: (_, deletedIds) => {
      // Remove from conversations list
      queryClient.setQueryData<ConversationsResponse>(
        queryKeys.userConversations(user!.id),
        (old) => {
          if (!old) return old
          return {
            ...old,
            conversations: old.conversations.filter(conv => !deletedIds.includes(conv.id)),
            pagination: { ...old.pagination, total: old.pagination.total - deletedIds.length }
          }
        }
      )
      
      // Remove individual conversation caches
      deletedIds.forEach(id => {
        queryClient.removeQueries({ queryKey: queryKeys.conversation(id) })
      })
      
      // Invalidate infinite queries
      queryClient.invalidateQueries({ 
        queryKey: [...queryKeys.userConversations(user!.id), 'infinite'] 
      })
      
      toast.success(`${deletedIds.length} conversations deleted successfully`)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useUpdateConversations() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ ids, updates }: { ids: string[]; updates: UpdateConversationData }) =>
      conversationsApi.updateConversations(ids, updates),
    onSuccess: (updatedConversations) => {
      // Update conversations list
      queryClient.setQueryData<ConversationsResponse>(
        queryKeys.userConversations(user!.id),
        (old) => {
          if (!old) return old
          const updatedMap = new Map(updatedConversations.map(conv => [conv.id, conv]))
          return {
            ...old,
            conversations: old.conversations.map(conv =>
              updatedMap.has(conv.id) ? updatedMap.get(conv.id)! : conv
            )
          }
        }
      )
      
      // Update individual conversation caches
      updatedConversations.forEach(conversation => {
        queryClient.setQueryData(queryKeys.conversation(conversation.id), conversation)
      })
      
      // Invalidate infinite queries
      queryClient.invalidateQueries({ 
        queryKey: [...queryKeys.userConversations(user!.id), 'infinite'] 
      })
      
      toast.success(`${updatedConversations.length} conversations updated successfully`)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}