/**
 * Error Reporting API Route
 *
 * Handles client-side error reporting for monitoring and debugging
 */

import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { createErrorResponse, createSuccessResponse, createError } from '@/lib/utils/error-handler'

// =============================================================================
// Validation Schema
// =============================================================================

const errorReportSchema = z.object({
  message: z.string().min(1).max(1000),
  stack: z.string().optional(),
  componentStack: z.string().optional(),
  errorId: z.string().optional(),
  url: z.string().url().optional(),
  userAgent: z.string().optional(),
  timestamp: z.string().datetime().optional(),
  level: z.enum(['error', 'warning', 'info']).default('error'),
  context: z.record(z.any()).optional(),
  userId: z.string().optional(),
})

type ErrorReport = z.infer<typeof errorReportSchema>

// =============================================================================
// POST - Report Error
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request
    let body
    try {
      body = await request.json()
    } catch (error) {
      throw createError.validation('Invalid JSON in request body')
    }

    const errorReport = errorReportSchema.parse(body)

    // Get user info if available (optional for error reporting)
    let userId: string | undefined
    try {
      const supabase = await createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      userId = user?.id
    } catch (error) {
      // Ignore auth errors for error reporting
      console.warn('Could not get user for error report:', error)
    }

    // Enhance error report with server-side info
    const enhancedReport: ErrorReport & {
      serverTimestamp: string
      ip?: string
      reportId: string
    } = {
      ...errorReport,
      userId: userId || errorReport.userId,
      serverTimestamp: new Date().toISOString(),
      ip: getClientIP(request),
      reportId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }

    // Log error for monitoring
    console.error('Client Error Report:', enhancedReport)

    // In production, you would send this to your monitoring service
    if (process.env.NODE_ENV === 'production') {
      await sendToMonitoringService(enhancedReport)
    }

    // Store in database for analysis (optional)
    if (process.env.STORE_ERROR_REPORTS === 'true') {
      await storeErrorReport(enhancedReport)
    }

    return createSuccessResponse({
      message: 'Error report received',
      reportId: enhancedReport.reportId,
    })
  } catch (error) {
    console.error('Error reporting API error:', error)
    return createErrorResponse(error instanceof Error ? error : new Error(String(error)))
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

function getClientIP(request: NextRequest): string | undefined {
  // Try various headers that might contain the client IP
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }

  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  if (cfConnectingIP) {
    return cfConnectingIP
  }

  return undefined
}

async function sendToMonitoringService(errorReport: any): Promise<void> {
  try {
    // This is where you would integrate with your monitoring service
    // Examples: Sentry, DataDog, LogRocket, Bugsnag, etc.

    // Example for Sentry:
    // Sentry.captureException(new Error(errorReport.message), {
    //   tags: {
    //     errorId: errorReport.errorId,
    //     reportId: errorReport.reportId
    //   },
    //   extra: errorReport,
    //   user: errorReport.userId ? { id: errorReport.userId } : undefined
    // })

    // For now, just log it
    console.log('Would send to monitoring service:', errorReport)
  } catch (error) {
    console.error('Failed to send error to monitoring service:', error)
  }
}

async function storeErrorReport(errorReport: any): Promise<void> {
  try {
    // This is where you would store the error report in your database
    // You might want to create an 'error_reports' table for this

    // Example implementation:
    // const supabase = createClient()
    // await supabase.from('error_reports').insert({
    //   message: errorReport.message,
    //   stack: errorReport.stack,
    //   error_id: errorReport.errorId,
    //   report_id: errorReport.reportId,
    //   user_id: errorReport.userId,
    //   url: errorReport.url,
    //   user_agent: errorReport.userAgent,
    //   level: errorReport.level,
    //   context: errorReport.context,
    //   client_timestamp: errorReport.timestamp,
    //   server_timestamp: errorReport.serverTimestamp,
    //   ip_address: errorReport.ip
    // })

    console.log('Would store error report in database:', errorReport.reportId)
  } catch (error) {
    console.error('Failed to store error report:', error)
  }
}

// =============================================================================
// GET - Health Check
// =============================================================================

export async function GET() {
  return createSuccessResponse({
    message: 'Error reporting endpoint is healthy',
    timestamp: new Date().toISOString(),
  })
}
