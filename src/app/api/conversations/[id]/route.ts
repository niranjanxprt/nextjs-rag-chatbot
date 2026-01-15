/**
 * Individual Conversation API Route
 * 
 * Handles CRUD operations for individual conversations.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Validation schemas
const updateConversationSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  is_shared: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
})

// GET /api/conversations/[id] - Get single conversation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get conversation with project info
    const { data: conversation, error } = await supabase
      .from('conversations')
      .select(`
        id,
        title,
        user_id,
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
      .eq('id', conversationId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Conversation not found' },
          { status: 404 }
        )
      }
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch conversation' },
        { status: 500 }
      )
    }

    // Check access permissions
    const hasAccess = conversation.user_id === user.id || 
      (conversation.is_shared && conversation.share_token)

    if (!hasAccess) {
      // Check if user has project access
      if (conversation.project_id) {
        const { data: projectMember } = await supabase
          .from('project_members')
          .select('role')
          .eq('project_id', conversation.project_id)
          .eq('user_id', user.id)
          .single()

        if (!projectMember) {
          return NextResponse.json(
            { error: 'Access denied' },
            { status: 403 }
          )
        }
      } else {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        )
      }
    }

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
    const validatedData = updateConversationSchema.parse(body)

    // Check if conversation exists and user has access
    const { data: existingConversation, error: fetchError } = await supabase
      .from('conversations')
      .select('user_id, project_id')
      .eq('id', conversationId)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Conversation not found' },
          { status: 404 }
        )
      }
      console.error('Database error:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch conversation' },
        { status: 500 }
      )
    }

    // Check ownership or project access
    let hasAccess = existingConversation.user_id === user.id

    if (!hasAccess && existingConversation.project_id) {
      const { data: projectMember } = await supabase
        .from('project_members')
        .select('role')
        .eq('project_id', existingConversation.project_id)
        .eq('user_id', user.id)
        .single()

      hasAccess = !!projectMember && ['owner', 'admin', 'member'].includes(projectMember.role)
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Generate new share token if sharing is being enabled
    const updates: any = {
      ...validatedData,
      updated_at: new Date().toISOString(),
    }

    if (validatedData.is_shared === true && !existingConversation.share_token) {
      updates.share_token = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    } else if (validatedData.is_shared === false) {
      updates.share_token = null
    }

    // Update conversation
    const { data: conversation, error } = await supabase
      .from('conversations')
      .update(updates)
      .eq('id', conversationId)
      .select(`
        id,
        title,
        user_id,
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
        { error: 'Failed to update conversation' },
        { status: 500 }
      )
    }

    // Log activity
    await supabase.rpc('log_activity', {
      p_user_id: user.id,
      p_project_id: existingConversation.project_id || null,
      p_action: 'updated',
      p_resource_type: 'conversation',
      p_resource_id: conversationId,
      p_metadata: { title: conversation.title }
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
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if conversation exists and user has access
    const { data: existingConversation, error: fetchError } = await supabase
      .from('conversations')
      .select('user_id, project_id, title')
      .eq('id', conversationId)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Conversation not found' },
          { status: 404 }
        )
      }
      console.error('Database error:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch conversation' },
        { status: 500 }
      )
    }

    // Check ownership or project admin access
    let hasAccess = existingConversation.user_id === user.id

    if (!hasAccess && existingConversation.project_id) {
      const { data: projectMember } = await supabase
        .from('project_members')
        .select('role')
        .eq('project_id', existingConversation.project_id)
        .eq('user_id', user.id)
        .single()

      hasAccess = !!projectMember && ['owner', 'admin'].includes(projectMember.role)
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Delete conversation (cascade will handle messages)
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to delete conversation' },
        { status: 500 }
      )
    }

    // Log activity
    await supabase.rpc('log_activity', {
      p_user_id: user.id,
      p_project_id: existingConversation.project_id || null,
      p_action: 'deleted',
      p_resource_type: 'conversation',
      p_resource_id: conversationId,
      p_metadata: { title: existingConversation.title }
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