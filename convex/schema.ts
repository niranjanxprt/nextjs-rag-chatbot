import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Convex Database Schema for Next.js RAG Chatbot
 * 
 * This schema defines all tables migrated from Supabase PostgreSQL to Convex.
 * Type mappings:
 * - UUID → v.id("table_name")
 * - TEXT → v.string()
 * - INTEGER/BIGINT → v.number()
 * - BOOLEAN → v.boolean()
 * - TIMESTAMP → v.number() (Unix timestamp in milliseconds)
 * - JSONB → v.object({...}) or v.any()
 */

export default defineSchema({
  // ==========================================================================
  // USERS AND PROFILES
  // ==========================================================================

  users: defineTable({
    email: v.string(),
    name: v.optional(v.string()), // Display name
    full_name: v.optional(v.string()),
    avatar_url: v.optional(v.string()),
    bio: v.optional(v.string()),
    preferences: v.optional(v.any()), // JSONB equivalent
    last_active: v.number(),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_email", ["email"]),

  // ==========================================================================
  // DOCUMENTS AND CHUNKS
  // ==========================================================================

  documents: defineTable({
    user_id: v.id("users"),
    project_id: v.optional(v.id("projects")),
    title: v.optional(v.string()), // Document title
    filename: v.string(),
    file_name: v.optional(v.string()), // Alias for filename
    file_size: v.number(),
    mime_type: v.string(),
    storage_id: v.optional(v.id("_storage")), // Convex file storage reference
    processing_status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    status: v.optional(v.union( // Alias for processing_status
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    )),
    chunk_count: v.optional(v.number()),
    error_message: v.optional(v.string()),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_user", ["user_id"])
    .index("by_project", ["project_id"])
    .index("by_status", ["processing_status"])
    .index("by_user_project", ["user_id", "project_id"]),

  document_chunks: defineTable({
    document_id: v.id("documents"),
    chunk_index: v.number(),
    content: v.string(),
    token_count: v.number(),
    embedding: v.optional(v.array(v.float64())), // Vector embedding
    metadata: v.optional(v.any()), // JSONB
    qdrant_point_id: v.optional(v.string()), // UUID as string
    created_at: v.number(),
  })
    .index("by_document", ["document_id"])
    .index("by_qdrant_point", ["qdrant_point_id"]),

  // ==========================================================================
  // CONVERSATIONS AND MESSAGES
  // ==========================================================================

  conversations: defineTable({
    user_id: v.id("users"),
    project_id: v.optional(v.id("projects")),
    title: v.optional(v.string()),
    is_pinned: v.optional(v.boolean()),
    is_shared: v.optional(v.boolean()),
    share_token: v.optional(v.string()),
    message_count: v.optional(v.number()),
    last_message_at: v.optional(v.number()),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_user", ["user_id"])
    .index("by_project", ["project_id"])
    .index("by_user_pinned", ["user_id", "is_pinned"])
    .index("by_share_token", ["share_token"]),

  messages: defineTable({
    conversation_id: v.id("conversations"),
    role: v.union(
      v.literal("user"),
      v.literal("assistant"),
      v.literal("system")
    ),
    content: v.string(),
    sources: v.optional(v.array(v.object({
      document_id: v.id("documents"),
      chunk_index: v.number(),
      similarity: v.float64(),
    }))),
    metadata: v.optional(v.any()), // JSONB equivalent
    created_at: v.number(),
  })
    .index("by_conversation", ["conversation_id"]),

  // ==========================================================================
  // PROJECTS AND COLLABORATION
  // ==========================================================================

  projects: defineTable({
    user_id: v.id("users"), // Project owner
    name: v.string(),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    is_default: v.optional(v.boolean()),
    is_public: v.optional(v.boolean()),
    allow_member_invite: v.optional(v.boolean()),
    max_members: v.optional(v.number()),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_user", ["user_id"])
    .index("by_user_default", ["user_id", "is_default"]),

  project_members: defineTable({
    project_id: v.id("projects"),
    user_id: v.id("users"),
    role: v.union(
      v.literal("owner"),
      v.literal("admin"),
      v.literal("member"),
      v.literal("viewer")
    ),
    permissions: v.optional(v.any()), // JSONB equivalent
    invited_by: v.optional(v.id("users")),
    joined_at: v.number(),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_project", ["project_id"])
    .index("by_user", ["user_id"])
    .index("by_role", ["role"])
    .index("by_project_user", ["project_id", "user_id"]),

  project_invitations: defineTable({
    project_id: v.id("projects"),
    email: v.string(),
    role: v.union(
      v.literal("admin"),
      v.literal("member"),
      v.literal("viewer")
    ),
    permissions: v.optional(v.any()), // JSONB equivalent
    token: v.string(),
    invited_by: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("declined"),
      v.literal("expired")
    ),
    expires_at: v.number(),
    accepted_at: v.optional(v.number()),
    accepted_by: v.optional(v.id("users")),
    created_at: v.number(),
  })
    .index("by_project", ["project_id"])
    .index("by_email", ["email"])
    .index("by_token", ["token"])
    .index("by_status", ["status"])
    .index("by_project_email", ["project_id", "email"]),

  // ==========================================================================
  // PROMPTS AND PREFERENCES
  // ==========================================================================

  prompts: defineTable({
    user_id: v.id("users"),
    name: v.string(),
    title: v.optional(v.string()), // Alias for name
    content: v.string(),
    description: v.optional(v.string()),
    variables: v.optional(v.any()), // JSONB array
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())), // Array of tags
    is_favorite: v.optional(v.boolean()),
    is_public: v.optional(v.boolean()), // Public prompts visible to all users
    usage_count: v.optional(v.number()),
    metadata: v.optional(v.any()), // JSONB
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_user", ["user_id"])
    .index("by_category", ["user_id", "category"])
    .index("by_favorite", ["user_id", "is_favorite"])
    .index("by_public", ["is_public"]),

  user_preferences: defineTable({
    user_id: v.id("users"),
    theme: v.union(
      v.literal("light"),
      v.literal("dark"),
      v.literal("system")
    ),
    language: v.optional(v.string()),
    notifications_enabled: v.optional(v.boolean()),
    default_project_id: v.optional(v.id("projects")),
    chat_settings: v.optional(v.any()), // JSONB
    ui_settings: v.optional(v.any()), // JSONB
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_user", ["user_id"]),

  // ==========================================================================
  // KNOWLEDGE BASES
  // ==========================================================================

  knowledge_bases: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    user_id: v.id("users"),
    project_id: v.optional(v.id("projects")),
    is_public: v.optional(v.boolean()),
    settings: v.optional(v.any()), // JSONB
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_user", ["user_id"])
    .index("by_project", ["project_id"]),

  knowledge_base_documents: defineTable({
    knowledge_base_id: v.id("knowledge_bases"),
    document_id: v.id("documents"),
    added_by: v.id("users"),
    added_at: v.number(),
  })
    .index("by_knowledge_base", ["knowledge_base_id"])
    .index("by_document", ["document_id"])
    .index("by_kb_document", ["knowledge_base_id", "document_id"]),

  // ==========================================================================
  // DOCUMENT SHARING
  // ==========================================================================

  document_shares: defineTable({
    document_id: v.id("documents"),
    shared_by: v.id("users"),
    shared_with: v.optional(v.id("users")), // NULL for public shares
    share_type: v.union(
      v.literal("private"),
      v.literal("project"),
      v.literal("public")
    ),
    permissions: v.optional(v.any()), // JSONB
    share_token: v.optional(v.string()),
    expires_at: v.optional(v.number()),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_document", ["document_id"])
    .index("by_shared_by", ["shared_by"])
    .index("by_share_token", ["share_token"]),

  // ==========================================================================
  // ACTIVITY LOGGING
  // ==========================================================================

  activity_log: defineTable({
    user_id: v.id("users"),
    project_id: v.optional(v.id("projects")),
    action: v.string(), // 'created', 'updated', 'deleted', 'shared', etc.
    resource_type: v.string(), // 'project', 'document', 'conversation', etc.
    resource_id: v.optional(v.string()), // Generic ID as string
    metadata: v.optional(v.any()), // JSONB
    created_at: v.number(),
  })
    .index("by_user", ["user_id"])
    .index("by_project", ["project_id"])
    .index("by_resource", ["resource_type", "resource_id"]),

  // ==========================================================================
  // USER SESSIONS
  // ==========================================================================

  user_sessions: defineTable({
    user_id: v.id("users"),
    session_token: v.string(),
    device_info: v.optional(v.any()), // JSONB
    ip_address: v.optional(v.string()),
    user_agent: v.optional(v.string()),
    expires_at: v.number(),
    last_activity: v.number(),
    created_at: v.number(),
  })
    .index("by_user", ["user_id"])
    .index("by_token", ["session_token"])
    .index("by_expires", ["expires_at"]),
});
