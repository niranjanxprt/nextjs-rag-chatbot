/**
 * Individual Document API Route
 *
 * Handles operations on specific documents: GET, PUT, DELETE
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getDocument,
  updateDocument,
  deleteDocument,
  getDocumentWithChunks,
  deleteDocumentChunks,
} from '@/lib/database/queries'
import { documentUpdateSchema } from '@/lib/schemas/validation'

// =============================================================================
// GET - Retrieve specific document
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

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const includeChunks = searchParams.get('includeChunks') === 'true'

    // Get document
    let document
    if (includeChunks) {
      document = await getDocumentWithChunks(documentId, user.id)
    } else {
      document = await getDocument(documentId, user.id)
    }

    if (!document) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Document not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: document,
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
    const body = await request.json()

    // Validate update data
    const validatedUpdates = documentUpdateSchema.parse(body)

    // Check if document exists and belongs to user
    const existingDocument = await getDocument(documentId, user.id)
    if (!existingDocument) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Document not found' },
        { status: 404 }
      )
    }

    // Update document
    const updatedDocument = await updateDocument(documentId, user.id, validatedUpdates)

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

    // Check if document exists and belongs to user
    const existingDocument = await getDocument(documentId, user.id)
    if (!existingDocument) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Document not found' },
        { status: 404 }
      )
    }

    // Delete from Supabase Storage
    const { error: storageError } = await supabase.storage
      .from('documents')
      .remove([existingDocument.storage_path])

    if (storageError) {
      console.error('Storage deletion error:', storageError)
      // Continue with database deletion even if storage deletion fails
    }

    // Delete document chunks first (due to foreign key constraint)
    await deleteDocumentChunks(documentId)

    // Delete document record
    await deleteDocument(documentId, user.id)

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
