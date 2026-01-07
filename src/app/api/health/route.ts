/**
 * Health Check API Route
 * 
 * Provides system health status for monitoring and deployment verification
 */

import { NextRequest } from 'next/server'
import { createSuccessResponse, createErrorResponse } from '@/lib/utils/error-handler'

// =============================================================================
// GET - Health Check
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now()
    
    // Basic health checks
    const checks = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
      region: process.env.VERCEL_REGION || 'local',
      deployment: process.env.VERCEL_GIT_COMMIT_SHA || 'local'
    }
    
    // Check environment variables
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'OPENAI_API_KEY',
      'QDRANT_URL',
      'QDRANT_API_KEY',
      'UPSTASH_REDIS_REST_URL',
      'UPSTASH_REDIS_REST_TOKEN'
    ]
    
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar])
    
    // External service checks (basic connectivity)
    const serviceChecks = await Promise.allSettled([
      checkSupabase(),
      checkOpenAI(),
      checkQdrant(),
      checkRedis()
    ])
    
    const services = {
      supabase: serviceChecks[0].status === 'fulfilled' ? serviceChecks[0].value : { status: 'error', error: (serviceChecks[0] as PromiseRejectedResult).reason },
      openai: serviceChecks[1].status === 'fulfilled' ? serviceChecks[1].value : { status: 'error', error: (serviceChecks[1] as PromiseRejectedResult).reason },
      qdrant: serviceChecks[2].status === 'fulfilled' ? serviceChecks[2].value : { status: 'error', error: (serviceChecks[2] as PromiseRejectedResult).reason },
      redis: serviceChecks[3].status === 'fulfilled' ? serviceChecks[3].value : { status: 'error', error: (serviceChecks[3] as PromiseRejectedResult).reason }
    }
    
    const responseTime = Date.now() - startTime
    
    // Determine overall health status
    const hasErrors = missingEnvVars.length > 0 || 
                     Object.values(services).some(service => service.status === 'error')
    
    const healthStatus = {
      status: hasErrors ? 'degraded' : 'healthy',
      checks,
      services,
      environment: {
        missingEnvVars: missingEnvVars.length > 0 ? missingEnvVars : undefined,
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      },
      performance: {
        responseTime: `${responseTime}ms`,
        memoryUsage: {
          rss: `${Math.round(checks.memory.rss / 1024 / 1024)}MB`,
          heapUsed: `${Math.round(checks.memory.heapUsed / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(checks.memory.heapTotal / 1024 / 1024)}MB`
        }
      }
    }
    
    // Return appropriate status code
    const statusCode = hasErrors ? 503 : 200
    
    return createSuccessResponse(healthStatus, statusCode)
    
  } catch (error) {
    console.error('Health check error:', error)
    return createErrorResponse(error instanceof Error ? error : new Error(String(error)))
  }
}

// =============================================================================
// Service Health Checks
// =============================================================================

async function checkSupabase(): Promise<{ status: string; responseTime?: number }> {
  const startTime = Date.now()
  
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return { status: 'not_configured' }
    }
    
    // Simple connectivity check
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
      method: 'HEAD',
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`
      }
    })
    
    const responseTime = Date.now() - startTime
    
    return {
      status: response.ok ? 'healthy' : 'error',
      responseTime
    }
  } catch (error) {
    return {
      status: 'error',
      responseTime: Date.now() - startTime
    }
  }
}

async function checkOpenAI(): Promise<{ status: string; responseTime?: number }> {
  const startTime = Date.now()
  
  try {
    if (!process.env.OPENAI_API_KEY) {
      return { status: 'not_configured' }
    }
    
    // Simple API key validation
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    })
    
    const responseTime = Date.now() - startTime
    
    return {
      status: response.ok ? 'healthy' : 'error',
      responseTime
    }
  } catch (error) {
    return {
      status: 'error',
      responseTime: Date.now() - startTime
    }
  }
}

async function checkQdrant(): Promise<{ status: string; responseTime?: number }> {
  const startTime = Date.now()
  
  try {
    if (!process.env.QDRANT_URL) {
      return { status: 'not_configured' }
    }
    
    // Simple connectivity check
    const response = await fetch(`${process.env.QDRANT_URL}/health`, {
      method: 'GET',
      headers: process.env.QDRANT_API_KEY ? {
        'api-key': process.env.QDRANT_API_KEY
      } : {}
    })
    
    const responseTime = Date.now() - startTime
    
    return {
      status: response.ok ? 'healthy' : 'error',
      responseTime
    }
  } catch (error) {
    return {
      status: 'error',
      responseTime: Date.now() - startTime
    }
  }
}

async function checkRedis(): Promise<{ status: string; responseTime?: number }> {
  const startTime = Date.now()
  
  try {
    if (!process.env.UPSTASH_REDIS_REST_URL) {
      return { status: 'not_configured' }
    }
    
    // Simple connectivity check using Upstash REST API
    const response = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/ping`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`
      }
    })
    
    const responseTime = Date.now() - startTime
    
    return {
      status: response.ok ? 'healthy' : 'error',
      responseTime
    }
  } catch (error) {
    return {
      status: 'error',
      responseTime: Date.now() - startTime
    }
  }
}