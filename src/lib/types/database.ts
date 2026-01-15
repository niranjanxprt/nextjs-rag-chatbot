/**
 * Database Types for Next.js RAG Chatbot
 *
 * TypeScript type definitions for all database entities
 * Generated from Convex schema
 */

import { Doc, Id } from '../../../convex/_generated/dataModel'

// =============================================================================
// Convex Document Types
// =============================================================================

export type User = Doc<"users">
export type Document = Doc<"documents">
export type DocumentChunk = Doc<"document_chunks">
export type Conversation = Doc<"conversations">
export type Message = Doc<"messages">
export type Project = Doc<"projects">
export type ProjectMember = Doc<"project_members">
export type ProjectInvitation = Doc<"project_invitations">
export type Prompt = Doc<"prompts">
export type UserPreferences = Doc<"user_preferences">
export type KnowledgeBase = Doc<"knowledge_bases">
export type KnowledgeBaseDocument = Doc<"knowledge_base_documents">
export type DocumentShare = Doc<"document_shares">
export type ActivityLog = Doc<"activity_log">
export type UserSession = Doc<"user_sessions">

// =============================================================================
// Convex ID Types
// =============================================================================

export type UserId = Id<"users">
export type DocumentId = Id<"documents">
export type DocumentChunkId = Id<"document_chunks">
export type ConversationId = Id<"conversations">
export type MessageId = Id<"messages">
export type ProjectId = Id<"projects">
export type ProjectMemberId = Id<"project_members">
export type ProjectInvitationId = Id<"project_invitations">
export type PromptId = Id<"prompts">
export type UserPreferencesId = Id<"user_preferences">
export type KnowledgeBaseId = Id<"knowledge_bases">
export type KnowledgeBaseDocumentId = Id<"knowledge_base_documents">
export type DocumentShareId = Id<"document_shares">
export type ActivityLogId = Id<"activity_log">
export type UserSessionId = Id<"user_sessions">
export type StorageId = Id<"_storage">

// =============================================================================
// Enum Types
// =============================================================================

export type DocumentProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed'
export type MessageRole = 'user' | 'assistant' | 'system'
export type ProjectMemberRole = 'owner' | 'admin' | 'member' | 'viewer'
export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired'
export type ShareType = 'private' | 'project' | 'public'
export type Theme = 'light' | 'dark' | 'system'

// =============================================================================
// Extended Types with Relations
// =============================================================================

export interface DocumentWithChunks extends Document {
  chunks: DocumentChunk[]
}

export interface ConversationWithMessages extends Conversation {
  messages: Message[]
}

export interface MessageWithConversation extends Message {
  conversation: Conversation
}

export interface ProjectWithMembers extends Project {
  members: ProjectMember[]
}

export interface UserWithPreferences extends User {
  preferences?: UserPreferences
}

// =============================================================================
// API Response Types
// =============================================================================

export interface DocumentUploadResult {
  document: Document
  uploadUrl?: string
  success: boolean
  error?: string
}

export interface DocumentProcessingResult {
  document: Document
  chunksCreated: number
  success: boolean
  error?: string
}

export interface SearchResult {
  chunk: DocumentChunk
  document: Document
  score: number
  relevance: number
}

export interface VectorSearchOptions {
  userId: UserId
  topK?: number
  threshold?: number
  includeMetadata?: boolean
}

export interface ChatResponse {
  message: Message
  sources?: SearchResult[]
  conversationId: ConversationId
}

// =============================================================================
// Settings Types
// =============================================================================

export interface ChatSettings {
  temperature: number
  maxTokens: number
  model?: string
}

export interface UISettings {
  sidebarCollapsed: boolean
  useKnowledgeBase: boolean
  compactMode?: boolean
}

// =============================================================================
// Error Types
// =============================================================================

export interface DatabaseError {
  code: string
  message: string
  details?: string
  hint?: string
}

export interface ValidationError {
  field: string
  message: string
  code: string
}

// =============================================================================
// Pagination Types
// =============================================================================

export interface PaginationOptions {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// =============================================================================
// Utility Types
// =============================================================================

// Helper type to extract the data type from a Convex query result
export type QueryResult<T> = T extends undefined ? undefined : T

// Helper type for optional fields
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

// Helper type for required fields
export type Required<T, K extends keyof T> = T & { [P in K]-?: T[P] }

// =============================================================================
// Legacy Compatibility Types (for gradual migration)
// =============================================================================

// Alias UUID to Id for backward compatibility
export type UUID = string

// Alias Timestamp to number for backward compatibility
export type Timestamp = number

// Profile type for backward compatibility with User
export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: number
  updated_at: number
}
