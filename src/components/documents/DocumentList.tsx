/**
 * Document List Component
 * 
 * Displays user documents with status indicators, search, and management actions
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { 
  File, 
  Search, 
  MoreVertical, 
  Trash2, 
  Download, 
  RefreshCw,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Document, PaginatedResponse } from '@/lib/types/database'

// =============================================================================
// Types
// =============================================================================

interface DocumentListProps {
  className?: string
  onDocumentSelect?: (document: Document) => void
  onDocumentDelete?: (documentId: string) => void
}

interface DocumentsResponse extends PaginatedResponse<Document> {
  meta?: {
    totalDocuments: number
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'completed':
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Processed
        </Badge>
      )
    case 'processing':
      return (
        <Badge variant="default" className="bg-blue-100 text-blue-800">
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          Processing
        </Badge>
      )
    case 'pending':
      return (
        <Badge variant="secondary">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </Badge>
      )
    case 'failed':
      return (
        <Badge variant="destructive">
          <AlertCircle className="w-3 h-3 mr-1" />
          Failed
        </Badge>
      )
    default:
      return (
        <Badge variant="outline">
          {status}
        </Badge>
      )
  }
}

function getFileIcon(mimeType: string) {
  // You could expand this to show different icons for different file types
  return <File className="w-4 h-4" />
}

// =============================================================================
// Component
// =============================================================================

export function DocumentList({ 
  className, 
  onDocumentSelect, 
  onDocumentDelete 
}: DocumentListProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  })
  const [totalDocuments, setTotalDocuments] = useState(0)
  const router = useRouter()

  // =============================================================================
  // API Functions
  // =============================================================================

  const fetchDocuments = useCallback(async (page: number = 1, search: string = '') => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        sortBy: 'created_at',
        sortOrder: 'desc'
      })

      if (search.trim()) {
        params.append('search', search.trim())
      }

      const response = await fetch(`/api/documents?${params}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to fetch documents')
      }

      const data: DocumentsResponse = await response.json()
      
      setDocuments(data.data)
      setPagination(data.pagination)
      setTotalDocuments(data.meta?.totalDocuments || 0)

    } catch (error) {
      console.error('Error fetching documents:', error)
      setError(error instanceof Error ? error.message : 'Failed to load documents')
    } finally {
      setLoading(false)
    }
  }, [pagination.limit])

  const deleteDocument = useCallback(async (documentId: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to delete document')
      }

      // Remove document from local state
      setDocuments(prev => prev.filter(doc => doc.id !== documentId))
      setTotalDocuments(prev => prev - 1)
      
      onDocumentDelete?.(documentId)

    } catch (error) {
      console.error('Error deleting document:', error)
      setError(error instanceof Error ? error.message : 'Failed to delete document')
    }
  }, [onDocumentDelete])

  const reprocessDocument = useCallback(async (documentId: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to reprocess document')
      }

      // Update document status in local state
      setDocuments(prev => prev.map(doc => 
        doc.id === documentId 
          ? { ...doc, processing_status: 'processing', error_message: null }
          : doc
      ))

    } catch (error) {
      console.error('Error reprocessing document:', error)
      setError(error instanceof Error ? error.message : 'Failed to reprocess document')
    }
  }, [])

  // =============================================================================
  // Event Handlers
  // =============================================================================

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
    fetchDocuments(1, query)
  }, [fetchDocuments])

  const handlePageChange = useCallback((newPage: number) => {
    fetchDocuments(newPage, searchQuery)
  }, [fetchDocuments, searchQuery])

  const handleRefresh = useCallback(() => {
    fetchDocuments(pagination.page, searchQuery)
  }, [fetchDocuments, pagination.page, searchQuery])

  const handleDocumentClick = useCallback((document: Document) => {
    onDocumentSelect?.(document)
  }, [onDocumentSelect])

  const handleDeleteClick = useCallback((document: Document, e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (confirm(`Are you sure you want to delete "${document.filename}"? This action cannot be undone.`)) {
      deleteDocument(document.id)
    }
  }, [deleteDocument])

  const handleReprocessClick = useCallback((document: Document, e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (confirm(`Reprocess "${document.filename}"? This will regenerate embeddings and may take a few minutes.`)) {
      reprocessDocument(document.id)
    }
  }, [reprocessDocument])

  // =============================================================================
  // Effects
  // =============================================================================

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  // Auto-refresh processing documents
  useEffect(() => {
    const processingDocs = documents.filter(doc => doc.processing_status === 'processing')
    
    if (processingDocs.length > 0) {
      const interval = setInterval(() => {
        fetchDocuments(pagination.page, searchQuery)
      }, 5000) // Check every 5 seconds

      return () => clearInterval(interval)
    }
  }, [documents, fetchDocuments, pagination.page, searchQuery])

  // =============================================================================
  // Render
  // =============================================================================

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Documents</h2>
          <p className="text-muted-foreground">
            {totalDocuments} document{totalDocuments !== 1 ? 's' : ''} in your knowledge base
          </p>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Document List */}
      {loading && documents.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span>Loading documents...</span>
        </div>
      ) : documents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <File className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
            <p className="text-gray-500 text-center mb-4">
              {searchQuery 
                ? `No documents match "${searchQuery}"`
                : "Upload your first document to get started"
              }
            </p>
            {!searchQuery && (
              <Button onClick={() => router.push('/documents/upload')}>
                Upload Document
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {documents.map((document) => (
            <Card 
              key={document.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleDocumentClick(document)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {getFileIcon(document.mime_type)}
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{document.filename}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{formatFileSize(document.file_size)}</span>
                        <span>{formatDate(document.created_at)}</span>
                        {document.chunk_count > 0 && (
                          <span>{document.chunk_count} chunks</span>
                        )}
                      </div>
                      {document.error_message && (
                        <p className="text-sm text-red-600 mt-1">
                          {document.error_message}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {getStatusBadge(document.processing_status)}
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {document.processing_status === 'failed' && (
                          <DropdownMenuItem 
                            onClick={(e) => handleReprocessClick(document, e)}
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Reprocess
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          onClick={(e) => handleDeleteClick(document, e)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} documents
          </p>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={!pagination.hasPrev}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={!pagination.hasNext}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}