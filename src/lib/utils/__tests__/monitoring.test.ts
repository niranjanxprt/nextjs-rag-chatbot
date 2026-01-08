/**
 * Monitoring Unit Tests
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals'
import { APIMonitor, HealthMonitor, MemoryMonitor, performanceMonitor } from '../monitoring'

// Mock console and logger
jest.mock('../logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}))

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    performanceMonitor.clearMetrics()
  })

  it('should record metrics', () => {
    performanceMonitor.recordMetric('test_metric', 100, 'ms', { tag: 'value' })

    const metrics = performanceMonitor.getMetrics()

    expect(metrics).toHaveLength(1)
    expect(metrics[0]).toMatchObject({
      name: 'test_metric',
      value: 100,
      unit: 'ms',
      tags: { tag: 'value' },
    })
    expect(metrics[0].timestamp).toBeDefined()
  })

  it('should filter metrics by name', () => {
    performanceMonitor.recordMetric('metric_a', 100, 'ms')
    performanceMonitor.recordMetric('metric_b', 200, 'ms')
    performanceMonitor.recordMetric('metric_a', 150, 'ms')

    const metricsA = performanceMonitor.getMetrics(undefined, 'metric_a')
    const metricsB = performanceMonitor.getMetrics(undefined, 'metric_b')

    expect(metricsA).toHaveLength(2)
    expect(metricsB).toHaveLength(1)
    expect(metricsA.every(m => m.name === 'metric_a')).toBe(true)
    expect(metricsB.every(m => m.name === 'metric_b')).toBe(true)
  })

  it('should filter metrics by time', () => {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

    performanceMonitor.recordMetric('old_metric', 100, 'ms')

    const recentMetrics = performanceMonitor.getMetrics(oneHourAgo)

    expect(recentMetrics).toHaveLength(1)
  })

  it('should calculate average metrics', () => {
    performanceMonitor.recordMetric('test_metric', 100, 'ms')
    performanceMonitor.recordMetric('test_metric', 200, 'ms')
    performanceMonitor.recordMetric('test_metric', 300, 'ms')

    const average = performanceMonitor.getAverageMetric('test_metric')

    expect(average).toBe(200)
  })

  it('should return null for average of non-existent metric', () => {
    const average = performanceMonitor.getAverageMetric('non_existent')

    expect(average).toBeNull()
  })

  it('should calculate percentiles', () => {
    // Add metrics with known values
    for (let i = 1; i <= 100; i++) {
      performanceMonitor.recordMetric('test_metric', i, 'ms')
    }

    const p50 = performanceMonitor.getPercentile('test_metric', 50)
    const p95 = performanceMonitor.getPercentile('test_metric', 95)
    const p99 = performanceMonitor.getPercentile('test_metric', 99)

    expect(p50).toBe(50)
    expect(p95).toBe(95)
    expect(p99).toBe(99)
  })

  it('should return null for percentile of non-existent metric', () => {
    const percentile = performanceMonitor.getPercentile('non_existent', 95)

    expect(percentile).toBeNull()
  })

  it('should limit stored metrics', () => {
    // Record more than the limit (1000)
    for (let i = 0; i < 1200; i++) {
      performanceMonitor.recordMetric('test_metric', i, 'ms')
    }

    const metrics = performanceMonitor.getMetrics()

    expect(metrics.length).toBeLessThanOrEqual(1000)
  })

  it('should clear metrics', () => {
    performanceMonitor.recordMetric('test_metric', 100, 'ms')

    expect(performanceMonitor.getMetrics()).toHaveLength(1)

    performanceMonitor.clearMetrics()

    expect(performanceMonitor.getMetrics()).toHaveLength(0)
  })

  it('should clear metrics older than date', () => {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

    performanceMonitor.recordMetric('old_metric', 100, 'ms')

    // Clear metrics older than 30 minutes ago
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000)
    performanceMonitor.clearMetrics(thirtyMinutesAgo)

    const remainingMetrics = performanceMonitor.getMetrics()

    expect(remainingMetrics).toHaveLength(1)
  })
})

describe('APIMonitor', () => {
  beforeEach(() => {
    performanceMonitor.clearMetrics()
  })

  it('should record API calls', () => {
    // Test the recordAPICall method directly
    const apiMonitor = new (APIMonitor as any)()
    apiMonitor.performanceMonitor = performanceMonitor

    apiMonitor.recordAPICall('GET', '/api/test', 200, 150)

    const metrics = performanceMonitor.getMetrics()

    expect(metrics.length).toBeGreaterThan(0)

    const responseTimeMetrics = metrics.filter(m => m.name === 'api_response_time')
    const requestCountMetrics = metrics.filter(m => m.name === 'api_request_count')

    expect(responseTimeMetrics).toHaveLength(1)
    expect(requestCountMetrics).toHaveLength(1)

    expect(responseTimeMetrics[0].value).toBe(150)
    expect(responseTimeMetrics[0].tags).toMatchObject({
      method: 'GET',
      path: '/api/test',
      status: '200',
      status_class: '2xx',
    })
  })

  it('should sanitize paths with IDs', () => {
    const apiMonitor = new (APIMonitor as any)()
    apiMonitor.performanceMonitor = performanceMonitor

    apiMonitor.recordAPICall('GET', '/api/users/123e4567-e89b-12d3-a456-426614174000', 200, 100)

    const metrics = performanceMonitor.getMetrics()
    const responseTimeMetric = metrics.find(m => m.name === 'api_response_time')

    expect(responseTimeMetric?.tags?.path).toBe('/api/users/:id')
  })

  it('should sanitize paths with numeric IDs', () => {
    const apiMonitor = new (APIMonitor as any)()
    apiMonitor.performanceMonitor = performanceMonitor

    apiMonitor.recordAPICall('GET', '/api/posts/123/comments/456', 200, 100)

    const metrics = performanceMonitor.getMetrics()
    const responseTimeMetric = metrics.find(m => m.name === 'api_response_time')

    expect(responseTimeMetric?.tags?.path).toBe('/api/posts/:id/comments/:id')
  })

  it('should remove query parameters from paths', () => {
    const apiMonitor = new (APIMonitor as any)()
    apiMonitor.performanceMonitor = performanceMonitor

    apiMonitor.recordAPICall('GET', '/api/search?q=test&limit=10', 200, 100)

    const metrics = performanceMonitor.getMetrics()
    const responseTimeMetric = metrics.find(m => m.name === 'api_response_time')

    expect(responseTimeMetric?.tags?.path).toBe('/api/search')
  })

  it('should classify status codes correctly', () => {
    const apiMonitor = new (APIMonitor as any)()
    apiMonitor.performanceMonitor = performanceMonitor

    apiMonitor.recordAPICall('GET', '/api/test', 200, 100)
    apiMonitor.recordAPICall('GET', '/api/test', 301, 100)
    apiMonitor.recordAPICall('GET', '/api/test', 404, 100)
    apiMonitor.recordAPICall('GET', '/api/test', 500, 100)

    const metrics = performanceMonitor.getMetrics()
    const responseTimeMetrics = metrics.filter(m => m.name === 'api_response_time')

    const statusClasses = responseTimeMetrics.map(m => m.tags?.status_class)

    expect(statusClasses).toContain('2xx')
    expect(statusClasses).toContain('3xx')
    expect(statusClasses).toContain('4xx')
    expect(statusClasses).toContain('5xx')
  })

  it('should calculate average response time', () => {
    const apiMonitor = new (APIMonitor as any)()
    apiMonitor.performanceMonitor = performanceMonitor

    apiMonitor.recordAPICall('GET', '/api/test', 200, 100)
    apiMonitor.recordAPICall('GET', '/api/test', 200, 200)
    apiMonitor.recordAPICall('GET', '/api/test', 200, 300)

    const average = performanceMonitor.getAverageMetric('api_response_time')

    expect(average).toBe(200)
  })

  it('should calculate P95 response time', () => {
    const apiMonitor = new (APIMonitor as any)()
    apiMonitor.performanceMonitor = performanceMonitor

    // Record 100 API calls with response times 1-100ms
    for (let i = 1; i <= 100; i++) {
      apiMonitor.recordAPICall('GET', '/api/test', 200, i)
    }

    const p95 = performanceMonitor.getPercentile('api_response_time', 95)

    expect(p95).toBe(95)
  })
})

describe('HealthMonitor', () => {
  let healthMonitor: HealthMonitor

  beforeEach(() => {
    healthMonitor = new HealthMonitor()
  })

  it('should check database health', async () => {
    const healthCheck = await healthMonitor.checkDatabaseHealth()

    expect(healthCheck).toMatchObject({
      service: 'database',
      status: expect.stringMatching(/^(healthy|degraded|unhealthy)$/),
      timestamp: expect.any(String),
    })

    if (healthCheck.responseTime !== undefined) {
      expect(healthCheck.responseTime).toBeGreaterThanOrEqual(0)
    }
  })

  it('should check vector database health', async () => {
    const healthCheck = await healthMonitor.checkVectorDatabaseHealth()

    expect(healthCheck).toMatchObject({
      service: 'vector_database',
      status: expect.stringMatching(/^(healthy|degraded|unhealthy)$/),
      timestamp: expect.any(String),
    })
  })

  it('should check Redis health', async () => {
    const healthCheck = await healthMonitor.checkRedisHealth()

    expect(healthCheck).toMatchObject({
      service: 'redis',
      status: expect.stringMatching(/^(healthy|degraded|unhealthy)$/),
      timestamp: expect.any(String),
    })
  })

  it('should perform complete health check', async () => {
    const healthChecks = await healthMonitor.performHealthCheck()

    expect(healthChecks).toHaveLength(3)

    const services = healthChecks.map(check => check.service)
    expect(services).toContain('database')
    expect(services).toContain('vector_database')
    expect(services).toContain('redis')

    healthChecks.forEach(check => {
      expect(check.status).toMatch(/^(healthy|degraded|unhealthy)$/)
      expect(check.timestamp).toBeDefined()
    })
  })

  it('should store last health check results', async () => {
    await healthMonitor.performHealthCheck()

    const lastCheck = healthMonitor.getLastHealthCheck()

    expect(lastCheck).toHaveLength(3)
  })
})

describe('MemoryMonitor', () => {
  let memoryMonitor: MemoryMonitor

  beforeEach(() => {
    memoryMonitor = new MemoryMonitor()
    performanceMonitor.clearMetrics()
  })

  it('should record memory usage', () => {
    // Mock process.memoryUsage
    const originalMemoryUsage = process.memoryUsage
    process.memoryUsage = jest.fn(() => ({
      rss: 1000000,
      heapUsed: 800000,
      heapTotal: 1200000,
      external: 100000,
      arrayBuffers: 50000,
    })) as any

    memoryMonitor.recordMemoryUsage()

    const metrics = memoryMonitor.getMemoryMetrics()

    expect(metrics.length).toBeGreaterThan(0)

    const memoryMetrics = metrics.filter(m => m.name.startsWith('memory_'))
    expect(memoryMetrics.length).toBeGreaterThanOrEqual(4)

    // Restore original function
    process.memoryUsage = originalMemoryUsage
  })

  it('should handle missing process.memoryUsage', () => {
    const originalMemoryUsage = process.memoryUsage
    delete (process as any).memoryUsage

    expect(() => {
      memoryMonitor.recordMemoryUsage()
    }).not.toThrow()

    // Restore original function
    process.memoryUsage = originalMemoryUsage
  })

  it('should start periodic monitoring', () => {
    jest.useFakeTimers()

    const interval = memoryMonitor.startPeriodicMonitoring(1000)

    expect(interval).toBeDefined()

    clearInterval(interval)
    jest.useRealTimers()
  })
})

describe('Integration Tests', () => {
  it('should work together for complete monitoring', () => {
    const apiMonitor = new (APIMonitor as any)()
    apiMonitor.performanceMonitor = performanceMonitor

    // Record some API calls
    apiMonitor.recordAPICall('GET', '/api/users', 200, 150)
    apiMonitor.recordAPICall('POST', '/api/users', 201, 300)
    apiMonitor.recordAPICall('GET', '/api/users/123', 404, 50)

    // Get metrics from performance monitor directly
    const metrics = performanceMonitor.getMetrics()
    const avgResponseTime = performanceMonitor.getAverageMetric('api_response_time')
    const p95ResponseTime = performanceMonitor.getPercentile('api_response_time', 95)

    expect(metrics.length).toBeGreaterThan(0)
    expect(avgResponseTime).toBeGreaterThan(0)
    expect(p95ResponseTime).toBeGreaterThan(0)
  })
})
