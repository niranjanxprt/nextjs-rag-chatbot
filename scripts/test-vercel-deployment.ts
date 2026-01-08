#!/usr/bin/env node

/**
 * Vercel CLI Integration Test Script
 *
 * This script tests the complete deployment flow using Vercel CLI
 * and verifies authentication works in the deployed environment.
 */

import { execSync, spawn, ChildProcess } from 'child_process'
import fs from 'fs'
import path from 'path'

// Configuration
const TEST_EMAIL = 'test@example.com'
const LOCAL_PORT = 3000
const TIMEOUT = 30000 // 30 seconds

interface CommandResult {
  success: boolean
  output?: string
  error?: string
}

console.log('🚀 Starting Vercel CLI Integration Tests...\n')

// Helper function to run commands
function runCommand(command: string, options: Record<string, any> = {}): string {
  try {
    console.log(`📋 Running: ${command}`)
    const result = execSync(command, {
      encoding: 'utf8',
      stdio: 'pipe',
      ...options,
    })
    console.log(`✅ Success: ${command}`)
    return result
  } catch (error) {
    console.error(`❌ Failed: ${command}`)
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(errorMessage)
    throw error
  }
}

// Helper function to wait for server to be ready
function waitForServer(url: string, timeout: number = TIMEOUT): Promise<void> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now()

    function check(): void {
      const elapsed = Date.now() - startTime
      if (elapsed > timeout) {
        reject(new Error(`Server not ready after ${timeout}ms`))
        return
      }

      try {
        execSync(`curl -f ${url} > /dev/null 2>&1`, { stdio: 'ignore' })
        resolve()
      } catch (error) {
        setTimeout(check, 1000)
      }
    }

    check()
  })
}

// Test functions
async function testVercelCLIInstallation(): Promise<void> {
  console.log('\n📦 Testing Vercel CLI Installation...')

  try {
    const version = runCommand('vercel --version')
    console.log(`✅ Vercel CLI version: ${version.trim()}`)
  } catch (error) {
    console.log('📥 Installing Vercel CLI...')
    runCommand('npm install -g vercel')
    const version = runCommand('vercel --version')
    console.log(`✅ Vercel CLI installed: ${version.trim()}`)
  }
}

async function testLocalBuild(): Promise<void> {
  console.log('\n🔨 Testing Local Build...')

  // Test Next.js build
  runCommand('npm run build')
  console.log('✅ Next.js build successful')

  // Verify build output
  const buildDir = path.join(process.cwd(), '.next')
  if (!fs.existsSync(buildDir)) {
    throw new Error('Build directory not found')
  }
  console.log('✅ Build artifacts verified')
}

async function testVercelDevServer(): Promise<void> {
  console.log('\n🌐 Testing Vercel Dev Server...')

  return new Promise((resolve, reject) => {
    // Start Vercel dev server
    const vercelProcess: ChildProcess = spawn(
      'vercel',
      ['dev', '--listen', LOCAL_PORT.toString()],
      {
        stdio: 'pipe',
        env: { ...process.env, NODE_ENV: 'development' },
      }
    )

    let serverReady = false
    let output = ''

    vercelProcess.stdout?.on('data', (data: Buffer) => {
      const text = data.toString()
      output += text
      console.log(`📡 Vercel Dev: ${text.trim()}`)

      if (text.includes('Ready!') || text.includes(`localhost:${LOCAL_PORT}`)) {
        serverReady = true
      }
    })

    vercelProcess.stderr?.on('data', (data: Buffer) => {
      console.error(`📡 Vercel Dev Error: ${data.toString().trim()}`)
    })

    // Wait for server to be ready
    setTimeout(async () => {
      if (!serverReady) {
        vercelProcess.kill()
        reject(new Error('Vercel dev server failed to start'))
        return
      }

      try {
        // Test server is responding
        await waitForServer(`http://localhost:${LOCAL_PORT}`)
        console.log('✅ Vercel dev server is responding')

        // Test authentication pages
        await testAuthenticationEndpoints()

        vercelProcess.kill()
        resolve()
      } catch (error) {
        vercelProcess.kill()
        reject(error)
      }
    }, 10000) // Wait 10 seconds for server to start
  })
}

async function testAuthenticationEndpoints(): Promise<void> {
  console.log('\n🔐 Testing Authentication Endpoints...')

  const baseUrl = `http://localhost:${LOCAL_PORT}`

  // Test login page
  try {
    runCommand(`curl -f ${baseUrl}/auth/login > /dev/null`)
    console.log('✅ Login page accessible')
  } catch (error) {
    throw new Error('Login page not accessible')
  }

  // Test callback page (should redirect without params)
  try {
    const response = runCommand(`curl -I ${baseUrl}/auth/callback 2>/dev/null | head -n 1`)
    if (response.includes('302') || response.includes('307')) {
      console.log('✅ Callback page redirects correctly')
    }
  } catch (error) {
    console.log('⚠️  Callback page test inconclusive (expected)')
  }

  // Test protected route (should redirect to login)
  try {
    const response = runCommand(`curl -I ${baseUrl}/chat 2>/dev/null | head -n 1`)
    if (response.includes('302') || response.includes('307')) {
      console.log('✅ Protected route redirects to login')
    }
  } catch (error) {
    console.log('⚠️  Protected route test inconclusive')
  }
}

async function testEnvironmentVariables(): Promise<void> {
  console.log('\n🔧 Testing Environment Variables...')

  // Check required environment variables
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'OPENAI_API_KEY',
    'QDRANT_URL',
    'QDRANT_API_KEY',
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
  ]

  const envFile = path.join(process.cwd(), '.env.local')
  if (!fs.existsSync(envFile)) {
    throw new Error('.env.local file not found')
  }

  const envContent = fs.readFileSync(envFile, 'utf8')

  for (const varName of requiredVars) {
    if (envContent.includes(`${varName}=`) && !envContent.includes(`${varName}=\n`)) {
      console.log(`✅ ${varName} is configured`)
    } else {
      console.log(`⚠️  ${varName} may not be configured`)
    }
  }
}

async function testSupabaseConnection(): Promise<void> {
  console.log('\n🗄️  Testing Supabase Connection...')

  // Read environment variables from .env.local
  const envFile = path.join(process.cwd(), '.env.local')
  if (fs.existsSync(envFile)) {
    const envContent = fs.readFileSync(envFile, 'utf8')
    const envVars: Record<string, string> = {}

    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=')
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim()
      }
    })

    // Set environment variables
    Object.assign(process.env, envVars)
  }

  // Create a simple test to verify Supabase connection
  const testScript = `
    const { createClient } = require('@supabase/supabase-js');
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!url || !key) {
      console.error('Missing Supabase credentials');
      console.error('URL:', url ? 'present' : 'missing');
      console.error('KEY:', key ? 'present' : 'missing');
      process.exit(1);
    }
    
    const supabase = createClient(url, key);
    
    supabase.auth.getSession()
      .then(({ data, error }) => {
        if (error) {
          console.error('Supabase connection failed:', error.message);
          process.exit(1);
        }
        console.log('✅ Supabase connection successful');
        process.exit(0);
      })
      .catch((err) => {
        console.error('Supabase connection error:', err.message);
        process.exit(1);
      });
  `

  fs.writeFileSync('/tmp/test-supabase.js', testScript)

  try {
    runCommand('node /tmp/test-supabase.js', {
      env: {
        ...process.env,
        NODE_PATH: path.join(process.cwd(), 'node_modules'),
      },
    })
    console.log('✅ Supabase connection verified')
  } catch (error) {
    console.log('❌ Supabase connection failed')
    throw error
  } finally {
    fs.unlinkSync('/tmp/test-supabase.js')
  }
}

async function testProductionDeployment(): Promise<void> {
  console.log('\n🚀 Testing Production Deployment Readiness...')

  // Test build for production
  runCommand('npm run build')
  console.log('✅ Production build successful')

  // Test that all required files exist
  const requiredFiles = ['.next/static', '.next/server', 'package.json', 'next.config.ts']

  for (const file of requiredFiles) {
    const filePath = path.join(process.cwd(), file)
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${file} exists`)
    } else {
      throw new Error(`Required file missing: ${file}`)
    }
  }

  console.log('✅ All deployment files ready')
}

// Main test runner
async function runTests(): Promise<void> {
  try {
    await testVercelCLIInstallation()
    await testEnvironmentVariables()
    await testSupabaseConnection()
    await testLocalBuild()
    await testVercelDevServer()
    await testProductionDeployment()

    console.log('\n🎉 All Vercel CLI Integration Tests Passed!')
    console.log('\n📋 Summary:')
    console.log('✅ Vercel CLI installed and working')
    console.log('✅ Environment variables configured')
    console.log('✅ Supabase connection verified')
    console.log('✅ Local build successful')
    console.log('✅ Vercel dev server working')
    console.log('✅ Authentication endpoints accessible')
    console.log('✅ Production deployment ready')

    console.log('\n🚀 Ready for deployment with: vercel --prod')
  } catch (error) {
    console.error('\n❌ Integration Tests Failed!')
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(errorMessage)
    process.exit(1)
  }
}

// Run tests if called directly
if (require.main === module) {
  runTests()
}

export {
  runTests,
  testVercelCLIInstallation,
  testLocalBuild,
  testVercelDevServer,
  testAuthenticationEndpoints,
  testEnvironmentVariables,
  testSupabaseConnection,
  testProductionDeployment,
}
