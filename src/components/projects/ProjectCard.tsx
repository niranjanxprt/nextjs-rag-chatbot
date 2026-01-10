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
import { FileText, MessageSquare, MoreVertical, Edit2, Trash2, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Project } from '@/lib/types/database'
import { EditProjectDialog } from './EditProjectDialog'

interface ProjectCardProps {
  project: Project
  isDefault?: boolean
  onUpdate?: (id: string, data: any) => Promise<Project | void>
  onDelete?: (id: string) => Promise<void>
  onClick?: () => void
  className?: string
}

export function ProjectCard({
  project,
  isDefault,
  onUpdate,
  onDelete,
  onClick,
  className,
}: ProjectCardProps) {
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${project.name}"?`)) {
      return
    }

    setIsDeleting(true)
    try {
      await onDelete?.(project.id)
    } catch (error) {
      console.error('Failed to delete project:', error)
      alert('Failed to delete project')
    } finally {
      setIsDeleting(false)
    }
  }

  // Get background color from project color
  const bgColor =
    {
      '#3b82f6': 'bg-blue-500/10 border-blue-200 dark:border-blue-800',
      '#ec4899': 'bg-pink-500/10 border-pink-200 dark:border-pink-800',
      '#8b5cf6': 'bg-purple-500/10 border-purple-200 dark:border-purple-800',
      '#f59e0b': 'bg-amber-500/10 border-amber-200 dark:border-amber-800',
      '#10b981': 'bg-emerald-500/10 border-emerald-200 dark:border-emerald-800',
      '#ef4444': 'bg-red-500/10 border-red-200 dark:border-red-800',
    }[project.color as string] || 'bg-gray-500/10'

  return (
    <>
      <Card className={cn('cursor-pointer hover:shadow-md transition-shadow', bgColor, className)}>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">{project.icon || '📁'}</span>
                <span className="truncate">{project.name}</span>
              </CardTitle>
              {isDefault && <Badge variant="secondary">Default</Badge>}
            </div>

            {/* Actions Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                {!isDefault && (
                  <DropdownMenuItem
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {project.description && (
            <CardDescription className="line-clamp-2 mt-2">
              {project.description}
            </CardDescription>
          )}
        </CardHeader>

        <CardContent>
          <div className="space-y-3">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="p-2 rounded-lg bg-background/50">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileText className="w-4 h-4" />
                  <span className="text-xs">Documents</span>
                </div>
                <p className="text-lg font-semibold mt-1">0</p>
              </div>

              <div className="p-2 rounded-lg bg-background/50">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-xs">Chats</span>
                </div>
                <p className="text-lg font-semibold mt-1">0</p>
              </div>
            </div>

            {/* Metadata */}
            <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
              <p>Created: {new Date(project.created_at || '').toLocaleDateString()}</p>
              {project.updated_at && (
                <p>Updated: {new Date(project.updated_at).toLocaleDateString()}</p>
              )}
            </div>

            {/* Action Button */}
            <Button
              variant="default"
              size="sm"
              className="w-full mt-2"
              onClick={onClick}
            >
              <Settings className="w-4 h-4 mr-2" />
              Open Project
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <EditProjectDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        project={project}
        onSubmit={async (data) => {
          await onUpdate?.(project.id, data)
          setShowEditDialog(false)
        }}
      />
    </>
  )
}
