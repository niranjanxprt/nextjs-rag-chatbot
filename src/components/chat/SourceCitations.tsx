'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileText, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

export interface Source {
  documentId?: string
  filename: string
  score: number
  excerpt?: string
  pageNumber?: number
}

interface SourceCitationsProps {
  sources: Source[]
  className?: string
  variant?: 'inline' | 'card' | 'expandable'
}

export function SourceCitations({
  sources,
  className,
  variant = 'card',
}: SourceCitationsProps) {
  const [isExpanded, setIsExpanded] = useState(variant !== 'expandable')

  if (!sources || sources.length === 0) {
    return null
  }

  // Sort by relevance score (highest first)
  const sortedSources = [...sources].sort((a, b) => b.score - a.score)

  // Inline variant - simple list
  if (variant === 'inline') {
    return (
      <div className={cn('mt-2 space-y-1 text-sm', className)}>
        <p className="font-semibold text-muted-foreground">Sources:</p>
        <ul className="space-y-1">
          {sortedSources.map((source, idx) => (
            <li
              key={`${source.filename}-${idx}`}
              className="flex items-center gap-2 text-muted-foreground"
            >
              <FileText className="w-3 h-3 flex-shrink-0" />
              <span className="text-xs truncate">{source.filename}</span>
              <Badge variant="outline" className="ml-auto text-xs">
                {(source.score * 100).toFixed(0)}%
              </Badge>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  // Expandable variant - collapsible card
  if (variant === 'expandable') {
    return (
      <Card className={cn('mt-3', className)}>
        <CardContent className="p-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full justify-between h-auto py-1.5"
          >
            <span className="text-sm font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Sources ({sources.length})
            </span>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>

          {isExpanded && (
            <div className="mt-2 space-y-2 border-t pt-2">
              {sortedSources.map((source, idx) => (
                <div
                  key={`${source.filename}-${idx}`}
                  className="rounded-lg p-2 bg-muted/50 border border-border/50 space-y-1"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <FileText className="w-4 h-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">
                          {source.filename}
                        </p>
                        {source.pageNumber !== undefined && (
                          <p className="text-xs text-muted-foreground">
                            Page {source.pageNumber}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge
                      variant={
                        source.score >= 0.8
                          ? 'default'
                          : source.score >= 0.6
                            ? 'secondary'
                            : 'outline'
                      }
                      className="text-xs flex-shrink-0"
                    >
                      {(source.score * 100).toFixed(0)}%
                    </Badge>
                  </div>

                  {source.excerpt && (
                    <p className="text-xs text-muted-foreground line-clamp-2 pl-6">
                      "{source.excerpt}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // Default card variant
  return (
    <Card className={cn('mt-3', className)}>
      <CardContent className="p-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Sources ({sources.length})</span>
          </div>

          <div className="space-y-2">
            {sortedSources.map((source, idx) => (
              <div
                key={`${source.filename}-${idx}`}
                className="rounded-lg p-2 bg-muted/50 border border-border/50 space-y-1"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {source.filename}
                    </p>
                    {source.pageNumber !== undefined && (
                      <p className="text-xs text-muted-foreground">
                        Page {source.pageNumber}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant={
                      source.score >= 0.8
                        ? 'default'
                        : source.score >= 0.6
                          ? 'secondary'
                          : 'outline'
                    }
                    className="text-xs flex-shrink-0"
                  >
                    {(source.score * 100).toFixed(0)}%
                  </Badge>
                </div>

                {source.excerpt && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    "{source.excerpt}"
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
