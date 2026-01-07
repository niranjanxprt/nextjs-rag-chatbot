/**
 * Health Check API Route
 * 
 * Provides system health status and diagnostics
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const checks = await Promise.allSettled([
      checkDatabase(),
      checkEnvironment(),
      checkMemory()
    ])
    
    const results = checks.map((check, index) => {
      const services = ['database', 'environment', 'memory']
      return {
        service: services[index],
        status: check.status === 'fulfilled' ? 'healthy' : 'unhealthy',
        details: check.status === 'fulfilled' ? check.value : check.reason?.message || 'Unknown error',
        timestamp: new Date().toISOString()
      }
    })
    
    const allHealthy = results.every(r => r.status === 'healthy')
    const responseTime = Date.now() - startTime
    
    return NextResponse.json({
      status: allHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks: results
    }, { 
      status: allHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Check': 'true'
      }
    })
    
  } catch (error) {
    const responseTime = Date.now() - startTime
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      error: error instanceof Error ? error.message : 'Health check failed',
      checks: []
    }, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Check': 'true'
      }
    })
  }
}

async function checkDatabase(): Promise<string> {
  try {
    const supabase = await createClient()
    
    // Simple query to test database connectivity
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
    
    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }
    
    return 'Database connection successful'
  } catch (error) {
    throw new Error(`Database check failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

async function checkEnvironment(): Promise<string> {
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'OPENAI_API_KEY'
  ]
  
  const missing = requiredEnvVars.filter(envVar => !process.env[envVar])
  
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`)
  }
  
  return 'All required environment variables are set'
}

async function checkMemory(): Promise<string> {
  const memUsage = process.memoryUsage()
  const memUsageMB = {
    rss: Math.round(memUsage.rss / 1024 / 1024),
    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
    external: Math.round(memUsage.external / 1024 / 1024)
  }
  
  // Check if memory usage is concerning (>500MB heap)
  if (memUsageMB.heapUsed > 500) {
    throw new Error(`High memory usage: ${memUsageMB.heapUsed}MB heap used`)
  }
  
  return `Memory usage normal: ${memUsageMB.heapUsed}MB heap used`
}
