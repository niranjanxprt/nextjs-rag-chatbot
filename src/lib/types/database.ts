/**
 * Database Types for Next.js RAG Chatbot
 *
 * TypeScript type definitions for all database entities
 * Generated from Supabase schema with additional utility types
 */

// =============================================================================
// Base Types
// =============================================================================

export type UUID = string
export type Timestamp = string

// =============================================================================
// User Profile Types
// =============================================================================

export interface Profile {
  id: UUID
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: Timestamp
  updated_at: Timestamp
}

export interface ProfileInsert {
  id: UUID
  email: string
  full_name?: string | null
  avatar_url?: string | null
}

export interface ProfileUpdate {
  email?: string
  full_name?: string | null
  avatar_url?: string | null
}

// =============================================================================
// Document Types
// =============================================================================

export type DocumentProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface Document {
  id: UUID
  user_id: UUID
  project_id: UUID | null
  filename: string
  file_size: number
  mime_type: string
  storage_path: string
  processing_status: DocumentProcessingStatus
  chunk_count: number
  error_message: string | null
  created_at: Timestamp
  updated_at: Timestamp
}

export interface DocumentInsert {
  user_id: UUID
  project_id?: UUID | null
  filename: string
  file_size: number
  mime_type: string
  storage_path: string
  processing_status?: DocumentProcessingStatus
  chunk_count?: number
  error_message?: string | null
}

export interface DocumentUpdate {
  filename?: string
  processing_status?: DocumentProcessingStatus
  chunk_count?: number
  error_message?: string | null
}

// =============================================================================
// Document Chunk Types
// =============================================================================

export interface DocumentChunk {
  id: UUID
  document_id: UUID
  chunk_index: number
  content: string
  token_count: number
  qdrant_point_id: UUID | null
  created_at: Timestamp
}

export interface DocumentChunkInsert {
  document_id: UUID
  chunk_index: number
  content: string
  token_count: number
  qdrant_point_id?: UUID | null
}

export interface DocumentChunkUpdate {
  content?: string
  token_count?: number
  qdrant_point_id?: UUID | null
}

// =============================================================================
// Project Types
// =============================================================================

export interface Project {
  id: UUID
  user_id: UUID
  name: string
  description: string | null
  color: string
  icon: string
  is_default: boolean
  created_at: Timestamp
  updated_at: Timestamp
}

export interface ProjectInsert {
  user_id: UUID
  name: string
  description?: string | null
  color?: string
  icon?: string
  is_default?: boolean
}

export interface ProjectUpdate {
  name?: string
  description?: string | null
  color?: string
  icon?: string
  is_default?: boolean
}

// =============================================================================
// Conversation Types
// =============================================================================

export interface Conversation {
  id: UUID
  user_id: UUID
  project_id: UUID | null
  title: string | null
  is_pinned: boolean
  message_count: number
  last_message_at: Timestamp | null
  created_at: Timestamp
  updated_at: Timestamp
}

export interface ConversationInsert {
  user_id: UUID
  project_id?: UUID | null
  title?: string | null
  is_pinned?: boolean
  message_count?: number
  last_message_at?: Timestamp | null
}

export interface ConversationUpdate {
  project_id?: UUID | null
  title?: string | null
  is_pinned?: boolean
  message_count?: number
  last_message_at?: Timestamp | null
}

// =============================================================================
// Message Types
// =============================================================================

export type MessageRole = 'user' | 'assistant' | 'system'

export interface Message {
  id: UUID
  conversation_id: UUID
  role: MessageRole
  content: string
  metadata: Record<string, any>
  created_at: Timestamp
}

export interface MessageInsert {
  conversation_id: UUID
  role: MessageRole
  content: string
  metadata?: Record<string, any>
}

export interface MessageUpdate {
  content?: string
  metadata?: Record<string, any>
}

// =============================================================================
// Prompt Types
// =============================================================================

export interface Prompt {
  id: UUID
  user_id: UUID
  name: string
  content: string
  description: string | null
  variables: string[] // Array of variable names like ['topic', 'style']
  category: string | null
  is_favorite: boolean
  usage_count: number
  created_at: Timestamp
  updated_at: Timestamp
}

export interface PromptInsert {
  user_id: UUID
  name: string
  content: string
  description?: string | null
  variables?: string[]
  category?: string | null
  is_favorite?: boolean
}

export interface PromptUpdate {
  name?: string
  content?: string
  description?: string | null
  variables?: string[]
  category?: string | null
  is_favorite?: boolean
  usage_count?: number
}

// =============================================================================
// User Preferences Types
// =============================================================================

export interface ChatSettings {
  temperature: number
  maxTokens: number
}

export interface UISettings {
  sidebarCollapsed: boolean
  useKnowledgeBase: boolean
}

export interface UserPreferences {
  user_id: UUID
  theme: 'light' | 'dark' | 'system'
  default_project_id: UUID | null
  chat_settings: ChatSettings
  ui_settings: UISettings
  created_at: Timestamp
  updated_at: Timestamp
}

export interface UserPreferencesInsert {
  user_id: UUID
  theme?: 'light' | 'dark' | 'system'
  default_project_id?: UUID | null
  chat_settings?: ChatSettings
  ui_settings?: UISettings
}

export interface UserPreferencesUpdate {
  theme?: 'light' | 'dark' | 'system'
  default_project_id?: UUID | null
  chat_settings?: ChatSettings
  ui_settings?: UISettings
}

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
  userId: UUID
  topK?: number
  threshold?: number
  includeMetadata?: boolean
}

export interface ChatResponse {
  message: Message
  sources?: SearchResult[]
  conversationId: UUID
}

// =============================================================================
// Supabase Database Type
// =============================================================================

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: ProfileInsert
        Update: ProfileUpdate
      }
      projects: {
        Row: Project
        Insert: ProjectInsert
        Update: ProjectUpdate
      }
      documents: {
        Row: Document
        Insert: DocumentInsert
        Update: DocumentUpdate
      }
      document_chunks: {
        Row: DocumentChunk
        Insert: DocumentChunkInsert
        Update: DocumentChunkUpdate
      }
      conversations: {
        Row: Conversation
        Insert: ConversationInsert
        Update: ConversationUpdate
      }
      messages: {
        Row: Message
        Insert: MessageInsert
        Update: MessageUpdate
      }
      prompts: {
        Row: Prompt
        Insert: PromptInsert
        Update: PromptUpdate
      }
      user_preferences: {
        Row: UserPreferences
        Insert: UserPreferencesInsert
        Update: UserPreferencesUpdate
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      document_processing_status: DocumentProcessingStatus
      message_role: MessageRole
    }
  }
}

// =============================================================================
// Utility Types
// =============================================================================

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']
export type Inserts<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']
export type Updates<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

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
