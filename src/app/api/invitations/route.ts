/**
 * User Invitations API Route
 * 
 * Handles user's project invitations - both sent and received.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/invitations - Get user's invitations
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
    const type = searchParams.get('type') // 'received' or 'sent'

    let query = supabase
      .from('project_invitations')
      .select(`
        id,
        project_id,
        email,
        role,
        permissions,
        token,
        invited_by,
        expires_at,
        accepted_at,
        accepted_by,
        created_at,
        projects:project_id (
          id,
          name,
          description
        ),
        invited_by_profile:invited_by (
          id,
          email,
          full_name,
          avatar_url
        )
      `)
      .is('accepted_at', null) // Only pending invitations
      .gt('expires_at', new Date().toISOString()) // Not expired
      .order('created_at', { ascending: false })

    if (type === 'sent') {
      // Invitations sent by the user
      query = query.eq('invited_by', user.id)
    } else {
      // Invitations received by the user (default)
      query = query.eq('email', user.email)
    }

    const { data: invitations, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch invitations' },
        { status: 500 }
      )
    }

    return NextResponse.json(invitations || [])

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}