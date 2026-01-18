/**
 * User Preferences Mutation Functions
 *
 * Provides write operations for user preferences with authentication checks.
 */

import { mutation } from '../_generated/server'
import { v } from 'convex/values'

/**
 * Update user preferences (creates if doesn't exist)
 */
export const update = mutation({
  args: {
    theme: v.optional(v.union(v.literal('light'), v.literal('dark'), v.literal('system'))),
    language: v.optional(v.string()),
    notifications_enabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error('Unauthorized: Authentication required')
    }

    const user = await ctx.db
      .query('users')
      .withIndex('email', q => q.eq('email', identity.email!))
      .first()

    if (!user) {
      throw new Error('User not found')
    }

    // Check if preferences exist
    const existingPreferences = await ctx.db
      .query('user_preferences')
      .withIndex('by_user', q => q.eq('user_id', user._id))
      .first()

    const now = Date.now()

    if (existingPreferences) {
      // Update existing preferences
      const updates: any = { updated_at: now }
      if (args.theme !== undefined) updates.theme = args.theme
      if (args.language !== undefined) updates.language = args.language
      if (args.notifications_enabled !== undefined)
        updates.notifications_enabled = args.notifications_enabled

      await ctx.db.patch(existingPreferences._id, updates)
      return existingPreferences._id
    } else {
      // Create new preferences with defaults
      const preferencesId = await ctx.db.insert('user_preferences', {
        user_id: user._id,
        theme: args.theme ?? 'system',
        language: args.language ?? 'en',
        notifications_enabled: args.notifications_enabled ?? true,
        created_at: now,
        updated_at: now,
      })

      return preferencesId
    }
  },
})
