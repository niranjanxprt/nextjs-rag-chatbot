/**
 * Dynamic Prompt API Routes
 *
 * Handles operations for a specific prompt
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPrompt, updatePrompt, deletePrompt } from '@/lib/database/queries'
import { createError, createErrorResponse, withErrorHandling } from '@/lib/utils/error-handler'
import type { PromptUpdate } from '@/lib/types/database'

// =============================================================================
// GET /api/prompts/[id] - Get a specific prompt
// =============================================================================

export const GET = withErrorHandling(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
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

      const promptId = params.id

      // Get prompt
      const prompt = await getPrompt(promptId, user.id)

      if (!prompt) {
        throw createError.notFound('Prompt not found')
      }

      return NextResponse.json(
        {
          prompt,
          success: true,
        },
        { status: 200 }
      )
    } catch (error) {
      console.error('GET /api/prompts/[id] error:', error)
      return createErrorResponse(error instanceof Error ? error : new Error(String(error)))
    }
  }
)

// =============================================================================
// PATCH /api/prompts/[id] - Update a prompt
// =============================================================================

export const PATCH = withErrorHandling(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
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

      const promptId = params.id

      // Parse request body
      let body
      try {
        body = await request.json()
      } catch (error) {
        throw createError.validation('Invalid JSON in request body')
      }

      const { name, content, description, variables, category, is_favorite } = body

      // Build update object - only include provided fields
      const updates: PromptUpdate = {}
      if (name !== undefined) updates.name = name
      if (content !== undefined) updates.content = content
      if (description !== undefined) updates.description = description
      if (variables !== undefined) updates.variables = variables
      if (category !== undefined) updates.category = category
      if (is_favorite !== undefined) updates.is_favorite = is_favorite

      // Validate at least one field is provided
      if (Object.keys(updates).length === 0) {
        throw createError.validation('At least one field must be provided for update')
      }

      // Update prompt
      const prompt = await updatePrompt(promptId, user.id, updates)

      return NextResponse.json(
        {
          prompt,
          success: true,
        },
        { status: 200 }
      )
    } catch (error) {
      console.error('PATCH /api/prompts/[id] error:', error)
      return createErrorResponse(error instanceof Error ? error : new Error(String(error)))
    }
  }
)

// =============================================================================
// DELETE /api/prompts/[id] - Delete a prompt
// =============================================================================

export const DELETE = withErrorHandling(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
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

      const promptId = params.id

      // Verify prompt exists and belongs to user
      const prompt = await getPrompt(promptId, user.id)
      if (!prompt) {
        throw createError.notFound('Prompt not found')
      }

      // Delete prompt
      await deletePrompt(promptId, user.id)

      return NextResponse.json(
        {
          success: true,
          message: 'Prompt deleted successfully',
        },
        { status: 200 }
      )
    } catch (error) {
      console.error('DELETE /api/prompts/[id] error:', error)
      return createErrorResponse(error instanceof Error ? error : new Error(String(error)))
    }
  }
)

// =============================================================================
// POST /api/prompts/[id]/use - Increment usage counter
// =============================================================================

export const POST = withErrorHandling(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      // Check if this is a /use endpoint
      const url = new URL(request.url)
      if (!url.pathname.endsWith('/use')) {
        return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
      }

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

      const promptId = params.id

      // Get prompt
      const prompt = await getPrompt(promptId, user.id)
      if (!prompt) {
        throw createError.notFound('Prompt not found')
      }

      // Increment usage counter
      const updated = await updatePrompt(promptId, user.id, {
        usage_count: (prompt.usage_count || 0) + 1,
      })

      return NextResponse.json(
        {
          prompt: updated,
          success: true,
        },
        { status: 200 }
      )
    } catch (error) {
      console.error('POST /api/prompts/[id]/use error:', error)
      return createErrorResponse(error instanceof Error ? error : new Error(String(error)))
    }
  }
)
