/**
 * Project Query Functions
 * 
 * Provides read-only access to project data with authentication and permission checks.
 */

import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * List all projects where the user is a member
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
    
    // Get all project memberships for the user
    const memberships = await ctx.db
      .query("project_members")
      .withIndex("by_user", (q) => q.eq("user_id", user._id))
      .collect();
    
    // Fetch all projects
    const projects = await Promise.all(
      memberships.map(async (membership) => {
        const project = await ctx.db.get(membership.project_id);
        return project ? { ...project, role: membership.role } : null;
      })
    );
    
    return projects.filter((p) => p !== null);
  },
});

/**
 * Get a specific project by ID
 */
export const get = query({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized: Authentication required");
    }
    
    const project = await ctx.db.get(args.id);
    if (!project) {
      throw new Error("Project not found");
    }
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
    
    if (!user) {
      throw new Error("User not found");
    }
    
    // Check if user is a member of the project
    const membership = await ctx.db
      .query("project_members")
      .withIndex("by_project", (q) => q.eq("project_id", args.id))
      .filter((q) => q.eq(q.field("user_id"), user._id))
      .first();
    
    if (!membership) {
      throw new Error("Unauthorized: Access denied");
    }
    
    return { ...project, role: membership.role };
  },
});

/**
 * Get members of a specific project
 */
export const getMembers = query({
  args: { projectId: v.id("projects") },
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
    
    // Verify user is a member of the project
    const userMembership = await ctx.db
      .query("project_members")
      .withIndex("by_project", (q) => q.eq("project_id", args.projectId))
      .filter((q) => q.eq(q.field("user_id"), user._id))
      .first();
    
    if (!userMembership) {
      throw new Error("Unauthorized: Access denied");
    }
    
    // Get all members
    const memberships = await ctx.db
      .query("project_members")
      .withIndex("by_project", (q) => q.eq("project_id", args.projectId))
      .collect();
    
    // Fetch user details for each member
    const members = await Promise.all(
      memberships.map(async (membership) => {
        const memberUser = await ctx.db.get(membership.user_id);
        return memberUser
          ? {
              ...memberUser,
              role: membership.role,
              joined_at: membership.created_at,
            }
          : null;
      })
    );
    
    return members.filter((m) => m !== null);
  },
});

/**
 * Get pending invitations for a project
 */
export const getInvitations = query({
  args: { projectId: v.id("projects") },
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
    
    // Verify user is an admin or owner of the project
    const membership = await ctx.db
      .query("project_members")
      .withIndex("by_project", (q) => q.eq("project_id", args.projectId))
      .filter((q) => q.eq(q.field("user_id"), user._id))
      .first();
    
    if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
      throw new Error("Unauthorized: Admin access required");
    }
    
    // Get all pending invitations
    const allInvitations = await ctx.db.query("project_invitations").collect();
    return allInvitations.filter(
      (inv) => inv.project_id === args.projectId && inv.status === "pending"
    );
  },
});
