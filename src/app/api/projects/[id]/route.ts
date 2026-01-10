/**
 * Dynamic Project API Routes
 *
 * Handles operations for a specific project
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getProject, updateProject, deleteProject } from '@/lib/database/queries'
import { createError, createErrorResponse, withErrorHandling } from '@/lib/utils/error-handler'
import type { ProjectUpdate } from '@/lib/types/database'

// =============================================================================
// GET /api/projects/[id] - Get a specific project
// =============================================================================

export const GET = withErrorHandling(
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
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

      const { id: projectId } = await params

      // Get project
      const project = await getProject(projectId, user.id)

      if (!project) {
        throw createError.notFound('Project not found')
      }

      // Get project statistics (document and conversation counts)
      const [docCount, convCount] = await Promise.all([
        supabase
          .from('documents')
          .select('*', { count: 'exact', head: true })
          .eq('project_id', projectId)
          .then(res => res.count || 0),
        supabase
          .from('conversations')
          .select('*', { count: 'exact', head: true })
          .eq('project_id', projectId)
          .then(res => res.count || 0),
      ])

      return NextResponse.json(
        {
          project,
          stats: {
            documentCount: docCount,
            conversationCount: convCount,
          },
          success: true,
        },
        { status: 200 }
      )
    } catch (error) {
      console.error('GET /api/projects/[id] error:', error)
      return createErrorResponse(error instanceof Error ? error : new Error(String(error)))
    }
  }
)

// =============================================================================
// PATCH /api/projects/[id] - Update a project
// =============================================================================

export const PATCH = withErrorHandling(
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
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

      const { id: projectId } = await params

      // Parse request body
      let body
      try {
        body = await request.json()
      } catch (error) {
        throw createError.validation('Invalid JSON in request body')
      }

      const { name, description, color, icon } = body

      // Validate at least one field is provided
      if (!name && !description && !color && !icon) {
        throw createError.validation('At least one field must be provided for update')
      }

      // Build update object
      const updates: ProjectUpdate = {}
      if (name !== undefined) updates.name = name
      if (description !== undefined) updates.description = description
      if (color !== undefined) updates.color = color
      if (icon !== undefined) updates.icon = icon

      // Update project
      const project = await updateProject(projectId, user.id, updates)

      return NextResponse.json(
        {
          project,
          success: true,
        },
        { status: 200 }
      )
    } catch (error) {
      console.error('PATCH /api/projects/[id] error:', error)
      return createErrorResponse(error instanceof Error ? error : new Error(String(error)))
    }
  }
)

// =============================================================================
// DELETE /api/projects/[id] - Delete a project
// =============================================================================

export const DELETE = withErrorHandling(
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
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

      const { id: projectId } = await params

      // Verify project exists and belongs to user
      const project = await getProject(projectId, user.id)
      if (!project) {
        throw createError.notFound('Project not found')
      }

      // Prevent deletion of default project
      if (project.is_default) {
        throw createError.validation('Cannot delete the default project')
      }

      // Delete project (cascades to documents and conversations via database)
      await deleteProject(projectId, user.id)

      return NextResponse.json(
        {
          success: true,
          message: 'Project deleted successfully',
        },
        { status: 200 }
      )
    } catch (error) {
      console.error('DELETE /api/projects/[id] error:', error)
      return createErrorResponse(error instanceof Error ? error : new Error(String(error)))
    }
  }
)
