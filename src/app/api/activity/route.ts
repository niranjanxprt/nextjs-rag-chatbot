/**
 * Activity Log API Route
 * 
 * Handles retrieving user and project activity logs
 * for audit trails and notifications.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Validation schemas
const activityQuerySchema = z.object({
  project_id: z.string().uuid().optional(),
  action: z.string().optional(),
  resource_type: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
})

// GET /api/activity - Get activity logs
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

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    const queryData = {
      project_id: searchParams.get('project_id') || undefined,
      action: searchParams.get('action') || undefined,
      resource_type: searchParams.get('resource_type') || undefined,
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0'),
      start_date: searchParams.get('start_date') || undefined,
      end_date: searchParams.get('end_date') || undefined,
    }

    const validatedData = activityQuerySchema.parse(queryData)

    // Build base query
    let query = supabase
      .from('activity_log')
      .select(`
        id,
        user_id,
        project_id,
        action,
        resource_type,
        resource_id,
        metadata,
        created_at,
        profiles:user_id (
          id,
          email,
          full_name,
          avatar_url
        ),
        projects:project_id (
          id,
          name
        )
      `)
      .order('created_at', { ascending: false })
      .range(validatedData.offset, validatedData.offset + validatedData.limit - 1)

    // Filter by user's activities or project activities they have access to
    if (validatedData.project_id) {
      // Check if user has access to the project
      const { data: projectAccess } = await supabase
        .from('project_members')
        .select('role')
        .eq('project_id', validatedData.project_id)
        .eq('user_id', user.id)
        .single()

      if (!projectAccess) {
        return NextResponse.json(
          { error: 'Access denied to project' },
          { status: 403 }
        )
      }

      query = query.eq('project_id', validatedData.project_id)
    } else {
      // Get activities for user's own actions or projects they're part of
      const { data: userProjects } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', user.id)

      const projectIds = userProjects?.map((p: any) => p.project_id) || []
      
      if (projectIds.length > 0) {
        query = query.or(`user_id.eq.${user.id},project_id.in.(${projectIds.join(',')})`)
      } else {
        query = query.eq('user_id', user.id)
      }
    }

    // Apply additional filters
    if (validatedData.action) {
      query = query.eq('action', validatedData.action)
    }

    if (validatedData.resource_type) {
      query = query.eq('resource_type', validatedData.resource_type)
    }

    if (validatedData.start_date) {
      query = query.gte('created_at', validatedData.start_date)
    }

    if (validatedData.end_date) {
      query = query.lte('created_at', validatedData.end_date)
    }

    const { data: activities, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch activity logs' },
        { status: 500 }
      )
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('activity_log')
      .select('*', { count: 'exact', head: true })

    // Apply same filters for count
    if (validatedData.project_id) {
      countQuery = countQuery.eq('project_id', validatedData.project_id)
    } else {
      const { data: userProjects } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', user.id)

      const projectIds = userProjects?.map((p: any) => p.project_id) || []
      
      if (projectIds.length > 0) {
        countQuery = countQuery.or(`user_id.eq.${user.id},project_id.in.(${projectIds.join(',')})`)
      } else {
        countQuery = countQuery.eq('user_id', user.id)
      }
    }

    if (validatedData.action) {
      countQuery = countQuery.eq('action', validatedData.action)
    }

    if (validatedData.resource_type) {
      countQuery = countQuery.eq('resource_type', validatedData.resource_type)
    }

    if (validatedData.start_date) {
      countQuery = countQuery.gte('created_at', validatedData.start_date)
    }

    if (validatedData.end_date) {
      countQuery = countQuery.lte('created_at', validatedData.end_date)
    }

    const { count } = await countQuery

    return NextResponse.json({
      activities: activities || [],
      pagination: {
        total: count || 0,
        limit: validatedData.limit,
        offset: validatedData.offset,
        hasMore: (count || 0) > validatedData.offset + validatedData.limit
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
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