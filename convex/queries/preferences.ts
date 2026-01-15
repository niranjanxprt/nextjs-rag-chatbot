/**
 * User Preferences Query Functions
 * 
 * Provides read-only access to user preferences with authentication checks.
 */

import { query } from "../_generated/server";

/**
 * Get preferences for the current user
 */
export const get = query({
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
    
    const preferences = await ctx.db
      .query("user_preferences")
      .withIndex("by_user", (q) => q.eq("user_id", user._id))
      .first();
    
    // Return default preferences if none exist
    if (!preferences) {
      return {
        theme: "system" as const,
        language: "en",
        notifications_enabled: true,
      };
    }
    
    return preferences;
  },
});
