/**
 * Environment Variables Validator
 * 
 * Validates all required and optional environment variables
 * Tests external service connections
 */

import fs from 'fs'
import { execSync } from 'child_process'

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
} as const

function logSuccess(message: string): void {
  console.log(`${colors.green}✅ ${message}${colors.reset}`)
}

function logError(message: string): void {
  console.log(`${colors.red}❌ ${message}${colors.reset}`)
}

function logWarning(message: string): void {
  console.log(`${colors.yellow}⚠️  ${message}${colors.reset}`)
}

async function validateEnvironment(): Promise<boolean> {
  console.log('🔍 Validating environment variables and dependencies...\n')

  let allValid = true

  // Required environment variables
  const requiredVars = [
    'OPENAI_API_KEY',
    'NEXT_PUBLIC_SUPABASE_URL', 
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ]

  // Optional but recommended variables
  const optionalVars = [
    'QDRANT_URL',
    'QDRANT_API_KEY', 
    'QDRANT_COLLECTION_NAME',
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN'
  ]

  // Check required variables
  console.log('📋 Required Environment Variables:')
  for (const varName of requiredVars) {
    if (process.env[varName]) {
      logSuccess(`${varName} is configured`)
    } else {
      logError(`${varName} is missing`)
      allValid = false
    }
  }

  // Check optional variables
  console.log('\n📋 Optional Environment Variables:')
  for (const varName of optionalVars) {
    if (process.env[varName]) {
      logSuccess(`${varName} is configured`)
    } else {
      logWarning(`${varName} is not set (optional but recommended)`)
    }
  }

  // Check dependencies
  console.log('\n📦 Dependencies Check:')
  
  if (!fs.existsSync('node_modules')) {
    logError('node_modules not found. Run: npm install')
    allValid = false
  } else {
    logSuccess('node_modules exists')
  }

  if (!fs.existsSync('package.json')) {
    logError('package.json not found')
    allValid = false
  } else {
    logSuccess('package.json exists')
  }

  // Test external service connections
  console.log('\n🌐 External Service Connections:')
  
  // Test Supabase connection
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const supabaseTest = await testSupabaseConnection()
      if (supabaseTest) {
        logSuccess('Supabase connection successful')
      } else {
        logError('Supabase connection failed')
        allValid = false
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logError(`Supabase connection error: ${errorMessage}`)
      allValid = false
    }
  } else {
    logError('Supabase credentials missing - cannot test connection')
    allValid = false
  }

  // Test OpenAI connection
  if (process.env.OPENAI_API_KEY) {
    try {
      const openaiTest = await testOpenAIConnection()
      if (openaiTest) {
        logSuccess('OpenAI connection successful')
      } else {
        logError('OpenAI connection failed')
        allValid = false
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logError(`OpenAI connection error: ${errorMessage}`)
      allValid = false
    }
  } else {
    logError('OpenAI API key missing - cannot test connection')
    allValid = false
  }

  // Test Qdrant connection (optional)
  if (process.env.QDRANT_URL && process.env.QDRANT_API_KEY) {
    try {
      const qdrantTest = await testQdrantConnection()
      if (qdrantTest) {
        logSuccess('Qdrant connection successful')
      } else {
        logWarning('Qdrant connection failed (optional service)')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logWarning(`Qdrant connection error: ${errorMessage} (optional service)`)
    }
  } else {
    logWarning('Qdrant credentials not configured (optional service)')
  }

  // Test Redis connection (optional)
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      const redisTest = await testRedisConnection()
      if (redisTest) {
        logSuccess('Redis connection successful')
      } else {
        logWarning('Redis connection failed (optional service)')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logWarning(`Redis connection error: ${errorMessage} (optional service)`)
    }
  } else {
    logWarning('Redis credentials not configured (optional service)')
  }

  return allValid
}

async function testSupabaseConnection(): Promise<boolean> {
  const testScript = `
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function test() {
  try {
    const { data, error } = await supabase.from('profiles').select('count').limit(1)
    if (error && error.code !== 'PGRST116') {
      throw error
    }
    return true
  } catch (err) {
    console.error('Supabase test failed:', err.message)
    return false
  }
}

test().then(success => process.exit(success ? 0 : 1))
`
  
  try {
    fs.writeFileSync('temp-supabase-test.js', testScript)
    execSync('node temp-supabase-test.js', { stdio: 'pipe' })
    fs.unlinkSync('temp-supabase-test.js')
    return true
  } catch (error) {
    if (fs.existsSync('temp-supabase-test.js')) {
      fs.unlinkSync('temp-supabase-test.js')
    }
    return false
  }
}

async function testOpenAIConnection(): Promise<boolean> {
  const testScript = `
const OpenAI = require('openai')

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

async function test() {
  try {
    await openai.models.list()
    return true
  } catch (err) {
    console.error('OpenAI test failed:', err.message)
    return false
  }
}

test().then(success => process.exit(success ? 0 : 1))
`
  
  try {
    fs.writeFileSync('temp-openai-test.js', testScript)
    execSync('node temp-openai-test.js', { stdio: 'pipe' })
    fs.unlinkSync('temp-openai-test.js')
    return true
  } catch (error) {
    if (fs.existsSync('temp-openai-test.js')) {
      fs.unlinkSync('temp-openai-test.js')
    }
    return false
  }
}

async function testQdrantConnection(): Promise<boolean> {
  const testScript = `
const { QdrantClient } = require('@qdrant/js-client-rest')

const client = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY
})

async function test() {
  try {
    await client.getCollections()
    return true
  } catch (err) {
    console.error('Qdrant test failed:', err.message)
    return false
  }
}

test().then(success => process.exit(success ? 0 : 1))
`
  
  try {
    fs.writeFileSync('temp-qdrant-test.js', testScript)
    execSync('node temp-qdrant-test.js', { stdio: 'pipe' })
    fs.unlinkSync('temp-qdrant-test.js')
    return true
  } catch (error) {
    if (fs.existsSync('temp-qdrant-test.js')) {
      fs.unlinkSync('temp-qdrant-test.js')
    }
    return false
  }
}

async function testRedisConnection(): Promise<boolean> {
  const testScript = `
const { Redis } = require('@upstash/redis')

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN
})

async function test() {
  try {
    await redis.ping()
    return true
  } catch (err) {
    console.error('Redis test failed:', err.message)
    return false
  }
}

test().then(success => process.exit(success ? 0 : 1))
`
  
  try {
    fs.writeFileSync('temp-redis-test.js', testScript)
    execSync('node temp-redis-test.js', { stdio: 'pipe' })
    fs.unlinkSync('temp-redis-test.js')
    return true
  } catch (error) {
    if (fs.existsSync('temp-redis-test.js')) {
      fs.unlinkSync('temp-redis-test.js')
    }
    return false
  }
}

export { validateEnvironment }