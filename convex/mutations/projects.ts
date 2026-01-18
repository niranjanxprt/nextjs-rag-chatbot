/**
 * Project Mutation Functions
 *
 * Provides write operations for projects with authentication and permission checks.
 */

import { mutation } from '../_generated/server'
import { v } from 'convex/values'

/**
 * Create a new project
 */
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
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

    const now = Date.now()
    const projectId = await ctx.db.insert('projects', {
      name: args.name,
      description: args.description,
      user_id: user._id,
      created_at: now,
      updated_at: now,
    })

    // Add creator as owner member
    await ctx.db.insert('project_members', {
      project_id: projectId,
      user_id: user._id,
      role: 'owner',
      joined_at: now,
      created_at: now,
      updated_at: now,
    })

    return projectId
  },
})

/**
 * Update project details
 */
export const update = mutation({
  args: {
    id: v.id('projects'),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error('Unauthorized: Authentication required')
    }

    const project = await ctx.db.get(args.id)
    if (!project) {
      throw new Error('Project not found')
    }

    const user = await ctx.db
      .query('users')
      .withIndex('email', q => q.eq('email', identity.email!))
      .first()

    if (!user) {
      throw new Error('User not found')
    }

    // Check if user is owner or admin
    const membership = await ctx.db
      .query('project_members')
      .withIndex('by_project', q => q.eq('project_id', args.id))
      .filter(q => q.eq(q.field('user_id'), user._id))
      .first()

    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      throw new Error('Unauthorized: Admin access required')
    }

    const updates: any = { updated_at: Date.now() }
    if (args.name !== undefined) updates.name = args.name
    if (args.description !== undefined) updates.description = args.description

    await ctx.db.patch(args.id, updates)
  },
})

/**
 * Delete a project
 */
export const remove = mutation({
  args: { id: v.id('projects') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error('Unauthorized: Authentication required')
    }

    const project = await ctx.db.get(args.id)
    if (!project) {
      throw new Error('Project not found')
    }

    const user = await ctx.db
      .query('users')
      .withIndex('email', q => q.eq('email', identity.email!))
      .first()

    if (!user || project.user_id !== user._id) {
      throw new Error('Unauthorized: Only owner can delete project')
    }

    // Delete all project members
    const members = await ctx.db
      .query('project_members')
      .withIndex('by_project', q => q.eq('project_id', args.id))
      .collect()

    for (const member of members) {
      await ctx.db.delete(member._id)
    }

    // Delete all invitations
    const allInvitations = await ctx.db.query('project_invitations').collect()
    const projectInvitations = allInvitations.filter(inv => inv.project_id === args.id)

    for (const invitation of projectInvitations) {
      await ctx.db.delete(invitation._id)
    }

    // Delete the project
    await ctx.db.delete(args.id)
  },
})

/**
 * Add a member to a project
 */
export const addMember = mutation({
  args: {
    project_id: v.id('projects'),
    user_id: v.id('users'),
    role: v.union(v.literal('admin'), v.literal('member')),
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

    // Check if requester is owner or admin
    const membership = await ctx.db
      .query('project_members')
      .withIndex('by_project', q => q.eq('project_id', args.project_id))
      .filter(q => q.eq(q.field('user_id'), user._id))
      .first()

    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      throw new Error('Unauthorized: Admin access required')
    }

    // Check if user is already a member
    const existingMembership = await ctx.db
      .query('project_members')
      .withIndex('by_project', q => q.eq('project_id', args.project_id))
      .filter(q => q.eq(q.field('user_id'), args.user_id))
      .first()

    if (existingMembership) {
      throw new Error('User is already a member of this project')
    }

    const now = Date.now()
    const memberId = await ctx.db.insert('project_members', {
      project_id: args.project_id,
      user_id: args.user_id,
      role: args.role,
      joined_at: now,
      created_at: now,
      updated_at: now,
    })

    return memberId
  },
})

/**
 * Remove a member from a project
 */
export const removeMember = mutation({
  args: {
    project_id: v.id('projects'),
    user_id: v.id('users'),
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

    const project = await ctx.db.get(args.project_id)
    if (!project) {
      throw new Error('Project not found')
    }

    // Check if requester is owner or admin
    const requesterMembership = await ctx.db
      .query('project_members')
      .withIndex('by_project', q => q.eq('project_id', args.project_id))
      .filter(q => q.eq(q.field('user_id'), user._id))
      .first()

    if (
      !requesterMembership ||
      (requesterMembership.role !== 'owner' && requesterMembership.role !== 'admin')
    ) {
      throw new Error('Unauthorized: Admin access required')
    }

    // Cannot remove the owner
    if (args.user_id === project.user_id) {
      throw new Error('Cannot remove project owner')
    }

    // Find and delete the membership
    const membership = await ctx.db
      .query('project_members')
      .withIndex('by_project', q => q.eq('project_id', args.project_id))
      .filter(q => q.eq(q.field('user_id'), args.user_id))
      .first()

    if (!membership) {
      throw new Error('User is not a member of this project')
    }

    await ctx.db.delete(membership._id)
  },
})

/**
 * Create a project invitation
 */
export const createInvitation = mutation({
  args: {
    project_id: v.id('projects'),
    email: v.string(),
    role: v.union(v.literal('admin'), v.literal('member')),
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

    // Check if requester is owner or admin
    const membership = await ctx.db
      .query('project_members')
      .withIndex('by_project', q => q.eq('project_id', args.project_id))
      .filter(q => q.eq(q.field('user_id'), user._id))
      .first()

    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      throw new Error('Unauthorized: Admin access required')
    }

    // Generate invitation token
    const token = crypto.randomUUID()
    const now = Date.now()
    const expiresAt = now + 7 * 24 * 60 * 60 * 1000 // 7 days

    const invitationId = await ctx.db.insert('project_invitations', {
      project_id: args.project_id,
      email: args.email,
      role: args.role,
      token,
      invited_by: user._id,
      status: 'pending',
      expires_at: expiresAt,
      created_at: now,
    })

    return { invitationId, token }
  },
})
