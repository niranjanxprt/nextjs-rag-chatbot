import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '0.1.0',
      services: {
        supabase: {
          configured: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
          url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'missing',
        },
        openai: {
          configured: !!process.env.OPENAI_API_KEY,
        },
      },
    }

    return NextResponse.json(health, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function HEAD() {
  return new Response(null, { status: 200 })
}