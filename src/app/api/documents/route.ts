/**
 * Documents API Route
 * 
 * Handles document listing, retrieval, and management operations
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { 
  getDocuments, 
  getDocument, 
  updateDocument, 
  deleteDocument,
  getUserDocumentCount 
} from '@/lib/database/queries'
import { paginationSchema, documentUpdateSchema } from '@/lib/schemas/validation'

// =============================================================================
// GET - List user documents with pagination
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      )
    }
    
    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const paginationParams = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      sortBy: searchParams.get('sortBy') || 'created_at',
      sortOrder: (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'
    }
    
    // Validate pagination parameters
    const validatedParams = paginationSchema.parse(paginationParams)
    
    // Get documents
    const result = await getDocuments(user.id, validatedParams)
    
    // Get total document count for user
    const totalDocuments = await getUserDocumentCount(user.id)
    
    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      meta: {
        totalDocuments
      }
    })
    
  } catch (error) {
    console.error('Documents GET API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error', 
        message: error instanceof Error ? error.message : 'Failed to fetch documents' 
      },
      { status: 500 }
    )
  }
}

// =============================================================================
// POST - Create new document (alternative to upload route)
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      )
    }
    
    // This endpoint is primarily for metadata-only document creation
    // Actual file uploads should use the /upload endpoint
    
    return NextResponse.json(
      { 
        error: 'Method Not Allowed', 
        message: 'Use /api/documents/upload for file uploads' 
      },
      { status: 405 }
    )
    
  } catch (error) {
    console.error('Documents POST API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error', 
        message: error instanceof Error ? error.message : 'An unexpected error occurred' 
      },
      { status: 500 }
    )
  }
}