/**
 * Conversation State Management
 * 
 * Manages conversation persistence, context windows, and state synchronization
 * with Redis for optimal performance and user experience
 */

import { Redis } from '@upstash/redis'
import { createHash } from 'crypto'
import type { Message } from '@/lib/types/database'
import { estimateTokenCount, fitContextToTokenLimit } from '@/lib/utils/token-counter'

// =============================================================================
// Types
// =============================================================================

export interface ConversationState {
  id: string
  userId: string
  title?: string
  messages: ConversationMessage[]
  metadata: {
    createdAt: string
    updatedAt: string
    totalMessages: number
    totalTokens: number
    lastActivity: string
  }
}

export interface ConversationMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  metadata?: {
    searchResults?: number
    contextUsed?: number
    tokenUsage?: {
      input?: number
      output?: number
      total?: number
    }
    contextSources?: Array<{
      documentId: string
      filename: string
      score: number
    }>
  }
}

export interface ConversationSummary {
  id: string
  title: string
  lastMessage: string
  lastActivity: string
  messageCount: number
  totalTokens: number
}

export interface ConversationOptions {
  maxMessages?: number
  maxTokens?: number
  ttl?: number // Time to live in seconds
  includeMetadata?: boolean
}

// =============================================================================
// Configuration
// =============================================================================

const CONVERSATION_CONFIG = {
  cachePrefix: 'conversation:',
  summaryPrefix: 'conversation_summary:',
  userConversationsPrefix: 'user_conversations:',
  defaultTTL: 86400 * 7, // 7 days
  maxMessages: 100,
  maxTokens: 8000,
  cleanupInterval: 3600, // 1 hour
  compressionThreshold: 50 // Messages before compression
}

// =============================================================================
// Initialize Services
// =============================================================================

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
})

// =============================================================================
// Error Handling
// =============================================================================

export class ConversationStateError extends Error {
  constructor(
    message: string,
    public code?: string
  ) {
    super(message)
    this.name = 'ConversationStateError'
  }
}

// =============================================================================
// Utility Functions
// =============================================================================

function generateConversationKey(conversationId: string): string {
  return `${CONVERSATION_CONFIG.cachePrefix}${conversationId}`
}

function generateSummaryKey(conversationId: string): string {
  return `${CONVERSATION_CONFIG.summaryPrefix}${conversationId}`
}

function generateUserConversationsKey(userId: string): string {
  return `${CONVERSATION_CONFIG.userConversationsPrefix}${userId}`
}

function calculateConversationTokens(messages: ConversationMessage[]): number {
  return messages.reduce((total, message) => {
    return total + estimateTokenCount(message.content)
  }, 0)
}

function generateConversationTitle(messages: ConversationMessage[]): string {
  // Find the first user message
  const firstUserMessage = messages.find(msg => msg.role === 'user')
  if (!firstUserMessage) {
    return 'New Conversation'
  }
  
  // Use first 50 characters of the first user message
  const title = firstUserMessage.content.substring(0, 50).trim()
  return title.length < firstUserMessage.content.length ? `${title}...` : title
}

// =============================================================================
// Core Conversation State Functions
// =============================================================================

export async function getConversationState(
  conversationId: string,
  options: ConversationOptions = {}
): Promise<ConversationState | null> {
  try {
    const key = generateConversationKey(conversationId)
    const cached = await redis.get(key)
    
    if (!cached || typeof cached !== 'object') {
      return null
    }
    
    const state = cached as ConversationState
    
    // Apply message and token limits if specified
    if (options.maxMessages && state.messages.length > options.maxMessages) {
      state.messages = state.messages.slice(-options.maxMessages)
    }
    
    if (options.maxTokens) {
      const totalTokens = calculateConversationTokens(state.messages)
      if (totalTokens > options.maxTokens) {
        // Keep messages within token limit, prioritizing recent messages
        let currentTokens = 0
        const limitedMessages: ConversationMessage[] = []
        
        for (let i = state.messages.length - 1; i >= 0; i--) {
          const messageTokens = estimateTokenCount(state.messages[i].content)
          if (currentTokens + messageTokens <= options.maxTokens) {
            limitedMessages.unshift(state.messages[i])
            currentTokens += messageTokens
          } else {
            break
          }
        }
        
        state.messages = limitedMessages
      }
    }
    
    return state
    
  } catch (error) {
    console.error('Error retrieving conversation state:', error)
    throw new ConversationStateError('Failed to retrieve conversation state')
  }
}

export async function saveConversationState(
  state: ConversationState,
  options: ConversationOptions = {}
): Promise<void> {
  try {
    const key = generateConversationKey(state.id)
    const ttl = options.ttl || CONVERSATION_CONFIG.defaultTTL
    
    // Update metadata
    state.metadata.updatedAt = new Date().toISOString()
    state.metadata.lastActivity = new Date().toISOString()
    state.metadata.totalMessages = state.messages.length
    state.metadata.totalTokens = calculateConversationTokens(state.messages)
    
    // Generate title if not set
    if (!state.title && state.messages.length > 0) {
      state.title = generateConversationTitle(state.messages)
    }
    
    // Save conversation state
    await redis.setex(key, ttl, state)
    
    // Update conversation summary
    await updateConversationSummary(state)
    
    // Update user's conversation list
    await addToUserConversations(state.userId, state.id)
    
    console.log(`Saved conversation state: ${state.id} (${state.messages.length} messages, ${state.metadata.totalTokens} tokens)`)
    
  } catch (error) {
    console.error('Error saving conversation state:', error)
    throw new ConversationStateError('Failed to save conversation state')
  }
}

export async function addMessageToConversation(
  conversationId: string,
  message: Omit<ConversationMessage, 'id' | 'timestamp'>
): Promise<ConversationState> {
  try {
    // Get existing state or create new one
    let state = await getConversationState(conversationId)
    
    if (!state) {
      throw new ConversationStateError('Conversation not found')
    }
    
    // Create new message
    const newMessage: ConversationMessage = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    }
    
    // Add message to state
    state.messages.push(newMessage)
    
    // Apply limits
    if (state.messages.length > CONVERSATION_CONFIG.maxMessages) {
      state.messages = state.messages.slice(-CONVERSATION_CONFIG.maxMessages)
    }
    
    const totalTokens = calculateConversationTokens(state.messages)
    if (totalTokens > CONVERSATION_CONFIG.maxTokens) {
      // Compress older messages by keeping only recent ones
      let currentTokens = 0
      const limitedMessages: ConversationMessage[] = []
      
      for (let i = state.messages.length - 1; i >= 0; i--) {
        const messageTokens = estimateTokenCount(state.messages[i].content)
        if (currentTokens + messageTokens <= CONVERSATION_CONFIG.maxTokens) {
          limitedMessages.unshift(state.messages[i])
          currentTokens += messageTokens
        } else {
          break
        }
      }
      
      state.messages = limitedMessages
    }
    
    // Save updated state
    await saveConversationState(state)
    
    return state
    
  } catch (error) {
    console.error('Error adding message to conversation:', error)
    throw new ConversationStateError('Failed to add message to conversation')
  }
}

export async function createConversationState(
  conversationId: string,
  userId: string,
  initialMessage?: Omit<ConversationMessage, 'id' | 'timestamp'>
): Promise<ConversationState> {
  try {
    const now = new Date().toISOString()
    
    const state: ConversationState = {
      id: conversationId,
      userId,
      messages: [],
      metadata: {
        createdAt: now,
        updatedAt: now,
        totalMessages: 0,
        totalTokens: 0,
        lastActivity: now
      }
    }
    
    // Add initial message if provided
    if (initialMessage) {
      const message: ConversationMessage = {
        ...initialMessage,
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: now
      }
      state.messages.push(message)
    }
    
    await saveConversationState(state)
    
    console.log(`Created new conversation state: ${conversationId}`)
    
    return state
    
  } catch (error) {
    console.error('Error creating conversation state:', error)
    throw new ConversationStateError('Failed to create conversation state')
  }
}

// =============================================================================
// Conversation Summary Functions
// =============================================================================

async function updateConversationSummary(state: ConversationState): Promise<void> {
  try {
    const summary: ConversationSummary = {
      id: state.id,
      title: state.title || generateConversationTitle(state.messages),
      lastMessage: state.messages.length > 0 
        ? state.messages[state.messages.length - 1].content.substring(0, 100)
        : '',
      lastActivity: state.metadata.lastActivity,
      messageCount: state.metadata.totalMessages,
      totalTokens: state.metadata.totalTokens
    }
    
    const key = generateSummaryKey(state.id)
    await redis.setex(key, CONVERSATION_CONFIG.defaultTTL, summary)
    
  } catch (error) {
    console.error('Error updating conversation summary:', error)
  }
}

export async function getConversationSummary(
  conversationId: string
): Promise<ConversationSummary | null> {
  try {
    const key = generateSummaryKey(conversationId)
    const summary = await redis.get(key)
    
    return summary && typeof summary === 'object' ? summary as ConversationSummary : null
    
  } catch (error) {
    console.error('Error retrieving conversation summary:', error)
    return null
  }
}

// =============================================================================
// User Conversation Management
// =============================================================================

async function addToUserConversations(userId: string, conversationId: string): Promise<void> {
  try {
    const key = generateUserConversationsKey(userId)
    
    // Add conversation ID to user's set with current timestamp as score
    await redis.zadd(key, { score: Date.now(), member: conversationId })
    
    // Set TTL for user conversations list
    await redis.expire(key, CONVERSATION_CONFIG.defaultTTL)
    
  } catch (error) {
    console.error('Error adding to user conversations:', error)
  }
}

export async function getUserConversations(
  userId: string,
  limit: number = 20,
  offset: number = 0
): Promise<ConversationSummary[]> {
  try {
    const key = generateUserConversationsKey(userId)
    
    // Get conversation IDs sorted by recency (highest score first)
    const conversationIds = await redis.zrange(key, offset, offset + limit - 1, { rev: true })
    
    if (!conversationIds || conversationIds.length === 0) {
      return []
    }
    
    // Get summaries for each conversation
    const summaries: ConversationSummary[] = []
    
    for (const conversationId of conversationIds) {
      const summary = await getConversationSummary(conversationId as string)
      if (summary) {
        summaries.push(summary)
      }
    }
    
    return summaries
    
  } catch (error) {
    console.error('Error retrieving user conversations:', error)
    return []
  }
}

// =============================================================================
// Cleanup and Maintenance
// =============================================================================

export async function deleteConversation(
  conversationId: string,
  userId: string
): Promise<boolean> {
  try {
    const conversationKey = generateConversationKey(conversationId)
    const summaryKey = generateSummaryKey(conversationId)
    const userConversationsKey = generateUserConversationsKey(userId)
    
    // Delete conversation state and summary
    await Promise.all([
      redis.del(conversationKey),
      redis.del(summaryKey),
      redis.zrem(userConversationsKey, conversationId)
    ])
    
    console.log(`Deleted conversation: ${conversationId}`)
    
    return true
    
  } catch (error) {
    console.error('Error deleting conversation:', error)
    return false
  }
}

export async function cleanupExpiredConversations(): Promise<number> {
  try {
    let cleanedCount = 0
    
    // This is a simplified cleanup - in production you might want more sophisticated logic
    const pattern = `${CONVERSATION_CONFIG.cachePrefix}*`
    const keys = await redis.keys(pattern)
    
    for (const key of keys) {
      const ttl = await redis.ttl(key)
      if (ttl === -1) { // Key exists but has no TTL
        await redis.expire(key, CONVERSATION_CONFIG.defaultTTL)
      }
    }
    
    console.log(`Cleaned up ${cleanedCount} expired conversations`)
    
    return cleanedCount
    
  } catch (error) {
    console.error('Error cleaning up conversations:', error)
    return 0
  }
}

// =============================================================================
// Utility Functions
// =============================================================================

export async function getConversationStats(userId?: string): Promise<{
  totalConversations: number
  totalMessages: number
  averageMessagesPerConversation: number
  oldestConversation?: string
  newestConversation?: string
}> {
  try {
    if (userId) {
      const conversations = await getUserConversations(userId, 1000) // Get all
      const totalMessages = conversations.reduce((sum, conv) => sum + conv.messageCount, 0)
      
      return {
        totalConversations: conversations.length,
        totalMessages,
        averageMessagesPerConversation: conversations.length > 0 ? totalMessages / conversations.length : 0,
        oldestConversation: conversations.length > 0 ? conversations[conversations.length - 1].lastActivity : undefined,
        newestConversation: conversations.length > 0 ? conversations[0].lastActivity : undefined
      }
    }
    
    // Global stats
    const conversationKeys = await redis.keys(`${CONVERSATION_CONFIG.cachePrefix}*`)
    
    return {
      totalConversations: conversationKeys.length,
      totalMessages: 0, // Would need to iterate through all conversations
      averageMessagesPerConversation: 0,
    }
    
  } catch (error) {
    console.error('Error getting conversation stats:', error)
    return {
      totalConversations: 0,
      totalMessages: 0,
      averageMessagesPerConversation: 0
    }
  }
}

export function formatConversationForExport(state: ConversationState): string {
  const header = `Conversation: ${state.title || state.id}\n`
  const metadata = `Created: ${state.metadata.createdAt}\nMessages: ${state.metadata.totalMessages}\n\n`
  
  const messages = state.messages
    .map(msg => `[${msg.timestamp}] ${msg.role.toUpperCase()}: ${msg.content}`)
    .join('\n\n')
  
  return header + metadata + messages
}