/**
 * File Upload Storage Functions
 * 
 * Handles file uploads to Convex storage with validation.
 */

import { mutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Generate an upload URL for file uploads
 * 
 * This mutation generates a temporary URL that clients can use to upload files
 * directly to Convex storage. The URL expires after a short time.
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    // Verify authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized: Authentication required");
    }
    
    // Generate and return upload URL
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Save file metadata after upload
 * 
 * After a file is uploaded using the upload URL, this mutation saves
 * the file metadata to the documents table.
 */
export const saveFileMetadata = mutation({
  args: {
    storageId: v.id("_storage"),
    filename: v.string(),
    fileSize: v.number(),
    mimeType: v.string(),
    title: v.optional(v.string()),
    projectId: v.optional(v.id("projects")),
  },
  handler: async (ctx, args) => {
    // Verify authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized: Authentication required");
    }
    
    // Get user
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
    
    if (!user) {
      throw new Error("User not found");
    }
    
    // Validate file size (max 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (args.fileSize > MAX_FILE_SIZE) {
      throw new Error("File size exceeds maximum allowed size of 10MB");
    }
    
    // Validate file type
    const ALLOWED_MIME_TYPES = [
      'application/pdf',
      'text/plain',
      'text/markdown',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ];
    
    if (!ALLOWED_MIME_TYPES.includes(args.mimeType)) {
      throw new Error(`File type ${args.mimeType} is not supported`);
    }
    
    // Create document record
    const now = Date.now();
    const documentId = await ctx.db.insert("documents", {
      user_id: user._id,
      project_id: args.projectId,
      title: args.title,
      filename: args.filename,
      file_name: args.filename,
      file_size: args.fileSize,
      mime_type: args.mimeType,
      storage_id: args.storageId,
      status: "pending",
      processing_status: "pending",
      created_at: now,
      updated_at: now,
    });
    
    return documentId;
  },
});

/**
 * Delete a file from storage
 * 
 * Removes a file from Convex storage when a document is deleted.
 */
export const deleteFile = mutation({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    // Verify authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized: Authentication required");
    }
    
    // Delete file from storage
    await ctx.storage.delete(args.storageId);
  },
});
