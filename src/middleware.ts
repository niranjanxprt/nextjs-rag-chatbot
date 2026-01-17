import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Handle CORS for API routes (for Vite frontend)
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-ID',
          'Access-Control-Max-Age': '86400',
        },
      })
    }
    
    // Add CORS headers to API responses
    const response = NextResponse.next()
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-ID')
    
    // Skip auth check for health endpoint
    if (request.nextUrl.pathname.startsWith('/api/health')) {
      return response
    }
    
    return response
  }
  
  // Check for Convex session token
  const token = request.cookies.get('convex_token')?.value
  
  // Protected routes that require authentication
  const protectedPaths = ['/dashboard', '/documents', '/chat', '/projects', '/prompts']
  const isProtectedPath = protectedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  )
  
  // Redirect to login if accessing protected route without token
  if (isProtectedPath && !token) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }
  
  // Redirect to dashboard if accessing auth pages with valid token
  const authPaths = ['/auth/login', '/auth/signup']
  const isAuthPath = authPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  )
  
  if (isAuthPath && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/health (health check endpoint)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - static assets (svg, png, jpg, etc.)
     */
    '/((?!api/health|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
