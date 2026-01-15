/**
 * Documents Management Hook
 * 
 * Convex hooks for managing documents with upload, processing,
 * and sharing capabilities. Uses Convex reactive queries for real-time updates.
 */

'use client'

import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Id } from '../../../convex/_generated/dataModel'
import { toast } from 'react-hot-toast'

// Types
export interface Document {
  _id: Id<"documents">
  user_id: Id<"users">
  project_id?: Id<"projects">
  title?: string
  filename: string
  file_name?: string
  file_size: number
  mime_type: string
  storage_id?: Id<"_storage">
  processing_status: 'pending' | 'processing' | 'completed' | 'failed'
  status?: 'pending' | 'processing' | 'completed' | 'failed'
  chunk_count?: number
  error_message?: string
  created_at: number
  updated_at: number
}

export interface UpdateDocumentData {
  filename?: string
  project_id?: Id<"projects">
  metadata?: Record<string, any>
}

// Hooks
export function useDocuments(params: {
  project_id?: Id<"projects">
  status?: string
} = {}) {
  const documents = useQuery(api.queries.documents.list, params.project_id ? { projectId: params.project_id } : {})
  
  return {
    data: documents ? { documents, total: documents.length } : undefined,
    isLoading: documents === undefined,
    error: null,
  }
}

export function useDocument(id: Id<"documents"> | string) {
  const document = useQuery(api.queries.documents.get, { id: id as Id<"documents"> })
  
  return {
    data: document,
    isLoading: document === undefined,
    error: null,
  }
}

export function useUpdateDocument() {
  const updateMutation = useMutation(api.mutations.documents.updateStatus)
  
  return {
    mutate: async ({ id, data }: { id: Id<"documents">; data: UpdateDocumentData }) => {
      try {
        await updateMutation({ 
          id, 
          status: data.metadata?.status || 'completed' 
        })
        toast.success('Document updated successfully')
      } catch (error: any) {
        toast.error(error.message)
        throw error
      }
    },
    mutateAsync: async ({ id, data }: { id: Id<"documents">; data: UpdateDocumentData }) => {
      await updateMutation({ 
        id, 
        status: data.metadata?.status || 'completed' 
      })
      toast.success('Document updated successfully')
    },
  }
}

export function useDeleteDocument() {
  const deleteMutation = useMutation(api.mutations.documents.remove)
  
  return {
    mutate: async (id: Id<"documents">) => {
      try {
        await deleteMutation({ id })
        toast.success('Document deleted successfully')
      } catch (error: any) {
        toast.error(error.message)
        throw error
      }
    },
    mutateAsync: async (id: Id<"documents">) => {
      await deleteMutation({ id })
      toast.success('Document deleted successfully')
    },
  }
}

// Note: Upload, share, and download functionality still uses API routes
// as they involve file handling which is better suited for HTTP endpoints
export function useUploadDocument() {
  return {
    mutate: async (data: { file: File; project_id?: string; metadata?: Record<string, any> }) => {
      const formData = new FormData()
      formData.append('file', data.file)
      if (data.project_id) formData.append('project_id', data.project_id)
      if (data.metadata) formData.append('metadata', JSON.stringify(data.metadata))

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        const error = await response.json()
        toast.error(error.error || 'Failed to upload document')
        throw new Error(error.error || 'Failed to upload document')
      }
      
      const result = await response.json()
      toast.success('Document uploaded successfully')
      return result
    },
    mutateAsync: async (data: { file: File; project_id?: string; metadata?: Record<string, any> }) => {
      const formData = new FormData()
      formData.append('file', data.file)
      if (data.project_id) formData.append('project_id', data.project_id)
      if (data.metadata) formData.append('metadata', JSON.stringify(data.metadata))

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to upload document')
      }
      
      const result = await response.json()
      toast.success('Document uploaded successfully')
      return result
    },
  }
}

export function useDownloadDocument() {
  return {
    mutate: async (documentId: string) => {
      try {
        const response = await fetch(`/api/documents/${documentId}/download`)
        
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to download document')
        }
        
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `document-${documentId}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        toast.success('Document downloaded successfully')
      } catch (error: any) {
        toast.error(error.message)
        throw error
      }
    },
  }
}
