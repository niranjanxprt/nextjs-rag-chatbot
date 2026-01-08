/**
 * Document Processing API Route
 *
 * Handles document processing: text extraction, chunking, and embedding generation
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getDocument, updateDocument, createDocumentChunks } from '@/lib/database/queries'
import { documentProcessingRequestSchema } from '@/lib/schemas/validation'
import { processDocument } from '@/lib/services/document-processor'

// =============================================================================
// POST - Process document
// =============================================================================

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params
  try {
    // Check authentication
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      )
    }

    const documentId = params.id

    // Parse request body
    const body = await request.json().catch(() => ({}))

    // Validate processing options
    const validatedOptions = documentProcessingRequestSchema.parse({
      documentId,
      ...body,
    })

    // Check if document exists and belongs to user
    const document = await getDocument(documentId, user.id)
    if (!document) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Document not found' },
        { status: 404 }
      )
    }

    // Check if document is already processed or processing
    if (document.processing_status === 'processing') {
      return NextResponse.json(
        { error: 'Conflict', message: 'Document is already being processed' },
        { status: 409 }
      )
    }

    if (document.processing_status === 'completed') {
      return NextResponse.json(
        { error: 'Conflict', message: 'Document is already processed' },
        { status: 409 }
      )
    }

    // Update document status to processing
    await updateDocument(documentId, user.id, {
      processing_status: 'processing',
      error_message: null,
    })

    try {
      // Process document in background
      // Note: In production, this should be moved to a background job queue
      const processingResult = await processDocument(document, {
        chunkSize: validatedOptions.chunkSize,
        chunkOverlap: validatedOptions.chunkOverlap,
      })

      // Update document with processing results
      await updateDocument(documentId, user.id, {
        processing_status: 'completed',
        chunk_count: processingResult.chunks.length,
        error_message: null,
      })

      // Create document chunks
      const chunkInserts = processingResult.chunks.map((chunk, index) => ({
        document_id: documentId,
        chunk_index: index,
        content: chunk.content,
        token_count: chunk.tokenCount,
        qdrant_point_id: chunk.qdrantPointId || null,
      }))

      await createDocumentChunks(chunkInserts)

      return NextResponse.json({
        success: true,
        data: {
          document: await getDocument(documentId, user.id),
          chunksCreated: processingResult.chunks.length,
          processingTime: processingResult.processingTime,
        },
        message: 'Document processed successfully',
      })
    } catch (processingError) {
      console.error('Document processing error:', processingError)

      // Update document status to failed
      await updateDocument(documentId, user.id, {
        processing_status: 'failed',
        error_message:
          processingError instanceof Error ? processingError.message : 'Processing failed',
      })

      return NextResponse.json(
        {
          error: 'Processing Failed',
          message:
            processingError instanceof Error
              ? processingError.message
              : 'Document processing failed',
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Document processing API error:', error)

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'Invalid processing options',
          details: error.message,
        },
        { status: 400 }
      )
    }

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
// GET - Get processing status
// =============================================================================

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params
  try {
    // Check authentication
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      )
    }

    const documentId = params.id

    // Get document
    const document = await getDocument(documentId, user.id)
    if (!document) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Document not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        documentId: document.id,
        status: document.processing_status,
        chunkCount: document.chunk_count,
        errorMessage: document.error_message,
        createdAt: document.created_at,
        updatedAt: document.updated_at,
      },
    })
  } catch (error) {
    console.error('Processing status API error:', error)

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to get processing status',
      },
      { status: 500 }
    )
  }
}
