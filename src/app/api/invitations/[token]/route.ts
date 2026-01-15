/**
 * Individual Invitation API Route
 * 
 * Handles accepting and declining project invitations.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/invitations/[token] - Accept invitation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get invitation
    const { data: invitation, error: invitationError } = await supabase
      .from('project_invitations')
      .select(`
        id,
        project_id,
        email,
        role,
        permissions,
        invited_by,
        expires_at,
        accepted_at,
        projects:project_id (
          id,
          name,
          description,
          max_members
        )
      `)
      .eq('token', token)
      .single()

    if (invitationError || !invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      )
    }

    // Check if invitation is already accepted
    if (invitation.accepted_at) {
      return NextResponse.json(
        { error: 'Invitation already accepted' },
        { status: 400 }
      )
    }

    // Check if invitation is expired
    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Invitation has expired' },
        { status: 400 }
      )
    }

    // Check if invitation email matches user email
    if (invitation.email !== user.email) {
      return NextResponse.json(
        { error: 'Invitation email does not match your account' },
        { status: 400 }
      )
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('project_members')
      .select('id')
      .eq('project_id', invitation.project_id)
      .eq('user_id', user.id)
      .single()

    if (existingMember) {
      return NextResponse.json(
        { error: 'You are already a member of this project' },
        { status: 400 }
      )
    }

    // Check member limit
    const { count: currentMemberCount } = await supabase
      .from('project_members')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', invitation.project_id)

    if (currentMemberCount && invitation.projects?.max_members && 
        currentMemberCount >= invitation.projects.max_members) {
      return NextResponse.json(
        { error: 'Project has reached maximum member limit' },
        { status: 400 }
      )
    }

    // Add user as project member
    const { data: newMember, error: memberError } = await supabase
      .from('project_members')
      .insert({
        project_id: invitation.project_id,
        user_id: user.id,
        role: invitation.role,
        permissions: invitation.permissions,
        invited_by: invitation.invited_by,
        joined_at: new Date().toISOString(),
      })
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

    if (memberError) {
      console.error('Failed to add member:', memberError)
      return NextResponse.json(
        { error: 'Failed to join project' },
        { status: 500 }
      )
    }

    // Mark invitation as accepted
    const { error: updateError } = await supabase
      .from('project_invitations')
      .update({
        accepted_at: new Date().toISOString(),
        accepted_by: user.id,
      })
      .eq('id', invitation.id)

    if (updateError) {
      console.error('Failed to update invitation:', updateError)
      // Don't fail the request, member was already added
    }

    // Log activity
    await supabase.rpc('log_activity', {
      p_user_id: user.id,
      p_project_id: invitation.project_id,
      p_action: 'joined',
      p_resource_type: 'member',
      p_resource_id: newMember.id,
      p_metadata: { 
        role: invitation.role,
        via_invitation: true
      }
    })

    return NextResponse.json({
      project: invitation.projects,
      member: newMember,
      message: `Successfully joined ${invitation.projects?.name}`
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/invitations/[token] - Decline invitation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get invitation
    const { data: invitation, error: invitationError } = await supabase
      .from('project_invitations')
      .select(`
        id,
        project_id,
        email,
        accepted_at,
        projects:project_id (
          name
        )
      `)
      .eq('token', token)
      .single()

    if (invitationError || !invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      )
    }

    // Check if invitation email matches user email
    if (invitation.email !== user.email) {
      return NextResponse.json(
        { error: 'Invitation email does not match your account' },
        { status: 400 }
      )
    }

    // Check if invitation is already accepted
    if (invitation.accepted_at) {
      return NextResponse.json(
        { error: 'Cannot decline an already accepted invitation' },
        { status: 400 }
      )
    }

    // Delete invitation (declining it)
    const { error } = await supabase
      .from('project_invitations')
      .delete()
      .eq('id', invitation.id)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to decline invitation' },
        { status: 500 }
      )
    }

    // Log activity
    await supabase.rpc('log_activity', {
      p_user_id: user.id,
      p_project_id: invitation.project_id,
      p_action: 'declined_invitation',
      p_resource_type: 'invitation',
      p_resource_id: invitation.id,
      p_metadata: { 
        project_name: invitation.projects?.name
      }
    })

    return NextResponse.json({
      message: `Declined invitation to ${invitation.projects?.name}`
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}