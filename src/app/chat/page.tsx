/**
 * Chat Page
 *
 * Main chat interface page with conversation management and React Query integration
 */

'use client'

import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import { useConversations, useCreateConversation } from '@/lib/hooks/useConversations'
import { ChatInterface } from '@/components/chat/ChatInterface'
import { ConversationSidebar } from '@/components/chat/ConversationSidebar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { MessageSquare, Plus, Loader2 } from 'lucide-react'

// Dynamically import AppLayout to avoid SSR issues
const AppLayout = dynamic(() => import('@/components/layouts/AppLayout').then(mod => ({ default: mod.AppLayout })), {
  ssr: false,
  loading: () => <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>
})

export default function ChatPage() {
  const [conversationId, setConversationId] = useState<string | undefined>()
  const { data: conversationsData, isLoading, error } = useConversations()
  const createConversationMutation = useCreateConversation()

  const conversations = conversationsData?.conversations || []

  const handleConversationChange = (newConversationId: string) => {
    setConversationId(newConversationId)
  }

  const handleNewConversation = async () => {
    try {
      const newConversation = await createConversationMutation.mutateAsync({
        title: 'New Conversation',
        project_id: undefined, // Default to personal conversation
      })
      setConversationId(newConversation.id)
    } catch (error) {
      console.error('Failed to create conversation:', error)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <AppLayout>
        <div className="h-full flex">
          {/* Sidebar Skeleton */}
          <div className="w-80 border-r bg-white p-4 space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-8 w-8" />
            </div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
          
          {/* Main Content Skeleton */}
          <div className="flex-1 p-6">
            <div className="mb-4">
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
            <div className="flex-1 space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-3/4" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  // Error state
  if (error) {
    return (
      <AppLayout>
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Conversations</h2>
            <p className="text-muted-foreground mb-4">{error.message}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="h-full flex">
        {/* Conversations Sidebar */}
        <div className="w-80 border-r bg-white flex flex-col">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Conversations
              </h2>
              <Button 
                size="sm" 
                onClick={handleNewConversation}
                disabled={createConversationMutation.isPending}
              >
                {createConversationMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
              </Button>
            </div>
            
            {conversations.length > 0 && (
              <div className="text-sm text-muted-foreground">
                {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
          
          <div className="flex-1 overflow-auto">
            {conversations.length === 0 ? (
              <div className="p-4 text-center">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-medium text-gray-900 mb-2">No conversations yet</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Start a new conversation to chat with your documents
                </p>
                <Button onClick={handleNewConversation} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  New Conversation
                </Button>
              </div>
            ) : (
              <ConversationSidebar
                onSelectConversation={setConversationId}
              />
            )}
          </div>
        </div>

        {/* Main Chat Interface */}
        <div className="flex-1 flex flex-col">
          {conversationId ? (
            <ChatInterface
              conversationId={conversationId}
              onConversationChange={handleConversationChange}
              className="h-full"
            />
          ) : (
            /* Welcome State */
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center max-w-md">
                <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-6" />
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  Welcome to RAG Chat
                </h2>
                <p className="text-gray-600 mb-6">
                  Select a conversation from the sidebar or start a new one to begin chatting with your documents using AI.
                </p>
                <Button onClick={handleNewConversation} size="lg">
                  <Plus className="w-5 h-5 mr-2" />
                  Start New Conversation
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
