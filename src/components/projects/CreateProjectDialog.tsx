'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

const PROJECT_COLORS = [
  '#3b82f6', // blue
  '#ec4899', // pink
  '#8b5cf6', // purple
  '#f59e0b', // amber
  '#10b981', // emerald
  '#ef4444', // red
]

const PROJECT_ICONS = ['📁', '📊', '📈', '💼', '🎯', '📚', '🔍', '⭐']

interface CreateProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: { name: string; description?: string; color?: string; icon?: string }) => Promise<void>
}

export function CreateProjectDialog({
  open,
  onOpenChange,
  onSubmit,
}: CreateProjectDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState(PROJECT_COLORS[0])
  const [icon, setIcon] = useState(PROJECT_ICONS[0])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Project name is required')
      return
    }

    setIsLoading(true)
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        color,
        icon,
      })
      // Reset form
      setName('')
      setDescription('')
      setColor(PROJECT_COLORS[0])
      setIcon(PROJECT_ICONS[0])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Add a new project to organize your documents and conversations.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Name Input */}
          <div className="space-y-2">
            <Label htmlFor="project-name">Project Name</Label>
            <Input
              id="project-name"
              placeholder="My Project"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              autoFocus
            />
          </div>

          {/* Description Input */}
          <div className="space-y-2">
            <Label htmlFor="project-description">Description (optional)</Label>
            <Textarea
              id="project-description"
              placeholder="What is this project about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
              rows={3}
            />
          </div>

          {/* Icon Selection */}
          <div className="space-y-2">
            <Label htmlFor="project-icon">Icon</Label>
            <Select value={icon} onValueChange={setIcon} disabled={isLoading}>
              <SelectTrigger id="project-icon">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROJECT_ICONS.map((ico) => (
                  <SelectItem key={ico} value={ico}>
                    <span className="text-lg mr-2">{ico}</span>
                    {ico}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Color Selection */}
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="grid grid-cols-6 gap-2">
              {PROJECT_COLORS.map((colorHex) => (
                <button
                  key={colorHex}
                  type="button"
                  className={`w-8 h-8 rounded-lg border-2 transition-all ${
                    color === colorHex ? 'border-foreground ring-2 ring-offset-2 ring-foreground' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: colorHex }}
                  onClick={() => setColor(colorHex)}
                  disabled={isLoading}
                  aria-label={`Select color ${colorHex}`}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !name.trim()}>
              {isLoading ? 'Creating...' : 'Create Project'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
