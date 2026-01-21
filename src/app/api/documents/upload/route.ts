/**
 * Document Upload API Route with RAG Processing
 *
 * Handles file uploads with validation, Convex Storage integration, and async RAG processing
 */

import { NextRequest, NextResponse } from 'next/server'
import { extractSessionToken, getAuthenticatedConvexClient } from '@/lib/convex/client'
import { api } from '../../../../../convex/_generated/api'
import { supportedMimeTypes } from '@/lib/schemas/validation'
import { Id } from '../../../../../convex/_generated/dataModel'

// =============================================================================
// Configuration
// =============================================================================

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

// =============================================================================
// Helper Functions
// =============================================================================

function validateFileType(file: File): boolean {
  return supportedMimeTypes.includes(file.type as any)
}

function validateFileSize(file: File): boolean {
  return file.size > 0 && file.size <= MAX_FILE_SIZE
}

/**
 * Process document asynchronously (runs in background)
 */
async function processDocumentAsync(
  documentId: string,
  storageId: string,
  fileName: string,
  fileType: string,
  userId: string,
  projectId?: string
) {
  try {
    // Import services dynamically to avoid circular dependencies
    const { processDocument } = await import('@/lib/services/document-processor')
    const { embedChunks } = await import('@/lib/services/embeddings')
    const { storeVectors, initializeCollection } = await import('@/lib/services/vector-search')
    
    // Get authenticated Convex client
    const convex = getAuthenticatedConvexClient()
    
    // 1. Download file from Convex storage
    const fileUrl = await convex.query(api.storage.retrieve.getUrl, {
      storageId: storageId as Id<'_storage'>,
    })
    
    const response = await fetch(fileUrl)
    const arrayBuffer = await response.arrayBuffer()
    const fileBuffer = Buffer.from(arrayBuffer)
    
    // 2. Extract text and chunk
    const { text, chunks } = await processDocument(fileBuffer, {
      user_id: userId,
      project_id: projectId,
      name: fileName,
      size: fileBuffer.length,
      type: fileType,
    })
    
    // 3. Store chunks in Convex
    const chunkIds: string[] = []
    for (const chunk of chunks) {
      const chunkId = await convex.mutation(api.mutations.chunks.create, {
        document_id: documentId as Id<'documents'>,
        content: chunk.content,
        position: chunk.position,
        start_char: chunk.start_char,
        end_char: chunk.end_char,
        qdrant_id: '', // Will be updated after storing in Qdrant
        user_id: userId as Id<'users'>,
        project_id: projectId as Id<'projects'> | undefined,
      })
      chunkIds.push(chunkId)
    }
    
    // 4. Generate embeddings
    const chunksWithIds = chunks.map((chunk, index) => ({
      chunk_id: chunkIds[index],
      document_id: documentId,
      content: chunk.content,
      position: chunk.position,
    }))
    
    const { embeddings } = await embedChunks(chunksWithIds, {
      user_id: userId,
      project_id: projectId,
      document_name: fileName,
    })
    
    // 5. Ensure Qdrant collection exists
    await initializeCollection()
    
    // 6. Store vectors in Qdrant
    const payloads = chunksWithIds.map((chunk, index) => ({
      chunk_id: chunk.chunk_id,
      document_id: documentId,
      user_id: userId,
      project_id: projectId,
      content: chunk.content,
      document_name: fileName,
    }))
    
    const qdrantIds = await storeVectors(embeddings, payloads)
    
    // 7. Update chunks with Qdrant IDs
    for (let i = 0; i < chunkIds.length; i++) {
      await convex.mutation(api.mutations.chunks.updateQdrantId, {
        id: chunkIds[i] as Id<'chunks'>,
        qdrant_id: qdrantIds[i],
        user_id: userId as Id<'users'>,
      })
    }
    
    // 8. Update document status to ready
    await convex.mutation(api.mutations.documents.updateStatus, {
      id: documentId as Id<'documents'>,
      user_id: userId as Id<'users'>,
      status: 'ready',
      chunk_count: chunks.length,
    })
    
    console.log(`Document ${documentId} processed successfully: ${chunks.length} chunks`)
  } catch (error) {
    console.error(`Document processing failed for ${documentId}:`, error)
    
    // Update document status to error
    try {
      const convex = getAuthenticatedConvexClient()
      await convex.mutation(api.mutations.documents.updateStatus, {
        id: documentId as Id<'documents'>,
        user_id: userId as Id<'users'>,
        status: 'error',
        error_message: error instanceof Error ? error.message : 'Processing failed',
      })
    } catch (updateError) {
      console.error('Failed to update document error status:', updateError)
    }
  }
}

// =============================================================================
// API Route Handler
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    // Extract session token
    const token = extractSessionToken(request)
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get authenticated Convex client
    const convex = getAuthenticatedConvexClient(token)

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file
    if (!validateFileType(file)) {
      return NextResponse.json(
        {
          error: 'Invalid File Type',
          message: `File type ${file.type} is not supported. Supported types: ${supportedMimeTypes.join(', ')}`,
        },
        { status: 400 }
      )
    }

    if (!validateFileSize(file)) {
      return NextResponse.json(
        {
          error: 'Invalid File Size',
          message: `File size must be between 1 byte and ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        },
        { status: 400 }
      )
    }

    // Get upload URL from Convex
    const uploadUrl = await convex.mutation(api.storage.upload.generateUploadUrl)

    // Upload file to Convex storage
    const result = await fetch(uploadUrl, {
      method: 'POST',
      headers: { 'Content-Type': file.type },
      body: file,
    })

    if (!result.ok) {
      return NextResponse.json(
        {
          error: 'Upload Failed',
          message: 'Failed to upload file to storage',
        },
        { status: 500 }
      )
    }

    const { storageId } = await result.json()

    // Create document record in Convex
    const document = await convex.mutation(api.mutations.documents.create, {
      title: file.name,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
      storage_id: storageId,
    })

    // Start async processing in background (don't await)
    processDocumentAsync(
      document,
      storageId,
      file.name,
      file.type,
      'user-id-placeholder', // TODO: Get actual user ID from session
      undefined // TODO: Get project ID if provided
    ).catch(error => {
      console.error('Background processing error:', error)
    })

    // Return success response immediately
    return NextResponse.json(
      {
        success: true,
        data: {
          document_id: document,
          status: 'processing',
          message: 'File uploaded successfully. Processing in background.',
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Upload API error:', error)

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
      { status: 500 }
    )
  }
}

// =============================================================================
// Options Handler (for CORS)
// =============================================================================

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
