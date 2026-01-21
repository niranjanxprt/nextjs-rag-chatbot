/**
 * Conversation Query Functions
 *
 * Provides read-only access to conversation data with authentication and ownership checks.
 */

import { query } from '../_generated/server'
import { v } from 'convex/values'

/**
 * List all conversations for the authenticated user
 */
export const list = query({
  args: {},
  handler: async ctx => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error('Unauthorized: Authentication required')
    }

    const user = await ctx.db
      .query('users')
      .withIndex('email', q => q.eq('email', identity.email!))
      .first()

    if (!user) {
      throw new Error('User not found')
    }

    return await ctx.db
      .query('conversations')
      .withIndex('by_user', q => q.eq('user_id', user._id))
      .order('desc')
      .collect()
  },
})

/**
 * Get a specific conversation by ID
 */
export const get = query({
  args: { id: v.id('conversations') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error('Unauthorized: Authentication required')
    }

    const conversation = await ctx.db.get(args.id)
    if (!conversation) {
      throw new Error('Conversation not found')
    }

    const user = await ctx.db
      .query('users')
      .withIndex('email', q => q.eq('email', identity.email!))
      .first()

    if (!user || conversation.user_id !== user._id) {
      throw new Error('Unauthorized: Access denied')
    }

    return conversation
  },
})

/**
 * Get messages for a specific conversation
 */
export const getMessages = query({
  args: { conversationId: v.id('conversations') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error('Unauthorized: Authentication required')
    }

    // Verify conversation ownership
    const conversation = await ctx.db.get(args.conversationId)
    if (!conversation) {
      throw new Error('Conversation not found')
    }

    const user = await ctx.db
      .query('users')
      .withIndex('email', q => q.eq('email', identity.email!))
      .first()

    if (!user || conversation.user_id !== user._id) {
      throw new Error('Unauthorized: Access denied')
    }

    return await ctx.db
      .query('messages')
      .withIndex('by_conversation', q => q.eq('conversation_id', args.conversationId))
      .order('asc')
      .collect()
  },
})

/**
 * Get recent messages for a conversation (for context)
 * Returns last N messages ordered by timestamp
 */
export const getRecentMessages = query({
  args: {
    conversationId: v.id('conversations'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error('Unauthorized: Authentication required')
    }

    // Verify conversation ownership
    const conversation = await ctx.db.get(args.conversationId)
    if (!conversation) {
      throw new Error('Conversation not found')
    }

    const user = await ctx.db
      .query('users')
      .withIndex('email', q => q.eq('email', identity.email!))
      .first()

    if (!user || conversation.user_id !== user._id) {
      throw new Error('Unauthorized: Access denied')
    }

    const limit = args.limit ?? 10
    const messages = await ctx.db
      .query('messages')
      .withIndex('by_conversation', q => q.eq('conversation_id', args.conversationId))
      .order('desc')
      .take(limit)

    // Return in chronological order (oldest first)
    return messages.reverse()
  },
})

/**
 * List conversations with optional project filter
 */
export const listByProject = query({
  args: {
    project_id: v.optional(v.id('projects')),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error('Unauthorized: Authentication required')
    }

    const user = await ctx.db
      .query('users')
      .withIndex('email', q => q.eq('email', identity.email!))
      .first()

    if (!user) {
      throw new Error('User not found')
    }

    const conversations = await ctx.db
      .query('conversations')
      .withIndex('by_user', q => q.eq('user_id', user._id))
      .order('desc')
      .collect()

    // Filter by project if provided
    if (args.project_id) {
      return conversations.filter(c => c.project_id === args.project_id)
    }

    return conversations
  },
})
