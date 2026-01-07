/**
 * Conversations API Route
 * 
 * Handles conversation management operations
 */

import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { 
  getUserConversations, 
  getConversationState, 
  deleteConversation,
  getConversationStats 
} from '@/lib/services/conversation-state'

// =============================================================================
// GET - List user conversations
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const includeStats = searchParams.get('includeStats') === 'true'

    // Get user conversations
    const conversations = await getUserConversations(user.id, limit, offset)

    // Get stats if requested
    let stats = undefined
    if (includeStats) {
      stats = await getConversationStats(user.id)
    }

    return Response.json({
      conversations,
      stats,
      pagination: {
        limit,
        offset,
        total: conversations.length
      }
    })

  } catch (error) {
    console.error('Conversations API error:', error)
    return new Response(
      error instanceof Error ? error.message : 'Internal server error',
      { status: 500 }
    )
  }
}

// =============================================================================
// DELETE - Delete all user conversations
// =============================================================================

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return new Response('Unauthorized', { status: 401 })
    }

    // Get all user conversations
    const conversations = await getUserConversations(user.id, 1000) // Get all
    
    // Delete each conversation
    let deletedCount = 0
    for (const conversation of conversations) {
      const success = await deleteConversation(conversation.id, user.id)
      if (success) {
        deletedCount++
      }
    }

    return Response.json({
      message: `Deleted ${deletedCount} conversations`,
      deletedCount
    })

  } catch (error) {
    console.error('Conversations delete API error:', error)
    return new Response(
      error instanceof Error ? error.message : 'Internal server error',
      { status: 500 }
    )
  }
}