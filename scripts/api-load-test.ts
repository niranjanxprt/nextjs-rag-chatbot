/**
 * API Load Test Script
 *
 * Tests the actual API endpoints to ensure they don't get stuck
 */

import { performance } from 'perf_hooks'

// Configuration
const TEST_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  maxConcurrentRequests: 5,
  requestTimeout: 10000, // 10 seconds
  testDuration: 30000, // 30 seconds
}

interface TestResult {
  endpoint: string
  method: string
  status: number
  duration: number
  error?: string
}

class APILoadTester {
  private results: TestResult[] = []
  private activeRequests = 0
  private startTime = 0

  async runTest(): Promise<void> {
    console.log('🚀 Starting API Load Test...')
    console.log(`Base URL: ${TEST_CONFIG.baseURL}`)
    console.log(`Max Concurrent: ${TEST_CONFIG.maxConcurrentRequests}`)
    console.log(`Test Duration: ${TEST_CONFIG.testDuration}ms`)
    console.log('---')

    this.startTime = performance.now()

    // Start concurrent test loops
    const testPromises = Array.from({ length: TEST_CONFIG.maxConcurrentRequests }, (_, i) =>
      this.testLoop(i)
    )

    // Wait for test duration
    await Promise.race([
      Promise.all(testPromises),
      new Promise(resolve => setTimeout(resolve, TEST_CONFIG.testDuration)),
    ])

    this.printResults()
  }

  private async testLoop(workerId: number): Promise<void> {
    while (performance.now() - this.startTime < TEST_CONFIG.testDuration) {
      try {
        // Test health endpoint
        await this.testEndpoint('GET', '/api/health', workerId)

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 100))

        // Test auth endpoint (should fail without auth, but shouldn't hang)
        await this.testEndpoint('POST', '/api/chat', workerId, {
          messages: [{ role: 'user', content: 'test' }],
        })

        await new Promise(resolve => setTimeout(resolve, 200))
      } catch (error) {
        console.error(`Worker ${workerId} error:`, error)
        break
      }
    }
  }

  private async testEndpoint(
    method: string,
    endpoint: string,
    workerId: number,
    body?: any
  ): Promise<void> {
    const startTime = performance.now()
    this.activeRequests++

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), TEST_CONFIG.requestTimeout)

      const response = await fetch(`${TEST_CONFIG.baseURL}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const duration = performance.now() - startTime

      this.results.push({
        endpoint,
        method,
        status: response.status,
        duration,
      })

      console.log(
        `✅ Worker ${workerId}: ${method} ${endpoint} - ${response.status} (${duration.toFixed(2)}ms)`
      )
    } catch (error) {
      const duration = performance.now() - startTime
      const errorMessage = error instanceof Error ? error.message : String(error)

      this.results.push({
        endpoint,
        method,
        status: 0,
        duration,
        error: errorMessage,
      })

      console.log(
        `❌ Worker ${workerId}: ${method} ${endpoint} - ERROR: ${errorMessage} (${duration.toFixed(2)}ms)`
      )
    } finally {
      this.activeRequests--
    }
  }

  private printResults(): void {
    console.log('\n📊 Test Results Summary')
    console.log('='.repeat(50))

    const totalRequests = this.results.length
    const successfulRequests = this.results.filter(r => r.status > 0 && r.status < 400).length
    const errorRequests = this.results.filter(r => r.error || r.status >= 400).length

    console.log(`Total Requests: ${totalRequests}`)
    console.log(`Successful: ${successfulRequests}`)
    console.log(`Errors: ${errorRequests}`)
    console.log(`Success Rate: ${((successfulRequests / totalRequests) * 100).toFixed(2)}%`)

    // Response time statistics
    const durations = this.results.map(r => r.duration)
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length
    const maxDuration = Math.max(...durations)
    const minDuration = Math.min(...durations)

    console.log(`\nResponse Times:`)
    console.log(`  Average: ${avgDuration.toFixed(2)}ms`)
    console.log(`  Min: ${minDuration.toFixed(2)}ms`)
    console.log(`  Max: ${maxDuration.toFixed(2)}ms`)

    // Check for stuck instances (requests taking too long)
    const stuckRequests = this.results.filter(r => r.duration > 5000) // > 5 seconds
    if (stuckRequests.length > 0) {
      console.log(`\n⚠️  Potentially Stuck Requests: ${stuckRequests.length}`)
      stuckRequests.forEach(r => {
        console.log(`  ${r.method} ${r.endpoint}: ${r.duration.toFixed(2)}ms`)
      })
    } else {
      console.log(`\n✅ No stuck instances detected!`)
    }

    // Error breakdown
    if (errorRequests > 0) {
      console.log(`\nError Breakdown:`)
      const errorTypes = new Map<string, number>()
      this.results
        .filter(r => r.error)
        .forEach(r => {
          const errorType = r.error || 'Unknown'
          errorTypes.set(errorType, (errorTypes.get(errorType) || 0) + 1)
        })

      errorTypes.forEach((count, error) => {
        console.log(`  ${error}: ${count}`)
      })
    }
  }
}

// Health check endpoint test
async function testHealthEndpoint(): Promise<boolean> {
  try {
    console.log('🔍 Testing health endpoint...')

    const response = await fetch(`${TEST_CONFIG.baseURL}/api/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    })

    if (response.ok) {
      console.log('✅ Health endpoint is responding')
      return true
    } else {
      console.log(`❌ Health endpoint returned ${response.status}`)
      return false
    }
  } catch (error) {
    console.log(`❌ Health endpoint error: ${error}`)
    return false
  }
}

// Main execution
async function main(): Promise<void> {
  try {
    // First check if server is running
    const isHealthy = await testHealthEndpoint()

    if (!isHealthy) {
      console.log('⚠️  Server may not be running. Starting load test anyway...')
    }

    // Run load test
    const tester = new APILoadTester()
    await tester.runTest()

    console.log('\n🎉 Load test completed!')
  } catch (error) {
    console.error('❌ Load test failed:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

export { APILoadTester, testHealthEndpoint }
