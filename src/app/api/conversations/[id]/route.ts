/**
 * Individual Conversation API Route
 * 
 * Handles CRUD operations for individual conversations with Convex backend.
 */

import { NextRequest, NextResponse } from 'next/server'
import { extractSessionToken, getAuthenticatedConvexClient } from '@/lib/convex/client'
import { api } from '../../../../../convex/_generated/api'
import { Id } from '../../../../../convex/_generated/dataModel'
import { z } from 'zod'

// Validation schemas
const updateConversationSchema = z.object({
  title: z.string().min(1).max(200),
})

// GET /api/conversations/[id] - Get single conversation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params
    
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

    // Get conversation from Convex
    const conversation = await convex.query(api.queries.conversations.get, { 
      id: conversationId as Id<"conversations"> 
    })

    return NextResponse.json(conversation)

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/conversations/[id] - Update conversation
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params
    
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
    const validatedData = updateConversationSchema.parse(body)

    // Update conversation via Convex mutation
    await convex.mutation(api.mutations.conversations.update, {
      id: conversationId as Id<"conversations">,
      title: validatedData.title,
    })

    // Get updated conversation
    const conversation = await convex.query(api.queries.conversations.get, { 
      id: conversationId as Id<"conversations"> 
    })

    return NextResponse.json(conversation)

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

// DELETE /api/conversations/[id] - Delete conversation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params
    
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

    // Delete conversation via Convex mutation (cascades to messages)
    await convex.mutation(api.mutations.conversations.remove, { 
      id: conversationId as Id<"conversations"> 
    })

    return NextResponse.json({
      message: 'Conversation deleted successfully'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
