/**
 * Document Query Functions
 *
 * Provides read-only access to document data with authentication and ownership checks.
 */

import { query } from '../_generated/server'
import { v } from 'convex/values'

/**
 * List all documents for the authenticated user
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
      .query('documents')
      .withIndex('by_user', q => q.eq('user_id', user._id))
      .order('desc')
      .collect()
  },
})

/**
 * Get a specific document by ID
 */
export const get = query({
  args: { id: v.id('documents') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error('Unauthorized: Authentication required')
    }

    const document = await ctx.db.get(args.id)
    if (!document) {
      throw new Error('Document not found')
    }

    const user = await ctx.db
      .query('users')
      .withIndex('email', q => q.eq('email', identity.email!))
      .first()

    if (!user || document.user_id !== user._id) {
      throw new Error('Unauthorized: Access denied')
    }

    return document
  },
})

/**
 * Get documents by status
 */
export const getByStatus = query({
  args: {
    status: v.union(
      v.literal('pending'),
      v.literal('processing'),
      v.literal('completed'),
      v.literal('failed')
    ),
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

    // Get all user documents first, then filter by status
    const allDocs = await ctx.db
      .query('documents')
      .withIndex('by_user', q => q.eq('user_id', user._id))
      .collect()

    return allDocs.filter(doc => doc.status === args.status)
  },
})

/**
 * Get document chunks for a specific document
 */
export const getChunks = query({
  args: { documentId: v.id('documents') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error('Unauthorized: Authentication required')
    }

    // Verify document ownership
    const document = await ctx.db.get(args.documentId)
    if (!document) {
      throw new Error('Document not found')
    }

    const user = await ctx.db
      .query('users')
      .withIndex('email', q => q.eq('email', identity.email!))
      .first()

    if (!user || document.user_id !== user._id) {
      throw new Error('Unauthorized: Access denied')
    }

    return await ctx.db
      .query('document_chunks')
      .withIndex('by_document', q => q.eq('document_id', args.documentId))
      .order('asc')
      .collect()
  },
})
