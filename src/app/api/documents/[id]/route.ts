/**
 * Individual Document API Route
 *
 * Handles operations on specific documents: GET, PUT, DELETE
 */

import { NextRequest, NextResponse } from 'next/server'
import { extractSessionToken, getAuthenticatedConvexClient } from '@/lib/convex/client'
import { api } from '../../../../../convex/_generated/api'
import { Id } from '../../../../../convex/_generated/dataModel'
import { documentUpdateSchema } from '@/lib/schemas/validation'

// =============================================================================
// GET - Retrieve specific document
// =============================================================================

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params
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

    const documentId = params.id as Id<"documents">

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const includeChunks = searchParams.get('includeChunks') === 'true'

    // Get document from Convex
    const document = await convex.query(api.queries.documents.get, { id: documentId })

    if (!document) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Document not found' },
        { status: 404 }
      )
    }

    // Get chunks if requested
    let responseData: any = document
    if (includeChunks) {
      const chunks = await convex.query(api.queries.documents.getChunks, { documentId })
      responseData = { ...document, chunks }
    }

    return NextResponse.json({
      success: true,
      data: responseData,
    })
  } catch (error) {
    console.error('Document GET API error:', error)

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to fetch document',
      },
      { status: 500 }
    )
  }
}

// =============================================================================
// PUT - Update document metadata
// =============================================================================

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params
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

    const documentId = params.id as Id<"documents">

    // Parse request body
    const body = await request.json()

    // Validate update data
    const validatedUpdates = documentUpdateSchema.parse(body)

    // Update document status via Convex mutation
    await convex.mutation(api.mutations.documents.updateStatus, {
      id: documentId,
      status: validatedUpdates.processing_status || 'completed',
      error_message: validatedUpdates.error_message || undefined,
      chunk_count: validatedUpdates.chunk_count,
    })

    // Get updated document
    const updatedDocument = await convex.query(api.queries.documents.get, { id: documentId })

    return NextResponse.json({
      success: true,
      data: updatedDocument,
      message: 'Document updated successfully',
    })
  } catch (error) {
    console.error('Document PUT API error:', error)

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'Invalid update data',
          details: error.message,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to update document',
      },
      { status: 500 }
    )
  }
}

// =============================================================================
// DELETE - Delete document and associated data
// =============================================================================

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params
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

    const documentId = params.id as Id<"documents">

    // Get document to check storage_id
    const document = await convex.query(api.queries.documents.get, { id: documentId })
    
    if (!document) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Document not found' },
        { status: 404 }
      )
    }

    // Delete from Convex storage
    // Note: Convex storage deletion will be handled in the mutation
    // The mutation will delete the document and all associated chunks

    // Delete document (cascades to chunks)
    await convex.mutation(api.mutations.documents.remove, { id: documentId })

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully',
    })
  } catch (error) {
    console.error('Document DELETE API error:', error)

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to delete document',
      },
      { status: 500 }
    )
  }
}
