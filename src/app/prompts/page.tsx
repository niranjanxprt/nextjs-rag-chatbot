'use client'

import React, { useState, useMemo } from 'react'
import { usePrompts } from '@/lib/contexts/prompts-context'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { PromptCard } from '@/components/prompts/PromptCard'
import { PromptEditor } from '@/components/prompts/PromptEditor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Search, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'general', label: 'General' },
  { value: 'analysis', label: 'Analysis' },
  { value: 'summary', label: 'Summary' },
  { value: 'extraction', label: 'Extraction' },
  { value: 'writing', label: 'Writing' },
  { value: 'other', label: 'Other' },
]

export default function PromptsPage() {
  const { prompts, createPrompt, updatePrompt, deletePrompt, isLoading } = usePrompts()
  const [showEditor, setShowEditor] = useState(false)
  const [editingPrompt, setEditingPrompt] = useState<any>(null)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  // Filter prompts
  const filteredPrompts = useMemo(() => {
    return prompts.filter((prompt) => {
      const matchesSearch =
        search === '' ||
        prompt.name.toLowerCase().includes(search.toLowerCase()) ||
        prompt.description?.toLowerCase().includes(search.toLowerCase())

      const matchesCategory =
        selectedCategory === 'all' || prompt.category === selectedCategory

      return matchesSearch && matchesCategory
    })
  }, [prompts, search, selectedCategory])

  // Separate favorite and other prompts
  const favorites = filteredPrompts.filter((p) => p.is_favorite)
  const others = filteredPrompts.filter((p) => !p.is_favorite)

  const handleCreatePrompt = async (data: any) => {
    try {
      await createPrompt({
        user_id: '', // Will be set by context
        ...data,
      })
      setShowEditor(false)
      setEditingPrompt(null)
    } catch (error) {
      console.error('Failed to create prompt:', error)
      throw error
    }
  }

  const handleUpdatePrompt = async (data: any) => {
    try {
      if (editingPrompt?.id) {
        await updatePrompt(editingPrompt.id, data)
        setShowEditor(false)
        setEditingPrompt(null)
      }
    } catch (error) {
      console.error('Failed to update prompt:', error)
      throw error
    }
  }

  const handleOpenEditor = (prompt?: any) => {
    setEditingPrompt(prompt || null)
    setShowEditor(true)
  }

  return (
    <DashboardLayout>
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <BookOpen className="w-8 h-8" />
                Prompts Library
              </h1>
              <p className="text-muted-foreground mt-1">
                Create and manage reusable prompt templates
              </p>
            </div>
            <Button onClick={() => handleOpenEditor()} size="lg">
              <Plus className="w-4 h-4 mr-2" />
              New Prompt
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="border-b p-4 bg-muted/30">
          <div className="flex gap-4 items-center max-w-5xl">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search prompts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-6 space-y-8">
            {/* Favorites */}
            {favorites.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  ⭐ Favorites ({favorites.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {favorites.map((prompt) => (
                    <PromptCard
                      key={prompt.id}
                      prompt={prompt}
                      onEdit={() => handleOpenEditor(prompt)}
                      onDelete={() => deletePrompt(prompt.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Other Prompts */}
            {others.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  All Prompts ({others.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {others.map((prompt) => (
                    <PromptCard
                      key={prompt.id}
                      prompt={prompt}
                      onEdit={() => handleOpenEditor(prompt)}
                      onDelete={() => deletePrompt(prompt.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {filteredPrompts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12">
                <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">No prompts found</h3>
                <p className="text-muted-foreground text-center max-w-sm mt-2">
                  {search || selectedCategory !== 'all'
                    ? 'Try adjusting your search or filter.'
                    : 'Create your first prompt template to get started.'}
                </p>
                <Button onClick={() => handleOpenEditor()} className="mt-4">
                  Create Prompt
                </Button>
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-muted-foreground">Loading prompts...</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Prompt Editor */}
      <PromptEditor
        open={showEditor}
        onOpenChange={setShowEditor}
        prompt={editingPrompt}
        onSubmit={editingPrompt ? handleUpdatePrompt : handleCreatePrompt}
      />
    </DashboardLayout>
  )
}
