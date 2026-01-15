/**
 * Conversations API Route
 * 
 * Handles CRUD operations for conversations with Convex backend.
 */

import { NextRequest, NextResponse } from 'next/server'
import { extractSessionToken, getAuthenticatedConvexClient } from '@/lib/convex/client'
import { api } from '../../../../convex/_generated/api'
import { z } from 'zod'

// Validation schemas
const createConversationSchema = z.object({
  title: z.string().min(1).max(200),
})

// GET /api/conversations - List user's conversations
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

    // Get conversations from Convex
    const conversations = await convex.query(api.queries.conversations.list)

    return NextResponse.json({
      conversations,
      pagination: {
        total: conversations.length,
        limit: 50,
        offset: 0,
        hasMore: false
      }
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/conversations - Create new conversation
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
    const validatedData = createConversationSchema.parse(body)

    // Create conversation via Convex mutation
    const conversationId = await convex.mutation(api.mutations.conversations.create, {
      title: validatedData.title,
    })

    // Get created conversation
    const conversation = await convex.query(api.queries.conversations.get, { id: conversationId })

    return NextResponse.json(conversation, { status: 201 })

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
