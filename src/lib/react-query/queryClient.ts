/**
 * React Query Client Configuration
 * 
 * Centralized configuration for React Query with optimized defaults
 * for the RAG chatbot application.
 */

import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: 5 minutes for most queries
      staleTime: 5 * 60 * 1000,
      // Cache time: 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry failed requests 3 times with exponential backoff
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus for real-time data
      refetchOnWindowFocus: true,
      // Don't refetch on reconnect to avoid spam
      refetchOnReconnect: false,
    },
    mutations: {
      // Retry mutations once
      retry: 1,
      // Show error notifications by default
      onError: (error) => {
        console.error('Mutation error:', error)
      },
    },
  },
})

// Query keys factory for consistent key management
export const queryKeys = {
  // User queries
  user: ['user'] as const,
  userProfile: (userId: string) => ['user', 'profile', userId] as const,
  
  // Project queries
  projects: ['projects'] as const,
  project: (id: string) => ['projects', id] as const,
  projectMembers: (id: string) => ['projects', id, 'members'] as const,
  
  // Document queries
  documents: ['documents'] as const,
  document: (id: string) => ['documents', id] as const,
  userDocuments: (userId: string) => ['documents', 'user', userId] as const,
  projectDocuments: (projectId: string) => ['documents', 'project', projectId] as const,
  
  // Conversation queries
  conversations: ['conversations'] as const,
  conversation: (id: string) => ['conversations', id] as const,
  conversationMessages: (id: string) => ['conversations', id, 'messages'] as const,
  userConversations: (userId: string) => ['conversations', 'user', userId] as const,
  projectConversations: (projectId: string) => ['conversations', 'project', projectId] as const,
  
  // Prompt queries
  prompts: ['prompts'] as const,
  prompt: (id: string) => ['prompts', id] as const,
  userPrompts: (userId: string) => ['prompts', 'user', userId] as const,
  
  // Knowledge base queries
  knowledgeBases: ['knowledge-bases'] as const,
  knowledgeBase: (id: string) => ['knowledge-bases', id] as const,
  knowledgeBaseDocuments: (id: string) => ['knowledge-bases', id, 'documents'] as const,
  
  // Member queries
  members: ['members'] as const,
  projectInvitations: (projectId: string) => ['invitations', 'project', projectId] as const,
  userInvitations: (userId: string) => ['invitations', 'user', userId] as const,
  
  // Search queries
  search: (query: string, filters?: Record<string, any>) => 
    ['search', query, filters] as const,
  searchSuggestions: (query: string) => ['search', 'suggestions', query] as const,
  
  // Activity queries
  activity: ['activity'] as const,
  userActivity: (userId: string) => ['activity', 'user', userId] as const,
  projectActivity: (projectId: string) => ['activity', 'project', projectId] as const,
} as const

// Helper function to invalidate related queries
export const invalidateQueries = {
  user: () => queryClient.invalidateQueries({ queryKey: queryKeys.user }),
  projects: () => queryClient.invalidateQueries({ queryKey: queryKeys.projects }),
  documents: () => queryClient.invalidateQueries({ queryKey: queryKeys.documents }),
  conversations: () => queryClient.invalidateQueries({ queryKey: queryKeys.conversations }),
  prompts: () => queryClient.invalidateQueries({ queryKey: queryKeys.prompts }),
  knowledgeBases: () => queryClient.invalidateQueries({ queryKey: queryKeys.knowledgeBases }),
  members: () => queryClient.invalidateQueries({ queryKey: queryKeys.members }),
  activity: () => queryClient.invalidateQueries({ queryKey: queryKeys.activity }),
}