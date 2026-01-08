/**
 * Vector Search API Route
 *
 * Handles document search requests with vector similarity
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { searchDocuments, hybridSearch } from '@/lib/services/vector-search'
import { vectorSearchSchema } from '@/lib/schemas/validation'

// =============================================================================
// POST - Perform vector search
// =============================================================================

export async function POST(request: NextRequest) {
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

    // Parse request body
    const body = await request.json()

    // Validate search parameters
    const validatedParams = vectorSearchSchema.parse({
      ...body,
      userId: user.id,
    })

    // Determine search type
    const searchType = body.searchType || 'semantic'

    let searchResults

    if (searchType === 'hybrid') {
      // Perform hybrid search (semantic + keyword)
      searchResults = await hybridSearch(validatedParams.query, {
        userId: validatedParams.userId,
        topK: validatedParams.topK,
        threshold: validatedParams.threshold,
        includeMetadata: validatedParams.includeMetadata,
        useCache: true,
        rerankResults: true,
        keywordWeight: body.keywordWeight || 0.3,
        semanticWeight: body.semanticWeight || 0.7,
        recencyWeight: body.recencyWeight || 0.1,
      })
    } else {
      // Perform semantic search
      searchResults = await searchDocuments(validatedParams.query, {
        userId: validatedParams.userId,
        topK: validatedParams.topK,
        threshold: validatedParams.threshold,
        includeMetadata: validatedParams.includeMetadata,
        useCache: true,
        rerankResults: true,
        documentIds: body.documentIds,
      })
    }

    return NextResponse.json({
      success: true,
      data: searchResults,
      meta: {
        searchType,
        cached: searchResults.cached,
        searchTime: searchResults.searchTime,
      },
    })
  } catch (error) {
    console.error('Search API error:', error)

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'Invalid search parameters',
          details: error.message,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Search failed',
      },
      { status: 500 }
    )
  }
}

// =============================================================================
// GET - Get search suggestions or recent searches
// =============================================================================

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'suggestions'

    if (type === 'suggestions') {
      // Return search suggestions based on user's documents
      // This is a placeholder - in production, you might want to implement
      // more sophisticated suggestion logic

      return NextResponse.json({
        success: true,
        data: {
          suggestions: [
            'What is the main topic?',
            'Summarize the key points',
            'What are the conclusions?',
            'Explain the methodology',
            'What are the recommendations?',
          ],
        },
      })
    }

    if (type === 'recent') {
      // Return recent searches
      // This would require storing search history in the database

      return NextResponse.json({
        success: true,
        data: {
          recentSearches: [],
        },
      })
    }

    return NextResponse.json(
      { error: 'Bad Request', message: 'Invalid type parameter' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Search suggestions API error:', error)

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to get suggestions',
      },
      { status: 500 }
    )
  }
}
