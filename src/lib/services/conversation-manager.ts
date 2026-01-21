/**
 * Conversation Manager Service
 * 
 * Manages conversation history and persistence using Convex
 */

import { ConvexHttpClient } from 'convex/browser'
import { api } from '../../../convex/_generated/api'
import { Id } from '../../../convex/_generated/dataModel'
import { Conversation, Message, SourceCitation } from '@/lib/types/rag'

// =============================================================================
// Convex Client
// =============================================================================

let convexClient: ConvexHttpClient | null = null

function getConvexClient(): ConvexHttpClient {
  if (!convexClient) {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL
    
    if (!url) {
      throw new Error('NEXT_PUBLIC_CONVEX_URL environment variable is not set')
    }
    
    convexClient = new ConvexHttpClient(url)
  }
  
  return convexClient
}

// =============================================================================
// Conversation Management
// =============================================================================

/**
 * Create a new conversation
 * @param userId - User ID
 * @param projectId - Optional project ID
 * @param title - Conversation title (auto-generated from first message if not provided)
 * @returns Conversation ID
 */
export async function createConversation(
  userId: string,
  projectId?: string,
  title?: string
): Promise<string> {
  const client = getConvexClient()
  
  try {
    const conversationId = await client.mutation(api.mutations.conversations.create, {
      title: title || 'New Conversation',
    })
    
    return conversationId
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to create conversation: ${error.message}`)
    }
    throw new Error('Failed to create conversation: Unknown error')
  }
}

/**
 * Add message to conversation
 * @param conversationId - Conversation ID
 * @param message - Message to add
 */
export async function addMessage(
  conversationId: string,
  message: Omit<Message, '_id' | 'conversation_id' | 'timestamp' | 'created_at'>
): Promise<string> {
  const client = getConvexClient()
  
  try {
    const messageId = await client.mutation(api.mutations.conversations.addMessage, {
      conversation_id: conversationId as Id<'conversations'>,
      role: message.role,
      content: message.content,
      sources: message.sources,
    })
    
    return messageId
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to add message: ${error.message}`)
    }
    throw new Error('Failed to add message: Unknown error')
  }
}

/**
 * Load conversation history
 * @param conversationId - Conversation ID
 * @param limit - Number of recent messages to load (default: 10)
 * @returns Array of messages ordered by timestamp
 */
export async function loadHistory(
  conversationId: string,
  limit: number = 10
): Promise<Message[]> {
  const client = getConvexClient()
  
  try {
    const messages = await client.query(api.queries.conversations.getMessages, {
      conversation_id: conversationId as Id<'conversations'>,
    })
    
    // Sort by timestamp and limit
    const sortedMessages = messages
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-limit)
    
    return sortedMessages as Message[]
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to load conversation history: ${error.message}`)
    }
    throw new Error('Failed to load conversation history: Unknown error')
  }
}

/**
 * List user's conversations
 * @param userId - User ID
 * @param projectId - Optional project filter
 * @returns Array of conversations ordered by updated_at
 */
export async function listConversations(
  userId: string,
  projectId?: string
): Promise<Conversation[]> {
  const client = getConvexClient()
  
  try {
    const conversations = await client.query(api.queries.conversations.list, {})
    
    // Filter by project if provided
    let filtered = conversations
    if (projectId) {
      filtered = conversations.filter(c => c.project_id === projectId)
    }
    
    // Sort by updated_at descending
    filtered.sort((a, b) => b.updated_at - a.updated_at)
    
    return filtered as Conversation[]
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to list conversations: ${error.message}`)
    }
    throw new Error('Failed to list conversations: Unknown error')
  }
}

/**
 * Delete conversation and all messages
 * @param conversationId - Conversation ID
 * @param userId - User ID for verification
 */
export async function deleteConversation(
  conversationId: string,
  userId: string
): Promise<void> {
  const client = getConvexClient()
  
  try {
    await client.mutation(api.mutations.conversations.remove, {
      id: conversationId as Id<'conversations'>,
    })
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to delete conversation: ${error.message}`)
    }
    throw new Error('Failed to delete conversation: Unknown error')
  }
}

/**
 * Update conversation title
 * @param conversationId - Conversation ID
 * @param title - New title
 * @param userId - User ID for verification
 */
export async function updateConversationTitle(
  conversationId: string,
  title: string,
  userId: string
): Promise<void> {
  const client = getConvexClient()
  
  try {
    await client.mutation(api.mutations.conversations.update, {
      id: conversationId as Id<'conversations'>,
      title,
    })
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to update conversation title: ${error.message}`)
    }
    throw new Error('Failed to update conversation title: Unknown error')
  }
}

/**
 * Auto-generate conversation title from first message
 * @param firstMessage - First user message
 * @returns Generated title (first 50 characters)
 */
export function generateConversationTitle(firstMessage: string): string {
  const cleaned = firstMessage.trim()
  
  if (cleaned.length <= 50) {
    return cleaned
  }
  
  // Truncate at 50 chars and try to end at a word boundary
  const truncated = cleaned.substring(0, 50)
  const lastSpace = truncated.lastIndexOf(' ')
  
  if (lastSpace > 30) {
    return truncated.substring(0, lastSpace) + '...'
  }
  
  return truncated + '...'
}

// =============================================================================
// Exports
// =============================================================================

export const ConversationManager = {
  createConversation,
  addMessage,
  loadHistory,
  listConversations,
  deleteConversation,
  updateConversationTitle,
  generateConversationTitle,
}
