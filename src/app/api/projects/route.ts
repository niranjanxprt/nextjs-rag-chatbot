/**
 * Projects API Route
 * 
 * Handles CRUD operations for projects with proper authentication,
 * member management, and collaboration features.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Validation schemas
const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  is_public: z.boolean().default(false),
  allow_member_invite: z.boolean().default(true),
  max_members: z.number().int().min(1).max(100).default(10),
})

const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  is_public: z.boolean().optional(),
  allow_member_invite: z.boolean().optional(),
  max_members: z.number().int().min(1).max(100).optional(),
})

// GET /api/projects - List user's projects
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
    const includePublic = searchParams.get('include_public') === 'true'
    const search = searchParams.get('search')

    // Get projects where user is owner or member
    let query = supabase
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
        updated_at,
        project_members!inner (
          role,
          user_id
        )
      `)
      .eq('project_members.user_id', user.id)
      .order('updated_at', { ascending: false })

    // Add search filter
    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    const { data: memberProjects, error: memberError } = await query

    if (memberError) {
      console.error('Database error:', memberError)
      return NextResponse.json(
        { error: 'Failed to fetch projects' },
        { status: 500 }
      )
    }

    let allProjects = memberProjects || []

    // Optionally include public projects
    if (includePublic) {
      let publicQuery = supabase
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
        .eq('is_public', true)
        .neq('user_id', user.id) // Exclude user's own projects

      if (search) {
        publicQuery = publicQuery.ilike('name', `%${search}%`)
      }

      const { data: publicProjects } = await publicQuery
      
      if (publicProjects) {
        // Add role info for public projects
        const publicProjectsWithRole = publicProjects.map((project: any) => ({
          ...project,
          project_members: [{ role: 'viewer', user_id: user.id }]
        }))
        
        allProjects = [...allProjects, ...publicProjectsWithRole]
      }
    }

    // Get additional stats for each project
    const projectsWithStats = await Promise.all(
      allProjects.map(async (project: any) => {
        // Get member count
        const { count: memberCount } = await supabase
          .from('project_members')
          .select('*', { count: 'exact', head: true })
          .eq('project_id', project.id)

        // Get document count
        const { count: documentCount } = await supabase
          .from('documents')
          .select('*', { count: 'exact', head: true })
          .eq('project_id', project.id)

        // Get conversation count
        const { count: conversationCount } = await supabase
          .from('conversations')
          .select('*', { count: 'exact', head: true })
          .eq('project_id', project.id)

        return {
          ...project,
          _count: {
            members: memberCount || 0,
            documents: documentCount || 0,
            conversations: conversationCount || 0,
          }
        }
      })
    )

    return NextResponse.json(projectsWithStats)

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/projects - Create new project
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
    const validatedData = createProjectSchema.parse(body)

    // Create project
    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        name: validatedData.name,
        description: validatedData.description || null,
        is_public: validatedData.is_public,
        allow_member_invite: validatedData.allow_member_invite,
        max_members: validatedData.max_members,
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to create project' },
        { status: 500 }
      )
    }

    // Add creator as owner member
    const { error: memberError } = await supabase
      .from('project_members')
      .insert({
        project_id: project.id,
        user_id: user.id,
        role: 'owner',
        permissions: {
          read: true,
          write: true,
          admin: true
        }
      })

    if (memberError) {
      console.error('Failed to add project owner:', memberError)
      // Don't fail the request, but log the error
    }

    // Log activity
    await supabase.rpc('log_activity', {
      p_user_id: user.id,
      p_project_id: project.id,
      p_action: 'created',
      p_resource_type: 'project',
      p_resource_id: project.id,
      p_metadata: { name: project.name }
    })

    // Add stats
    const projectWithStats = {
      ...project,
      _count: {
        members: 1,
        documents: 0,
        conversations: 0,
      }
    }

    return NextResponse.json(projectWithStats, { status: 201 })

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