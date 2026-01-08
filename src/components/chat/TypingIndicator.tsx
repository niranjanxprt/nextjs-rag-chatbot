/**
 * Typing Indicator Component
 *
 * Shows animated typing indicator when AI is generating response
 */

'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Bot } from 'lucide-react'
import { cn } from '@/lib/utils'

// =============================================================================
// Types
// =============================================================================

interface TypingIndicatorProps {
  className?: string
}

// =============================================================================
// Component
// =============================================================================

export function TypingIndicator({ className }: TypingIndicatorProps) {
  return (
    <div className={cn('flex gap-3 p-4', className)}>
      {/* Avatar */}
      <Avatar className="w-8 h-8 shrink-0 bg-secondary">
        <AvatarFallback>
          <Bot className="w-4 h-4" />
        </AvatarFallback>
      </Avatar>

      {/* Typing Content */}
      <div className="flex-1 space-y-2">
        {/* Header */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">AI Assistant</span>
          <span className="text-xs text-muted-foreground">is typing...</span>
        </div>

        {/* Typing Animation */}
        <Card className="bg-muted max-w-fit">
          <CardContent className="p-3">
            <div className="flex items-center gap-1">
              <div className="flex gap-1">
                <div
                  className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                  style={{ animationDelay: '0ms' }}
                />
                <div
                  className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                  style={{ animationDelay: '150ms' }}
                />
                <div
                  className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                  style={{ animationDelay: '300ms' }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
