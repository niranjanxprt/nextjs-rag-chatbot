/**
 * Knowledge Base Management Hook
 * 
 * React Query hook for managing knowledge bases and their
 * associated documents.
 */

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/lib/auth/context'
import { queryKeys } from '@/lib/react-query/queryClient'
import { toast } from 'react-hot-toast'

// Types
export interface KnowledgeBase {
  id: string
  name: string
  description: string | null
  user_id: string
  project_id: string | null
  is_public: boolean
  settings: {
    auto_update?: boolean
    embedding_model?: string
    chunk_size?: number
    chunk_overlap?: number
    [key: string]: any
  }
  created_at: string
  updated_at: string
  projects?: {
    id: string
    name: string
  } | null
  _count?: {
    documents: number
  }
}

export interface KnowledgeBaseDocument {
  id: string
  knowledge_base_id: string
  document_id: string
  added_by: string
  added_at: string
  documents: {
    id: string
    filename: string
    original_filename: string
    file_size: number
    file_type: string
    status: string
    chunk_count: number
    created_at: string
  }
}

export interface CreateKnowledgeBaseData {
  name: string
  description?: string
  project_id?: string
  is_public?: boolean
  settings?: Record<string, any>
}

export interface UpdateKnowledgeBaseData {
  name?: string
  description?: string
  is_public?: boolean
  settings?: Record<string, any>
}

export interface AddDocumentToKBData {
  document_id: string
}

// API Functions
const knowledgeBaseApi = {
  // Get knowledge bases
  async getKnowledgeBases(params: {
    project_id?: string
    is_public?: boolean
  } = {}): Promise<KnowledgeBase[]> {
    const searchParams = new URLSearchParams()
    
    if (params.project_id) searchParams.set('project_id', params.project_id)
    if (params.is_public !== undefined) searchParams.set('is_public', params.is_public.toString())

    const response = await fetch(`/api/knowledge-base?${searchParams}`)
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch knowledge bases')
    }
    
    return response.json()
  },

  // Get single knowledge base
  async getKnowledgeBase(id: string): Promise<KnowledgeBase> {
    const response = await fetch(`/api/knowledge-base/${id}`)
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch knowledge base')
    }
    
    return response.json()
  },

  // Create knowledge base
  async createKnowledgeBase(data: CreateKnowledgeBaseData): Promise<KnowledgeBase> {
    const response = await fetch('/api/knowledge-base', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create knowledge base')
    }
    
    return response.json()
  },

  // Update knowledge base
  async updateKnowledgeBase(id: string, data: UpdateKnowledgeBaseData): Promise<KnowledgeBase> {
    const response = await fetch(`/api/knowledge-base/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update knowledge base')
    }
    
    return response.json()
  },

  // Delete knowledge base
  async deleteKnowledgeBase(id: string): Promise<void> {
    const response = await fetch(`/api/knowledge-base/${id}`, {
      method: 'DELETE',
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete knowledge base')
    }
  },

  // Get knowledge base documents
  async getKnowledgeBaseDocuments(id: string): Promise<KnowledgeBaseDocument[]> {
    const response = await fetch(`/api/knowledge-base/${id}/documents`)
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch knowledge base documents')
    }
    
    return response.json()
  },

  // Add document to knowledge base
  async addDocumentToKB(id: string, data: AddDocumentToKBData): Promise<KnowledgeBaseDocument> {
    const response = await fetch(`/api/knowledge-base/${id}/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to add document to knowledge base')
    }
    
    return response.json()
  },

  // Remove document from knowledge base
  async removeDocumentFromKB(id: string, documentId: string): Promise<void> {
    const response = await fetch(`/api/knowledge-base/${id}/documents/${documentId}`, {
      method: 'DELETE',
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to remove document from knowledge base')
    }
  },

  // Search knowledge base
  async searchKnowledgeBase(id: string, query: string, options: {
    limit?: number
    threshold?: number
  } = {}): Promise<{
    results: Array<{
      document_id: string
      chunk_id: string
      content: string
      similarity: number
      metadata: Record<string, any>
    }>
    total: number
  }> {
    const searchParams = new URLSearchParams({ query })
    
    if (options.limit) searchParams.set('limit', options.limit.toString())
    if (options.threshold) searchParams.set('threshold', options.threshold.toString())

    const response = await fetch(`/api/knowledge-base/${id}/search?${searchParams}`)
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to search knowledge base')
    }
    
    return response.json()
  },
}

// Hooks
export function useKnowledgeBases(params: {
  project_id?: string
  is_public?: boolean
} = {}) {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: queryKeys.knowledgeBases,
    queryFn: () => knowledgeBaseApi.getKnowledgeBases(params),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useKnowledgeBase(id: string) {
  return useQuery({
    queryKey: queryKeys.knowledgeBase(id),
    queryFn: () => knowledgeBaseApi.getKnowledgeBase(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateKnowledgeBase() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: knowledgeBaseApi.createKnowledgeBase,
    onSuccess: (newKB) => {
      // Add to knowledge bases list
      queryClient.setQueryData<KnowledgeBase[]>(queryKeys.knowledgeBases, (old) => {
        if (!old) return [newKB]
        return [newKB, ...old]
      })
      
      // Set individual KB cache
      queryClient.setQueryData(queryKeys.knowledgeBase(newKB.id), newKB)
      
      toast.success('Knowledge base created successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useUpdateKnowledgeBase() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateKnowledgeBaseData }) =>
      knowledgeBaseApi.updateKnowledgeBase(id, data),
    onSuccess: (updatedKB) => {
      // Update individual KB cache
      queryClient.setQueryData(queryKeys.knowledgeBase(updatedKB.id), updatedKB)
      
      // Update knowledge bases list
      queryClient.setQueryData<KnowledgeBase[]>(queryKeys.knowledgeBases, (old) => {
        if (!old) return old
        return old.map(kb => kb.id === updatedKB.id ? updatedKB : kb)
      })
      
      toast.success('Knowledge base updated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useDeleteKnowledgeBase() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: knowledgeBaseApi.deleteKnowledgeBase,
    onSuccess: (_, deletedId) => {
      // Remove from knowledge bases list
      queryClient.setQueryData<KnowledgeBase[]>(queryKeys.knowledgeBases, (old) => {
        if (!old) return old
        return old.filter(kb => kb.id !== deletedId)
      })
      
      // Remove individual KB cache
      queryClient.removeQueries({ queryKey: queryKeys.knowledgeBase(deletedId) })
      queryClient.removeQueries({ queryKey: queryKeys.knowledgeBaseDocuments(deletedId) })
      
      toast.success('Knowledge base deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useKnowledgeBaseDocuments(id: string) {
  return useQuery({
    queryKey: queryKeys.knowledgeBaseDocuments(id),
    queryFn: () => knowledgeBaseApi.getKnowledgeBaseDocuments(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export function useAddDocumentToKB() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AddDocumentToKBData }) =>
      knowledgeBaseApi.addDocumentToKB(id, data),
    onSuccess: (newKBDoc, { id }) => {
      // Add to KB documents list
      queryClient.setQueryData<KnowledgeBaseDocument[]>(
        queryKeys.knowledgeBaseDocuments(id),
        (old) => {
          if (!old) return [newKBDoc]
          return [newKBDoc, ...old]
        }
      )
      
      // Update KB document count
      queryClient.setQueryData<KnowledgeBase>(
        queryKeys.knowledgeBase(id),
        (old) => {
          if (!old) return old
          return {
            ...old,
            _count: {
              ...old._count,
              documents: (old._count?.documents || 0) + 1
            }
          }
        }
      )
      
      toast.success('Document added to knowledge base')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useRemoveDocumentFromKB() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, documentId }: { id: string; documentId: string }) =>
      knowledgeBaseApi.removeDocumentFromKB(id, documentId),
    onSuccess: (_, { id, documentId }) => {
      // Remove from KB documents list
      queryClient.setQueryData<KnowledgeBaseDocument[]>(
        queryKeys.knowledgeBaseDocuments(id),
        (old) => {
          if (!old) return old
          return old.filter(doc => doc.document_id !== documentId)
        }
      )
      
      // Update KB document count
      queryClient.setQueryData<KnowledgeBase>(
        queryKeys.knowledgeBase(id),
        (old) => {
          if (!old) return old
          return {
            ...old,
            _count: {
              ...old._count,
              documents: Math.max((old._count?.documents || 1) - 1, 0)
            }
          }
        }
      )
      
      toast.success('Document removed from knowledge base')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useSearchKnowledgeBase() {
  return useMutation({
    mutationFn: ({ id, query, options }: { 
      id: string
      query: string
      options?: { limit?: number; threshold?: number }
    }) => knowledgeBaseApi.searchKnowledgeBase(id, query, options),
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}