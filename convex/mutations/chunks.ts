/**
 * Chunk Mutations
 * 
 * Convex mutations for chunk CRUD operations
 */

import { mutation } from '../_generated/server'
import { v } from 'convex/values'

/**
 * Create a new chunk
 */
export const create = mutation({
  args: {
    document_id: v.id('documents'),
    content: v.string(),
    position: v.number(),
    start_char: v.number(),
    end_char: v.number(),
    qdrant_id: v.string(),
    user_id: v.id('users'),
    project_id: v.optional(v.id('projects')),
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
    
    const chunkId = await ctx.db.insert('chunks', {
      document_id: args.document_id,
      content: args.content,
      position: args.position,
      start_char: args.start_char,
      end_char: args.end_char,
      qdrant_id: args.qdrant_id,
      user_id: args.user_id,
      project_id: args.project_id,
      created_at: Date.now(),
    })
    
    return chunkId
  },
})

/**
 * Create multiple chunks in batch
 */
export const createBatch = mutation({
  args: {
    chunks: v.array(
      v.object({
        document_id: v.id('documents'),
        content: v.string(),
        position: v.number(),
        start_char: v.number(),
        end_char: v.number(),
        qdrant_id: v.string(),
        user_id: v.id('users'),
        project_id: v.optional(v.id('projects')),
      })
    ),
  },
  handler: async (ctx, args) => {
    if (args.chunks.length === 0) {
      return []
    }
    
    // Verify user owns the document (check first chunk)
    const document = await ctx.db.get(args.chunks[0].document_id)
    
    if (!document) {
      throw new Error('Document not found')
    }
    
    if (document.user_id !== args.chunks[0].user_id) {
      throw new Error('Unauthorized: Document does not belong to user')
    }
    
    const now = Date.now()
    const chunkIds: string[] = []
    
    for (const chunk of args.chunks) {
      const chunkId = await ctx.db.insert('chunks', {
        ...chunk,
        created_at: now,
      })
      chunkIds.push(chunkId)
    }
    
    return chunkIds
  },
})

/**
 * Update chunk's Qdrant ID
 * Used after storing embedding in Qdrant
 */
export const updateQdrantId = mutation({
  args: {
    id: v.id('chunks'),
    qdrant_id: v.string(),
    user_id: v.id('users'),
  },
  handler: async (ctx, args) => {
    const chunk = await ctx.db.get(args.id)
    
    if (!chunk) {
      throw new Error('Chunk not found')
    }
    
    // Enforce user ownership
    if (chunk.user_id !== args.user_id) {
      throw new Error('Unauthorized: Chunk does not belong to user')
    }
    
    await ctx.db.patch(args.id, {
      qdrant_id: args.qdrant_id,
    })
    
    return args.id
  },
})

/**
 * Delete all chunks for a document
 * Used when deleting a document
 */
export const deleteByDocument = mutation({
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
    
    // Delete each chunk
    for (const chunk of chunks) {
      await ctx.db.delete(chunk._id)
    }
    
    return { deleted: chunks.length }
  },
})

/**
 * Delete a single chunk
 */
export const remove = mutation({
  args: {
    id: v.id('chunks'),
    user_id: v.id('users'),
  },
  handler: async (ctx, args) => {
    const chunk = await ctx.db.get(args.id)
    
    if (!chunk) {
      throw new Error('Chunk not found')
    }
    
    // Enforce user ownership
    if (chunk.user_id !== args.user_id) {
      throw new Error('Unauthorized: Chunk does not belong to user')
    }
    
    await ctx.db.delete(args.id)
    
    return { success: true }
  },
})
