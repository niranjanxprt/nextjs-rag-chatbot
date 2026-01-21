/**
 * Document Mutations
 * 
 * Convex mutations for document CRUD operations
 */

import { mutation } from '../_generated/server'
import { v } from 'convex/values'

/**
 * Create a new document record
 */
export const create = mutation({
  args: {
    user_id: v.id('users'),
    project_id: v.optional(v.id('projects')),
    name: v.string(),
    filename: v.string(),
    size: v.number(),
    type: v.string(),
    storage_id: v.optional(v.id('_storage')),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    
    const documentId = await ctx.db.insert('documents', {
      user_id: args.user_id,
      project_id: args.project_id,
      name: args.name,
      filename: args.filename,
      file_name: args.filename, // Alias
      size: args.size,
      file_size: args.size, // Alias
      type: args.type,
      mime_type: args.type, // Alias
      storage_id: args.storage_id,
      upload_date: now,
      chunk_count: 0,
      status: 'processing',
      created_at: now,
      updated_at: now,
    })
    
    return documentId
  },
})

/**
 * Update document status and metadata
 */
export const updateStatus = mutation({
  args: {
    id: v.id('documents'),
    user_id: v.id('users'),
    status: v.union(
      v.literal('processing'),
      v.literal('ready'),
      v.literal('error')
    ),
    chunk_count: v.optional(v.number()),
    error_message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const document = await ctx.db.get(args.id)
    
    if (!document) {
      throw new Error('Document not found')
    }
    
    // Enforce user ownership
    if (document.user_id !== args.user_id) {
      throw new Error('Unauthorized: Document does not belong to user')
    }
    
    await ctx.db.patch(args.id, {
      status: args.status,
      chunk_count: args.chunk_count ?? document.chunk_count,
      error_message: args.error_message,
      updated_at: Date.now(),
    })
    
    return args.id
  },
})

/**
 * Delete a document
 * Note: Chunks should be deleted separately
 */
export const remove = mutation({
  args: {
    id: v.id('documents'),
    user_id: v.id('users'),
  },
  handler: async (ctx, args) => {
    const document = await ctx.db.get(args.id)
    
    if (!document) {
      throw new Error('Document not found')
    }
    
    // Enforce user ownership
    if (document.user_id !== args.user_id) {
      throw new Error('Unauthorized: Document does not belong to user')
    }
    
    // Prevent deletion of documents being processed
    if (document.status === 'processing') {
      throw new Error('Cannot delete document while processing')
    }
    
    await ctx.db.delete(args.id)
    
    return { success: true }
  },
})

/**
 * Update document metadata
 */
export const update = mutation({
  args: {
    id: v.id('documents'),
    user_id: v.id('users'),
    name: v.optional(v.string()),
    project_id: v.optional(v.id('projects')),
  },
  handler: async (ctx, args) => {
    const document = await ctx.db.get(args.id)
    
    if (!document) {
      throw new Error('Document not found')
    }
    
    // Enforce user ownership
    if (document.user_id !== args.user_id) {
      throw new Error('Unauthorized: Document does not belong to user')
    }
    
    const updates: any = {
      updated_at: Date.now(),
    }
    
    if (args.name !== undefined) {
      updates.name = args.name
    }
    
    if (args.project_id !== undefined) {
      updates.project_id = args.project_id
    }
    
    await ctx.db.patch(args.id, updates)
    
    return args.id
  },
})
