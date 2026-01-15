/**
 * Search API Route
 * 
 * Handles semantic search across documents with proper
 * access control and result ranking.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Validation schemas
const searchSchema = z.object({
  query: z.string().min(1).max(500),
  project_id: z.string().uuid().optional(),
  document_ids: z.array(z.string().uuid()).optional(),
  limit: z.number().int().min(1).max(50).default(10),
  threshold: z.number().min(0).max(1).default(0.7),
  include_metadata: z.boolean().default(true),
})

// GET /api/search - Semantic search
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    const queryData = {
      query: searchParams.get('query'),
      project_id: searchParams.get('project_id') || undefined,
      document_ids: searchParams.get('document_ids')?.split(',') || undefined,
      limit: parseInt(searchParams.get('limit') || '10'),
      threshold: parseFloat(searchParams.get('threshold') || '0.7'),
      include_metadata: searchParams.get('include_metadata') !== 'false',
    }

    const validatedData = searchSchema.parse(queryData)

    // Get user's accessible documents
    let documentQuery = supabase
      .from('documents')
      .select('id, filename, project_id')
      .eq('user_id', user.id)
      .eq('status', 'completed')

    // Filter by project if specified
    if (validatedData.project_id) {
      // Check if user has access to the project
      const { data: projectAccess } = await supabase
        .from('project_members')
        .select('role')
        .eq('project_id', validatedData.project_id)
        .eq('user_id', user.id)
        .single()

      if (!projectAccess) {
        // Check if project is public
        const { data: project } = await supabase
          .from('projects')
          .select('is_public')
          .eq('id', validatedData.project_id)
          .single()

        if (!project?.is_public) {
          return NextResponse.json(
            { error: 'Access denied to project' },
            { status: 403 }
          )
        }
      }

      documentQuery = documentQuery.eq('project_id', validatedData.project_id)
    }

    // Filter by specific documents if specified
    if (validatedData.document_ids) {
      documentQuery = documentQuery.in('id', validatedData.document_ids)
    }

    const { data: accessibleDocuments, error: docError } = await documentQuery

    if (docError) {
      console.error('Database error:', docError)
      return NextResponse.json(
        { error: 'Failed to fetch accessible documents' },
        { status: 500 }
      )
    }

    if (!accessibleDocuments || accessibleDocuments.length === 0) {
      return NextResponse.json({
        results: [],
        total: 0,
        query: validatedData.query,
        search_metadata: {
          documents_searched: 0,
          threshold: validatedData.threshold,
          limit: validatedData.limit,
        }
      })
    }

    const documentIds = accessibleDocuments.map((doc: any) => doc.id)

    // TODO: Implement actual vector search
    // This is a placeholder implementation
    // In a real implementation, you would:
    // 1. Generate embeddings for the query using OpenAI
    // 2. Perform vector similarity search against stored embeddings
    // 3. Return ranked results based on similarity scores

    // For now, return a mock response structure
    const mockResults = [
      {
        document_id: documentIds[0] || 'mock-doc-1',
        chunk_id: 'chunk-1',
        content: `This is a mock search result for query: "${validatedData.query}". In a real implementation, this would be actual content from your documents that matches the semantic meaning of your search query.`,
        similarity: 0.85,
        metadata: validatedData.include_metadata ? {
          document_name: accessibleDocuments[0]?.filename || 'Mock Document',
          chunk_index: 0,
          page_number: 1,
          word_count: 50,
        } : undefined,
      }
    ]

    // Simulate search delay
    await new Promise(resolve => setTimeout(resolve, 100))

    return NextResponse.json({
      results: mockResults,
      total: mockResults.length,
      query: validatedData.query,
      search_metadata: {
        documents_searched: accessibleDocuments.length,
        threshold: validatedData.threshold,
        limit: validatedData.limit,
        processing_time_ms: 100,
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid search parameters', details: error.errors },
        { status: 400 }
      )
    }

    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/search - Advanced search with body parameters
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = searchSchema.parse(body)

    // Log search query for analytics
    await supabase.rpc('log_activity', {
      p_user_id: user.id,
      p_project_id: validatedData.project_id || null,
      p_action: 'searched',
      p_resource_type: 'search',
      p_resource_id: null,
      p_metadata: { 
        query: validatedData.query,
        limit: validatedData.limit,
        threshold: validatedData.threshold
      }
    })

    // Use the same logic as GET but with body parameters
    // This allows for more complex search parameters
    return GET(request)

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid search parameters', details: error.errors },
        { status: 400 }
      )
    }

    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}