/**
 * Search Suggestions API Route
 * 
 * Provides search query suggestions based on user's documents
 * and search history.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Validation schemas
const suggestionsSchema = z.object({
  query: z.string().min(1).max(100),
  project_id: z.string().uuid().optional(),
  limit: z.number().int().min(1).max(20).default(5),
})

// GET /api/search/suggestions - Get search suggestions
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
      limit: parseInt(searchParams.get('limit') || '5'),
    }

    const validatedData = suggestionsSchema.parse(queryData)

    // Get recent search queries from activity log
    let activityQuery = supabase
      .from('activity_log')
      .select('metadata')
      .eq('user_id', user.id)
      .eq('action', 'searched')
      .eq('resource_type', 'search')
      .order('created_at', { ascending: false })
      .limit(50)

    if (validatedData.project_id) {
      activityQuery = activityQuery.eq('project_id', validatedData.project_id)
    }

    const { data: recentSearches, error: searchError } = await activityQuery

    if (searchError) {
      console.error('Database error:', searchError)
      // Continue without recent searches
    }

    // Extract search queries from activity log
    const recentQueries = recentSearches
      ?.map((activity: any) => activity.metadata?.query)
      .filter((query: any) => query && typeof query === 'string')
      .filter((query: any) => query.toLowerCase().includes(validatedData.query.toLowerCase()))
      .slice(0, validatedData.limit) || []

    // Get document titles that match the query
    let documentQuery = supabase
      .from('documents')
      .select('filename, original_filename')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .ilike('filename', `%${validatedData.query}%`)
      .limit(validatedData.limit)

    if (validatedData.project_id) {
      documentQuery = documentQuery.eq('project_id', validatedData.project_id)
    }

    const { data: matchingDocuments, error: docError } = await documentQuery

    if (docError) {
      console.error('Database error:', docError)
      // Continue without document suggestions
    }

    // Generate suggestions from document names
    const documentSuggestions = matchingDocuments
      ?.map((doc: any) => `Search in "${doc.original_filename || doc.filename}"`)
      .slice(0, validatedData.limit) || []

    // Get common search patterns (mock data for now)
    const commonPatterns = [
      'What is',
      'How to',
      'Explain',
      'Summary of',
      'Key points about',
      'Definition of',
      'Examples of',
      'Benefits of',
      'Process for',
      'Steps to',
    ].filter(pattern => 
      pattern.toLowerCase().includes(validatedData.query.toLowerCase()) ||
      validatedData.query.toLowerCase().includes(pattern.toLowerCase())
    ).map(pattern => `${pattern} ${validatedData.query}`)

    // Combine all suggestions and remove duplicates
    const allSuggestions = [
      ...recentQueries,
      ...documentSuggestions,
      ...commonPatterns.slice(0, 2), // Limit common patterns
    ]

    const uniqueSuggestions = Array.from(new Set(allSuggestions))
      .slice(0, validatedData.limit)

    // Add suggestion metadata
    const suggestionsWithMetadata = uniqueSuggestions.map((suggestion, index) => ({
      text: suggestion,
      type: recentQueries.includes(suggestion) ? 'recent' : 
            documentSuggestions.includes(suggestion) ? 'document' : 'pattern',
      score: 1 - (index * 0.1), // Simple scoring based on order
    }))

    return NextResponse.json({
      suggestions: suggestionsWithMetadata,
      query: validatedData.query,
      total: suggestionsWithMetadata.length,
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
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