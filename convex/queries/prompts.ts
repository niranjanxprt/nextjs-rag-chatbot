/**
 * Prompt Query Functions
 * 
 * Provides read-only access to prompt library with authentication and visibility checks.
 */

import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * List prompts for the authenticated user (owned + public)
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
    
    const allPrompts = await ctx.db.query("prompts").collect();
    
    // Return user's own prompts + public prompts
    return allPrompts.filter(
      (prompt) => prompt.user_id === user._id || prompt.is_public
    );
  },
});

/**
 * Get a specific prompt by ID
 */
export const get = query({
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
    
    if (!user) {
      throw new Error("User not found");
    }
    
    // Allow access if user owns the prompt or it's public
    if (prompt.user_id !== user._id && !prompt.is_public) {
      throw new Error("Unauthorized: Access denied");
    }
    
    return prompt;
  },
});

/**
 * List only public prompts
 */
export const listPublic = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized: Authentication required");
    }
    
    return await ctx.db
      .query("prompts")
      .withIndex("by_public", (q) => q.eq("is_public", true))
      .collect();
  },
});

/**
 * List prompts by category
 */
export const listByCategory = query({
  args: { category: v.string() },
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
    
    const allPrompts = await ctx.db.query("prompts").collect();
    
    // Filter by category and visibility
    return allPrompts.filter(
      (prompt) =>
        prompt.category === args.category &&
        (prompt.user_id === user._id || prompt.is_public)
    );
  },
});
