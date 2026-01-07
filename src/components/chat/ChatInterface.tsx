/**
 * Chat Interface Component
 * 
 * Main chat interface with message display, input, and streaming support
 */

'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { MessageList } from './MessageList'
import { TypingIndicator } from './TypingIndicator'
import { Send, RefreshCw, Trash2, AlertCircle } from 'lucide-react'
import { Message } from '@/lib/types/database'
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
  className 
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // =============================================================================
  // Event Handlers
  // =============================================================================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      conversation_id: conversationId || '',
      role: 'user',
      content: input.trim(),
      metadata: {},
      created_at: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          })),
          conversationId
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // Extract conversation ID from response headers
      const newConversationId = response.headers.get('X-Conversation-Id')
      if (newConversationId && newConversationId !== conversationId) {
        onConversationChange?.(newConversationId)
      }

      // Handle streaming response
      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        conversation_id: newConversationId || conversationId || '',
        role: 'assistant',
        content: '',
        metadata: {},
        created_at: new Date().toISOString()
      }

      setMessages(prev => [...prev, assistantMessage])

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.content) {
                setMessages(prev => prev.map(m => 
                  m.id === assistantMessage.id 
                    ? { ...m, content: m.content + data.content }
                    : m
                ))
              }
            } catch (e) {
              // Ignore parsing errors
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
  }

  const handleClearChat = () => {
    if (confirm('Are you sure you want to clear this conversation?')) {
      setMessages([])
      setError(null)
    }
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    handleSubmit(e)
  }

  const handleRetry = () => {
    // For now, just clear the error
    setError(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleFormSubmit(e as any)
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
      {/* Header */}
      <Card className="border-b rounded-none">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">RAG Chatbot</CardTitle>
            <div className="flex gap-2">
              {error && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetry}
                  disabled={isLoading}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </Button>
              )}
              {hasMessages && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearChat}
                  disabled={isLoading}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="m-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || 'An error occurred while processing your message.'}
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
                <h3 className="text-lg font-semibold mb-2">
                  Welcome to RAG Chatbot
                </h3>
                <p className="text-muted-foreground mb-4">
                  Ask questions about your uploaded documents. I'll search through your knowledge base to provide accurate answers.
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
                  isLoading 
                    ? "AI is thinking..." 
                    : "Ask a question about your documents..."
                }
                disabled={isLoading}
                className="min-h-[44px]"
              />
            </div>
            <Button
              type="submit"
              disabled={!canSend}
              size="lg"
              className="px-6"
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
            <span>
              {messages.length > 0 && `${messages.length} messages`}
            </span>
            <span>
              Press Enter to send, Shift+Enter for new line
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}