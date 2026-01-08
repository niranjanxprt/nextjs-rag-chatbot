'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Star, MoreVertical, Edit2, Trash2, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Prompt } from '@/lib/types/database'

interface PromptCardProps {
  prompt: Prompt
  onEdit?: () => void
  onDelete?: (id: string) => Promise<void>
  onFavorite?: (id: string, isFavorite: boolean) => Promise<void>
  onCopy?: (content: string) => void
  className?: string
}

export function PromptCard({
  prompt,
  onEdit,
  onDelete,
  onFavorite,
  onCopy,
  className,
}: PromptCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isCopying, setIsCopying] = useState(false)

  const handleDelete = async () => {
    if (!window.confirm(`Delete prompt "${prompt.name}"?`)) {
      return
    }

    setIsDeleting(true)
    try {
      await onDelete?.(prompt.id)
    } catch (error) {
      console.error('Failed to delete prompt:', error)
      alert('Failed to delete prompt')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCopy = () => {
    setIsCopying(true)
    try {
      navigator.clipboard.writeText(prompt.content)
      onCopy?.(prompt.content)
      setTimeout(() => setIsCopying(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
      setIsCopying(false)
    }
  }

  return (
    <Card className={cn('flex flex-col h-full hover:shadow-md transition-shadow', className)}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="line-clamp-2">{prompt.name}</CardTitle>
            {prompt.category && (
              <Badge variant="outline" className="mt-2">
                {prompt.category}
              </Badge>
            )}
          </div>

          {/* Star/Favorite Button */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onFavorite?.(prompt.id, !prompt.is_favorite)}
            title={prompt.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Star
              className={cn('w-4 h-4', prompt.is_favorite && 'fill-yellow-400 text-yellow-400')}
            />
          </Button>
        </div>

        {prompt.description && (
          <CardDescription className="line-clamp-2">{prompt.description}</CardDescription>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-3">
        {/* Content Preview */}
        <div className="flex-1">
          <p className="text-sm text-muted-foreground line-clamp-3 bg-muted/50 rounded p-2">
            {prompt.content}
          </p>
        </div>

        {/* Variables */}
        {prompt.variables && prompt.variables.length > 0 && (
          <div className="text-xs space-y-1">
            <p className="font-semibold text-muted-foreground">Variables:</p>
            <div className="flex flex-wrap gap-1">
              {prompt.variables.map((variable, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {variable}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Usage Count */}
        {prompt.usage_count !== undefined && prompt.usage_count > 0 && (
          <p className="text-xs text-muted-foreground">
            Used {prompt.usage_count} time{prompt.usage_count !== 1 ? 's' : ''}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={handleCopy}
            disabled={isCopying}
          >
            <Copy className="w-4 h-4 mr-1" />
            {isCopying ? 'Copied!' : 'Copy'}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 w-9 p-0">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Edit2 className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  )
}
