/**
 * Database Query Helpers and Utilities
 *
 * NOTE: This file is deprecated and being migrated to Convex.
 * These are stub implementations for backward compatibility with tests.
 * All new code should use Convex queries and mutations directly.
 */

import type { Document, DocumentChunk } from '@/lib/types/database'

// Stub implementations for backward compatibility
export async function getDocument(documentId: string, userId: string): Promise<Document | null> {
  console.warn('getDocument is deprecated - use Convex queries instead')
  return null
}

export async function updateDocument(documentId: string, userId: string, updates: any): Promise<Document> {
  console.warn('updateDocument is deprecated - use Convex mutations instead')
  throw new Error('Not implemented - use Convex mutations')
}

export async function createDocumentChunks(chunks: any[]): Promise<DocumentChunk[]> {
  console.warn('createDocumentChunks is deprecated - use Convex mutations instead')
  throw new Error('Not implemented - use Convex mutations')
}

// Export other stub functions as needed
export async function getProfile(userId: string): Promise<any> {
  console.warn('getProfile is deprecated - use Convex queries instead')
  return null
}

export async function createDocument(data: any): Promise<Document> {
  console.warn('createDocument is deprecated - use Convex mutations instead')
  throw new Error('Not implemented - use Convex mutations')
}
