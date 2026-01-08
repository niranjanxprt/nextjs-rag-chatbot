/**
 * Health Check API Endpoint
 *
 * Provides system health status and performance metrics
 */

import { NextRequest, NextResponse } from 'next/server'
import { healthMonitor, apiMonitor, memoryMonitor } from '@/lib/utils/monitoring'
import { logger } from '@/lib/utils/logger'

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    logger.info('Health check requested', {
      operation: 'health_check',
      requestId: request.headers.get('x-request-id') || undefined,
    })

    // Perform health checks
    const healthChecks = await healthMonitor.performHealthCheck()

    // Get performance metrics (last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    const apiMetrics = apiMonitor.getAPIMetrics(fiveMinutesAgo)
    const memoryMetrics = memoryMonitor.getMemoryMetrics(fiveMinutesAgo)

    // Calculate summary statistics
    const avgResponseTime = apiMonitor.getAverageResponseTime(fiveMinutesAgo)
    const p95ResponseTime = apiMonitor.getP95ResponseTime(fiveMinutesAgo)

    // Determine overall health status
    const overallStatus = healthChecks.every(check => check.status === 'healthy')
      ? 'healthy'
      : healthChecks.some(check => check.status === 'unhealthy')
        ? 'unhealthy'
        : 'degraded'

    const response = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime ? process.uptime() : null,
      services: healthChecks,
      performance: {
        api: {
          averageResponseTime: avgResponseTime,
          p95ResponseTime: p95ResponseTime,
          requestCount: apiMetrics.filter(m => m.name === 'api_request_count').length,
        },
        memory: {
          current:
            memoryMetrics.filter(m => m.name === 'memory_heap_used').slice(-1)[0]?.value || null,
          peak: Math.max(
            ...memoryMetrics.filter(m => m.name === 'memory_heap_used').map(m => m.value),
            0
          ),
        },
      },
      version: process.env.npm_package_version || 'unknown',
    }

    const duration = Date.now() - startTime

    logger.info('Health check completed', {
      operation: 'health_check',
      duration,
      metadata: { status: overallStatus },
    })

    // Return appropriate HTTP status based on health
    const httpStatus = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503

    return NextResponse.json(response, { status: httpStatus })
  } catch (error) {
    const duration = Date.now() - startTime

    logger.error(
      'Health check failed',
      {
        operation: 'health_check',
        duration,
      },
      error as Error
    )

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    )
  }
}

// Simple ping endpoint for basic availability checks
export async function HEAD() {
  return new NextResponse(null, { status: 200 })
}
