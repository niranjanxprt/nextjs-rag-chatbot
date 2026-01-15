/**
 * Preferences API Route with Convex Backend
 */

import { NextRequest, NextResponse } from 'next/server'
import { extractSessionToken, getAuthenticatedConvexClient } from '@/lib/convex/client'
import { api } from '../../../../convex/_generated/api'
import { z } from 'zod'

// Validation schemas
const updatePreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  language: z.string().optional(),
  notifications_enabled: z.boolean().optional(),
})

// GET /api/preferences - Get user preferences
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

    // Get preferences from Convex
    const preferences = await convex.query(api.queries.preferences.get)

    return NextResponse.json(preferences)

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/preferences - Update user preferences
export async function PUT(request: NextRequest) {
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
    const validatedData = updatePreferencesSchema.parse(body)

    // Update preferences via Convex mutation
    await convex.mutation(api.mutations.preferences.update, validatedData)

    // Get updated preferences
    const preferences = await convex.query(api.queries.preferences.get)

    return NextResponse.json(preferences)

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
