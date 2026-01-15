/**
 * Project Members API Route
 * 
 * Handles project member management including invitations,
 * role updates, and member removal.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import crypto from 'crypto'

// Validation schemas
const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'member', 'viewer']),
  permissions: z.object({
    read: z.boolean().default(true),
    write: z.boolean().default(false),
    admin: z.boolean().default(false),
  }).optional(),
})

// Helper function to check project access
async function checkProjectAccess(
  supabase: any,
  projectId: string,
  userId: string,
  requiredRole?: string[]
) {
  const { data: member, error } = await supabase
    .from('project_members')
    .select('role, permissions')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    throw new Error('Failed to check project access')
  }

  if (!member) return null

  if (requiredRole && !requiredRole.includes(member.role)) {
    return null
  }

  return member
}

// GET /api/projects/[id]/members - Get project members
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
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Get project members with profile info
    const { data: members, error } = await supabase
      .from('project_members')
      .select(`
        id,
        project_id,
        user_id,
        role,
        permissions,
        invited_by,
        joined_at,
        created_at,
        updated_at,
        profiles:user_id (
          id,
          email,
          full_name,
          avatar_url,
          last_active
        )
      `)
      .eq('project_id', projectId)
      .order('joined_at', { ascending: true })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch project members' },
        { status: 500 }
      )
    }

    return NextResponse.json(members || [])

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/projects/[id]/members - Invite member to project
export async function POST(
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
    const validatedData = inviteMemberSchema.parse(body)

    // Check if project allows member invites
    const { data: project } = await supabase
      .from('projects')
      .select('allow_member_invite, max_members')
      .eq('id', projectId)
      .single()

    if (!project?.allow_member_invite) {
      return NextResponse.json(
        { error: 'Project does not allow member invitations' },
        { status: 403 }
      )
    }

    // Check member limit
    const { count: currentMemberCount } = await supabase
      .from('project_members')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId)

    if (currentMemberCount && currentMemberCount >= project.max_members) {
      return NextResponse.json(
        { error: 'Project has reached maximum member limit' },
        { status: 400 }
      )
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('project_members')
      .select('id')
      .eq('project_id', projectId)
      .eq('profiles.email', validatedData.email)
      .single()

    if (existingMember) {
      return NextResponse.json(
        { error: 'User is already a member of this project' },
        { status: 400 }
      )
    }

    // Check if there's already a pending invitation
    const { data: existingInvitation } = await supabase
      .from('project_invitations')
      .select('id')
      .eq('project_id', projectId)
      .eq('email', validatedData.email)
      .is('accepted_at', null)
      .single()

    if (existingInvitation) {
      return NextResponse.json(
        { error: 'User already has a pending invitation' },
        { status: 400 }
      )
    }

    // Set default permissions based on role
    const defaultPermissions = {
      admin: { read: true, write: true, admin: true },
      member: { read: true, write: true, admin: false },
      viewer: { read: true, write: false, admin: false },
    }

    const permissions = validatedData.permissions || defaultPermissions[validatedData.role]

    // Generate invitation token
    const token = crypto.randomBytes(32).toString('hex')

    // Create invitation
    const { data: invitation, error } = await supabase
      .from('project_invitations')
      .insert({
        project_id: projectId,
        email: validatedData.email,
        role: validatedData.role,
        permissions,
        token,
        invited_by: user.id,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      })
      .select(`
        id,
        project_id,
        email,
        role,
        permissions,
        token,
        invited_by,
        expires_at,
        created_at,
        projects:project_id (
          id,
          name
        ),
        invited_by_profile:invited_by (
          id,
          email,
          full_name
        )
      `)
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to create invitation' },
        { status: 500 }
      )
    }

    // Log activity
    await supabase.rpc('log_activity', {
      p_user_id: user.id,
      p_project_id: projectId,
      p_action: 'invited',
      p_resource_type: 'member',
      p_resource_id: invitation.id,
      p_metadata: { 
        email: validatedData.email,
        role: validatedData.role 
      }
    })

    // TODO: Send invitation email
    // This would typically integrate with an email service
    console.log(`Invitation created for ${validatedData.email} with token: ${token}`)

    return NextResponse.json(invitation, { status: 201 })

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