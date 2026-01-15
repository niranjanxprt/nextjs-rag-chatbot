/**
 * Conversation Query Functions
 * 
 * Provides read-only access to conversation data with authentication and ownership checks.
 */

import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * List all conversations for the authenticated user
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
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
    
    return await ctx.db
      .query("conversations")
      .withIndex("by_user", (q) => q.eq("user_id", user._id))
      .order("desc")
      .collect();
  },
});

/**
 * Get a specific conversation by ID
 */
export const get = query({
  args: { id: v.id("conversations") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized: Authentication required");
    }
    
    const conversation = await ctx.db.get(args.id);
    if (!conversation) {
      throw new Error("Conversation not found");
    }
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
    
    if (!user || conversation.user_id !== user._id) {
      throw new Error("Unauthorized: Access denied");
    }
    
    return conversation;
  },
});

/**
 * Get messages for a specific conversation
 */
export const getMessages = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized: Authentication required");
    }
    
    // Verify conversation ownership
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
    
    if (!user || conversation.user_id !== user._id) {
      throw new Error("Unauthorized: Access denied");
    }
    
    return await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversation_id", args.conversationId))
      .order("asc")
      .collect();
  },
});
