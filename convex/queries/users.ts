/**
 * User Query Functions
 *
 * Provides read-only access to user data with authentication checks.
 */

import { query } from '../_generated/server'
import { v } from 'convex/values'

/**
 * Get the current authenticated user
 */
export const current = query({
  args: {},
  handler: async ctx => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return null
    }

    const user = await ctx.db
      .query('users')
      .withIndex('email', q => q.eq('email', identity.email!))
      .first()

    return user
  },
})

/**
 * Get a specific user by ID (for project members, etc.)
 */
export const get = query({
  args: { id: v.id('users') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error('Unauthorized: Authentication required')
    }

    const user = await ctx.db.get(args.id)
    if (!user) {
      throw new Error('User not found')
    }

    // Return limited user info (no sensitive data)
    return {
      _id: user._id,
      email: user.email,
      name: user.name,
      avatar_url: user.avatar_url,
      created_at: user.created_at,
    }
  },
})

/**
 * Search users by email (for invitations)
 */
export const searchByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error('Unauthorized: Authentication required')
    }

    const user = await ctx.db
      .query('users')
      .withIndex('email', q => q.eq('email', args.email))
      .first()

    if (!user) {
      return null
    }

    // Return limited user info
    return {
      _id: user._id,
      email: user.email,
      name: user.name,
      avatar_url: user.avatar_url,
    }
  },
})
