/**
 * Chat Page
 *
 * Main chat interface page - Updated to match original design
 */

'use client'

import React, { useState } from 'react'
import { ChatInterface } from '@/components/chat/ChatInterface'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'

export default function ChatPage() {
  const [conversationId, setConversationId] = useState<string | undefined>()

  const handleConversationChange = (newConversationId: string) => {
    setConversationId(newConversationId)
  }

  return (
    <DashboardLayout>
      <div className="h-full flex flex-col p-6">
        <div className="mb-4">
          <h1 className="text-2xl font-semibold text-foreground">Chat</h1>
          <p className="text-muted-foreground">
            Ask questions about your documents or have a general conversation
          </p>
        </div>
        
        <div className="flex-1 min-h-0">
          <ChatInterface
            conversationId={conversationId}
            onConversationChange={handleConversationChange}
            className="h-full"
          />
        </div>
      </div>
    </DashboardLayout>
  )
}
