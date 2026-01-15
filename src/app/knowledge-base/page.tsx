/**
 * Knowledge Base Page
 *
 * Manage knowledge bases for organizing documents and improving RAG responses
 */

'use client'

import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import { useKnowledgeBases } from '@/lib/hooks/useKnowledgeBase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  BookOpen, 
  Plus, 
  FileText, 
  Users, 
  Calendar,
  Loader2,
  Search,
  Settings,
  MoreVertical
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

// Dynamically import AppLayout to avoid SSR issues
const AppLayout = dynamic(() => import('@/components/layouts/AppLayout').then(mod => ({ default: mod.AppLayout })), {
  ssr: false,
  loading: () => <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>
})

interface KnowledgeBase {
  id: string
  name: string
  description: string | null
  is_public: boolean
  created_at: string
  updated_at: string
}

export default function KnowledgeBasePage() {
  const { data: knowledgeBases = [], isLoading, error, refetch } = useKnowledgeBases()
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const filteredKnowledgeBases = knowledgeBases.filter((kb: KnowledgeBase) =>
    kb.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (kb.description && kb.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  // Loading state
  if (isLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto py-6 space-y-6 px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <BookOpen className="w-8 h-8" />
                Knowledge Bases
              </h1>
              <p className="text-muted-foreground">
                Organize documents into knowledge bases for better AI responses
              </p>
            </div>
            <Button disabled size="lg">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Loading...
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AppLayout>
    )
  }

  // Error state
  if (error) {
    return (
      <AppLayout>
        <div className="container mx-auto py-6 px-6">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Knowledge Bases</h2>
              <p className="text-muted-foreground mb-4">{error.message}</p>
              <Button onClick={() => refetch()}>
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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <BookOpen className="w-8 h-8" />
              Knowledge Bases
            </h1>
            <p className="text-muted-foreground">
              Organize documents into knowledge bases for better AI responses
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} size="lg">
            <Plus className="w-4 h-4 mr-2" />
            New Knowledge Base
          </Button>
        </div>

        {/* Search */}
        {knowledgeBases.length > 0 && (
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search knowledge bases..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        )}

        {/* Stats */}
        {knowledgeBases.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Knowledge Bases</p>
                    <p className="text-2xl font-bold text-gray-900">{knowledgeBases.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Documents</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {knowledgeBases.reduce((sum: number, kb: any) => sum + (kb.document_count || 0), 0)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Public Knowledge Bases</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {knowledgeBases.filter((kb: any) => kb.is_public).length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Knowledge Bases Grid */}
        {filteredKnowledgeBases.length === 0 && searchQuery ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No knowledge bases found matching "{searchQuery}"</p>
          </div>
        ) : filteredKnowledgeBases.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <BookOpen className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No knowledge bases yet</h3>
            <p className="text-gray-500 text-center max-w-sm mb-6">
              Create your first knowledge base to organize documents and improve AI responses.
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Knowledge Base
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredKnowledgeBases.map((kb: any) => (
              <Card key={kb.id} className="hover:shadow-lg transition-all duration-200 cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-blue-600" />
                        {kb.name}
                      </CardTitle>
                      <CardDescription className="text-gray-600 line-clamp-2 text-sm">
                        {kb.description || 'No description provided'}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Settings className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        <span>{kb.document_count || 0} docs</span>
                      </div>
                      {kb.is_public && (
                        <Badge variant="secondary" className="text-xs">
                          Public
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(kb.created_at)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}