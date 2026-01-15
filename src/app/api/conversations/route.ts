/**
 * Conversations API Route
 * 
 * Handles CRUD operations for conversations with proper authentication,
 * validation, and error handling.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Validation schemas
const createConversationSchema = z.object({
  title: z.string().min(1).max(200),
  project_id: z.string().uuid().optional(),
  is_shared: z.boolean().default(false),
  metadata: z.record(z.any()).optional(),
})

const updateConversationSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  is_shared: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
})

// GET /api/conversations - List user's conversations
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('project_id')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const search = searchParams.get('search')

    // Build query
    let query = supabase
      .from('conversations')
      .select(`
        id,
        title,
        project_id,
        is_shared,
        share_token,
        metadata,
        created_at,
        updated_at,
        projects:project_id (
          id,
          name
        )
      `)
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (projectId) {
      query = query.eq('project_id', projectId)
    }

    if (search) {
      query = query.ilike('title', `%${search}%`)
    }

    const { data: conversations, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch conversations' },
        { status: 500 }
      )
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (projectId) {
      countQuery = countQuery.eq('project_id', projectId)
    }

    if (search) {
      countQuery = countQuery.ilike('title', `%${search}%`)
    }

    const { count } = await countQuery

    return NextResponse.json({
      conversations,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
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
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = createConversationSchema.parse(body)

    // Verify project access if project_id is provided
    if (validatedData.project_id) {
      const { data: projectMember } = await supabase
        .from('project_members')
        .select('role')
        .eq('project_id', validatedData.project_id)
        .eq('user_id', user.id)
        .single()

      if (!projectMember) {
        return NextResponse.json(
          { error: 'Access denied to project' },
          { status: 403 }
        )
      }
    }

    // Generate share token if conversation is shared
    const shareToken = validatedData.is_shared 
      ? `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      : null

    // Create conversation
    const { data: conversation, error } = await supabase
      .from('conversations')
      .insert({
        user_id: user.id,
        title: validatedData.title,
        project_id: validatedData.project_id || null,
        is_shared: validatedData.is_shared,
        share_token: shareToken,
        metadata: validatedData.metadata || {},
      })
      .select(`
        id,
        title,
        project_id,
        is_shared,
        share_token,
        metadata,
        created_at,
        updated_at,
        projects:project_id (
          id,
          name
        )
      `)
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to create conversation' },
        { status: 500 }
      )
    }

    // Log activity
    await supabase.rpc('log_activity', {
      p_user_id: user.id,
      p_project_id: validatedData.project_id || null,
      p_action: 'created',
      p_resource_type: 'conversation',
      p_resource_id: conversation.id,
      p_metadata: { title: conversation.title }
    })

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

// PUT /api/conversations - Bulk update conversations
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { conversation_ids, updates } = body

    if (!Array.isArray(conversation_ids) || conversation_ids.length === 0) {
      return NextResponse.json(
        { error: 'conversation_ids must be a non-empty array' },
        { status: 400 }
      )
    }

    // Validate updates
    const validatedUpdates = updateConversationSchema.parse(updates)

    // Update conversations
    const { data: conversations, error } = await supabase
      .from('conversations')
      .update({
        ...validatedUpdates,
        updated_at: new Date().toISOString(),
      })
      .in('id', conversation_ids)
      .eq('user_id', user.id) // Ensure user owns the conversations
      .select()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to update conversations' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      updated: conversations.length,
      conversations
    })

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

// DELETE /api/conversations - Bulk delete conversations
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { conversation_ids } = body

    if (!Array.isArray(conversation_ids) || conversation_ids.length === 0) {
      return NextResponse.json(
        { error: 'conversation_ids must be a non-empty array' },
        { status: 400 }
      )
    }

    // Delete conversations (cascade will handle messages)
    const { error } = await supabase
      .from('conversations')
      .delete()
      .in('id', conversation_ids)
      .eq('user_id', user.id) // Ensure user owns the conversations

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to delete conversations' },
        { status: 500 }
      )
    }

    // Log activity
    for (const conversationId of conversation_ids) {
      await supabase.rpc('log_activity', {
        p_user_id: user.id,
        p_project_id: null,
        p_action: 'deleted',
        p_resource_type: 'conversation',
        p_resource_id: conversationId
      })
    }

    return NextResponse.json({
      deleted: conversation_ids.length,
      message: 'Conversations deleted successfully'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}