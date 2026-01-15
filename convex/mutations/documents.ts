/**
 * Document Mutation Functions
 * 
 * Provides write operations for documents with authentication and ownership checks.
 */

import { mutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Create a new document
 */
export const create = mutation({
  args: {
    title: v.string(),
    file_name: v.string(),
    file_size: v.number(),
    mime_type: v.string(),
    storage_id: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized: Authentication required");
    }
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
    
    if (!user) {
      throw new Error("User not found");
    }
    
    const now = Date.now();
    const documentId = await ctx.db.insert("documents", {
      user_id: user._id,
      title: args.title,
      filename: args.file_name,
      file_name: args.file_name,
      file_size: args.file_size,
      mime_type: args.mime_type,
      storage_id: args.storage_id,
      status: "pending",
      processing_status: "pending",
      created_at: now,
      updated_at: now,
    });
    
    return documentId;
  },
});

/**
 * Update document status
 */
export const updateStatus = mutation({
  args: {
    id: v.id("documents"),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    error_message: v.optional(v.string()),
    chunk_count: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized: Authentication required");
    }
    
    const document = await ctx.db.get(args.id);
    if (!document) {
      throw new Error("Document not found");
    }
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
    
    if (!user || document.user_id !== user._id) {
      throw new Error("Unauthorized: Access denied");
    }
    
    await ctx.db.patch(args.id, {
      status: args.status,
      error_message: args.error_message,
      chunk_count: args.chunk_count,
      updated_at: Date.now(),
    });
  },
});

/**
 * Delete a document
 */
export const remove = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized: Authentication required");
    }
    
    const document = await ctx.db.get(args.id);
    if (!document) {
      throw new Error("Document not found");
    }
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
    
    if (!user || document.user_id !== user._id) {
      throw new Error("Unauthorized: Access denied");
    }
    
    // Delete all chunks associated with the document
    const chunks = await ctx.db
      .query("document_chunks")
      .withIndex("by_document", (q) => q.eq("document_id", args.id))
      .collect();
    
    for (const chunk of chunks) {
      await ctx.db.delete(chunk._id);
    }
    
    // Delete the document
    await ctx.db.delete(args.id);
  },
});

/**
 * Create document chunks
 */
export const createChunk = mutation({
  args: {
    document_id: v.id("documents"),
    content: v.string(),
    chunk_index: v.number(),
    embedding: v.array(v.float64()),
    metadata: v.object({
      page: v.optional(v.number()),
      section: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized: Authentication required");
    }
    
    // Verify document ownership
    const document = await ctx.db.get(args.document_id);
    if (!document) {
      throw new Error("Document not found");
    }
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
    
    if (!user || document.user_id !== user._id) {
      throw new Error("Unauthorized: Access denied");
    }
    
    const chunkId = await ctx.db.insert("document_chunks", {
      document_id: args.document_id,
      content: args.content,
      chunk_index: args.chunk_index,
      token_count: Math.ceil(args.content.length / 4), // Rough estimate: 1 token ≈ 4 chars
      embedding: args.embedding,
      metadata: args.metadata,
      created_at: Date.now(),
    });
    
    return chunkId;
  },
});
