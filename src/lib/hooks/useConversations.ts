/**
 * Conversations Management Hook
 * 
 * Convex hooks for managing conversations with real-time updates.
 */

'use client'

import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Id } from '../../../convex/_generated/dataModel'
import { toast } from 'react-hot-toast'

// Types
export interface Conversation {
  _id: Id<"conversations">
  user_id: Id<"users">
  project_id?: Id<"projects">
  title?: string
  is_pinned?: boolean
  is_shared?: boolean
  share_token?: string
  message_count?: number
  last_message_at?: number
  created_at: number
  updated_at: number
}

export interface CreateConversationData {
  title: string
  project_id?: Id<"projects">
  is_shared?: boolean
  metadata?: Record<string, any>
}

export interface UpdateConversationData {
  title?: string
  is_shared?: boolean
  metadata?: Record<string, any>
}

// Hooks
export function useConversations(params: {
  project_id?: Id<"projects">
  search?: string
  limit?: number
} = {}) {
  const conversations = useQuery(api.queries.conversations.list, {})
  
  return {
    data: conversations ? {
      conversations,
      pagination: {
        total: conversations.length,
        limit: params.limit || 50,
        offset: 0,
        hasMore: false,
      }
    } : undefined,
    isLoading: conversations === undefined,
    error: null,
  }
}

export function useConversation(id: Id<"conversations"> | string) {
  const conversation = useQuery(api.queries.conversations.get, { id: id as Id<"conversations"> })
  
  return {
    data: conversation,
    isLoading: conversation === undefined,
    error: null,
  }
}

export function useCreateConversation() {
  const createMutation = useMutation(api.mutations.conversations.create)
  
  return {
    mutate: async (data: CreateConversationData) => {
      try {
        const id = await createMutation({ title: data.title })
        toast.success('Conversation created successfully')
        return id
      } catch (error: any) {
        toast.error(error.message)
        throw error
      }
    },
    mutateAsync: async (data: CreateConversationData) => {
      const id = await createMutation({ title: data.title })
      toast.success('Conversation created successfully')
      return id
    },
  }
}

export function useUpdateConversation() {
  const updateMutation = useMutation(api.mutations.conversations.update)
  
  return {
    mutate: async ({ id, data }: { id: Id<"conversations">; data: UpdateConversationData }) => {
      try {
        await updateMutation({ id, title: data.title! })
        toast.success('Conversation updated successfully')
      } catch (error: any) {
        toast.error(error.message)
        throw error
      }
    },
    mutateAsync: async ({ id, data }: { id: Id<"conversations">; data: UpdateConversationData }) => {
      await updateMutation({ id, title: data.title! })
      toast.success('Conversation updated successfully')
    },
  }
}

export function useDeleteConversation() {
  const deleteMutation = useMutation(api.mutations.conversations.remove)
  
  return {
    mutate: async (id: Id<"conversations">) => {
      try {
        await deleteMutation({ id })
        toast.success('Conversation deleted successfully')
      } catch (error: any) {
        toast.error(error.message)
        throw error
      }
    },
    mutateAsync: async (id: Id<"conversations">) => {
      await deleteMutation({ id })
      toast.success('Conversation deleted successfully')
    },
  }
}

// Bulk operations still use API routes for efficiency
export function useDeleteConversations() {
  return {
    mutate: async (ids: string[]) => {
      try {
        const response = await fetch('/api/conversations', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversation_ids: ids }),
        })
        
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to delete conversations')
        }
        
        toast.success(`${ids.length} conversations deleted successfully`)
      } catch (error: any) {
        toast.error(error.message)
        throw error
      }
    },
  }
}

export function useUpdateConversations() {
  return {
    mutate: async ({ ids, updates }: { ids: string[]; updates: UpdateConversationData }) => {
      try {
        const response = await fetch('/api/conversations', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversation_ids: ids, updates }),
        })
        
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to update conversations')
        }
        
        toast.success(`${ids.length} conversations updated successfully`)
      } catch (error: any) {
        toast.error(error.message)
        throw error
      }
    },
  }
}
