/**
 * Database Query Helpers and Utilities
 * 
 * Centralized database operations with proper error handling,
 * type safety, and performance optimizations
 */

import { createClient } from '@/lib/supabase/server'
import type { 
  Database,
  Profile,
  Document,
  DocumentChunk,
  Conversation,
  Message,
  DocumentInsert,
  DocumentUpdate,
  DocumentChunkInsert,
  ConversationInsert,
  MessageInsert,
  PaginationOptions,
  PaginatedResponse,
  DocumentWithChunks,
  ConversationWithMessages
} from '@/lib/types/database'
import { 
  documentInsertSchema,
  documentUpdateSchema,
  documentChunkInsertSchema,
  conversationInsertSchema,
  messageInsertSchema,
  paginationSchema
} from '@/lib/schemas/validation'

// =============================================================================
// Error Handling
// =============================================================================

export class DatabaseError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: string
  ) {
    super(message)
    this.name = 'DatabaseError'
  }
}

function handleDatabaseError(error: any): never {
  console.error('Database error:', error)
  
  if (error.code) {
    throw new DatabaseError(
      error.message || 'Database operation failed',
      error.code,
      error.details
    )
  }
  
  throw new DatabaseError('Unknown database error occurred')
}

// =============================================================================
// Profile Operations
// =============================================================================

export async function getProfile(userId: string): Promise<Profile | null> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      handleDatabaseError(error)
    }
    
    return data
  } catch (error) {
    if (error instanceof DatabaseError) throw error
    handleDatabaseError(error)
  }
}

export async function updateProfile(
  userId: string, 
  updates: Partial<Profile>
): Promise<Profile> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
    
    if (error) handleDatabaseError(error)
    
    return data
  } catch (error) {
    if (error instanceof DatabaseError) throw error
    handleDatabaseError(error)
  }
}

// =============================================================================
// Document Operations
// =============================================================================

export async function createDocument(
  documentData: DocumentInsert
): Promise<Document> {
  try {
    // Validate input
    const validatedData = documentInsertSchema.parse(documentData)
    
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('documents')
      .insert(validatedData)
      .select()
      .single()
    
    if (error) handleDatabaseError(error)
    
    return data
  } catch (error) {
    if (error instanceof DatabaseError) throw error
    handleDatabaseError(error)
  }
}

export async function getDocument(
  documentId: string, 
  userId: string
): Promise<Document | null> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('user_id', userId)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      handleDatabaseError(error)
    }
    
    return data
  } catch (error) {
    if (error instanceof DatabaseError) throw error
    handleDatabaseError(error)
  }
}

export async function getDocuments(
  userId: string,
  options: PaginationOptions = {}
): Promise<PaginatedResponse<Document>> {
  try {
    const validatedOptions = paginationSchema.parse(options)
    const { page, limit, sortBy = 'created_at', sortOrder } = validatedOptions
    
    const supabase = await createClient()
    
    // Get total count
    const { count, error: countError } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
    
    if (countError) handleDatabaseError(countError)
    
    // Get paginated data
    const from = (page - 1) * limit
    const to = from + limit - 1
    
    let query = supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .range(from, to)
    
    if (sortBy) {
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })
    }
    
    const { data, error } = await query
    
    if (error) handleDatabaseError(error)
    
    const total = count || 0
    const totalPages = Math.ceil(total / limit)
    
    return {
      data: data || [],
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }
  } catch (error) {
    if (error instanceof DatabaseError) throw error
    handleDatabaseError(error)
  }
}

export async function updateDocument(
  documentId: string,
  userId: string,
  updates: DocumentUpdate
): Promise<Document> {
  try {
    const validatedUpdates = documentUpdateSchema.parse(updates)
    
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('documents')
      .update(validatedUpdates)
      .eq('id', documentId)
      .eq('user_id', userId)
      .select()
      .single()
    
    if (error) handleDatabaseError(error)
    
    return data
  } catch (error) {
    if (error instanceof DatabaseError) throw error
    handleDatabaseError(error)
  }
}

export async function deleteDocument(
  documentId: string,
  userId: string
): Promise<void> {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId)
      .eq('user_id', userId)
    
    if (error) handleDatabaseError(error)
  } catch (error) {
    if (error instanceof DatabaseError) throw error
    handleDatabaseError(error)
  }
}

export async function getDocumentWithChunks(
  documentId: string,
  userId: string
): Promise<DocumentWithChunks | null> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('documents')
      .select(`
        *,
        chunks:document_chunks(*)
      `)
      .eq('id', documentId)
      .eq('user_id', userId)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      handleDatabaseError(error)
    }
    
    return data as DocumentWithChunks
  } catch (error) {
    if (error instanceof DatabaseError) throw error
    handleDatabaseError(error)
  }
}

// =============================================================================
// Document Chunk Operations
// =============================================================================

export async function createDocumentChunk(
  chunkData: DocumentChunkInsert
): Promise<DocumentChunk> {
  try {
    const validatedData = documentChunkInsertSchema.parse(chunkData)
    
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('document_chunks')
      .insert(validatedData)
      .select()
      .single()
    
    if (error) handleDatabaseError(error)
    
    return data
  } catch (error) {
    if (error instanceof DatabaseError) throw error
    handleDatabaseError(error)
  }
}

export async function createDocumentChunks(
  chunksData: DocumentChunkInsert[]
): Promise<DocumentChunk[]> {
  try {
    const validatedData = chunksData.map(chunk => 
      documentChunkInsertSchema.parse(chunk)
    )
    
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('document_chunks')
      .insert(validatedData)
      .select()
    
    if (error) handleDatabaseError(error)
    
    return data || []
  } catch (error) {
    if (error instanceof DatabaseError) throw error
    handleDatabaseError(error)
  }
}

export async function getDocumentChunks(
  documentId: string
): Promise<DocumentChunk[]> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('document_chunks')
      .select('*')
      .eq('document_id', documentId)
      .order('chunk_index', { ascending: true })
    
    if (error) handleDatabaseError(error)
    
    return data || []
  } catch (error) {
    if (error instanceof DatabaseError) throw error
    handleDatabaseError(error)
  }
}

export async function deleteDocumentChunks(
  documentId: string
): Promise<void> {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('document_chunks')
      .delete()
      .eq('document_id', documentId)
    
    if (error) handleDatabaseError(error)
  } catch (error) {
    if (error instanceof DatabaseError) throw error
    handleDatabaseError(error)
  }
}

// =============================================================================
// Conversation Operations
// =============================================================================

export async function createConversation(
  conversationData: ConversationInsert
): Promise<Conversation> {
  try {
    const validatedData = conversationInsertSchema.parse(conversationData)
    
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('conversations')
      .insert(validatedData)
      .select()
      .single()
    
    if (error) handleDatabaseError(error)
    
    return data
  } catch (error) {
    if (error instanceof DatabaseError) throw error
    handleDatabaseError(error)
  }
}

export async function getConversation(
  conversationId: string,
  userId: string
): Promise<Conversation | null> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .eq('user_id', userId)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      handleDatabaseError(error)
    }
    
    return data
  } catch (error) {
    if (error instanceof DatabaseError) throw error
    handleDatabaseError(error)
  }
}

export async function getConversations(
  userId: string,
  options: PaginationOptions = {}
): Promise<PaginatedResponse<Conversation>> {
  try {
    const validatedOptions = paginationSchema.parse(options)
    const { page, limit, sortBy = 'updated_at', sortOrder } = validatedOptions
    
    const supabase = await createClient()
    
    // Get total count
    const { count, error: countError } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
    
    if (countError) handleDatabaseError(countError)
    
    // Get paginated data
    const from = (page - 1) * limit
    const to = from + limit - 1
    
    let query = supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .range(from, to)
    
    if (sortBy) {
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })
    }
    
    const { data, error } = await query
    
    if (error) handleDatabaseError(error)
    
    const total = count || 0
    const totalPages = Math.ceil(total / limit)
    
    return {
      data: data || [],
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }
  } catch (error) {
    if (error instanceof DatabaseError) throw error
    handleDatabaseError(error)
  }
}

export async function getConversationWithMessages(
  conversationId: string,
  userId: string
): Promise<ConversationWithMessages | null> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        messages(*)
      `)
      .eq('id', conversationId)
      .eq('user_id', userId)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      handleDatabaseError(error)
    }
    
    return data as ConversationWithMessages
  } catch (error) {
    if (error instanceof DatabaseError) throw error
    handleDatabaseError(error)
  }
}

export async function deleteConversation(
  conversationId: string,
  userId: string
): Promise<void> {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId)
      .eq('user_id', userId)
    
    if (error) handleDatabaseError(error)
  } catch (error) {
    if (error instanceof DatabaseError) throw error
    handleDatabaseError(error)
  }
}

// =============================================================================
// Message Operations
// =============================================================================

export async function createMessage(
  messageData: MessageInsert
): Promise<Message> {
  try {
    const validatedData = messageInsertSchema.parse(messageData)
    
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('messages')
      .insert(validatedData)
      .select()
      .single()
    
    if (error) handleDatabaseError(error)
    
    return data
  } catch (error) {
    if (error instanceof DatabaseError) throw error
    handleDatabaseError(error)
  }
}

export async function getMessages(
  conversationId: string,
  options: PaginationOptions = {}
): Promise<PaginatedResponse<Message>> {
  try {
    const validatedOptions = paginationSchema.parse(options)
    const { page, limit, sortBy = 'created_at', sortOrder = 'asc' } = validatedOptions
    
    const supabase = await createClient()
    
    // Get total count
    const { count, error: countError } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', conversationId)
    
    if (countError) handleDatabaseError(countError)
    
    // Get paginated data
    const from = (page - 1) * limit
    const to = from + limit - 1
    
    let query = supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .range(from, to)
    
    if (sortBy) {
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })
    }
    
    const { data, error } = await query
    
    if (error) handleDatabaseError(error)
    
    const total = count || 0
    const totalPages = Math.ceil(total / limit)
    
    return {
      data: data || [],
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }
  } catch (error) {
    if (error instanceof DatabaseError) throw error
    handleDatabaseError(error)
  }
}

// =============================================================================
// Utility Functions
// =============================================================================

export async function getUserDocumentCount(userId: string): Promise<number> {
  try {
    const supabase = await createClient()
    
    const { count, error } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
    
    if (error) handleDatabaseError(error)
    
    return count || 0
  } catch (error) {
    if (error instanceof DatabaseError) throw error
    handleDatabaseError(error)
  }
}

export async function getUserConversationCount(userId: string): Promise<number> {
  try {
    const supabase = await createClient()
    
    const { count, error } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
    
    if (error) handleDatabaseError(error)
    
    return count || 0
  } catch (error) {
    if (error instanceof DatabaseError) throw error
    handleDatabaseError(error)
  }
}

export async function getRecentDocuments(
  userId: string,
  limit: number = 5
): Promise<Document[]> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) handleDatabaseError(error)
    
    return data || []
  } catch (error) {
    if (error instanceof DatabaseError) throw error
    handleDatabaseError(error)
  }
}

export async function getRecentConversations(
  userId: string,
  limit: number = 5
): Promise<Conversation[]> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(limit)
    
    if (error) handleDatabaseError(error)
    
    return data || []
  } catch (error) {
    if (error instanceof DatabaseError) throw error
    handleDatabaseError(error)
  }
}