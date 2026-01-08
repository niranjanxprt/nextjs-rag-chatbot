/**
 * API Endpoints Tester
 *
 * Tests all API routes for proper functionality
 */

import http from 'http'
import https from 'https'
import { URL } from 'url'

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
} as const

interface RequestOptions {
  method?: string
  headers?: Record<string, string>
  body?: string | object
  timeout?: number
}

interface ApiResponse {
  statusCode: number
  headers: http.IncomingHttpHeaders
  data: any
}

interface ApiEndpoint {
  name: string
  path: string
  method: string
  body?: object
  expectedStatus: number | number[]
  critical: boolean
}

interface HealthResponseData {
  status?: string
  timestamp?: string
  services?: Record<string, { status: string }>
}

function logSuccess(message: string): void {
  console.log(`${colors.green}✅ ${message}${colors.reset}`)
}

function logError(message: string): void {
  console.log(`${colors.red}❌ ${message}${colors.reset}`)
}

function logWarning(message: string): void {
  console.log(`${colors.yellow}⚠️  ${message}${colors.reset}`)
}

function logInfo(message: string): void {
  console.log(`${colors.blue}ℹ️  ${message}${colors.reset}`)
}

async function makeRequest(url: string, options: RequestOptions = {}): Promise<ApiResponse> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url)
    const client = urlObj.protocol === 'https:' ? https : http

    const requestOptions: http.RequestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'NextJS-RAG-Test-Suite/1.0',
        ...options.headers,
      },
      timeout: options.timeout || 10000,
    }

    const req = client.request(requestOptions, res => {
      let data = ''
      res.on('data', chunk => (data += chunk))
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {}
          resolve({
            statusCode: res.statusCode || 0,
            headers: res.headers,
            data: jsonData,
          })
        } catch (error) {
          resolve({
            statusCode: res.statusCode || 0,
            headers: res.headers,
            data: data,
          })
        }
      })
    })

    req.on('error', reject)
    req.on('timeout', () => reject(new Error('Request timeout')))

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body))
    }

    req.end()
  })
}

async function testAPIs(baseUrl: string): Promise<boolean> {
  console.log('🌐 Testing API endpoints...\n')

  let allPassed = true
  const results: boolean[] = []

  // Define API endpoints to test
  const endpoints: ApiEndpoint[] = [
    {
      name: 'Health Check',
      path: '/api/health',
      method: 'GET',
      expectedStatus: 200,
      critical: true,
    },
    {
      name: 'Monitoring Health',
      path: '/api/monitoring/health',
      method: 'GET',
      expectedStatus: 200,
      critical: false,
    },
    {
      name: 'Monitoring Metrics',
      path: '/api/monitoring/metrics',
      method: 'GET',
      expectedStatus: 200,
      critical: false,
    },
    {
      name: 'Cache Status',
      path: '/api/cache',
      method: 'GET',
      expectedStatus: 200,
      critical: false,
    },
    {
      name: 'Documents List',
      path: '/api/documents',
      method: 'GET',
      expectedStatus: [200, 401], // May require auth
      critical: true,
    },
    {
      name: 'Search Endpoint',
      path: '/api/search',
      method: 'POST',
      body: { query: 'test search' },
      expectedStatus: [200, 400, 401],
      critical: true,
    },
    {
      name: 'Conversations List',
      path: '/api/conversations',
      method: 'GET',
      expectedStatus: [200, 401],
      critical: true,
    },
  ]

  // Test each endpoint
  for (const endpoint of endpoints) {
    console.log(`🔍 Testing ${endpoint.name}:`)

    try {
      const response = await makeRequest(`${baseUrl}${endpoint.path}`, {
        method: endpoint.method,
        body: endpoint.body,
        timeout: 15000,
      })

      const expectedStatuses = Array.isArray(endpoint.expectedStatus)
        ? endpoint.expectedStatus
        : [endpoint.expectedStatus]

      if (expectedStatuses.includes(response.statusCode)) {
        logSuccess(`${endpoint.name} - Status: ${response.statusCode}`)
        results.push(true)
      } else {
        logError(
          `${endpoint.name} - Expected: ${expectedStatuses.join(' or ')}, Got: ${response.statusCode}`
        )
        if (endpoint.critical) {
          allPassed = false
        }
        results.push(!endpoint.critical)
      }

      // Additional validation for specific endpoints
      if (endpoint.path === '/api/health' && response.statusCode === 200) {
        validateHealthResponse(response.data)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logError(`${endpoint.name} - Request failed: ${errorMessage}`)
      if (endpoint.critical) {
        allPassed = false
      }
      results.push(!endpoint.critical)
    }
  }

  // Test error handling
  console.log('\n🚨 Testing Error Handling:')
  await testErrorHandling(baseUrl)

  // Test rate limiting (if implemented)
  console.log('\n⏱️  Testing Rate Limiting:')
  await testRateLimiting(baseUrl)

  // Test CORS headers
  console.log('\n🌍 Testing CORS Configuration:')
  await testCORS(baseUrl)

  return allPassed
}

function validateHealthResponse(data: HealthResponseData): void {
  const requiredFields: (keyof HealthResponseData)[] = ['status', 'timestamp', 'services']

  for (const field of requiredFields) {
    if (data[field] !== undefined) {
      logSuccess(`Health response contains ${field}`)
    } else {
      logWarning(`Health response missing ${field}`)
    }
  }

  if (data.services) {
    const services = ['database', 'openai', 'vectordb', 'cache']
    for (const service of services) {
      if (data.services[service]) {
        const status = data.services[service].status
        if (status === 'healthy') {
          logSuccess(`${service} service is healthy`)
        } else {
          logWarning(`${service} service status: ${status}`)
        }
      }
    }
  }
}

async function testErrorHandling(baseUrl: string): Promise<void> {
  const errorTests = [
    {
      name: 'Invalid JSON',
      path: '/api/search',
      method: 'POST',
      body: 'invalid json',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      name: 'Non-existent endpoint',
      path: '/api/nonexistent',
      method: 'GET',
    },
    {
      name: 'Invalid method',
      path: '/api/health',
      method: 'DELETE',
    },
  ]

  for (const test of errorTests) {
    try {
      const response = await makeRequest(`${baseUrl}${test.path}`, {
        method: test.method,
        body: test.body,
        headers: test.headers,
      })

      if (response.statusCode >= 400 && response.statusCode < 500) {
        logSuccess(`${test.name} - Properly returns error status: ${response.statusCode}`)
      } else {
        logWarning(`${test.name} - Unexpected status: ${response.statusCode}`)
      }
    } catch (error) {
      logInfo(`${test.name} - Connection error (expected for some tests)`)
    }
  }
}

async function testRateLimiting(baseUrl: string): Promise<void> {
  // Test multiple rapid requests to see if rate limiting is in place
  const requests: Promise<ApiResponse>[] = []
  const testPath = '/api/health'

  for (let i = 0; i < 10; i++) {
    requests.push(makeRequest(`${baseUrl}${testPath}`))
  }

  try {
    const responses = await Promise.all(requests)
    const rateLimited = responses.some(r => r.statusCode === 429)

    if (rateLimited) {
      logSuccess('Rate limiting is active')
    } else {
      logInfo('No rate limiting detected (may not be implemented)')
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logWarning(`Rate limiting test failed: ${errorMessage}`)
  }
}

async function testCORS(baseUrl: string): Promise<void> {
  try {
    const response = await makeRequest(`${baseUrl}/api/health`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:3000',
        'Access-Control-Request-Method': 'GET',
      },
    })

    if (response.headers['access-control-allow-origin']) {
      logSuccess('CORS headers present')
    } else {
      logInfo('CORS headers not detected (may be handled by framework)')
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logWarning(`CORS test failed: ${errorMessage}`)
  }
}

export { testAPIs }
