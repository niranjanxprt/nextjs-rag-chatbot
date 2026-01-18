/**
 * Conversation Mutation Functions
 *
 * Provides write operations for conversations and messages with authentication checks.
 */

import { mutation } from '../_generated/server'
import { v } from 'convex/values'

/**
 * Create a new conversation
 */
export const create = mutation({
  args: {
    title: v.string(),
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

    const now = Date.now()
    const conversationId = await ctx.db.insert('conversations', {
      user_id: user._id,
      title: args.title,
      created_at: now,
      updated_at: now,
    })

    return conversationId
  },
})

/**
 * Update conversation title
 */
export const update = mutation({
  args: {
    id: v.id('conversations'),
    title: v.string(),
  },
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

    await ctx.db.patch(args.id, {
      title: args.title,
      updated_at: Date.now(),
    })
  },
})

/**
 * Delete a conversation
 */
export const remove = mutation({
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

    // Delete all messages in the conversation
    const messages = await ctx.db
      .query('messages')
      .withIndex('by_conversation', q => q.eq('conversation_id', args.id))
      .collect()

    for (const message of messages) {
      await ctx.db.delete(message._id)
    }

    // Delete the conversation
    await ctx.db.delete(args.id)
  },
})

/**
 * Add a message to a conversation
 */
export const addMessage = mutation({
  args: {
    conversation_id: v.id('conversations'),
    role: v.union(v.literal('user'), v.literal('assistant')),
    content: v.string(),
    sources: v.optional(
      v.array(
        v.object({
          document_id: v.id('documents'),
          chunk_index: v.number(),
          similarity: v.float64(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error('Unauthorized: Authentication required')
    }

    // Verify conversation ownership
    const conversation = await ctx.db.get(args.conversation_id)
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

    const messageId = await ctx.db.insert('messages', {
      conversation_id: args.conversation_id,
      role: args.role,
      content: args.content,
      sources: args.sources,
      created_at: Date.now(),
    })

    // Update conversation's updated_at timestamp
    await ctx.db.patch(args.conversation_id, {
      updated_at: Date.now(),
    })

    return messageId
  },
})
