/**
 * Prompts Context Provider
 *
 * Manages global prompts library state and provides CRUD operations
 */

'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import type { Prompt, PromptInsert, PromptUpdate } from '@/lib/types/database'

// =============================================================================
// Types
// =============================================================================

interface PromptsContextType {
  prompts: Prompt[]
  isLoading: boolean
  error: string | null
  createPrompt: (data: PromptInsert) => Promise<Prompt>
  updatePrompt: (id: string, data: PromptUpdate) => Promise<Prompt>
  deletePrompt: (id: string) => Promise<void>
  toggleFavorite: (id: string) => Promise<Prompt>
  usePrompt: (id: string) => Promise<Prompt>
  getPromptsByCategory: (category: string) => Prompt[]
  getFavoritePrompts: () => Prompt[]
}

// =============================================================================
// Context & Provider
// =============================================================================

const PromptsContext = createContext<PromptsContextType | null>(null)

export function PromptsProvider({ children }: { children: React.ReactNode }) {
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load prompts on mount
  useEffect(() => {
    loadPrompts()
  }, [])

  async function loadPrompts() {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/prompts')

      if (!response.ok) {
        throw new Error(`Failed to load prompts: ${response.statusText}`)
      }

      const data = await response.json()
      setPrompts(data.prompts || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load prompts'
      setError(message)
      console.error('Error loading prompts:', err)
    } finally {
      setIsLoading(false)
    }
  }

  async function createPrompt(data: PromptInsert): Promise<Prompt> {
    try {
      setError(null)

      const response = await fetch('/api/prompts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to create prompt')
      }

      const result = await response.json()
      const newPrompt = result.prompt

      setPrompts(prev => [...prev, newPrompt])

      return newPrompt
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create prompt'
      setError(message)
      throw err
    }
  }

  async function updatePrompt(id: string, data: PromptUpdate): Promise<Prompt> {
    try {
      setError(null)

      const response = await fetch(`/api/prompts/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to update prompt')
      }

      const result = await response.json()
      const updated = result.prompt

      setPrompts(prev => prev.map(p => (p.id === id ? updated : p)))

      return updated
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update prompt'
      setError(message)
      throw err
    }
  }

  async function deletePrompt(id: string): Promise<void> {
    try {
      setError(null)

      const response = await fetch(`/api/prompts/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to delete prompt')
      }

      setPrompts(prev => prev.filter(p => p.id !== id))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete prompt'
      setError(message)
      throw err
    }
  }

  async function toggleFavorite(id: string): Promise<Prompt> {
    const prompt = prompts.find(p => p.id === id)
    if (!prompt) throw new Error('Prompt not found')

    return updatePrompt(id, {
      is_favorite: !prompt.is_favorite,
    })
  }

  async function usePrompt(id: string): Promise<Prompt> {
    const prompt = prompts.find(p => p.id === id)
    if (!prompt) throw new Error('Prompt not found')

    // Increment usage counter via the /use endpoint
    try {
      setError(null)

      const response = await fetch(`/api/prompts/${id}/use`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to increment usage counter')
      }

      const result = await response.json()
      const updated = result.prompt

      setPrompts(prev => prev.map(p => (p.id === id ? updated : p)))

      return updated
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to use prompt'
      setError(message)
      throw err
    }
  }

  function getPromptsByCategory(category: string): Prompt[] {
    return prompts.filter(p => p.category === category)
  }

  function getFavoritePrompts(): Prompt[] {
    return prompts.filter(p => p.is_favorite)
  }

  const value: PromptsContextType = {
    prompts,
    isLoading,
    error,
    createPrompt,
    updatePrompt,
    deletePrompt,
    toggleFavorite,
    usePrompt,
    getPromptsByCategory,
    getFavoritePrompts,
  }

  return <PromptsContext.Provider value={value}>{children}</PromptsContext.Provider>
}

// =============================================================================
// Hook
// =============================================================================

export function usePrompts() {
  const context = useContext(PromptsContext)
  if (!context) {
    throw new Error('usePrompts must be used within PromptsProvider')
  }
  return context
}
