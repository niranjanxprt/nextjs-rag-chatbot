/**
 * Prompts API Route with Convex Backend
 */

import { NextRequest, NextResponse } from 'next/server'
import { extractSessionToken, getAuthenticatedConvexClient } from '@/lib/convex/client'
import { api } from '../../../../convex/_generated/api'
import { z } from 'zod'

// Validation schemas
const createPromptSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  category: z.string().optional(),
  is_public: z.boolean().default(false),
})

// GET /api/prompts - List prompts
export async function GET(request: NextRequest) {
  try {
    // Extract session token
    const token = extractSessionToken(request)
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get authenticated Convex client
    const convex = getAuthenticatedConvexClient(token)

    // Get prompts from Convex
    const prompts = await convex.query(api.queries.prompts.list)

    return NextResponse.json({ prompts })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/prompts - Create new prompt
export async function POST(request: NextRequest) {
  try {
    // Extract session token
    const token = extractSessionToken(request)
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get authenticated Convex client
    const convex = getAuthenticatedConvexClient(token)

    // Parse and validate request body
    const body = await request.json()
    const validatedData = createPromptSchema.parse(body)

    // Create prompt via Convex mutation
    const promptId = await convex.mutation(api.mutations.prompts.create, {
      title: validatedData.title,
      content: validatedData.content,
      category: validatedData.category,
      is_public: validatedData.is_public,
    })

    // Get created prompt
    const prompt = await convex.query(api.queries.prompts.get, { id: promptId })

    return NextResponse.json(prompt, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
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
