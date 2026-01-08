#!/usr/bin/env tsx

/**
 * Enhanced Local Testing Script
 * Comprehensive testing before deployment
 */

import { execSync } from 'child_process'
import { config } from 'dotenv'
import path from 'path'

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
}

function log(message: string, color: keyof typeof colors = 'reset'): void {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

async function runCommand(command: string, description: string): Promise<boolean> {
  try {
    log(`\n▶️  ${description}...`, 'blue')
    execSync(command, { encoding: 'utf8', stdio: 'pipe', cwd: process.cwd() })
    log(`✅ ${description} - PASSED`, 'green')
    return true
  } catch (error) {
    log(`❌ ${description} - FAILED`, 'red')
    if (error instanceof Error && error.message) {
      log(`   Error: ${error.message.split('\n')[0]}`, 'red')
    }
    return false
  }
}

async function testServiceConnection(
  serviceName: string,
  testFn: () => Promise<boolean>
): Promise<boolean> {
  try {
    log(`\n▶️  Testing ${serviceName} connection...`, 'blue')
    const connected = await testFn()
    if (connected) {
      log(`✅ ${serviceName} connection - OK`, 'green')
      return true
    } else {
      log(`❌ ${serviceName} connection - FAILED`, 'red')
      return false
    }
  } catch (error) {
    log(`❌ ${serviceName} connection - ERROR: ${error instanceof Error ? error.message : String(error)}`, 'red')
    return false
  }
}

async function main(): Promise<void> {
  log('\n🚀 Enhanced Local Testing Suite\n', 'bold')

  // Load environment
  config({ path: path.join(process.cwd(), '.env.local') })

  const results: boolean[] = []

  // Step 1: Validate environment
  results.push(await runCommand('npm run validate:env', 'Environment Validation'))

  // Step 2: Type checking
  results.push(await runCommand('npm run type-check', 'TypeScript Type Check'))

  // Step 3: Linting
  results.push(await runCommand('npm run lint', 'ESLint Code Quality'))

  // Step 4: Unit tests
  results.push(await runCommand('npm test -- --passWithNoTests --silent 2>/dev/null', 'Unit Tests'))

  // Step 5: Build
  results.push(await runCommand('npm run build', 'Production Build'))

  // Step 6: External service connections
  log('\n🔌 Testing External Services...', 'bold')

  // Test Supabase
  results.push(
    await testServiceConnection('Supabase', async () => {
      try {
        const { createClient } = await import('@supabase/supabase-js')
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        // Just try to list tables to verify connection
        const { error } = await (supabase as any).from('profiles').select('count').limit(1)
        return !error
      } catch (error) {
        return false
      }
    })
  )

  // Test OpenAI
  results.push(
    await testServiceConnection('OpenAI', async () => {
      try {
        const { OpenAI } = await import('openai')
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
        await openai.models.list()
        return true
      } catch (error) {
        return false
      }
    })
  )

  // Test Qdrant
  results.push(
    await testServiceConnection('Qdrant', async () => {
      try {
        const response = await fetch(`${process.env.QDRANT_URL}/collections`, {
          headers: {
            'api-key': process.env.QDRANT_API_KEY!,
          },
        })
        return response.ok
      } catch (error) {
        return false
      }
    })
  )

  // Test Redis
  results.push(
    await testServiceConnection('Upstash Redis', async () => {
      try {
        const response = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/ping`, {
          headers: {
            Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN!}`,
          },
        })
        return response.ok
      } catch (error) {
        return false
      }
    })
  )

  // Summary
  const passed = results.filter(Boolean).length
  const total = results.length

  log('\n' + '='.repeat(50), 'reset')
  log(`\n📊 Test Results: ${passed}/${total} passed\n`, 'bold')

  if (passed === total) {
    log('🎉 All tests passed! Ready for deployment!\n', 'green')
    process.exit(0)
  } else {
    log('⚠️  Some tests failed. Please review the output above.\n', 'yellow')
    process.exit(passed === results.length - results.filter((_) => false).length ? 0 : 1)
  }
}

main().catch((error) => {
  log(`\n❌ Test script error: ${error.message}`, 'red')
  process.exit(1)
})
