/**
 * Chat Store - Zustand State Management
 *
 * Centralized state management for chat functionality following best practices:
 * - Better performance than React Context (fewer re-renders)
 * - Persistent draft input across page refreshes
 * - TypeScript-friendly with full type safety
 * - Simpler than Redux with less boilerplate
 *
 * Based on recommendations from:
 * - Perplexity AI research on React chat best practices
 * - Vercel React best practices (react-best-practices skill)
 * - AI SDK documentation
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ChatMessage } from '@/services/api/types'

interface ChatState {
  // State
  conversationId: string | null
  messages: ChatMessage[]
  input: string
  isStreaming: boolean
  selectedProject: string | null
  useKnowledgeBase: boolean

  // Actions
  setConversationId: (id: string | null) => void
  appendMessage: (message: ChatMessage) => void
  updateMessage: (messageId: string, updates: Partial<ChatMessage>) => void
  setMessages: (messages: ChatMessage[]) => void
  setInput: (input: string) => void
  setIsStreaming: (streaming: boolean) => void
  setSelectedProject: (projectId: string | null) => void
  setUseKnowledgeBase: (use: boolean) => void
  clear: () => void
  clearMessages: () => void
}

/**
 * Chat Store
 *
 * Uses Zustand with persistence middleware to:
 * 1. Maintain conversation state across page refreshes
 * 2. Persist draft input (never lose what user was typing)
 * 3. Optimize re-renders (only components using specific state update)
 * 4. Provide clean API for state management
 */
export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      // Initial state
      conversationId: null,
      messages: [],
      input: '',
      isStreaming: false,
      selectedProject: null,
      useKnowledgeBase: false,

      // Actions
      setConversationId: id => set({ conversationId: id }),

      appendMessage: message =>
        set(state => ({
          messages: [...state.messages, message],
        })),

      updateMessage: (messageId, updates) =>
        set(state => ({
          messages: state.messages.map(msg =>
            msg.id === messageId ? { ...msg, ...updates } : msg
          ),
        })),

      setMessages: messages => set({ messages }),

      setInput: input => set({ input }),

      setIsStreaming: streaming => set({ isStreaming: streaming }),

      setSelectedProject: projectId => set({ selectedProject: projectId }),

      setUseKnowledgeBase: use => set({ useKnowledgeBase: use }),

      clear: () =>
        set({
          conversationId: null,
          messages: [],
          input: '',
          isStreaming: false,
        }),

      clearMessages: () =>
        set({
          messages: [],
          conversationId: null,
        }),
    }),
    {
      name: 'chat-store',
      // Only persist these fields (not messages - they come from backend)
      partialize: state => ({
        input: state.input, // Persist draft input
        conversationId: state.conversationId, // Persist current conversation
        selectedProject: state.selectedProject, // Persist selected project
        useKnowledgeBase: state.useKnowledgeBase, // Persist KB toggle
      }),
    }
  )
)

/**
 * Selectors for optimized component subscriptions
 *
 * Use these to subscribe to specific parts of state:
 * - Prevents unnecessary re-renders
 * - Follows React best practices for performance
 *
 * Example:
 *   const input = useChatStore(selectInput)
 *   const messages = useChatStore(selectMessages)
 */
export const selectInput = (state: ChatState) => state.input
export const selectMessages = (state: ChatState) => state.messages
export const selectIsStreaming = (state: ChatState) => state.isStreaming
export const selectConversationId = (state: ChatState) => state.conversationId
export const selectSelectedProject = (state: ChatState) => state.selectedProject
export const selectUseKnowledgeBase = (state: ChatState) => state.useKnowledgeBase

/**
 * Action selectors for components that only need actions
 *
 * Use these to avoid re-renders when state changes:
 *
 * Example:
 *   const { setInput, appendMessage } = useChatStore(selectActions)
 */
export const selectActions = (state: ChatState) => ({
  setConversationId: state.setConversationId,
  appendMessage: state.appendMessage,
  updateMessage: state.updateMessage,
  setMessages: state.setMessages,
  setInput: state.setInput,
  setIsStreaming: state.setIsStreaming,
  setSelectedProject: state.setSelectedProject,
  setUseKnowledgeBase: state.setUseKnowledgeBase,
  clear: state.clear,
  clearMessages: state.clearMessages,
})
