/**
 * Prompts API Routes
 *
 * Handles CRUD operations for prompt templates
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createPrompt, getPrompts } from '@/lib/database/queries'
import { createError, createErrorResponse, withErrorHandling } from '@/lib/utils/error-handler'
import type { PromptInsert } from '@/lib/types/database'

// =============================================================================
// GET /api/prompts - List user's prompts with optional filtering
// =============================================================================

export const GET = withErrorHandling(async (request: NextRequest) => {
  try {
    // Check authentication
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      throw createError.unauthorized('Authentication required')
    }

    if (!user) {
      throw createError.unauthorized('Authentication required')
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || null

    // Get prompts
    const prompts = await getPrompts(user.id, category)

    return NextResponse.json(
      {
        prompts,
        count: prompts.length,
        success: true,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('GET /api/prompts error:', error)
    return createErrorResponse(error instanceof Error ? error : new Error(String(error)))
  }
})

// =============================================================================
// POST /api/prompts - Create a new prompt template
// =============================================================================

export const POST = withErrorHandling(async (request: NextRequest) => {
  try {
    // Check authentication
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      throw createError.unauthorized('Authentication required')
    }

    if (!user) {
      throw createError.unauthorized('Authentication required')
    }

    // Parse request body
    let body
    try {
      body = await request.json()
    } catch (error) {
      throw createError.validation('Invalid JSON in request body')
    }

    const { name, content, description, variables, category, is_favorite } = body

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw createError.validation('Prompt name is required')
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      throw createError.validation('Prompt content is required')
    }

    // Create prompt
    const promptData: PromptInsert = {
      user_id: user.id,
      name: name.trim(),
      content: content.trim(),
      description: description || null,
      variables: Array.isArray(variables) ? variables : [],
      category: category || null,
      is_favorite: is_favorite || false,
    }

    const prompt = await createPrompt(promptData)

    return NextResponse.json(
      {
        prompt,
        success: true,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST /api/prompts error:', error)
    return createErrorResponse(error instanceof Error ? error : new Error(String(error)))
  }
})
