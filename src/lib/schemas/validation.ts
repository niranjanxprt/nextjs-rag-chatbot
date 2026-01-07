/**
 * Zod Validation Schemas for Next.js RAG Chatbot
 * 
 * Comprehensive validation schemas for API requests, form data,
 * and database operations with proper error handling
 */

import { z } from 'zod'
import type { 
  DocumentProcessingStatus, 
  MessageRole,
  VectorSearchOptions,
  PaginationOptions 
} from '@/lib/types/database'

// =============================================================================
// Base Schemas
// =============================================================================

export const uuidSchema = z.string().uuid('Invalid UUID format')

export const emailSchema = z
  .string()
  .email('Invalid email format')
  .min(1, 'Email is required')
  .max(255, 'Email too long')

export const timestampSchema = z.string().datetime('Invalid timestamp format')

// =============================================================================
// File Upload Schemas
// =============================================================================

export const supportedMimeTypes = [
  'application/pdf',
  'text/plain',
  'text/markdown',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
] as const

export const fileUploadSchema = z.object({
  file: z.instanceof(File, { message: 'File is required' })
    .refine(
      (file) => file.size > 0,
      'File cannot be empty'
    )
    .refine(
      (file) => file.size <= 10 * 1024 * 1024, // 10MB
      'File size must be less than 10MB'
    )
    .refine(
      (file) => supportedMimeTypes.includes(file.type as any),
      `File type must be one of: ${supportedMimeTypes.join(', ')}`
    ),
  userId: uuidSchema
})

export const documentUploadFormSchema = z.object({
  filename: z.string()
    .min(1, 'Filename is required')
    .max(255, 'Filename too long')
    .regex(/^[^<>:"/\\|?*]+$/, 'Invalid filename characters'),
  fileSize: z.number()
    .positive('File size must be positive')
    .max(10 * 1024 * 1024, 'File size must be less than 10MB'),
  mimeType: z.enum(supportedMimeTypes, {
    errorMap: () => ({ message: 'Unsupported file type' })
  })
})

// =============================================================================
// Profile Schemas
// =============================================================================

export const profileSchema = z.object({
  id: uuidSchema,
  email: emailSchema,
  full_name: z.string().max(100, 'Name too long').nullable(),
  avatar_url: z.string().url('Invalid URL format').nullable(),
  created_at: timestampSchema,
  updated_at: timestampSchema
})

export const profileInsertSchema = z.object({
  id: uuidSchema,
  email: emailSchema,
  full_name: z.string().max(100, 'Name too long').optional(),
  avatar_url: z.string().url('Invalid URL format').optional()
})

export const profileUpdateSchema = z.object({
  email: emailSchema.optional(),
  full_name: z.string().max(100, 'Name too long').nullable().optional(),
  avatar_url: z.string().url('Invalid URL format').nullable().optional()
})

// =============================================================================
// Document Schemas
// =============================================================================

export const documentProcessingStatusSchema = z.enum([
  'pending',
  'processing', 
  'completed',
  'failed'
] as const)

export const documentSchema = z.object({
  id: uuidSchema,
  user_id: uuidSchema,
  filename: z.string().min(1, 'Filename is required').max(255, 'Filename too long'),
  file_size: z.number().positive('File size must be positive'),
  mime_type: z.string().min(1, 'MIME type is required'),
  storage_path: z.string().min(1, 'Storage path is required'),
  processing_status: documentProcessingStatusSchema,
  chunk_count: z.number().min(0, 'Chunk count cannot be negative'),
  error_message: z.string().nullable(),
  created_at: timestampSchema,
  updated_at: timestampSchema
})

export const documentInsertSchema = z.object({
  user_id: uuidSchema,
  filename: z.string().min(1, 'Filename is required').max(255, 'Filename too long'),
  file_size: z.number().positive('File size must be positive'),
  mime_type: z.string().min(1, 'MIME type is required'),
  storage_path: z.string().min(1, 'Storage path is required'),
  processing_status: documentProcessingStatusSchema.optional(),
  chunk_count: z.number().min(0, 'Chunk count cannot be negative').optional(),
  error_message: z.string().nullable().optional()
})

export const documentUpdateSchema = z.object({
  filename: z.string().min(1, 'Filename is required').max(255, 'Filename too long').optional(),
  processing_status: documentProcessingStatusSchema.optional(),
  chunk_count: z.number().min(0, 'Chunk count cannot be negative').optional(),
  error_message: z.string().nullable().optional()
})

// =============================================================================
// Document Chunk Schemas
// =============================================================================

export const documentChunkSchema = z.object({
  id: uuidSchema,
  document_id: uuidSchema,
  chunk_index: z.number().min(0, 'Chunk index cannot be negative'),
  content: z.string().min(1, 'Content is required').max(10000, 'Content too long'),
  token_count: z.number().positive('Token count must be positive'),
  qdrant_point_id: uuidSchema.nullable(),
  created_at: timestampSchema
})

export const documentChunkInsertSchema = z.object({
  document_id: uuidSchema,
  chunk_index: z.number().min(0, 'Chunk index cannot be negative'),
  content: z.string().min(1, 'Content is required').max(10000, 'Content too long'),
  token_count: z.number().positive('Token count must be positive'),
  qdrant_point_id: uuidSchema.nullable().optional()
})

export const documentChunkUpdateSchema = z.object({
  content: z.string().min(1, 'Content is required').max(10000, 'Content too long').optional(),
  token_count: z.number().positive('Token count must be positive').optional(),
  qdrant_point_id: uuidSchema.nullable().optional()
})

// =============================================================================
// Conversation Schemas
// =============================================================================

export const conversationSchema = z.object({
  id: uuidSchema,
  user_id: uuidSchema,
  title: z.string().max(200, 'Title too long').nullable(),
  created_at: timestampSchema,
  updated_at: timestampSchema
})

export const conversationInsertSchema = z.object({
  user_id: uuidSchema,
  title: z.string().max(200, 'Title too long').optional()
})

export const conversationUpdateSchema = z.object({
  title: z.string().max(200, 'Title too long').nullable().optional()
})

// =============================================================================
// Message Schemas
// =============================================================================

export const messageRoleSchema = z.enum(['user', 'assistant', 'system'] as const)

export const messageSchema = z.object({
  id: uuidSchema,
  conversation_id: uuidSchema,
  role: messageRoleSchema,
  content: z.string().min(1, 'Content is required').max(50000, 'Content too long'),
  metadata: z.record(z.any()).default({}),
  created_at: timestampSchema
})

export const messageInsertSchema = z.object({
  conversation_id: uuidSchema,
  role: messageRoleSchema,
  content: z.string().min(1, 'Content is required').max(50000, 'Content too long'),
  metadata: z.record(z.any()).optional().default({})
})

export const messageUpdateSchema = z.object({
  content: z.string().min(1, 'Content is required').max(50000, 'Content too long').optional(),
  metadata: z.record(z.any()).optional()
})

// =============================================================================
// API Request Schemas
// =============================================================================

export const chatRequestSchema = z.object({
  messages: z.array(z.object({
    role: messageRoleSchema,
    content: z.string().min(1, 'Message content is required').max(10000, 'Message too long')
  })).min(1, 'At least one message is required'),
  conversationId: uuidSchema.optional(),
  temperature: z.number().min(0).max(2).optional().default(0.1),
  maxTokens: z.number().positive().max(4000).optional().default(1000)
})

export const vectorSearchSchema = z.object({
  query: z.string().min(1, 'Query is required').max(1000, 'Query too long'),
  userId: uuidSchema,
  topK: z.number().positive().max(20).optional().default(5),
  threshold: z.number().min(0).max(1).optional().default(0.7),
  includeMetadata: z.boolean().optional().default(true)
})

export const documentProcessingRequestSchema = z.object({
  documentId: uuidSchema,
  chunkSize: z.number().positive().max(2000).optional().default(500),
  chunkOverlap: z.number().min(0).max(500).optional().default(50)
})

// =============================================================================
// Pagination Schemas
// =============================================================================

export const paginationSchema = z.object({
  page: z.number().positive().optional().default(1),
  limit: z.number().positive().max(100).optional().default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
})

// =============================================================================
// Authentication Schemas
// =============================================================================

export const magicLinkRequestSchema = z.object({
  email: emailSchema,
  redirectTo: z.string().url('Invalid redirect URL').optional()
})

export const otpRequestSchema = z.object({
  email: emailSchema,
  createUser: z.boolean().optional().default(true)
})

export const otpVerifySchema = z.object({
  email: emailSchema,
  token: z.string().length(6, 'OTP must be 6 digits').regex(/^\d+$/, 'OTP must contain only digits'),
  type: z.enum(['email', 'sms']).default('email')
})

// =============================================================================
// Environment Configuration Schema
// =============================================================================

export const envSchema = z.object({
  // Next.js
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  NEXT_PUBLIC_SITE_URL: z.string().url('Invalid site URL').optional(),
  
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'Supabase service role key is required'),
  
  // OpenAI
  OPENAI_API_KEY: z.string().min(1, 'OpenAI API key is required'),
  
  // Qdrant
  QDRANT_URL: z.string().url('Invalid Qdrant URL'),
  QDRANT_API_KEY: z.string().min(1, 'Qdrant API key is required'),
  QDRANT_COLLECTION_NAME: z.string().min(1, 'Qdrant collection name is required').default('documents'),
  
  // Upstash Redis
  UPSTASH_REDIS_REST_URL: z.string().url('Invalid Upstash Redis URL'),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1, 'Upstash Redis token is required')
})

// =============================================================================
// Form Validation Schemas
// =============================================================================

export const loginFormSchema = z.object({
  email: emailSchema,
  method: z.enum(['magic_link', 'otp']).default('magic_link')
})

export const otpFormSchema = z.object({
  email: emailSchema,
  otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d+$/, 'OTP must contain only digits')
})

export const profileFormSchema = z.object({
  full_name: z.string().max(100, 'Name too long').optional(),
  email: emailSchema
})

export const documentDeleteSchema = z.object({
  documentId: uuidSchema,
  confirmDelete: z.boolean().refine(val => val === true, 'Please confirm deletion')
})

// =============================================================================
// Error Response Schema
// =============================================================================

export const errorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  code: z.string().optional(),
  details: z.any().optional()
})

// =============================================================================
// Success Response Schema
// =============================================================================

export const successResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  message: z.string().optional()
})

// =============================================================================
// Type Exports
// =============================================================================

export type FileUploadInput = z.infer<typeof fileUploadSchema>
export type DocumentUploadFormInput = z.infer<typeof documentUploadFormSchema>
export type ProfileInsertInput = z.infer<typeof profileInsertSchema>
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>
export type DocumentInsertInput = z.infer<typeof documentInsertSchema>
export type DocumentUpdateInput = z.infer<typeof documentUpdateSchema>
export type DocumentChunkInsertInput = z.infer<typeof documentChunkInsertSchema>
export type ConversationInsertInput = z.infer<typeof conversationInsertSchema>
export type MessageInsertInput = z.infer<typeof messageInsertSchema>
export type ChatRequestInput = z.infer<typeof chatRequestSchema>
export type VectorSearchInput = z.infer<typeof vectorSearchSchema>
export type PaginationInput = z.infer<typeof paginationSchema>
export type LoginFormInput = z.infer<typeof loginFormSchema>
export type OtpFormInput = z.infer<typeof otpFormSchema>
export type ProfileFormInput = z.infer<typeof profileFormSchema>
export type EnvInput = z.infer<typeof envSchema>