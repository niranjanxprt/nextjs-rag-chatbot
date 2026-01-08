/**
 * Projects API Routes
 *
 * Handles CRUD operations for projects
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createProject, getProjects, getDefaultProject } from '@/lib/database/queries'
import { createError, createErrorResponse, withErrorHandling } from '@/lib/utils/error-handler'
import type { ProjectInsert } from '@/lib/types/database'

// =============================================================================
// GET /api/projects - List user's projects
// =============================================================================

export const GET = withErrorHandling(async (request: NextRequest) => {
  try {
    // Check authentication
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      throw createError.unauthorized('Authentication required')
    }

    if (!user) {
      throw createError.unauthorized('Authentication required')
    }

    // Get projects
    const projects = await getProjects(user.id)

    return NextResponse.json(
      {
        projects,
        success: true,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('GET /api/projects error:', error)
    return createErrorResponse(error instanceof Error ? error : new Error(String(error)))
  }
})

// =============================================================================
// POST /api/projects - Create a new project
// =============================================================================

export const POST = withErrorHandling(async (request: NextRequest) => {
  try {
    // Check authentication
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      throw createError.unauthorized('Authentication required')
    }

    if (!user) {
      throw createError.unauthorized('Authentication required')
    }

    // Parse request body
    let body
    try {
      body = await request.json()
    } catch (error) {
      throw createError.validation('Invalid JSON in request body')
    }

    const { name, description, color, icon } = body

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw createError.validation('Project name is required')
    }

    // Create project
    const projectData: ProjectInsert = {
      user_id: user.id,
      name: name.trim(),
      description: description || null,
      color: color || '#3b82f6',
      icon: icon || 'folder',
      is_default: false,
    }

    const project = await createProject(projectData)

    return NextResponse.json(
      {
        project,
        success: true,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST /api/projects error:', error)
    return createErrorResponse(error instanceof Error ? error : new Error(String(error)))
  }
})
