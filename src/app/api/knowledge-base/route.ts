/**
 * Knowledge Base API Route
 * 
 * Handles CRUD operations for knowledge bases with proper
 * access control and document management.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Validation schemas
const createKnowledgeBaseSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  project_id: z.string().uuid().optional(),
  is_public: z.boolean().default(false),
  settings: z.object({
    auto_update: z.boolean().default(true),
    embedding_model: z.string().default('text-embedding-3-small'),
    chunk_size: z.number().int().min(100).max(2000).default(500),
    chunk_overlap: z.number().int().min(0).max(500).default(50),
  }).optional(),
})

const updateKnowledgeBaseSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  is_public: z.boolean().optional(),
  settings: z.object({
    auto_update: z.boolean().optional(),
    embedding_model: z.string().optional(),
    chunk_size: z.number().int().min(100).max(2000).optional(),
    chunk_overlap: z.number().int().min(0).max(500).optional(),
  }).optional(),
})

// GET /api/knowledge-base - List knowledge bases
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
    const projectId = searchParams.get('project_id')
    const isPublic = searchParams.get('is_public')
    const search = searchParams.get('search')

    // Build query
    let query = supabase
      .from('knowledge_bases')
      .select(`
        id,
        name,
        description,
        user_id,
        project_id,
        is_public,
        settings,
        created_at,
        updated_at,
        projects:project_id (
          id,
          name
        )
      `)
      .order('updated_at', { ascending: false })

    // Filter by user's knowledge bases or public ones
    if (isPublic === 'true') {
      query = query.eq('is_public', true)
    } else {
      // User's own KBs or ones in projects they have access to
      query = query.or(`user_id.eq.${user.id},and(is_public.eq.true)`)
    }

    // Filter by project
    if (projectId) {
      // Check if user has access to the project
      const { data: projectAccess } = await supabase
        .from('project_members')
        .select('role')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .single()

      if (!projectAccess) {
        return NextResponse.json(
          { error: 'Access denied to project' },
          { status: 403 }
        )
      }

      query = query.eq('project_id', projectId)
    }

    // Add search filter
    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    const { data: knowledgeBases, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch knowledge bases' },
        { status: 500 }
      )
    }

    // Get document counts for each knowledge base
    const kbsWithCounts = await Promise.all(
      (knowledgeBases || []).map(async (kb: any) => {
        const { count } = await supabase
          .from('knowledge_base_documents')
          .select('*', { count: 'exact', head: true })
          .eq('knowledge_base_id', kb.id)

        return {
          ...kb,
          _count: {
            documents: count || 0,
          }
        }
      })
    )

    return NextResponse.json(kbsWithCounts)

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/knowledge-base - Create knowledge base
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
    const validatedData = createKnowledgeBaseSchema.parse(body)

    // Check project access if project_id is provided
    if (validatedData.project_id) {
      const { data: projectAccess } = await supabase
        .from('project_members')
        .select('role')
        .eq('project_id', validatedData.project_id)
        .eq('user_id', user.id)
        .single()

      if (!projectAccess || !['owner', 'admin', 'member'].includes(projectAccess.role)) {
        return NextResponse.json(
          { error: 'Access denied to project' },
          { status: 403 }
        )
      }
    }

    // Create knowledge base
    const { data: knowledgeBase, error } = await supabase
      .from('knowledge_bases')
      .insert({
        user_id: user.id,
        name: validatedData.name,
        description: validatedData.description || null,
        project_id: validatedData.project_id || null,
        is_public: validatedData.is_public,
        settings: validatedData.settings || {
          auto_update: true,
          embedding_model: 'text-embedding-3-small',
          chunk_size: 500,
          chunk_overlap: 50,
        },
      })
      .select(`
        id,
        name,
        description,
        user_id,
        project_id,
        is_public,
        settings,
        created_at,
        updated_at,
        projects:project_id (
          id,
          name
        )
      `)
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to create knowledge base' },
        { status: 500 }
      )
    }

    // Log activity
    await supabase.rpc('log_activity', {
      p_user_id: user.id,
      p_project_id: validatedData.project_id || null,
      p_action: 'created',
      p_resource_type: 'knowledge_base',
      p_resource_id: knowledgeBase.id,
      p_metadata: { name: knowledgeBase.name }
    })

    // Add document count
    const knowledgeBaseWithCount = {
      ...knowledgeBase,
      _count: {
        documents: 0,
      }
    }

    return NextResponse.json(knowledgeBaseWithCount, { status: 201 })

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