/**
 * Documents API Route
 *
 * Handles document listing, retrieval, and management operations
 */

import { NextRequest, NextResponse } from 'next/server'
import { extractSessionToken, getAuthenticatedConvexClient } from '@/lib/convex/client'
import { api } from '../../../../convex/_generated/api'
import { paginationSchema } from '@/lib/schemas/validation'

// =============================================================================
// GET - List user documents with pagination
// =============================================================================

export async function GET(request: NextRequest) {
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

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const paginationParams = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      sortBy: searchParams.get('sortBy') || 'created_at',
      sortOrder: (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc',
    }

    // Validate pagination parameters
    const validatedParams = paginationSchema.parse(paginationParams)

    // Get documents from Convex
    const documents = await convex.query(api.queries.documents.list)

    // Apply client-side pagination and sorting
    // Note: In production, this should be done server-side in Convex
    const sortedDocs = [...documents].sort((a, b) => {
      const aVal = a[validatedParams.sortBy as keyof typeof a] || ''
      const bVal = b[validatedParams.sortBy as keyof typeof b] || ''
      const order = validatedParams.sortOrder === 'asc' ? 1 : -1
      return aVal > bVal ? order : -order
    })

    const startIndex = (validatedParams.page - 1) * validatedParams.limit
    const endIndex = startIndex + validatedParams.limit
    const paginatedDocs = sortedDocs.slice(startIndex, endIndex)

    return NextResponse.json({
      success: true,
      data: paginatedDocs,
      pagination: {
        page: validatedParams.page,
        limit: validatedParams.limit,
        total: documents.length,
        totalPages: Math.ceil(documents.length / validatedParams.limit),
      },
      meta: {
        totalDocuments: documents.length,
      },
    })
  } catch (error) {
    console.error('Documents GET API error:', error)

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to fetch documents',
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
    // Extract session token
    const token = extractSessionToken(request)
    if (!token) {
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
        message: 'Use /api/documents/upload for file uploads',
      },
      { status: 405 }
    )
  } catch (error) {
    console.error('Documents POST API error:', error)

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
      { status: 500 }
    )
  }
}
