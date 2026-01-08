/**
 * Documents Page
 *
 * Main page for document management with upload and list functionality
 */

'use client'

import React from 'react'
import { DocumentUploader } from '@/components/documents/DocumentUploader'
import { DocumentList } from '@/components/documents/DocumentList'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { DocumentSuspense } from '@/components/ui/suspense-wrapper'

export default function DocumentsPage() {
  return (
    <DashboardLayout>
      <DocumentSuspense>
        <div className="container mx-auto py-6 space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Document Management</h1>
            <p className="text-muted-foreground">
              Upload and manage your documents for the RAG chatbot knowledge base.
            </p>
          </div>

          <Tabs defaultValue="list" className="space-y-6">
            <TabsList>
              <TabsTrigger value="list">My Documents</TabsTrigger>
              <TabsTrigger value="upload">Upload New</TabsTrigger>
            </TabsList>
            <TabsContent value="list" className="space-y-6">
              <DocumentList />
            </TabsContent>

            <TabsContent value="upload" className="space-y-6">
              <DocumentUploader
                onUploadComplete={documentId => {
                  console.log('Document uploaded:', documentId)
                  // Could switch to list tab or show success message
                }}
                onUploadError={error => {
                  console.error('Upload error:', error)
                  // Could show error toast
                }}
              />
            </TabsContent>
          </Tabs>
        </div>
      </DocumentSuspense>
    </DashboardLayout>
  )
}
