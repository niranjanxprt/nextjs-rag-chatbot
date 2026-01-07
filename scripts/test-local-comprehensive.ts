#!/usr/bin/env node

/**
 * Comprehensive Local Testing Script for Next.js RAG Chatbot
 * 
 * Validates entire application before Vercel deployment including:
 * - Environment validation
 * - Build testing  
 * - API endpoint testing
 * - Feature validation
 * - Performance checks
 */

import { execSync, spawn, ChildProcess } from 'child_process'
import fs from 'fs'
import path from 'path'
import http from 'http'

// Import test modules
import { validateEnvironment } from './test-modules/env-validator.js'
import { testBuild } from './test-modules/build-tester.js'
import { testAPIs } from './test-modules/api-tester.js'
import { testFeatures } from './test-modules/feature-tester.js'

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
} as const

type ColorKey = keyof typeof colors

interface CommandResult {
  success: boolean
  output?: string
  error?: string
}

interface CommandOptions {
  silent?: boolean
  timeout?: number
}

interface TestReport {
  timestamp: string
  environment: string
  phases: {
    environment: boolean
    build: boolean
    api: boolean
    features: boolean
  }
  summary: {
    total: number
    passed: number
    failed: number
  }
}

function log(message: string, color: ColorKey = 'reset'): void {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logStep(step: string, message: string): void {
  log(`\n${colors.bold}[${step}]${colors.reset} ${message}`, 'blue')
}

function logSuccess(message: string): void {
  log(`✅ ${message}`, 'green')
}

function logError(message: string): void {
  log(`❌ ${message}`, 'red')
}

function logWarning(message: string): void {
  log(`⚠️  ${message}`, 'yellow')
}

function logInfo(message: string): void {
  log(`ℹ️  ${message}`, 'cyan')
}

async function runCommand(command: string, description: string, options: CommandOptions = {}): Promise<CommandResult> {
  try {
    log(`Running: ${command}`)
    const output = execSync(command, { 
      encoding: 'utf8', 
      stdio: options.silent ? 'pipe' : 'inherit',
      timeout: options.timeout || 60000
    })
    logSuccess(`${description} - OK`)
    return { success: true, output }
  } catch (error) {
    logError(`${description} - FAILED`)
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (!options.silent) {
      log(`Error: ${errorMessage}`, 'red')
    }
    return { success: false, error: errorMessage }
  }
}

async function waitForServer(url: string, timeout: number = 30000): Promise<boolean> {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    try {
      await new Promise<number>((resolve, reject) => {
        const req = http.get(url, (res) => {
          resolve(res.statusCode || 0)
        })
        req.on('error', reject)
        req.setTimeout(5000, () => reject(new Error('Timeout')))
      })
      return true
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
  return false
}

async function startDevServerForTesting(): Promise<ChildProcess> {
  logInfo('Starting development server for API testing...')
  
  const server = spawn('npm', ['run', 'dev'], {
    stdio: 'pipe',
    env: { ...process.env, NODE_ENV: 'development' }
  })

  // Wait for server to start
  const serverReady = await waitForServer('http://localhost:3000')
  if (!serverReady) {
    server.kill()
    throw new Error('Development server failed to start within timeout')
  }

  logSuccess('Development server started on http://localhost:3000')
  return server
}

async function main(): Promise<number> {
  log(`${colors.bold}🚀 Next.js RAG Chatbot - Comprehensive Testing Suite${colors.reset}`)
  log('Validating entire application before Vercel deployment...\n')

  const results: boolean[] = []
  let devServer: ChildProcess | null = null

  try {
    // Load environment variables
    if (fs.existsSync('.env.local')) {
      try {
        const dotenv = await import('dotenv')
        dotenv.config({ path: '.env.local' })
        logInfo('Loaded environment variables from .env.local')
      } catch (error) {
        // If dotenv is not installed, try to load manually
        const envContent = fs.readFileSync('.env.local', 'utf8')
        const envLines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'))
        
        for (const line of envLines) {
          const [key, ...valueParts] = line.split('=')
          if (key && valueParts.length > 0) {
            process.env[key.trim()] = valueParts.join('=').trim()
          }
        }
        logInfo('Loaded environment variables manually (dotenv not available)')
      }
    } else {
      logWarning('No .env.local file found - using system environment variables')
    }

    // Phase 1: Environment & Dependencies
    logStep('PHASE 1', 'Environment & Dependencies Validation')
    const envResult = await validateEnvironment()
    results.push(envResult)

    // Phase 2: Build & Code Quality
    logStep('PHASE 2', 'Build & Code Quality Testing')
    const buildResult = await testBuild()
    results.push(buildResult)

    // Phase 3: API Endpoints (requires dev server)
    logStep('PHASE 3', 'API Endpoints Testing')
    try {
      devServer = await startDevServerForTesting()
      await new Promise(resolve => setTimeout(resolve, 3000)) // Give server time to fully start
      
      const apiResult = await testAPIs('http://localhost:3000')
      results.push(apiResult)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logError(`Failed to start dev server for API testing: ${errorMessage}`)
      results.push(false)
    }

    // Phase 4: Feature Integration
    logStep('PHASE 4', 'Feature Integration Testing')
    const featureResult = await testFeatures(devServer ? 'http://localhost:3000' : undefined)
    results.push(featureResult)

    // Generate comprehensive report
    await generateTestReport(results)

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logError(`Testing suite failed: ${errorMessage}`)
    results.push(false)
  } finally {
    // Cleanup
    if (devServer) {
      logInfo('Stopping development server...')
      devServer.kill()
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }

  // Final summary
  const passed = results.filter(Boolean).length
  const total = results.length

  logStep('FINAL SUMMARY', 'Test Results')
  if (passed === total) {
    logSuccess(`All ${total} test phases passed! ✨`)
    log('\n🎉 Your application is ready for deployment!')
    log('\nRecommended next steps:')
    log('1. Review the detailed test report above')
    log('2. Run manual testing with: npm run dev')
    log('3. Deploy to Vercel with: vercel --prod')
    return 0
  } else {
    logError(`${passed}/${total} test phases passed`)
    log('\n❌ Please fix the failing tests before deploying')
    log('Check the detailed report above for specific issues')
    return 1
  }
}

async function generateTestReport(results: boolean[]): Promise<void> {
  logStep('REPORT', 'Generating Test Report')
  
  const report: TestReport = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    phases: {
      environment: results[0] || false,
      build: results[1] || false,
      api: results[2] || false,
      features: results[3] || false
    },
    summary: {
      total: results.length,
      passed: results.filter(Boolean).length,
      failed: results.filter(r => !r).length
    }
  }

  // Save report to file
  const reportPath = path.join(process.cwd(), 'test-report.json')
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
  logSuccess(`Test report saved to: ${reportPath}`)

  // Display summary
  log('\n📊 Test Phase Summary:')
  log(`Environment & Dependencies: ${report.phases.environment ? '✅ PASS' : '❌ FAIL'}`)
  log(`Build & Code Quality: ${report.phases.build ? '✅ PASS' : '❌ FAIL'}`)
  log(`API Endpoints: ${report.phases.api ? '✅ PASS' : '❌ FAIL'}`)
  log(`Feature Integration: ${report.phases.features ? '✅ PASS' : '❌ FAIL'}`)
}

// Error handling
process.on('uncaughtException', (error: Error) => {
  logError(`Uncaught exception: ${error.message}`)
  process.exit(1)
})

process.on('unhandledRejection', (error: Error) => {
  logError(`Unhandled rejection: ${error.message}`)
  process.exit(1)
})

process.on('SIGINT', () => {
  logInfo('Received SIGINT, cleaning up...')
  process.exit(0)
})

if (require.main === module) {
  main().then(exitCode => {
    process.exit(exitCode)
  }).catch((error: Error) => {
    logError(`Script failed: ${error.message}`)
    process.exit(1)
  })
}

export { main, runCommand, log, logSuccess, logError, logWarning, logInfo }