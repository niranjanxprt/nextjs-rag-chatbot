/**
 * Enhanced Chat Interface Component
 *
 * Uses Vercel AI SDK useChat hook for streaming with RAG context
 */

'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useChat } from 'ai/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
import { MessageList } from './MessageList'
import { TypingIndicator } from './TypingIndicator'
import { Send, RefreshCw, Trash2, AlertCircle, BookOpen } from 'lucide-react'
import { useProjects } from '@/lib/contexts/projects-context'
import { useConversations } from '@/lib/contexts/conversations-context'
import { cn } from '@/lib/utils'

// =============================================================================
// Types
// =============================================================================

interface ChatInterfaceProps {
  conversationId?: string
  onConversationChange?: (conversationId: string) => void
  className?: string
}

// =============================================================================
// Component
// =============================================================================

export function ChatInterface({
  conversationId,
  onConversationChange,
  className,
}: ChatInterfaceProps) {
  const { currentProject } = useProjects()
  const { currentConversation } = useConversations()

  // Knowledge base toggle state
  const [useKnowledgeBase, setUseKnowledgeBase] = useState(true)

  // Auto-scroll ref
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Use chat hook with AI SDK
  const { messages, input, handleInputChange, handleSubmit, isLoading, error, stop } = useChat({
    api: '/api/chat',
    id: conversationId,
    body: {
      conversationId,
      projectId: currentProject?.id,
      useKnowledgeBase,
    },
    onResponse: response => {
      // Extract conversation ID from response headers if it's new
      const newConversationId = response.headers.get('X-Conversation-Id')
      if (newConversationId && newConversationId !== conversationId) {
        onConversationChange?.(newConversationId)
      }
    },
  })

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // =============================================================================
  // Event Handlers
  // =============================================================================

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (input.trim() && !isLoading) {
      handleSubmit(e)
    }
  }

  const handleClearChat = () => {
    if (confirm('Are you sure you want to clear this conversation?')) {
      // In a real app, you might want to clear the conversation
      // For now, just clear the message display
      window.location.reload()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      const form = e.currentTarget.form
      if (form) {
        handleFormSubmit({ preventDefault: () => {} } as React.FormEvent<HTMLFormElement>)
      }
    }
  }

  // =============================================================================
  // Render Helpers
  // =============================================================================

  const hasMessages = messages.length > 0
  const canSend = input.trim().length > 0 && !isLoading

  // =============================================================================
  // Render
  // =============================================================================

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header with KB Toggle */}
      <Card className="border-b rounded-none">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg">RAG Chatbot</CardTitle>
              {currentProject && (
                <p className="text-xs text-muted-foreground mt-1">
                  Project: {currentProject.name}
                </p>
              )}
            </div>

            {/* Knowledge Base Toggle */}
            <div className="flex items-center gap-3 pr-2">
              <div className="flex items-center gap-2">
                <BookOpen className={cn('w-4 h-4', useKnowledgeBase ? 'text-primary' : 'text-muted')} />
                <Switch
                  checked={useKnowledgeBase}
                  onCheckedChange={setUseKnowledgeBase}
                  disabled={isLoading}
                  aria-label="Toggle Knowledge Base"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {error && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.reload()}
                    disabled={isLoading}
                    title="Reload conversation"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                )}
                {hasMessages && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearChat}
                    disabled={isLoading}
                    title="Clear conversation"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
                {isLoading && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={stop}
                    title="Stop generation"
                  >
                    <span className="w-4 h-4">⏹</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="m-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error instanceof Error ? error.message : 'An error occurred while processing your message.'}
          </AlertDescription>
        </Alert>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        {hasMessages ? (
          <div className="h-full overflow-y-auto">
            <MessageList messages={messages} />
            {isLoading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <Card className="max-w-md mx-4">
              <CardContent className="pt-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                  <Send className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Welcome to RAG Chatbot</h3>
                <p className="text-muted-foreground mb-4">
                  Ask questions about your uploaded documents. I'll search through your knowledge
                  base to provide accurate answers.
                </p>
                <div className="text-sm text-muted-foreground">
                  <p className="mb-1">Try asking:</p>
                  <ul className="text-left space-y-1">
                    <li>• "What is the main topic of my documents?"</li>
                    <li>• "Summarize the key findings"</li>
                    <li>• "What are the recommendations?"</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Input Area */}
      <Card className="border-t rounded-none">
        <CardContent className="p-4">
          <form onSubmit={handleFormSubmit} className="flex gap-2">
            <div className="flex-1">
              <Input
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={
                  isLoading ? 'AI is thinking...' : 'Ask a question about your documents...'
                }
                disabled={isLoading}
                className="min-h-[44px]"
                aria-label="Chat message input"
              />
            </div>
            <Button
              type="submit"
              disabled={!canSend}
              size="lg"
              className="px-6"
              title={canSend ? 'Send message' : 'Enter a message to send'}
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>

          {/* Status Info */}
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <span>{messages.length > 0 && `${messages.length} messages`}</span>
            <span>{useKnowledgeBase ? 'Using Knowledge Base' : 'Free mode'}</span>
            <span>Enter to send, Shift+Enter for new line</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
