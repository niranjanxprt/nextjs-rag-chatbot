/**
 * Documents Management Hook
 * 
 * React Query hook for managing documents with upload, processing,
 * and sharing capabilities.
 */

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/lib/auth/context'
import { queryKeys } from '@/lib/react-query/queryClient'
import { toast } from 'react-hot-toast'

// Types
export interface Document {
  id: string
  filename: string
  original_filename: string
  file_size: number
  file_type: string
  user_id: string
  project_id: string | null
  status: 'uploading' | 'processing' | 'completed' | 'failed'
  processing_progress: number
  chunk_count: number
  embedding_status: 'pending' | 'processing' | 'completed' | 'failed'
  metadata: {
    pages?: number
    word_count?: number
    language?: string
    [key: string]: any
  }
  created_at: string
  updated_at: string
  projects?: {
    id: string
    name: string
  } | null
}

export interface DocumentShare {
  id: string
  document_id: string
  shared_by: string
  shared_with: string | null
  share_type: 'private' | 'project' | 'public'
  permissions: {
    read: boolean
    download: boolean
  }
  share_token: string | null
  expires_at: string | null
  created_at: string
  updated_at: string
}

export interface UploadDocumentData {
  file: File
  project_id?: string
  metadata?: Record<string, any>
}

export interface UpdateDocumentData {
  filename?: string
  project_id?: string
  metadata?: Record<string, any>
}

export interface ShareDocumentData {
  shared_with?: string
  share_type: 'private' | 'project' | 'public'
  permissions: {
    read: boolean
    download: boolean
  }
  expires_at?: string
}

// API Functions
const documentsApi = {
  // Get user's documents
  async getDocuments(params: {
    project_id?: string
    status?: string
    limit?: number
    offset?: number
  } = {}): Promise<{ documents: Document[]; total: number }> {
    const searchParams = new URLSearchParams()
    
    if (params.project_id) searchParams.set('project_id', params.project_id)
    if (params.status) searchParams.set('status', params.status)
    if (params.limit) searchParams.set('limit', params.limit.toString())
    if (params.offset) searchParams.set('offset', params.offset.toString())

    const response = await fetch(`/api/documents?${searchParams}`)
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch documents')
    }
    
    return response.json()
  },

  // Get single document
  async getDocument(id: string): Promise<Document> {
    const response = await fetch(`/api/documents/${id}`)
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch document')
    }
    
    return response.json()
  },

  // Upload document
  async uploadDocument(data: UploadDocumentData): Promise<Document> {
    const formData = new FormData()
    formData.append('file', data.file)
    
    if (data.project_id) {
      formData.append('project_id', data.project_id)
    }
    
    if (data.metadata) {
      formData.append('metadata', JSON.stringify(data.metadata))
    }

    const response = await fetch('/api/documents/upload', {
      method: 'POST',
      body: formData,
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to upload document')
    }
    
    return response.json()
  },

  // Update document
  async updateDocument(id: string, data: UpdateDocumentData): Promise<Document> {
    const response = await fetch(`/api/documents/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update document')
    }
    
    return response.json()
  },

  // Delete document
  async deleteDocument(id: string): Promise<void> {
    const response = await fetch(`/api/documents/${id}`, {
      method: 'DELETE',
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete document')
    }
  },

  // Share document
  async shareDocument(id: string, data: ShareDocumentData): Promise<DocumentShare> {
    const response = await fetch(`/api/documents/${id}/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to share document')
    }
    
    return response.json()
  },

  // Get document shares
  async getDocumentShares(id: string): Promise<DocumentShare[]> {
    const response = await fetch(`/api/documents/${id}/shares`)
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch document shares')
    }
    
    return response.json()
  },

  // Download document
  async downloadDocument(id: string): Promise<Blob> {
    const response = await fetch(`/api/documents/${id}/download`)
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to download document')
    }
    
    return response.blob()
  },
}

// Hooks
export function useDocuments(params: {
  project_id?: string
  status?: string
} = {}) {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: params.project_id 
      ? queryKeys.projectDocuments(params.project_id)
      : queryKeys.userDocuments(user?.id || ''),
    queryFn: () => documentsApi.getDocuments(params),
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export function useDocument(id: string) {
  return useQuery({
    queryKey: queryKeys.document(id),
    queryFn: () => documentsApi.getDocument(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

export function useUploadDocument() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: documentsApi.uploadDocument,
    onSuccess: (newDocument) => {
      // Add to documents list
      const queryKey = newDocument.project_id 
        ? queryKeys.projectDocuments(newDocument.project_id)
        : queryKeys.userDocuments(user!.id)
      
      queryClient.setQueryData<{ documents: Document[]; total: number }>(
        queryKey,
        (old) => {
          if (!old) return { documents: [newDocument], total: 1 }
          return {
            documents: [newDocument, ...old.documents],
            total: old.total + 1
          }
        }
      )
      
      // Set individual document cache
      queryClient.setQueryData(queryKeys.document(newDocument.id), newDocument)
      
      toast.success('Document uploaded successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useUpdateDocument() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDocumentData }) =>
      documentsApi.updateDocument(id, data),
    onSuccess: (updatedDocument) => {
      // Update individual document cache
      queryClient.setQueryData(queryKeys.document(updatedDocument.id), updatedDocument)
      
      // Update documents lists
      const userQueryKey = queryKeys.userDocuments(user!.id)
      queryClient.setQueryData<{ documents: Document[]; total: number }>(
        userQueryKey,
        (old) => {
          if (!old) return old
          return {
            ...old,
            documents: old.documents.map(doc =>
              doc.id === updatedDocument.id ? updatedDocument : doc
            )
          }
        }
      )
      
      // Update project documents if applicable
      if (updatedDocument.project_id) {
        const projectQueryKey = queryKeys.projectDocuments(updatedDocument.project_id)
        queryClient.setQueryData<{ documents: Document[]; total: number }>(
          projectQueryKey,
          (old) => {
            if (!old) return old
            return {
              ...old,
              documents: old.documents.map(doc =>
                doc.id === updatedDocument.id ? updatedDocument : doc
              )
            }
          }
        )
      }
      
      toast.success('Document updated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useDeleteDocument() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: documentsApi.deleteDocument,
    onSuccess: (_, deletedId) => {
      // Get the document to know which lists to update
      const document = queryClient.getQueryData<Document>(queryKeys.document(deletedId))
      
      // Remove from user documents list
      const userQueryKey = queryKeys.userDocuments(user!.id)
      queryClient.setQueryData<{ documents: Document[]; total: number }>(
        userQueryKey,
        (old) => {
          if (!old) return old
          return {
            ...old,
            documents: old.documents.filter(doc => doc.id !== deletedId),
            total: old.total - 1
          }
        }
      )
      
      // Remove from project documents if applicable
      if (document?.project_id) {
        const projectQueryKey = queryKeys.projectDocuments(document.project_id)
        queryClient.setQueryData<{ documents: Document[]; total: number }>(
          projectQueryKey,
          (old) => {
            if (!old) return old
            return {
              ...old,
              documents: old.documents.filter(doc => doc.id !== deletedId),
              total: old.total - 1
            }
          }
        )
      }
      
      // Remove individual document cache
      queryClient.removeQueries({ queryKey: queryKeys.document(deletedId) })
      
      toast.success('Document deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useShareDocument() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ShareDocumentData }) =>
      documentsApi.shareDocument(id, data),
    onSuccess: (share) => {
      // Invalidate document shares
      queryClient.invalidateQueries({ 
        queryKey: [...queryKeys.document(share.document_id), 'shares'] 
      })
      
      toast.success('Document shared successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useDocumentShares(documentId: string) {
  return useQuery({
    queryKey: [...queryKeys.document(documentId), 'shares'],
    queryFn: () => documentsApi.getDocumentShares(documentId),
    enabled: !!documentId,
    staleTime: 2 * 60 * 1000,
  })
}

export function useDownloadDocument() {
  return useMutation({
    mutationFn: documentsApi.downloadDocument,
    onSuccess: (blob, documentId) => {
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `document-${documentId}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('Document downloaded successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}