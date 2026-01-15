/**
 * User Mutation Functions
 * 
 * Provides write operations for user management.
 */

import { mutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Create or update user (called during authentication)
 */
export const createOrUpdate = mutation({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
    avatar_url: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized: Authentication required");
    }
    
    // Check if user exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    
    const now = Date.now();
    
    if (existingUser) {
      // Update existing user
      const updates: any = { updated_at: now };
      if (args.name !== undefined) updates.name = args.name;
      if (args.avatar_url !== undefined) updates.avatar_url = args.avatar_url;
      
      await ctx.db.patch(existingUser._id, updates);
      return existingUser._id;
    } else {
      // Create new user
      const userId = await ctx.db.insert("users", {
        email: args.email,
        name: args.name,
        avatar_url: args.avatar_url,
        last_active: now,
        created_at: now,
        updated_at: now,
      });
      
      return userId;
    }
  },
});

/**
 * Update user profile
 */
export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    avatar_url: v.optional(v.string()),
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
    
    const updates: any = { updated_at: Date.now() };
    if (args.name !== undefined) updates.name = args.name;
    if (args.avatar_url !== undefined) updates.avatar_url = args.avatar_url;
    
    await ctx.db.patch(user._id, updates);
  },
});
