/**
 * Semantic Search API Route (Internal)
 * 
 * Performs semantic search using embeddings and Qdrant
 */

import { NextRequest, NextResponse } from 'next/server'
import { embedQuery } from '@/lib/services/embeddings'
import { search } from '@/lib/services/vector-search'
import { SearchFilters, SearchOptions } from '@/lib/types/rag'

// =============================================================================
// POST - Perform semantic search
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, user_id, project_id, top_k, score_threshold } = body

    // Validate input
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    if (!user_id || typeof user_id !== 'string') {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      )
    }

    // Prepare filters
    const filters: SearchFilters = {
      user_id,
      project_id: project_id || undefined,
    }

    // Prepare options
    const options: SearchOptions = {
      topK: top_k || 5,
      scoreThreshold: score_threshold || 0.7,
    }

    // Generate query embedding
    const queryVector = await embedQuery(query)

    // Perform semantic search
    const results = await search(queryVector, filters, options)

    return NextResponse.json(
      {
        success: true,
        results,
        count: results.length,
        query,
        filters,
        options,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Semantic search error:', error)

    return NextResponse.json(
      {
        error: 'Semantic search failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// =============================================================================
// OPTIONS - CORS support
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
