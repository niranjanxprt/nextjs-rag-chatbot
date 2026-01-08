'use client'

import React, { useState } from 'react'
import { useConversations } from '@/lib/contexts/conversations-context'
import { useProjects } from '@/lib/contexts/projects-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus, Search, Trash2, Pin, PinOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ConversationItem } from './ConversationItem'

interface ConversationSidebarProps {
  onSelectConversation?: (conversationId: string) => void
  className?: string
}

export function ConversationSidebar({
  onSelectConversation,
  className,
}: ConversationSidebarProps) {
  const { conversations, createConversation, deleteConversation, pinConversation, currentConversation } = useConversations()
  const { currentProject } = useProjects()
  const [search, setSearch] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  // Filter conversations by current project
  const filteredConversations = conversations.filter(
    (conv) =>
      (!currentProject || conv.project_id === currentProject.id) &&
      (search === '' || conv.title.toLowerCase().includes(search.toLowerCase()))
  )

  // Separate pinned and recent conversations
  const pinnedConversations = filteredConversations.filter((conv) => conv.is_pinned)
  const recentConversations = filteredConversations.filter((conv) => !conv.is_pinned)

  const handleCreateConversation = async () => {
    setIsCreating(true)
    try {
      const newConversation = await createConversation({
        user_id: '', // Will be set by context
        title: 'New Conversation',
        project_id: currentProject?.id,
      })
      onSelectConversation?.(newConversation.id)
    } catch (error) {
      console.error('Failed to create conversation:', error)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className={cn('flex flex-col h-full bg-background border-r', className)}>
      {/* Header */}
      <div className="p-4 border-b space-y-3">
        <Button
          onClick={handleCreateConversation}
          disabled={isCreating}
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Chat
        </Button>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {/* Pinned Conversations */}
          {pinnedConversations.length > 0 && (
            <div>
              <div className="px-2 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Pinned
              </div>
              <div className="space-y-1">
                {pinnedConversations.map((conversation) => (
                  <ConversationItem
                    key={conversation.id}
                    conversation={conversation}
                    isActive={currentConversation?.id === conversation.id}
                    onSelect={() => onSelectConversation?.(conversation.id)}
                    onPin={() => pinConversation(conversation.id, false)}
                    onDelete={() => deleteConversation(conversation.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Recent Conversations */}
          {recentConversations.length > 0 && (
            <div>
              <div className="px-2 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Recent
              </div>
              <div className="space-y-1">
                {recentConversations.map((conversation) => (
                  <ConversationItem
                    key={conversation.id}
                    conversation={conversation}
                    isActive={currentConversation?.id === conversation.id}
                    onSelect={() => onSelectConversation?.(conversation.id)}
                    onPin={() => pinConversation(conversation.id, true)}
                    onDelete={() => deleteConversation(conversation.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {filteredConversations.length === 0 && (
            <div className="px-2 py-8 text-center text-sm text-muted-foreground">
              {search ? 'No conversations found' : 'No conversations yet'}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer - Project Info */}
      {currentProject && (
        <div className="p-3 border-t text-xs text-muted-foreground bg-muted/20">
          <p className="truncate font-medium">{currentProject.name}</p>
          <p className="text-xs">{filteredConversations.length} conversations</p>
        </div>
      )}
    </div>
  )
}
