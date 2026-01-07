/**
 * Individual Conversation API Route
 * 
 * Handles operations on specific conversations
 */

import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { 
  getConversationState, 
  deleteConversation,
  formatConversationForExport 
} from '@/lib/services/conversation-state'

// =============================================================================
// GET - Get conversation details
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { id: conversationId } = await params
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') // 'json' or 'text'
    const maxMessages = parseInt(searchParams.get('maxMessages') || '100')
    const maxTokens = parseInt(searchParams.get('maxTokens') || '8000')

    // Get conversation state
    const conversation = await getConversationState(conversationId, {
      maxMessages,
      maxTokens,
      includeMetadata: true
    })

    if (!conversation) {
      return new Response('Conversation not found', { status: 404 })
    }

    // Verify ownership
    if (conversation.userId !== user.id) {
      return new Response('Forbidden', { status: 403 })
    }

    // Return in requested format
    if (format === 'text') {
      const textExport = formatConversationForExport(conversation)
      return new Response(textExport, {
        headers: {
          'Content-Type': 'text/plain',
          'Content-Disposition': `attachment; filename="conversation-${conversationId}.txt"`
        }
      })
    }

    return Response.json(conversation)

  } catch (error) {
    console.error('Conversation GET API error:', error)
    return new Response(
      error instanceof Error ? error.message : 'Internal server error',
      { status: 500 }
    )
  }
}

// =============================================================================
// DELETE - Delete specific conversation
// =============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { id: conversationId } = await params

    // Verify conversation exists and belongs to user
    const conversation = await getConversationState(conversationId)
    if (!conversation) {
      return new Response('Conversation not found', { status: 404 })
    }

    if (conversation.userId !== user.id) {
      return new Response('Forbidden', { status: 403 })
    }

    // Delete conversation
    const success = await deleteConversation(conversationId, user.id)

    if (!success) {
      return new Response('Failed to delete conversation', { status: 500 })
    }

    return Response.json({
      message: 'Conversation deleted successfully',
      conversationId
    })

  } catch (error) {
    console.error('Conversation DELETE API error:', error)
    return new Response(
      error instanceof Error ? error.message : 'Internal server error',
      { status: 500 }
    )
  }
}