/**
 * Prompt Mutation Functions
 * 
 * Provides write operations for prompt library with authentication and ownership checks.
 */

import { mutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Create a new prompt
 */
export const create = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    category: v.optional(v.string()),
    is_public: v.boolean(),
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
    const promptId = await ctx.db.insert("prompts", {
      user_id: user._id,
      title: args.title,
      content: args.content,
      category: args.category,
      is_public: args.is_public,
      created_at: now,
      updated_at: now,
    });
    
    return promptId;
  },
});

/**
 * Update a prompt
 */
export const update = mutation({
  args: {
    id: v.id("prompts"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    category: v.optional(v.string()),
    is_public: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized: Authentication required");
    }
    
    const prompt = await ctx.db.get(args.id);
    if (!prompt) {
      throw new Error("Prompt not found");
    }
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
    
    if (!user || prompt.user_id !== user._id) {
      throw new Error("Unauthorized: Access denied");
    }
    
    const updates: any = { updated_at: Date.now() };
    if (args.title !== undefined) updates.title = args.title;
    if (args.content !== undefined) updates.content = args.content;
    if (args.category !== undefined) updates.category = args.category;
    if (args.is_public !== undefined) updates.is_public = args.is_public;
    
    await ctx.db.patch(args.id, updates);
  },
});

/**
 * Delete a prompt
 */
export const remove = mutation({
  args: { id: v.id("prompts") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized: Authentication required");
    }
    
    const prompt = await ctx.db.get(args.id);
    if (!prompt) {
      throw new Error("Prompt not found");
    }
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
    
    if (!user || prompt.user_id !== user._id) {
      throw new Error("Unauthorized: Access denied");
    }
    
    await ctx.db.delete(args.id);
  },
});
