/**
 * Individual Project Member API Route
 * 
 * Handles individual member operations including role updates
 * and member removal.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Validation schemas
const updateMemberSchema = z.object({
  role: z.enum(['admin', 'member', 'viewer']).optional(),
  permissions: z.object({
    read: z.boolean(),
    write: z.boolean(),
    admin: z.boolean(),
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

// PUT /api/projects/[id]/members/[memberId] - Update member role/permissions
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const { id: projectId, memberId } = await params
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
    const validatedData = updateMemberSchema.parse(body)

    // Get the member being updated
    const { data: targetMember, error: memberError } = await supabase
      .from('project_members')
      .select('user_id, role')
      .eq('id', memberId)
      .eq('project_id', projectId)
      .single()

    if (memberError || !targetMember) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      )
    }

    // Prevent non-owners from modifying owners
    if (targetMember.role === 'owner' && access.role !== 'owner') {
      return NextResponse.json(
        { error: 'Cannot modify project owner' },
        { status: 403 }
      )
    }

    // Prevent users from modifying themselves (except permissions)
    if (targetMember.user_id === user.id && validatedData.role) {
      return NextResponse.json(
        { error: 'Cannot change your own role' },
        { status: 403 }
      )
    }

    // Set default permissions based on role if role is being changed
    let permissions = validatedData.permissions
    if (validatedData.role && !permissions) {
      const defaultPermissions = {
        admin: { read: true, write: true, admin: true },
        member: { read: true, write: true, admin: false },
        viewer: { read: true, write: false, admin: false },
      }
      permissions = defaultPermissions[validatedData.role]
    }

    // Update member
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (validatedData.role) {
      updateData.role = validatedData.role
    }

    if (permissions) {
      updateData.permissions = permissions
    }

    const { data: updatedMember, error } = await supabase
      .from('project_members')
      .update(updateData)
      .eq('id', memberId)
      .eq('project_id', projectId)
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
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to update member' },
        { status: 500 }
      )
    }

    // Log activity
    await supabase.rpc('log_activity', {
      p_user_id: user.id,
      p_project_id: projectId,
      p_action: 'updated',
      p_resource_type: 'member',
      p_resource_id: memberId,
      p_metadata: { 
        role: updatedMember.role,
        target_user: updatedMember.profiles?.email
      }
    })

    return NextResponse.json(updatedMember)

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

// DELETE /api/projects/[id]/members/[memberId] - Remove member from project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const { id: projectId, memberId } = await params
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get the member being removed
    const { data: targetMember, error: memberError } = await supabase
      .from('project_members')
      .select('user_id, role, profiles:user_id(email)')
      .eq('id', memberId)
      .eq('project_id', projectId)
      .single()

    if (memberError || !targetMember) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      )
    }

    // Check if user can remove this member
    const access = await checkProjectAccess(supabase, projectId, user.id)
    if (!access) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Users can remove themselves (leave project)
    const isSelfRemoval = targetMember.user_id === user.id

    // Non-self removal requires admin/owner permissions
    if (!isSelfRemoval) {
      if (!['owner', 'admin'].includes(access.role)) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        )
      }

      // Prevent non-owners from removing owners
      if (targetMember.role === 'owner' && access.role !== 'owner') {
        return NextResponse.json(
          { error: 'Cannot remove project owner' },
          { status: 403 }
        )
      }
    }

    // Prevent removing the last owner
    if (targetMember.role === 'owner') {
      const { count: ownerCount } = await supabase
        .from('project_members')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId)
        .eq('role', 'owner')

      if (ownerCount && ownerCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot remove the last project owner' },
          { status: 400 }
        )
      }
    }

    // Remove member
    const { error } = await supabase
      .from('project_members')
      .delete()
      .eq('id', memberId)
      .eq('project_id', projectId)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to remove member' },
        { status: 500 }
      )
    }

    // Log activity
    await supabase.rpc('log_activity', {
      p_user_id: user.id,
      p_project_id: projectId,
      p_action: isSelfRemoval ? 'left' : 'removed',
      p_resource_type: 'member',
      p_resource_id: memberId,
      p_metadata: { 
        target_user: targetMember.profiles?.email,
        role: targetMember.role
      }
    })

    return NextResponse.json({
      message: isSelfRemoval ? 'Left project successfully' : 'Member removed successfully'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}