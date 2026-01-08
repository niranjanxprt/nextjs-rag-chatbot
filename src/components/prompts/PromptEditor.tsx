'use client'

import React, { useState, useEffect } from 'react'
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
import { AlertCircle, Plus, X } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { Prompt } from '@/lib/types/database'

const CATEGORIES = ['general', 'analysis', 'summary', 'extraction', 'writing', 'other']

interface PromptEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  prompt?: Prompt | null
  onSubmit: (data: any) => Promise<void>
}

export function PromptEditor({
  open,
  onOpenChange,
  prompt,
  onSubmit,
}: PromptEditorProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('general')
  const [variables, setVariables] = useState<string[]>([])
  const [newVariable, setNewVariable] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize form when prompt changes or dialog opens
  useEffect(() => {
    if (open) {
      if (prompt) {
        setName(prompt.name)
        setDescription(prompt.description || '')
        setContent(prompt.content)
        setCategory(prompt.category || 'general')
        setVariables(Array.isArray(prompt.variables) ? prompt.variables : [])
      } else {
        setName('')
        setDescription('')
        setContent('')
        setCategory('general')
        setVariables([])
      }
      setNewVariable('')
      setError(null)
    }
  }, [open, prompt])

  const addVariable = () => {
    if (newVariable.trim() && !variables.includes(newVariable.trim())) {
      setVariables([...variables, newVariable.trim()])
      setNewVariable('')
    }
  }

  const removeVariable = (index: number) => {
    setVariables(variables.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Prompt name is required')
      return
    }

    if (!content.trim()) {
      setError('Prompt content is required')
      return
    }

    setIsLoading(true)
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        content: content.trim(),
        category,
        variables,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save prompt')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{prompt ? 'Edit Prompt' : 'Create New Prompt'}</DialogTitle>
          <DialogDescription>
            {prompt ? 'Update your prompt template.' : 'Create a new reusable prompt template.'}
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
            <Label htmlFor="prompt-name">Prompt Name *</Label>
            <Input
              id="prompt-name"
              placeholder="e.g., Summarize Article"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              autoFocus
            />
          </div>

          {/* Description Input */}
          <div className="space-y-2">
            <Label htmlFor="prompt-description">Description (optional)</Label>
            <Input
              id="prompt-description"
              placeholder="What does this prompt do?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* Category Select */}
          <div className="space-y-2">
            <Label htmlFor="prompt-category">Category</Label>
            <Select value={category} onValueChange={setCategory} disabled={isLoading}>
              <SelectTrigger id="prompt-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Content Input */}
          <div className="space-y-2">
            <Label htmlFor="prompt-content">
              Prompt Content *
              <span className="text-xs text-muted-foreground ml-2">
                Use {'{}'} syntax for variables
              </span>
            </Label>
            <Textarea
              id="prompt-content"
              placeholder="Enter your prompt template here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isLoading}
              rows={6}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Example: "Summarize the following text: {'{text}'}"
            </p>
          </div>

          {/* Variables Section */}
          <div className="space-y-2">
            <Label>Variables</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add variable (e.g., text, topic)"
                value={newVariable}
                onChange={(e) => setNewVariable(e.target.value)}
                disabled={isLoading}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addVariable()
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={addVariable}
                disabled={isLoading || !newVariable.trim()}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Variables List */}
            {variables.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {variables.map((variable, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-1 bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm"
                  >
                    <code>{variable}</code>
                    <button
                      type="button"
                      onClick={() => removeVariable(index)}
                      disabled={isLoading}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
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
            <Button type="submit" disabled={isLoading || !name.trim() || !content.trim()}>
              {isLoading ? (prompt ? 'Saving...' : 'Creating...') : prompt ? 'Save Changes' : 'Create Prompt'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
