/**
 * Documents Page
 *
 * Main page for document management with upload and list functionality
 */

'use client'

import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import { useDocuments } from '@/lib/hooks/useDocuments'
import { DocumentUploader } from '@/components/documents/DocumentUploader'
import { DocumentList } from '@/components/documents/DocumentList'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { FileText, Upload, Loader2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

// Dynamically import AppLayout to avoid SSR issues
const AppLayout = dynamic(() => import('@/components/layouts/AppLayout').then(mod => ({ default: mod.AppLayout })), {
  ssr: false,
  loading: () => <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>
})

export default function DocumentsPage() {
  const { data: documentsData, isLoading, error } = useDocuments()
  const [activeTab, setActiveTab] = useState('list')

  const documents = documentsData?.documents || []
  const totalDocuments = documentsData?.total || 0

  const handleUploadComplete = (documentId: string) => {
    console.log('Document uploaded:', documentId)
    // Convex queries are reactive and will automatically update
    setActiveTab('list')
  }

  const handleUploadError = (error: string) => {
    console.error('Upload error:', error)
  }

  // Loading state
  if (isLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto py-6 space-y-6 px-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <FileText className="w-8 h-8" />
              Document Management
            </h1>
            <p className="text-muted-foreground">
              Upload and manage your documents for the RAG chatbot knowledge base.
            </p>
          </div>
          
          <div className="space-y-4">
            <Skeleton className="h-10 w-64" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-20 w-full" />
                  <div className="flex gap-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  // Error state
  if (error) {
    const errorMessage = typeof error === 'string' ? error : 'An error occurred'
    return (
      <AppLayout>
        <div className="container mx-auto py-6 px-6">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Documents</h2>
              <p className="text-muted-foreground mb-4">{errorMessage}</p>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="container mx-auto py-6 space-y-6 px-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <FileText className="w-8 h-8" />
              Document Management
            </h1>
            <p className="text-muted-foreground">
              Upload and manage your documents for the RAG chatbot knowledge base.
            </p>
          </div>
          
          {/* Stats */}
          <div className="text-right">
            <div className="text-2xl font-bold">{totalDocuments}</div>
            <div className="text-sm text-muted-foreground">Total Documents</div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              My Documents ({documents.length})
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload New
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="list" className="space-y-6">
            <DocumentList 
              onDocumentSelect={(doc) => console.log('Selected document:', doc)}
              onDocumentDelete={(id) => console.log('Delete document:', id)}
            />
          </TabsContent>

          <TabsContent value="upload" className="space-y-6">
            <DocumentUploader
              onUploadComplete={handleUploadComplete}
              onUploadError={handleUploadError}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}
