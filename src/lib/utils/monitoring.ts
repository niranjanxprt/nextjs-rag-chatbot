/**
 * Performance Monitoring and Metrics
 * 
 * Utilities for tracking application performance,
 * API response times, and system health
 */

import { logger } from './logger'

export interface PerformanceMetric {
  name: string
  value: number
  unit: 'ms' | 'bytes' | 'count' | 'percentage'
  timestamp: string
  tags?: Record<string, string>
}

export interface HealthCheck {
  service: string
  status: 'healthy' | 'degraded' | 'unhealthy'
  responseTime?: number
  error?: string
  timestamp: string
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private readonly maxMetrics = 1000 // Keep last 1000 metrics in memory

  // Record a performance metric
  recordMetric(name: string, value: number, unit: PerformanceMetric['unit'], tags?: Record<string, string>): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: new Date().toISOString(),
      tags
    }

    this.metrics.push(metric)
    
    // Keep only the most recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }

    // Log significant metrics
    if (this.shouldLogMetric(name, value, unit)) {
      logger.info(`Performance metric: ${name}`, {
        operation: 'performance_metric',
        metadata: { name, value, unit, tags }
      })
    }
  }

  private shouldLogMetric(name: string, value: number, unit: string): boolean {
    // Log slow API responses
    if (name.includes('api_response_time') && unit === 'ms' && value > 1000) {
      return true
    }
    
    // Log high memory usage
    if (name.includes('memory') && unit === 'bytes' && value > 100 * 1024 * 1024) {
      return true
    }
    
    // Log error rates
    if (name.includes('error_rate') && unit === 'percentage' && value > 5) {
      return true
    }
    
    return false
  }

  // Get metrics for a specific time range
  getMetrics(since?: Date, name?: string): PerformanceMetric[] {
    let filtered = this.metrics

    if (since) {
      filtered = filtered.filter(m => new Date(m.timestamp) >= since)
    }

    if (name) {
      filtered = filtered.filter(m => m.name === name)
    }

    return filtered
  }

  // Calculate average for a metric
  getAverageMetric(name: string, since?: Date): number | null {
    const metrics = this.getMetrics(since, name)
    
    if (metrics.length === 0) {
      return null
    }

    const sum = metrics.reduce((acc, m) => acc + m.value, 0)
    return sum / metrics.length
  }

  // Get percentile for a metric
  getPercentile(name: string, percentile: number, since?: Date): number | null {
    const metrics = this.getMetrics(since, name)
    
    if (metrics.length === 0) {
      return null
    }

    const sorted = metrics.map(m => m.value).sort((a, b) => a - b)
    const index = Math.ceil((percentile / 100) * sorted.length) - 1
    
    return sorted[Math.max(0, index)]
  }

  // Clear old metrics
  clearMetrics(olderThan?: Date): void {
    if (olderThan) {
      this.metrics = this.metrics.filter(m => new Date(m.timestamp) >= olderThan)
    } else {
      this.metrics = []
    }
  }
}

// API Response Time Monitoring
export class APIMonitor {
  private static instance: APIMonitor
  private performanceMonitor: PerformanceMonitor

  constructor() {
    this.performanceMonitor = new PerformanceMonitor()
  }

  static getInstance(): APIMonitor {
    if (!APIMonitor.instance) {
      APIMonitor.instance = new APIMonitor()
    }
    return APIMonitor.instance
  }

  // Middleware for Next.js API routes
  middleware() {
    return (req: any, res: any, next: any) => {
      const startTime = Date.now()
      const originalSend = res.send

      res.send = function(data: any) {
        const duration = Date.now() - startTime
        const method = req.method
        const path = req.url
        const status = res.statusCode

        // Record metrics
        APIMonitor.getInstance().recordAPICall(method, path, status, duration)

        return originalSend.call(this, data)
      }

      if (next) next()
    }
  }

  recordAPICall(method: string, path: string, status: number, duration: number): void {
    const tags = {
      method,
      path: this.sanitizePath(path),
      status: status.toString(),
      status_class: this.getStatusClass(status)
    }

    this.performanceMonitor.recordMetric('api_response_time', duration, 'ms', tags)
    this.performanceMonitor.recordMetric('api_request_count', 1, 'count', tags)

    // Log slow requests
    if (duration > 1000) {
      logger.warn(`Slow API request: ${method} ${path}`, {
        operation: 'slow_api_request',
        duration,
        metadata: { method, path, status }
      })
    }
  }

  private sanitizePath(path: string): string {
    // Remove query parameters and replace IDs with placeholders
    return path
      .split('?')[0]
      .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id')
      .replace(/\/\d+/g, '/:id')
  }

  private getStatusClass(status: number): string {
    if (status < 300) return '2xx'
    if (status < 400) return '3xx'
    if (status < 500) return '4xx'
    return '5xx'
  }

  getAPIMetrics(since?: Date) {
    return this.performanceMonitor.getMetrics(since)
  }

  getAverageResponseTime(since?: Date): number | null {
    return this.performanceMonitor.getAverageMetric('api_response_time', since)
  }

  getP95ResponseTime(since?: Date): number | null {
    return this.performanceMonitor.getPercentile('api_response_time', 95, since)
  }
}

// System Health Monitoring
export class HealthMonitor {
  private healthChecks: HealthCheck[] = []

  async checkDatabaseHealth(): Promise<HealthCheck> {
    const startTime = Date.now()
    
    try {
      // Simple health check - you can expand this
      const responseTime = Date.now() - startTime
      
      return {
        service: 'database',
        status: responseTime < 1000 ? 'healthy' : 'degraded',
        responseTime,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      return {
        service: 'database',
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }
    }
  }

  async checkVectorDatabaseHealth(): Promise<HealthCheck> {
    const startTime = Date.now()
    
    try {
      // You can add actual Qdrant health check here
      const responseTime = Date.now() - startTime
      
      return {
        service: 'vector_database',
        status: responseTime < 2000 ? 'healthy' : 'degraded',
        responseTime,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      return {
        service: 'vector_database',
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }
    }
  }

  async checkRedisHealth(): Promise<HealthCheck> {
    const startTime = Date.now()
    
    try {
      // You can add actual Redis health check here
      const responseTime = Date.now() - startTime
      
      return {
        service: 'redis',
        status: responseTime < 500 ? 'healthy' : 'degraded',
        responseTime,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      return {
        service: 'redis',
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }
    }
  }

  async performHealthCheck(): Promise<HealthCheck[]> {
    const checks = await Promise.all([
      this.checkDatabaseHealth(),
      this.checkVectorDatabaseHealth(),
      this.checkRedisHealth()
    ])

    this.healthChecks = checks
    
    // Log unhealthy services
    checks.forEach(check => {
      if (check.status === 'unhealthy') {
        logger.error(`Service unhealthy: ${check.service}`, {
          operation: 'health_check',
          metadata: { service: check.service, error: check.error }
        })
      } else if (check.status === 'degraded') {
        logger.warn(`Service degraded: ${check.service}`, {
          operation: 'health_check',
          metadata: { service: check.service, responseTime: check.responseTime }
        })
      }
    })

    return checks
  }

  getLastHealthCheck(): HealthCheck[] {
    return this.healthChecks
  }
}

// Memory Usage Monitoring
export class MemoryMonitor {
  private performanceMonitor: PerformanceMonitor

  constructor() {
    this.performanceMonitor = new PerformanceMonitor()
  }

  recordMemoryUsage(): void {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage()
      
      this.performanceMonitor.recordMetric('memory_rss', usage.rss, 'bytes')
      this.performanceMonitor.recordMetric('memory_heap_used', usage.heapUsed, 'bytes')
      this.performanceMonitor.recordMetric('memory_heap_total', usage.heapTotal, 'bytes')
      this.performanceMonitor.recordMetric('memory_external', usage.external, 'bytes')
    }
  }

  startPeriodicMonitoring(intervalMs: number = 30000): NodeJS.Timeout {
    return setInterval(() => {
      this.recordMemoryUsage()
    }, intervalMs)
  }

  getMemoryMetrics(since?: Date) {
    return this.performanceMonitor.getMetrics(since)
  }
}

// Export singleton instances
export const apiMonitor = APIMonitor.getInstance()
export const healthMonitor = new HealthMonitor()
export const memoryMonitor = new MemoryMonitor()
export const performanceMonitor = new PerformanceMonitor()

// Utility function to start all monitoring
export const startMonitoring = () => {
  // Start memory monitoring
  memoryMonitor.startPeriodicMonitoring()
  
  // Log startup
  logger.info('Performance monitoring started', {
    operation: 'monitoring_startup'
  })
}