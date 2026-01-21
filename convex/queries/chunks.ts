/**
 * Chunk Queries
 * 
 * Convex queries for document chunk retrieval
 */

import { query } from '../_generated/server'
import { v } from 'convex/values'

/**
 * Get all chunks for a document
 */
export const getByDocument = query({
  args: {
    document_id: v.id('documents'),
    user_id: v.id('users'),
  },
  handler: async (ctx, args) => {
    // Verify user owns the document
    const document = await ctx.db.get(args.document_id)
    
    if (!document) {
      throw new Error('Document not found')
    }
    
    if (document.user_id !== args.user_id) {
      throw new Error('Unauthorized: Document does not belong to user')
    }
    
    // Get all chunks for the document
    const chunks = await ctx.db
      .query('chunks')
      .withIndex('by_document', (q) => q.eq('document_id', args.document_id))
      .collect()
    
    // Sort by position
    return chunks.sort((a, b) => a.position - b.position)
  },
})

/**
 * Get a single chunk by ID
 */
export const get = query({
  args: {
    id: v.id('chunks'),
    user_id: v.id('users'),
  },
  handler: async (ctx, args) => {
    const chunk = await ctx.db.get(args.id)
    
    if (!chunk) {
      return null
    }
    
    // Enforce user ownership
    if (chunk.user_id !== args.user_id) {
      throw new Error('Unauthorized: Chunk does not belong to user')
    }
    
    return chunk
  },
})

/**
 * Get chunk by Qdrant ID
 * Used for linking Qdrant search results back to Convex
 */
export const getByQdrantId = query({
  args: {
    qdrant_id: v.string(),
    user_id: v.id('users'),
  },
  handler: async (ctx, args) => {
    const chunks = await ctx.db
      .query('chunks')
      .withIndex('by_qdrant_id', (q) => q.eq('qdrant_id', args.qdrant_id))
      .collect()
    
    const chunk = chunks[0]
    
    if (!chunk) {
      return null
    }
    
    // Enforce user ownership
    if (chunk.user_id !== args.user_id) {
      throw new Error('Unauthorized: Chunk does not belong to user')
    }
    
    return chunk
  },
})

/**
 * Count chunks for a document
 */
export const countByDocument = query({
  args: {
    document_id: v.id('documents'),
    user_id: v.id('users'),
  },
  handler: async (ctx, args) => {
    // Verify user owns the document
    const document = await ctx.db.get(args.document_id)
    
    if (!document) {
      throw new Error('Document not found')
    }
    
    if (document.user_id !== args.user_id) {
      throw new Error('Unauthorized: Document does not belong to user')
    }
    
    const chunks = await ctx.db
      .query('chunks')
      .withIndex('by_document', (q) => q.eq('document_id', args.document_id))
      .collect()
    
    return chunks.length
  },
})
