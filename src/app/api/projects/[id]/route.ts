/**
 * Individual Project API Route
 * 
 * Handles CRUD operations for individual projects with proper
 * access control and member management.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Validation schemas
const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  is_public: z.boolean().optional(),
  allow_member_invite: z.boolean().optional(),
  max_members: z.number().int().min(1).max(100).optional(),
})

// Helper function to check project access
async function checkProjectAccess(
  supabase: any,
  projectId: string,
  userId: string,
  requiredRole?: string[]
) {
  // Check if user is project member
  const { data: member, error } = await supabase
    .from('project_members')
    .select('role, permissions')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    throw new Error('Failed to check project access')
  }

  if (!member) {
    // Check if project is public
    const { data: project } = await supabase
      .from('projects')
      .select('is_public')
      .eq('id', projectId)
      .single()

    if (project?.is_public) {
      return { role: 'viewer', permissions: { read: true, write: false, admin: false } }
    }

    return null
  }

  // Check role requirements
  if (requiredRole && !requiredRole.includes(member.role)) {
    return null
  }

  return member
}

// GET /api/projects/[id] - Get single project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check project access
    const access = await checkProjectAccess(supabase, projectId, user.id)
    if (!access) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      )
    }

    // Get project details
    const { data: project, error } = await supabase
      .from('projects')
      .select(`
        id,
        name,
        description,
        user_id,
        is_public,
        allow_member_invite,
        max_members,
        created_at,
        updated_at
      `)
      .eq('id', projectId)
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch project' },
        { status: 500 }
      )
    }

    // Get project stats
    const [
      { count: memberCount },
      { count: documentCount },
      { count: conversationCount }
    ] = await Promise.all([
      supabase
        .from('project_members')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId),
      supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId),
      supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId)
    ])

    const projectWithStats = {
      ...project,
      _count: {
        members: memberCount || 0,
        documents: documentCount || 0,
        conversations: conversationCount || 0,
      },
      _user_role: access.role,
      _user_permissions: access.permissions,
    }

    return NextResponse.json(projectWithStats)

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/projects/[id] - Update project
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check project access (admin or owner required)
    const access = await checkProjectAccess(supabase, projectId, user.id, ['owner', 'admin'])
    if (!access) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = updateProjectSchema.parse(body)

    // Update project
    const { data: project, error } = await supabase
      .from('projects')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to update project' },
        { status: 500 }
      )
    }

    // Log activity
    await supabase.rpc('log_activity', {
      p_user_id: user.id,
      p_project_id: projectId,
      p_action: 'updated',
      p_resource_type: 'project',
      p_resource_id: projectId,
      p_metadata: { name: project.name }
    })

    return NextResponse.json(project)

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

// DELETE /api/projects/[id] - Delete project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check project access (owner only)
    const access = await checkProjectAccess(supabase, projectId, user.id, ['owner'])
    if (!access) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Get project name for logging
    const { data: project } = await supabase
      .from('projects')
      .select('name')
      .eq('id', projectId)
      .single()

    // Delete project (cascade will handle related records)
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to delete project' },
        { status: 500 }
      )
    }

    // Log activity
    await supabase.rpc('log_activity', {
      p_user_id: user.id,
      p_project_id: null,
      p_action: 'deleted',
      p_resource_type: 'project',
      p_resource_id: projectId,
      p_metadata: { name: project?.name }
    })

    return NextResponse.json({
      message: 'Project deleted successfully'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}