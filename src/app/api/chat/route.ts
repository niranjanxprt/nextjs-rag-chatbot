/**
 * Chat API Route with Convex Backend
 */

import { NextRequest, NextResponse } from 'next/server'
import { extractSessionToken, getAuthenticatedConvexClient } from '@/lib/convex/client'
import { api } from '../../../../convex/_generated/api'
import { Id } from '../../../../convex/_generated/dataModel'

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

    const body = await request.json()
    const { message, conversationId } = body

    if (!message || !conversationId) {
      return NextResponse.json(
        { error: 'Message and conversationId are required' },
        { status: 400 }
      )
    }

    // Add user message to conversation
    await convex.mutation(api.mutations.conversations.addMessage, {
      conversation_id: conversationId as Id<"conversations">,
      role: "user",
      content: message,
    })

    // Simple AI response for now (can be enhanced with OpenAI later)
    const aiResponse = `You said: "${message}". This is a Convex-powered chat response.`

    // Add AI response to conversation
    await convex.mutation(api.mutations.conversations.addMessage, {
      conversation_id: conversationId as Id<"conversations">,
      role: "assistant",
      content: aiResponse,
    })

    return NextResponse.json({
      message: aiResponse,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    )
  }
}