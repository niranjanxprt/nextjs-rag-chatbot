/**
 * Performance Monitoring Utilities
 *
 * Tools for measuring and optimizing application performance
 * on Vercel and other deployment platforms
 */

// =============================================================================
// Types
// =============================================================================

export interface PerformanceMetric {
  name: string
  value: number
  unit: 'ms' | 'bytes' | 'count'
  timestamp: number
  context?: Record<string, any>
}

export interface PerformanceReport {
  metrics: PerformanceMetric[]
  summary: {
    totalTime: number
    memoryUsage: NodeJS.MemoryUsage
    timestamp: string
  }
}

// =============================================================================
// Performance Timer
// =============================================================================

export class PerformanceTimer {
  private startTime: number
  private marks: Map<string, number> = new Map()
  private metrics: PerformanceMetric[] = []

  constructor(private name: string) {
    this.startTime = performance.now()
  }

  mark(label: string): void {
    const now = performance.now()
    this.marks.set(label, now)

    this.metrics.push({
      name: `${this.name}.${label}`,
      value: now - this.startTime,
      unit: 'ms',
      timestamp: Date.now(),
    })
  }

  measure(startLabel: string, endLabel?: string): number {
    const startTime = this.marks.get(startLabel)
    const endTime = endLabel ? this.marks.get(endLabel) : performance.now()

    if (!startTime) {
      throw new Error(`Mark "${startLabel}" not found`)
    }

    if (endLabel && !endTime) {
      throw new Error(`Mark "${endLabel}" not found`)
    }

    const duration = (endTime || performance.now()) - startTime

    this.metrics.push({
      name: `${this.name}.${startLabel}_to_${endLabel || 'end'}`,
      value: duration,
      unit: 'ms',
      timestamp: Date.now(),
    })

    return duration
  }

  end(): PerformanceReport {
    const totalTime = performance.now() - this.startTime

    return {
      metrics: this.metrics,
      summary: {
        totalTime,
        memoryUsage: process.memoryUsage(),
        timestamp: new Date().toISOString(),
      },
    }
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics]
  }
}

// =============================================================================
// Function Performance Wrapper
// =============================================================================

export function withPerformanceTracking<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  name: string
) {
  return async (...args: T): Promise<R> => {
    const timer = new PerformanceTimer(name)

    try {
      timer.mark('start')
      const result = await fn(...args)
      timer.mark('end')

      const report = timer.end()

      // Log performance metrics in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`Performance Report for ${name}:`, report)
      }

      // In production, you might want to send to monitoring service
      if (process.env.NODE_ENV === 'production') {
        await sendPerformanceMetrics(report)
      }

      return result
    } catch (error) {
      timer.mark('error')
      const report = timer.end()

      // Log error with performance context
      console.error(`Performance Error in ${name}:`, {
        error,
        performance: report,
      })

      throw error
    }
  }
}

// =============================================================================
// Memory Monitoring
// =============================================================================

export function getMemoryUsage(): {
  rss: string
  heapUsed: string
  heapTotal: string
  external: string
  arrayBuffers: string
} {
  const usage = process.memoryUsage()

  return {
    rss: formatBytes(usage.rss),
    heapUsed: formatBytes(usage.heapUsed),
    heapTotal: formatBytes(usage.heapTotal),
    external: formatBytes(usage.external),
    arrayBuffers: formatBytes(usage.arrayBuffers),
  }
}

export function checkMemoryThreshold(thresholdMB: number = 100): boolean {
  const usage = process.memoryUsage()
  const heapUsedMB = usage.heapUsed / 1024 / 1024

  return heapUsedMB > thresholdMB
}

export function logMemoryUsage(context?: string): void {
  const usage = getMemoryUsage()
  const prefix = context ? `[${context}]` : ''

  console.log(`${prefix} Memory Usage:`, usage)
}

// =============================================================================
// API Performance Monitoring
// =============================================================================

export function createAPIPerformanceMiddleware() {
  return (handler: Function) => {
    return async (req: any, res: any) => {
      const timer = new PerformanceTimer(`api_${req.method}_${req.url}`)

      timer.mark('request_start')

      // Add performance headers
      res.setHeader('X-Response-Time-Start', Date.now().toString())

      try {
        const result = await handler(req, res)

        timer.mark('request_end')
        const report = timer.end()

        // Add performance headers
        res.setHeader('X-Response-Time', `${report.summary.totalTime.toFixed(2)}ms`)
        res.setHeader('X-Memory-Usage', formatBytes(report.summary.memoryUsage.heapUsed))

        // Log slow requests
        if (report.summary.totalTime > 1000) {
          console.warn('Slow API request:', {
            method: req.method,
            url: req.url,
            duration: report.summary.totalTime,
            memory: report.summary.memoryUsage,
          })
        }

        return result
      } catch (error) {
        timer.mark('request_error')
        const report = timer.end()

        console.error('API Performance Error:', {
          method: req.method,
          url: req.url,
          error,
          performance: report,
        })

        throw error
      }
    }
  }
}

// =============================================================================
// Client-Side Performance
// =============================================================================

export function measureWebVitals() {
  if (typeof window === 'undefined') return

  // Core Web Vitals
  const observer = new PerformanceObserver(list => {
    for (const entry of list.getEntries()) {
      const metric: PerformanceMetric = {
        name: entry.name,
        value: (entry as any).value || (entry as any).processingStart || entry.startTime || 0,
        unit: 'ms',
        timestamp: Date.now(),
        context: {
          entryType: entry.entryType,
          startTime: entry.startTime,
        },
      }

      // Log in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Web Vital:', metric)
      }

      // Send to analytics in production
      if (process.env.NODE_ENV === 'production') {
        sendWebVital(metric)
      }
    }
  })

  // Observe different performance entry types
  try {
    observer.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint'] })
  } catch (error) {
    console.warn('Performance Observer not supported:', error)
  }
}

export function measurePageLoad(pageName: string) {
  if (typeof window === 'undefined') return

  const timer = new PerformanceTimer(`page_${pageName}`)

  // Mark when page starts loading
  timer.mark('load_start')

  // Mark when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      timer.mark('dom_ready')
    })
  } else {
    timer.mark('dom_ready')
  }

  // Mark when page is fully loaded
  window.addEventListener('load', () => {
    timer.mark('load_complete')

    const report = timer.end()

    if (process.env.NODE_ENV === 'development') {
      console.log(`Page Load Performance for ${pageName}:`, report)
    }
  })

  return timer
}

// =============================================================================
// Utility Functions
// =============================================================================

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

async function sendPerformanceMetrics(report: PerformanceReport): Promise<void> {
  try {
    // In production, send to your monitoring service
    // For example: DataDog, New Relic, Vercel Analytics, etc.

    // Placeholder implementation
    if (process.env.VERCEL_ANALYTICS_ID) {
      // Send to Vercel Analytics
      console.log('Would send to Vercel Analytics:', report)
    }

    if (process.env.DATADOG_API_KEY) {
      // Send to DataDog
      console.log('Would send to DataDog:', report)
    }
  } catch (error) {
    console.error('Failed to send performance metrics:', error)
  }
}

async function sendWebVital(metric: PerformanceMetric): Promise<void> {
  try {
    // Send web vitals to analytics service
    if (process.env.NODE_ENV === 'production') {
      // Example: Google Analytics, Vercel Analytics, etc.
      console.log('Would send web vital:', metric)
    }
  } catch (error) {
    console.error('Failed to send web vital:', error)
  }
}

// =============================================================================
// Vercel-Specific Optimizations
// =============================================================================

export function optimizeForVercel() {
  // Memory management for serverless functions
  if (typeof global !== 'undefined') {
    // Set up memory monitoring
    const memoryThreshold = parseInt(process.env.MEMORY_THRESHOLD_MB || '100')

    setInterval(() => {
      if (checkMemoryThreshold(memoryThreshold)) {
        console.warn('Memory threshold exceeded:', getMemoryUsage())

        // Force garbage collection if available
        if (global.gc) {
          global.gc()
          console.log('Forced garbage collection')
        }
      }
    }, 30000) // Check every 30 seconds
  }

  // Set up performance monitoring
  if (typeof window !== 'undefined') {
    measureWebVitals()
  }
}

// =============================================================================
// Bundle Size Analysis
// =============================================================================

export function analyzeBundleSize() {
  if (typeof window === 'undefined') return

  // Analyze loaded scripts
  const scripts = Array.from(document.scripts)
  const totalSize = scripts.reduce((size, script) => {
    if (script.src && script.src.includes('_next/static')) {
      // Estimate size based on script src (this is approximate)
      return size + 1 // Placeholder
    }
    return size
  }, 0)

  console.log('Bundle Analysis:', {
    scriptCount: scripts.length,
    estimatedSize: `${totalSize}KB`,
    scripts: scripts.map(s => s.src).filter(Boolean),
  })
}

// =============================================================================
// Cold Start Optimization
// =============================================================================

export function warmupFunction() {
  // Pre-initialize expensive operations
  const startTime = performance.now()

  // Pre-load critical modules
  try {
    require('crypto')
    require('zlib')
    // Add other critical modules
  } catch (error) {
    console.warn('Module pre-loading failed:', error)
  }

  const warmupTime = performance.now() - startTime
  console.log(`Function warmup completed in ${warmupTime.toFixed(2)}ms`)

  return warmupTime
}
