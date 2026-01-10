/**
 * Conversations Context Provider
 *
 * Manages conversation threads and history
 */

'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import type { Conversation } from '@/lib/types/database'

// =============================================================================
// Types
// =============================================================================

interface ConversationsContextType {
  conversations: Conversation[]
  currentConversation: Conversation | null
  setCurrentConversation: (id: string) => void
  createConversation: () => Promise<Conversation>
  updateConversation: (id: string, title: string, isPinned?: boolean) => Promise<Conversation>
  deleteConversation: (id: string) => Promise<void>
  pinConversation: (id: string, pinned: boolean) => Promise<Conversation>
  isLoading: boolean
  error: string | null
}

// =============================================================================
// Context & Provider
// =============================================================================

const ConversationsContext = createContext<ConversationsContextType | null>(null)

export function ConversationsProvider({ children }: { children: React.ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversation, setCurrentConversationState] = useState<Conversation | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load conversations on mount
  useEffect(() => {
    loadConversations()
  }, [])

  async function loadConversations() {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/conversations')

      if (!response.ok) {
        throw new Error(`Failed to load conversations: ${response.statusText}`)
      }

      const data = await response.json()
      const fetchedConversations = data.conversations || []

      // Sort: pinned first, then by last_message_at
      const sorted = fetchedConversations.sort(
        (a: Conversation, b: Conversation) => {
          if (a.is_pinned && !b.is_pinned) return -1
          if (!a.is_pinned && b.is_pinned) return 1
          const aTime = new Date(a.last_message_at || a.created_at).getTime()
          const bTime = new Date(b.last_message_at || b.created_at).getTime()
          return bTime - aTime
        }
      )

      setConversations(sorted)

      // Restore current conversation from localStorage or use first
      const storedId = localStorage.getItem('currentConversationId')
      const currentFromStorage = sorted.find((c: Conversation) => c.id === storedId)
      const toSet = currentFromStorage || sorted[0] || null

      setCurrentConversationState(toSet)

      if (toSet) {
        localStorage.setItem('currentConversationId', toSet.id)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load conversations'
      setError(message)
      console.error('Error loading conversations:', err)
    } finally {
      setIsLoading(false)
    }
  }

  function setCurrentConversation(id: string) {
    const conversation = conversations.find(c => c.id === id)
    if (conversation) {
      setCurrentConversationState(conversation)
      localStorage.setItem('currentConversationId', id)
    }
  }

  async function createConversation(): Promise<Conversation> {
    try {
      setError(null)

      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: null, // Will be generated from first message
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to create conversation')
      }

      const result = await response.json()
      const newConversation = result.conversation

      setConversations(prev => [newConversation, ...prev])
      setCurrentConversationState(newConversation)
      localStorage.setItem('currentConversationId', newConversation.id)

      return newConversation
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create conversation'
      setError(message)
      throw err
    }
  }

  async function updateConversation(
    id: string,
    title: string,
    isPinned?: boolean
  ): Promise<Conversation> {
    try {
      setError(null)

      const body: Record<string, any> = { title }
      if (isPinned !== undefined) body.is_pinned = isPinned

      const response = await fetch(`/api/conversations/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to update conversation')
      }

      const result = await response.json()
      const updated = result.conversation

      // Re-sort conversations
      setConversations(prev => {
        const filtered = prev.filter(c => c.id !== id)
        const newList = [...filtered, updated]
        return newList.sort((a, b) => {
          if (a.is_pinned && !b.is_pinned) return -1
          if (!a.is_pinned && b.is_pinned) return 1
          const aTime = new Date(a.last_message_at || a.created_at).getTime()
          const bTime = new Date(b.last_message_at || b.created_at).getTime()
          return bTime - aTime
        })
      })

      // Update current conversation if it was modified
      if (currentConversation?.id === id) {
        setCurrentConversationState(updated)
      }

      return updated
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update conversation'
      setError(message)
      throw err
    }
  }

  async function pinConversation(id: string, pinned: boolean): Promise<Conversation> {
    const conversation = conversations.find(c => c.id === id)
    if (!conversation) {
      throw new Error('Conversation not found')
    }
    return updateConversation(id, conversation.title || 'Untitled', pinned)
  }

  async function deleteConversation(id: string): Promise<void> {
    try {
      setError(null)

      const response = await fetch(`/api/conversations/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to delete conversation')
      }

      setConversations(prev => prev.filter(c => c.id !== id))

      // Switch to another conversation if current was deleted
      if (currentConversation?.id === id) {
        const next = conversations.find(c => c.id !== id)
        setCurrentConversationState(next || null)
        if (next) {
          localStorage.setItem('currentConversationId', next.id)
        } else {
          localStorage.removeItem('currentConversationId')
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete conversation'
      setError(message)
      throw err
    }
  }

  const value: ConversationsContextType = {
    conversations,
    currentConversation,
    setCurrentConversation,
    createConversation,
    updateConversation,
    deleteConversation,
    pinConversation,
    isLoading,
    error,
  }

  return (
    <ConversationsContext.Provider value={value}>{children}</ConversationsContext.Provider>
  )
}

// =============================================================================
// Hook
// =============================================================================

export function useConversations() {
  const context = useContext(ConversationsContext)
  if (!context) {
    throw new Error('useConversations must be used within ConversationsProvider')
  }
  return context
}
