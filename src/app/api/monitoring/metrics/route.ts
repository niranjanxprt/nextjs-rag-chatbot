/**
 * Metrics API Endpoint
 *
 * Provides detailed performance metrics and statistics
 */

import { NextRequest, NextResponse } from 'next/server'
import { apiMonitor, performanceMonitor } from '@/lib/utils/monitoring'
import { logger } from '@/lib/utils/logger'

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    const { searchParams } = new URL(request.url)
    const since = searchParams.get('since')
    const metric = searchParams.get('metric')

    // Parse since parameter
    const sinceDate = since ? new Date(since) : new Date(Date.now() - 60 * 60 * 1000) // Default: last hour

    if (isNaN(sinceDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid since parameter. Use ISO 8601 format.' },
        { status: 400 }
      )
    }

    logger.info('Metrics requested', {
      operation: 'metrics_request',
      metadata: { since: sinceDate.toISOString(), metric },
    })

    // Get metrics
    const metrics = performanceMonitor.getMetrics(sinceDate, metric || undefined)

    // Calculate statistics for API response times
    const apiResponseTimes = metrics.filter(m => m.name === 'api_response_time').map(m => m.value)

    const apiRequestCounts = metrics.filter(m => m.name === 'api_request_count').length

    const statistics = {
      api: {
        totalRequests: apiRequestCounts,
        averageResponseTime:
          apiResponseTimes.length > 0
            ? apiResponseTimes.reduce((a, b) => a + b, 0) / apiResponseTimes.length
            : null,
        minResponseTime: apiResponseTimes.length > 0 ? Math.min(...apiResponseTimes) : null,
        maxResponseTime: apiResponseTimes.length > 0 ? Math.max(...apiResponseTimes) : null,
        p50ResponseTime: getPercentile(apiResponseTimes, 50),
        p95ResponseTime: getPercentile(apiResponseTimes, 95),
        p99ResponseTime: getPercentile(apiResponseTimes, 99),
      },
      timeRange: {
        since: sinceDate.toISOString(),
        until: new Date().toISOString(),
        durationMinutes: Math.round((Date.now() - sinceDate.getTime()) / (1000 * 60)),
      },
    }

    // Group metrics by name for easier consumption
    const groupedMetrics = metrics.reduce(
      (acc, metric) => {
        if (!acc[metric.name]) {
          acc[metric.name] = []
        }
        acc[metric.name].push(metric)
        return acc
      },
      {} as Record<string, typeof metrics>
    )

    const response = {
      statistics,
      metrics: groupedMetrics,
      totalMetrics: metrics.length,
    }

    const duration = Date.now() - startTime

    logger.info('Metrics request completed', {
      operation: 'metrics_request',
      duration,
      metadata: {
        metricsCount: metrics.length,
        timeRangeMinutes: statistics.timeRange.durationMinutes,
      },
    })

    return NextResponse.json(response)
  } catch (error) {
    const duration = Date.now() - startTime

    logger.error(
      'Metrics request failed',
      {
        operation: 'metrics_request',
        duration,
      },
      error as Error
    )

    return NextResponse.json(
      {
        error: 'Failed to retrieve metrics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// Helper function to calculate percentiles
function getPercentile(values: number[], percentile: number): number | null {
  if (values.length === 0) return null

  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.ceil((percentile / 100) * sorted.length) - 1

  return sorted[Math.max(0, index)]
}

// Clear metrics endpoint (DELETE)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const olderThan = searchParams.get('olderThan')

    const olderThanDate = olderThan ? new Date(olderThan) : undefined

    if (olderThan && isNaN(olderThanDate!.getTime())) {
      return NextResponse.json(
        { error: 'Invalid olderThan parameter. Use ISO 8601 format.' },
        { status: 400 }
      )
    }

    performanceMonitor.clearMetrics(olderThanDate)

    logger.info('Metrics cleared', {
      operation: 'metrics_clear',
      metadata: { olderThan: olderThanDate?.toISOString() },
    })

    return NextResponse.json({
      success: true,
      message: 'Metrics cleared successfully',
      clearedBefore: olderThanDate?.toISOString() || 'all',
    })
  } catch (error) {
    logger.error(
      'Failed to clear metrics',
      {
        operation: 'metrics_clear',
      },
      error as Error
    )

    return NextResponse.json(
      {
        error: 'Failed to clear metrics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
