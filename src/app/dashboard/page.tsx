/**
 * Dashboard Page
 *
 * Main dashboard with overview of documents and quick actions
 */

'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatCard } from '@/components/ui/stat-card'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { FileText, MessageCircle, Upload, Search, MessageSquare, Files, Zap } from 'lucide-react'
import { useConversations } from '@/lib/contexts/conversations-context'

export default function DashboardPage() {
  const { conversations } = useConversations()
  const [stats, setStats] = useState({
    totalConversations: 0,
    totalDocuments: 0,
  })

  useEffect(() => {
    // Set statistics from context
    setStats({
      totalConversations: conversations.length,
      totalDocuments: 0, // Would fetch from documents context/API
    })
  }, [conversations])

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to your RAG Chatbot. Upload documents and start chatting with your AI assistant.
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Conversations"
            value={stats.totalConversations}
            icon={<MessageSquare className="h-5 w-5 text-blue-500" />}
          />
          <StatCard
            label="Documents Uploaded"
            value={stats.totalDocuments}
            icon={<Files className="h-5 w-5 text-green-500" />}
          />
          <StatCard
            label="Quick Start"
            value="3 Steps"
            icon={<Zap className="h-5 w-5 text-yellow-500" />}
          />
          <StatCard
            label="Features"
            value="8+"
            icon={<Upload className="h-5 w-5 text-purple-500" />}
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-500" />
                Upload Documents
              </CardTitle>
              <CardDescription>Add new documents to your knowledge base</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/documents?tab=upload">Upload Files</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-green-500" />
                Manage Documents
              </CardTitle>
              <CardDescription>View and organize your uploaded documents</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/documents">View Documents</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-purple-500" />
                Start Chatting
              </CardTitle>
              <CardDescription>Ask questions about your documents</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/chat">Open Chat</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Search className="w-5 h-5 text-orange-500" />
                Search Documents
              </CardTitle>
              <CardDescription>Find specific information in your documents</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/search">Search</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Getting Started */}
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>Follow these steps to set up your RAG chatbot</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                  1
                </div>
                <div>
                  <h3 className="font-medium">Upload Documents</h3>
                  <p className="text-sm text-muted-foreground">
                    Upload PDF, TXT, or Markdown files to build your knowledge base
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-semibold">
                  2
                </div>
                <div>
                  <h3 className="font-medium">Wait for Processing</h3>
                  <p className="text-sm text-muted-foreground">
                    Documents are automatically processed and indexed for search
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-semibold">
                  3
                </div>
                <div>
                  <h3 className="font-medium">Start Chatting</h3>
                  <p className="text-sm text-muted-foreground">
                    Ask questions and get answers based on your documents
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <Card>
          <CardHeader>
            <CardTitle>Features</CardTitle>
            <CardDescription>What you can do with your RAG chatbot</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="font-medium">Document Management</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Upload multiple file formats (PDF, TXT, Markdown)</li>
                  <li>• Automatic text extraction and processing</li>
                  <li>• Document status tracking and error handling</li>
                  <li>• Secure file storage with user isolation</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium">AI Chat Assistant</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Context-aware responses based on your documents</li>
                  <li>• Source citations for transparency</li>
                  <li>• Streaming responses for real-time interaction</li>
                  <li>• Conversation history and management</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
