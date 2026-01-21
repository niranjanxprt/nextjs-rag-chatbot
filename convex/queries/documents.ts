/**
 * Document Queries
 * 
 * Convex queries for document retrieval with user_id filtering
 */

import { query } from '../_generated/server'
import { v } from 'convex/values'

/**
 * Get a single document by ID
 * Enforces user ownership
 */
export const get = query({
  args: {
    id: v.id('documents'),
    user_id: v.id('users'),
  },
  handler: async (ctx, args) => {
    const document = await ctx.db.get(args.id)
    
    if (!document) {
      return null
    }
    
    // Enforce user ownership
    if (document.user_id !== args.user_id) {
      throw new Error('Unauthorized: Document does not belong to user')
    }
    
    return document
  },
})

/**
 * List documents for a user
 * Optionally filter by project_id
 */
export const list = query({
  args: {
    user_id: v.id('users'),
    project_id: v.optional(v.id('projects')),
    limit: v.optional(v.number()),
    status: v.optional(v.union(
      v.literal('processing'),
      v.literal('ready'),
      v.literal('error')
    )),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query('documents')
      .withIndex('by_user', (q) => q.eq('user_id', args.user_id))
    
    // Filter by project if provided
    if (args.project_id) {
      query = ctx.db
        .query('documents')
        .withIndex('by_user_project', (q) => 
          q.eq('user_id', args.user_id).eq('project_id', args.project_id)
        )
    }
    
    // Filter by status if provided
    if (args.status) {
      const allDocs = await query.collect()
      const filtered = allDocs.filter(doc => doc.status === args.status)
      return args.limit ? filtered.slice(0, args.limit) : filtered
    }
    
    // Apply limit
    if (args.limit) {
      return await query.take(args.limit)
    }
    
    return await query.collect()
  },
})

/**
 * Get document by storage_id
 * Used when processing uploaded files
 */
export const getByStorageId = query({
  args: {
    storage_id: v.id('_storage'),
    user_id: v.id('users'),
  },
  handler: async (ctx, args) => {
    const documents = await ctx.db
      .query('documents')
      .withIndex('by_user', (q) => q.eq('user_id', args.user_id))
      .collect()
    
    const document = documents.find(doc => doc.storage_id === args.storage_id)
    
    if (!document) {
      return null
    }
    
    return document
  },
})

/**
 * Count documents by status for a user
 */
export const countByStatus = query({
  args: {
    user_id: v.id('users'),
    project_id: v.optional(v.id('projects')),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query('documents')
      .withIndex('by_user', (q) => q.eq('user_id', args.user_id))
    
    if (args.project_id) {
      query = ctx.db
        .query('documents')
        .withIndex('by_user_project', (q) => 
          q.eq('user_id', args.user_id).eq('project_id', args.project_id)
        )
    }
    
    const documents = await query.collect()
    
    return {
      processing: documents.filter(d => d.status === 'processing').length,
      ready: documents.filter(d => d.status === 'ready').length,
      error: documents.filter(d => d.status === 'error').length,
      total: documents.length,
    }
  },
})
