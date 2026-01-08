#!/usr/bin/env tsx

/**
 * Environment Variable Validation Script
 * Validates all required environment variables before app starts
 */

import { config } from 'dotenv'
import path from 'path'

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
}

function log(message: string, color: keyof typeof colors = 'reset'): void {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

async function main(): Promise<void> {
  log('\n🔍 Validating Environment Variables...\n', 'bold')

  // Load .env.local (this is where local overrides go)
  const envPath = path.join(process.cwd(), '.env.local')
  config({ path: envPath })

  const requiredVars = [
    'OPENAI_API_KEY',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'QDRANT_URL',
    'QDRANT_API_KEY',
    'QDRANT_COLLECTION_NAME',
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
  ]

  const optionalVars = [
    'LANGFUSE_PUBLIC_KEY',
    'LANGFUSE_SECRET_KEY',
    'LANGFUSE_BASE_URL',
  ]

  let allPresent = true
  const missing: string[] = []
  const present: string[] = []

  // Check required variables
  log('📋 Required Variables:', 'bold')
  for (const varName of requiredVars) {
    if (process.env[varName]) {
      present.push(varName)
      log(`✅ ${varName}`, 'green')
    } else {
      missing.push(varName)
      log(`❌ ${varName} - MISSING`, 'red')
      allPresent = false
    }
  }

  // Check optional variables
  log('\n📋 Optional Variables:', 'yellow')
  for (const varName of optionalVars) {
    if (process.env[varName]) {
      log(`✅ ${varName}`, 'green')
    } else {
      log(`⚠️  ${varName} - Not set (optional)`, 'yellow')
    }
  }

  // Summary
  log('\n' + '='.repeat(50), 'reset')
  log(`Total Required: ${requiredVars.length}`, 'reset')
  log(`Present: ${present.length}`, 'green')
  log(`Missing: ${missing.length}`, 'red')

  if (!allPresent) {
    log('\n❌ Environment validation FAILED', 'red')
    log('\n💡 Action Required:', 'yellow')
    log('1. Check your .env.local file exists at: ' + envPath, 'yellow')
    log('2. Copy missing variables from .env to .env.local:', 'yellow')
    missing.forEach(v => log(`   - ${v}`, 'yellow'))
    log('3. Ensure all API keys and URLs are correctly set', 'yellow')
    log('4. Run this script again: npm run validate:env', 'yellow')
    process.exit(1)
  }

  log('\n✅ Environment validation PASSED', 'green')
  log('All required variables are present!\n', 'green')
  process.exit(0)
}

main().catch((error) => {
  log(`\n❌ Validation script error: ${error.message}`, 'red')
  process.exit(1)
})
