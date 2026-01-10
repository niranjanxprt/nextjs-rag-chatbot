/**
 * Langfuse Monitoring API Route
 *
 * Provides observability status and configuration information
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getLangfuseStatus } from '@/lib/services/langfuse'
import { createError, createErrorResponse, withErrorHandling } from '@/lib/utils/error-handler'

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

    // Get Langfuse status
    const status = getLangfuseStatus()

    return NextResponse.json(
      {
        langfuse: {
          ...status,
          publicKey: status.configured ? '***' : undefined,
          baseUrl: process.env.LANGFUSE_BASE_URL || 'https://cloud.langfuse.com',
          environment: process.env.NODE_ENV,
        },
        success: true,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Langfuse status API error:', error)
    return createErrorResponse(error instanceof Error ? error : new Error(String(error)))
  }
})
