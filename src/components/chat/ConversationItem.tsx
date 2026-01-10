'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreVertical, Trash2, Pin, PinOff, Edit2, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Conversation } from '@/lib/types/database'

interface ConversationItemProps {
  conversation: Conversation
  isActive?: boolean
  onSelect?: () => void
  onPin?: () => void
  onDelete?: () => void
  onRename?: (newTitle: string) => void
}

export function ConversationItem({
  conversation,
  isActive,
  onSelect,
  onPin,
  onDelete,
  onRename,
}: ConversationItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(conversation.title)

  const handleRename = () => {
    if (editTitle?.trim() && editTitle !== conversation.title) {
      onRename?.(editTitle)
    }
    setIsEditing(false)
    setEditTitle(conversation.title)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditTitle(conversation.title)
  }

  return (
    <div
      className={cn(
        'group flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-accent transition-colors',
        isActive && 'bg-accent'
      )}
    >
      {/* Main Content */}
      <div className="flex-1 min-w-0 cursor-pointer" onClick={onSelect}>
        {isEditing ? (
          <Input
            autoFocus
            value={editTitle || ''}
            onChange={(e) => setEditTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename()
              if (e.key === 'Escape') handleCancel()
            }}
            className="h-7 text-sm"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <p className="text-sm font-medium truncate text-foreground">
            {conversation.title}
          </p>
        )}
        {conversation.message_count !== undefined && (
          <p className="text-xs text-muted-foreground truncate">
            {conversation.message_count} message{conversation.message_count !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Actions - Show on hover or when editing */}
      {isEditing ? (
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleRename}
            className="h-6 w-6 p-0"
          >
            <Check className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCancel}
            className="h-6 w-6 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => setIsEditing(true)}>
              <Edit2 className="w-4 h-4 mr-2" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onPin}>
              {conversation.is_pinned ? (
                <>
                  <PinOff className="w-4 h-4 mr-2" />
                  Unpin
                </>
              ) : (
                <>
                  <Pin className="w-4 h-4 mr-2" />
                  Pin
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}
