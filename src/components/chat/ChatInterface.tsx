/**
 * Simplified Chat Interface Component for Vercel Deployment
 */

'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Send } from 'lucide-react'

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
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Array<{id: string, role: string, content: string}>>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = { id: Date.now().toString(), role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      // Simple fetch to chat API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      })

      if (response.ok) {
        const data = await response.json()
        const assistantMessage = { 
          id: (Date.now() + 1).toString(), 
          role: 'assistant', 
          content: data.message || 'Hello! This is a simplified chat interface.' 
        }
        setMessages(prev => [...prev, assistantMessage])
      }
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage = { 
        id: (Date.now() + 1).toString(), 
        role: 'assistant', 
        content: 'Sorry, there was an error processing your message.' 
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <Card className="border-b rounded-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">RAG Chatbot</CardTitle>
        </CardHeader>
      </Card>

      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <Card className="max-w-md">
              <CardContent className="pt-6 text-center">
                <h3 className="text-lg font-semibold mb-2">Welcome to RAG Chatbot</h3>
                <p className="text-muted-foreground">
                  Start a conversation by typing a message below.
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted px-4 py-2 rounded-lg">
                  Thinking...
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Card className="border-t rounded-none">
        <CardContent className="p-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={!input.trim() || isLoading}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
