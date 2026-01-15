/**
 * File Retrieval Storage Functions
 * 
 * Handles file retrieval from Convex storage.
 */

import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Get a file URL from storage
 * 
 * Returns a temporary URL that can be used to download a file from Convex storage.
 * The URL expires after a short time for security.
 */
export const getUrl = query({
  args: { 
    storageId: v.id("_storage") 
  },
  handler: async (ctx, args) => {
    // Verify authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized: Authentication required");
    }
    
    // Get file URL
    const url = await ctx.storage.getUrl(args.storageId);
    
    if (!url) {
      throw new Error("File not found in storage");
    }
    
    return url;
  },
});

/**
 * Get file metadata
 * 
 * Returns metadata about a stored file including size and type.
 */
export const getMetadata = query({
  args: {
    storageId: v.id("_storage")
  },
  handler: async (ctx, args) => {
    // Verify authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized: Authentication required");
    }
    
    // Get file metadata
    const metadata = await ctx.storage.getMetadata(args.storageId);
    
    if (!metadata) {
      throw new Error("File not found in storage");
    }
    
    return {
      storageId: args.storageId,
      size: metadata.size,
      contentType: metadata.contentType,
      sha256: metadata.sha256,
    };
  },
});
