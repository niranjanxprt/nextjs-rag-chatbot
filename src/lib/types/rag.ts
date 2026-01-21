/**
 * RAG System Type Definitions
 * 
 * Comprehensive TypeScript types for the RAG chat system
 */

export type DocumentStatus = 'processing' | 'ready' | 'error'

export interface Document {
  _id: string
  name: string
  size: number
  type: string
  user_id: string
  project_id?: string
  upload_date: number
  chunk_count: number
  status: DocumentStatus
  error_message?: string
}

export interface Chunk {
  _id: string
  document_id: string
  content: string
  position: number
  start_char: number
  end_char: number
  qdrant_id: string
  user_id: string
  project_id?: string
}

export interface Conversation {
  _id: string
  user_id: string
  project_id?: string
  title: string
  created_at: number
  updated_at: number
}

export interface Message {
  _id: string
  conversation_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  sources?: SourceCitation[]
  timestamp: number
}

export interface SourceCitation {
  id: string
  document_name: string
  snippet: string
  score: number
}

export interface SearchResult {
  chunk_id: string
  document_id: string
  document_name: string
  content: string
  score: number
  position: number
}

// Document Processing Types

export interface DocumentMetadata {
  user_id: string
  project_id?: string
  name: string
  size: number
  type: string
}

export interface ChunkData {
  content: string
  position: number
  start_char: number
  end_char: number
}

export interface ProcessingResult {
  document_id: string
  status: DocumentStatus
  chunk_count: number
  error?: string
}

// Embedding Types

export interface ChunkWithId {
  chunk_id: string
  document_id: string
  content: string
  position: number
}

export interface EmbeddingMetadata {
  user_id: string
  project_id?: string
  document_name: string
}

export interface EmbeddingResult {
  chunk_id: string
  qdrant_id: string
  success: boolean
  error?: string
}

// Search Types

export interface SearchFilters {
  user_id: string
  project_id?: string
}

export interface SearchOptions {
  topK?: number // Default: 5
  scoreThreshold?: number // Default: 0.7
}

// Chat Types

export interface ChatContext {
  user_id: string
  project_id?: string
  conversation_id: string
}

export interface ChatOptions {
  ragEnabled: boolean
  maxContextTokens?: number // Default: 3000
  temperature?: number // Default: 0.7
}

export interface StreamingResponse {
  stream: ReadableStream
  sources: SourceCitation[]
}

// Qdrant Types

export interface QdrantPoint {
  id: string // UUID
  vector: number[] // 1536-dimensional embedding
  payload: {
    chunk_id: string
    document_id: string
    user_id: string
    project_id?: string
    content: string
    document_name: string
  }
}

// API Request/Response Types

export interface UploadDocumentRequest {
  file: File
  user_id: string
  project_id?: string
}

export interface UploadDocumentResponse {
  success: boolean
  document_id: string
  status: DocumentStatus
  message: string
}

export interface ChatRequest {
  message: string
  conversation_id: string
  user_id: string
  project_id?: string
  rag_enabled: boolean
  temperature?: number
}

export interface ConversationListRequest {
  user_id: string
  project_id?: string
  limit?: number
  offset?: number
}

export interface ConversationListResponse {
  conversations: Array<{
    id: string
    title: string
    created_at: number
    updated_at: number
    message_count: number
  }>
  total: number
  has_more: boolean
}
