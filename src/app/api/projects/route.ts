/**
 * Projects API Route with Convex Backend
 */

import { NextRequest, NextResponse } from 'next/server'
import { extractSessionToken, getAuthenticatedConvexClient } from '@/lib/convex/client'
import { api } from '../../../../convex/_generated/api'
import { z } from 'zod'

// Validation schemas
const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
})

// GET /api/projects - List user's projects
export async function GET(request: NextRequest) {
  try {
    // Extract session token
    const token = extractSessionToken(request)
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get authenticated Convex client
    const convex = getAuthenticatedConvexClient(token)

    // Get projects from Convex
    const projects = await convex.query(api.queries.projects.list)

    return NextResponse.json({ projects })

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
    // Extract session token
    const token = extractSessionToken(request)
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get authenticated Convex client
    const convex = getAuthenticatedConvexClient(token)

    // Parse and validate request body
    const body = await request.json()
    const validatedData = createProjectSchema.parse(body)

    // Create project via Convex mutation
    const projectId = await convex.mutation(api.mutations.projects.create, {
      name: validatedData.name,
      description: validatedData.description,
    })

    // Get created project
    const project = await convex.query(api.queries.projects.get, { id: projectId })

    return NextResponse.json(project, { status: 201 })

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
