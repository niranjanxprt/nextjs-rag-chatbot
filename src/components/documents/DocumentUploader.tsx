/**
 * Document Uploader Component
 * 
 * Provides drag-and-drop file upload interface with progress tracking
 * and validation feedback
 */

'use client'

import React, { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { useToastActions } from '@/components/ui/toast'
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

// =============================================================================
// Types
// =============================================================================

interface UploadFile {
  file: File
  id: string
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error'
  progress: number
  error?: string
  documentId?: string
}

interface DocumentUploaderProps {
  onUploadComplete?: (documentId: string) => void
  onUploadError?: (error: string) => void
  className?: string
}

// =============================================================================
// Configuration
// =============================================================================

const SUPPORTED_TYPES = [
  'application/pdf',
  'text/plain',
  'text/markdown',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_FILES = 5

// =============================================================================
// Helper Functions
// =============================================================================

function validateFile(file: File): string | null {
  if (!SUPPORTED_TYPES.includes(file.type)) {
    return `File type ${file.type} is not supported. Supported types: PDF, TXT, Markdown, Word documents.`
  }
  
  if (file.size > MAX_FILE_SIZE) {
    return `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB.`
  }
  
  if (file.size === 0) {
    return 'File cannot be empty.'
  }
  
  return null
}

function generateFileId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

// =============================================================================
// Component
// =============================================================================

export function DocumentUploader({ 
  onUploadComplete, 
  onUploadError, 
  className 
}: DocumentUploaderProps) {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const toast = useToastActions()

  // =============================================================================
  // File Upload Functions
  // =============================================================================

  const uploadFile = useCallback(async (uploadFile: UploadFile): Promise<void> => {
    try {
      // Update status to uploading
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, status: 'uploading', progress: 0 }
          : f
      ))

      // Create FormData
      const formData = new FormData()
      formData.append('file', uploadFile.file)

      // Upload file
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Upload failed')
      }

      const result = await response.json()
      const documentId = result.data.document.id

      // Update status to processing
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, status: 'processing', progress: 50, documentId }
          : f
      ))

      // Start document processing
      const processResponse = await fetch(`/api/documents/${documentId}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      })

      if (!processResponse.ok) {
        const errorData = await processResponse.json()
        throw new Error(errorData.message || 'Processing failed')
      }

      // Update status to completed
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, status: 'completed', progress: 100 }
          : f
      ))

      onUploadComplete?.(documentId)
      toast.success('Document uploaded successfully', `${uploadFile.file.name} has been processed and is ready for search.`)

    } catch (error) {
      console.error('Upload error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, status: 'error', error: errorMessage }
          : f
      ))

      onUploadError?.(errorMessage)
      toast.error('Upload failed', errorMessage)
    }
  }, [onUploadComplete, onUploadError, toast])

  // =============================================================================
  // Event Handlers
  // =============================================================================

  const handleFileSelect = useCallback((selectedFiles: FileList | File[]) => {
    const fileArray = Array.from(selectedFiles)
    
    // Check total file limit
    if (files.length + fileArray.length > MAX_FILES) {
      onUploadError?.(`Maximum ${MAX_FILES} files allowed`)
      return
    }

    const newFiles: UploadFile[] = []
    
    for (const file of fileArray) {
      const validationError = validateFile(file)
      
      if (validationError) {
        onUploadError?.(validationError)
        continue
      }

      // Check for duplicates
      const isDuplicate = files.some(f => 
        f.file.name === file.name && f.file.size === file.size
      )
      
      if (isDuplicate) {
        onUploadError?.(`File "${file.name}" is already selected`)
        continue
      }

      newFiles.push({
        file,
        id: generateFileId(),
        status: 'pending',
        progress: 0
      })
    }

    if (newFiles.length > 0) {
      setFiles(prev => [...prev, ...newFiles])
    }
  }, [files, onUploadError])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const droppedFiles = e.dataTransfer.files
    handleFileSelect(droppedFiles)
  }, [handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileSelect(e.target.files)
    }
  }, [handleFileSelect])

  const handleRemoveFile = useCallback((fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
  }, [])

  const handleUploadAll = useCallback(async () => {
    const pendingFiles = files.filter(f => f.status === 'pending')
    
    if (pendingFiles.length === 0) {
      return
    }

    setIsUploading(true)

    try {
      // Upload files sequentially to avoid overwhelming the server
      for (const file of pendingFiles) {
        await uploadFile(file)
      }
    } finally {
      setIsUploading(false)
    }
  }, [files, uploadFile])

  const handleClearCompleted = useCallback(() => {
    setFiles(prev => prev.filter(f => f.status !== 'completed' && f.status !== 'error'))
  }, [])

  // =============================================================================
  // Render Helpers
  // =============================================================================

  const getStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'uploading':
      case 'processing':
        return <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      default:
        return <File className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusText = (file: UploadFile) => {
    switch (file.status) {
      case 'pending':
        return 'Ready to upload'
      case 'uploading':
        return 'Uploading...'
      case 'processing':
        return 'Processing...'
      case 'completed':
        return 'Completed'
      case 'error':
        return file.error || 'Error'
      default:
        return ''
    }
  }

  const pendingCount = files.filter(f => f.status === 'pending').length
  const completedCount = files.filter(f => f.status === 'completed').length
  const errorCount = files.filter(f => f.status === 'error').length

  // =============================================================================
  // Render
  // =============================================================================

  return (
    <div className={cn('space-y-4', className)}>
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Documents</CardTitle>
          <CardDescription>
            Upload PDF, TXT, Markdown, or Word documents to add to your knowledge base.
            Maximum file size: 10MB. Maximum {MAX_FILES} files at once.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
              isDragOver 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            )}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            role="button"
            tabIndex={0}
            aria-label="File upload area. Click to browse files or drag and drop files here."
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                fileInputRef.current?.click()
              }
            }}
          >
            <Upload className={cn(
              'mx-auto h-12 w-12 mb-4 transition-colors',
              isDragOver ? 'text-blue-500' : 'text-gray-400'
            )} />
            <p className={cn(
              'text-lg font-medium mb-2 transition-colors',
              isDragOver ? 'text-blue-700' : 'text-gray-900'
            )}>
              {isDragOver ? 'Drop files here' : 'Drop files here or click to browse'}
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Supported formats: PDF, TXT, Markdown, Word documents
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              Choose Files
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.txt,.md,.doc,.docx"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Selected Files ({files.length})</CardTitle>
              <CardDescription>
                {pendingCount > 0 && `${pendingCount} pending`}
                {completedCount > 0 && `, ${completedCount} completed`}
                {errorCount > 0 && `, ${errorCount} failed`}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {completedCount > 0 || errorCount > 0 ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearCompleted}
                >
                  Clear Completed
                </Button>
              ) : null}
              {pendingCount > 0 && (
                <Button
                  onClick={handleUploadAll}
                  disabled={isUploading}
                  size="sm"
                >
                  Upload All ({pendingCount})
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-3 p-3 border rounded-lg"
                >
                  {getStatusIcon(file.status)}
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {file.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(file.file.size / 1024 / 1024).toFixed(2)} MB • {getStatusText(file)}
                    </p>
                    
                    {(file.status === 'uploading' || file.status === 'processing') && (
                      <Progress value={file.progress} className="mt-2 h-1" />
                    )}
                    
                    {file.status === 'error' && file.error && (
                      <Alert className="mt-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          {file.error}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                  
                  {file.status === 'pending' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFile(file.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}