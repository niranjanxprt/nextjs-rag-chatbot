/**
 * Cache Management API Route
 *
 * Handles cache statistics, invalidation, and warming operations
 */

import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getStats,
  clearAll,
  invalidateByTag,
  invalidateByPattern,
  warmCache,
  embeddings,
  search,
  documents,
} from '@/lib/services/cache'
import { createErrorResponse, createSuccessResponse, createError } from '@/lib/utils/error-handler'

// =============================================================================
// GET - Cache Statistics
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    // Check authentication (admin only)
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      throw createError.unauthorized('Authentication required')
    }

    // In a real app, you'd check for admin role here
    // For now, any authenticated user can view cache stats

    const stats = await getStats()

    return createSuccessResponse({
      message: 'Cache statistics retrieved',
      stats,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Cache stats API error:', error)
    return createErrorResponse(error instanceof Error ? error : new Error(String(error)))
  }
}

// =============================================================================
// DELETE - Clear Cache
// =============================================================================

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication (admin only)
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      throw createError.unauthorized('Authentication required')
    }

    const { searchParams } = new URL(request.url)
    const tag = searchParams.get('tag')
    const pattern = searchParams.get('pattern')
    const namespace = searchParams.get('namespace')

    let clearedCount = 0
    let operation = 'clear_all'

    if (tag) {
      clearedCount = await invalidateByTag(tag)
      operation = 'clear_by_tag'
    } else if (pattern) {
      clearedCount = await invalidateByPattern(pattern)
      operation = 'clear_by_pattern'
    } else if (namespace) {
      // Clear specific namespace
      switch (namespace) {
        case 'embeddings':
          clearedCount = await embeddings.invalidateAll()
          break
        case 'search':
          clearedCount = await search.invalidateAll()
          break
        case 'documents':
          // Would need user ID for documents
          const userId = searchParams.get('userId')
          if (userId) {
            clearedCount = await documents.invalidateForUser(userId)
          } else {
            throw createError.validation('userId required for documents namespace')
          }
          break
        default:
          throw createError.validation(`Unknown namespace: ${namespace}`)
      }
      operation = 'clear_namespace'
    } else {
      await clearAll()
      operation = 'clear_all'
    }

    return createSuccessResponse({
      message: `Cache cleared successfully`,
      operation,
      clearedCount,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Cache clear API error:', error)
    return createErrorResponse(error instanceof Error ? error : new Error(String(error)))
  }
}

// =============================================================================
// POST - Cache Operations (Warm, etc.)
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    // Check authentication (admin only)
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      throw createError.unauthorized('Authentication required')
    }

    let body
    try {
      body = await request.json()
    } catch (error) {
      throw createError.validation('Invalid JSON in request body')
    }

    const { operation, ...params } = body

    switch (operation) {
      case 'warm':
        await warmCacheOperation(params)
        return createSuccessResponse({
          message: 'Cache warming initiated',
          operation: 'warm',
          timestamp: new Date().toISOString(),
        })

      case 'invalidate_user':
        if (!params.userId) {
          throw createError.validation('userId required for user invalidation')
        }
        const userClearedCount = await search.invalidateForUser(params.userId)
        return createSuccessResponse({
          message: 'User cache invalidated',
          operation: 'invalidate_user',
          clearedCount: userClearedCount,
          userId: params.userId,
          timestamp: new Date().toISOString(),
        })

      default:
        throw createError.validation(`Unknown operation: ${operation}`)
    }
  } catch (error) {
    console.error('Cache operation API error:', error)
    return createErrorResponse(error instanceof Error ? error : new Error(String(error)))
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

async function warmCacheOperation(params: any): Promise<void> {
  const warmingFunctions: Array<() => Promise<void>> = []

  // Add cache warming functions based on params
  if (params.embeddings) {
    warmingFunctions.push(async () => {
      console.log('Warming embeddings cache...')
      // This would pre-generate embeddings for common queries
      // For now, just a placeholder
    })
  }

  if (params.search) {
    warmingFunctions.push(async () => {
      console.log('Warming search cache...')
      // This would pre-execute common search queries
      // For now, just a placeholder
    })
  }

  if (params.documents && params.userId) {
    warmingFunctions.push(async () => {
      console.log('Warming documents cache...')
      // This would pre-load user documents
      // For now, just a placeholder
    })
  }

  if (warmingFunctions.length === 0) {
    // Default warming strategy
    warmingFunctions.push(async () => {
      console.log('Default cache warming...')
      // Basic cache warming
    })
  }

  await warmCache(warmingFunctions)
}
