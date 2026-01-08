/**
 * Message List Component
 *
 * Displays chat messages with proper formatting and source citations
 */

'use client'

import React from 'react'
import { Message } from '@/lib/types/database'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { User, Bot, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SourceCitations, type Source } from './SourceCitations'

// =============================================================================
// Types
// =============================================================================

interface MessageListProps {
  messages: Message[]
  className?: string
}

interface MessageItemProps {
  message: Message
  isLast?: boolean
}

// =============================================================================
// Helper Functions
// =============================================================================

function formatTimestamp(timestamp: Date | string): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function extractSourcesFromMetadata(metadata: any): Source[] {
  if (!metadata) return []

  // Handle contextSources from RAG context
  if (metadata.contextSources && Array.isArray(metadata.contextSources)) {
    return metadata.contextSources.map((source: any) => ({
      documentId: source.documentId,
      filename: source.filename || source.name || 'Unknown',
      score: source.score || 0,
      excerpt: source.excerpt,
      pageNumber: source.pageNumber,
    }))
  }

  return []
}

// =============================================================================
// Message Item Component
// =============================================================================

function MessageItem({ message, isLast }: MessageItemProps) {
  const isUser = message.role === 'user'
  const isAssistant = message.role === 'assistant'
  const sources = extractSourcesFromMetadata(message.metadata)

  return (
    <div className={cn('flex gap-3 p-4', isLast && 'pb-6')}>
      {/* Avatar */}
      <Avatar className={cn('w-8 h-8 shrink-0', isUser ? 'bg-primary' : 'bg-secondary')}>
        <AvatarFallback>
          {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
        </AvatarFallback>
      </Avatar>

      {/* Message Content */}
      <div className="flex-1 space-y-2">
        {/* Message Header */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{isUser ? 'You' : 'AI Assistant'}</span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatTimestamp(message.created_at || new Date())}
          </span>
        </div>

        {/* Message Text */}
        <Card
          className={cn('max-w-none', isUser ? 'bg-primary text-primary-foreground' : 'bg-muted')}
        >
          <CardContent className="p-3">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              {message.content.split('\n').map((line, index) => (
                <p
                  key={index}
                  className={cn('mb-2 last:mb-0', isUser && 'text-primary-foreground')}
                >
                  {line}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sources (for assistant messages) */}
        {isAssistant && sources.length > 0 && (
          <SourceCitations sources={sources} variant="card" />
        )}

        {/* Metadata (for debugging - only show in development) */}
        {process.env.NODE_ENV === 'development' && message.metadata && (
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer">Debug Info</summary>
            <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto">
              {JSON.stringify(message.metadata, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// Main Component
// =============================================================================

export function MessageList({ messages, className }: MessageListProps) {
  if (messages.length === 0) {
    return null
  }

  return (
    <div className={cn('divide-y', className)}>
      {messages.map((message, index) => (
        <MessageItem
          key={message.id || index}
          message={message}
          isLast={index === messages.length - 1}
        />
      ))}
    </div>
  )
}
