/**
 * Chat API Route with RAG Capabilities
 */

import { NextRequest, NextResponse } from 'next/server'
import { extractSessionToken, getAuthenticatedConvexClient, getConvexClient } from '@/lib/convex/client'
import { api } from '../../../../convex/_generated/api'
import { Id } from '../../../../convex/_generated/dataModel'
import { processMessage } from '@/lib/services/chat-engine'
import { loadHistory } from '@/lib/services/conversation-manager'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, conversationId, ragEnabled = false, projectId } = body

    if (!message || !conversationId) {
      return NextResponse.json(
        { error: 'Message and conversationId are required' },
        { status: 400 }
      )
    }

    // Extract session token (optional for testing)
    const token = extractSessionToken(request)
    
    // Get user ID from session (placeholder - implement proper auth)
    const userId = 'user-id-placeholder' // TODO: Get from authenticated session

    // Only save to Convex if we have a valid session token
    if (token) {
      try {
        const convex = getAuthenticatedConvexClient(token)
        
        // Add user message to conversation
        await convex.mutation(api.mutations.conversations.addMessage, {
          conversation_id: conversationId as Id<"conversations">,
          role: "user",
          content: message,
        })
      } catch (error) {
        console.warn('Failed to save message to Convex (testing mode):', error)
      }
    }

    // Load conversation history (skip if no token)
    const history = token ? await loadHistory(conversationId, 10) : []

    // Process message with RAG pipeline
    const result = await processMessage(
      message,
      {
        user_id: userId,
        project_id: projectId,
        conversation_id: conversationId,
      },
      {
        ragEnabled,
        maxContextTokens: 3000,
        temperature: 0.7,
      },
      history
    )

    // Stream the response
    const reader = result.stream.getReader()
    const encoder = new TextEncoder()
    let fullResponse = ''

    const stream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read()
            
            if (done) {
              // Save assistant response to conversation (if authenticated)
              if (token) {
                try {
                  const convex = getAuthenticatedConvexClient(token)
                  await convex.mutation(api.mutations.conversations.addMessage, {
                    conversation_id: conversationId as Id<"conversations">,
                    role: "assistant",
                    content: fullResponse,
                    sources: result.sources,
                  })
                } catch (error) {
                  console.warn('Failed to save response to Convex (testing mode):', error)
                }
              }
              
              controller.close()
              break
            }
            
            // value is already a string from textStream
            fullResponse += value
            
            // Forward to client
            controller.enqueue(encoder.encode(value))
          }
        } catch (error) {
          console.error('Streaming error:', error)
          controller.error(error)
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    )
  }
}