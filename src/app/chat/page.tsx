/**
 * Chat Page
 *
 * Main chat interface page with conversation management
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
      <div className="h-[calc(100vh-8rem)] flex flex-col">
        <ChatInterface
          conversationId={conversationId}
          onConversationChange={handleConversationChange}
          className="flex-1"
        />
      </div>
    </DashboardLayout>
  )
}
