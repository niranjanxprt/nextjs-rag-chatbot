#!/usr/bin/env tsx

/**
 * Local Testing Script for Next.js RAG Chatbot
 * Tests all functionality before Vercel deployment
 */

import { execSync, spawn, ChildProcess } from 'child_process'
import { promises as fs } from 'fs'
import * as path from 'path'
import * as readline from 'readline'

// Types
interface TestResult {
  name: string
  success: boolean
  error?: string
}

interface Colors {
  readonly green: string
  readonly red: string
  readonly yellow: string
  readonly blue: string
  readonly reset: string
  readonly bold: string
}

// Colors for output
const colors: Colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
} as const

function log(message: string, color: keyof Colors = 'reset'): void {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logStep(step: number, message: string): void {
  log(`\n${colors.bold}[STEP ${step}]${colors.reset} ${message}`, 'blue')
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

async function runCommand(command: string, description: string): Promise<boolean> {
  try {
    log(`Running: ${command}`)
    execSync(command, { encoding: 'utf8', stdio: 'pipe' })
    logSuccess(`${description} - PASSED`)
    return true
  } catch (error) {
    logError(`${description} - FAILED`)
    const errorMessage = error instanceof Error ? error.message : String(error)
    log(`Error: ${errorMessage}`, 'red')
    return false
  }
}

async function checkEnvironment(): Promise<boolean> {
  logStep(1, 'Checking Environment Variables')
  
  const requiredVars: string[] = [
    'OPENAI_API_KEY',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ]

  let allPresent = true
  for (const varName of requiredVars) {
    if (process.env[varName]) {
      logSuccess(`${varName} is configured`)
    } else {
      logError(`${varName} is missing in .env.local`)
      allPresent = false
    }
  }

  return allPresent
}

async function installDependencies(): Promise<boolean> {
  logStep(2, 'Installing Dependencies')
  
  try {
    await fs.access('node_modules')
    logSuccess('Dependencies already installed')
    return true
  } catch {
    log('Installing npm dependencies...')
    return await runCommand('npm install', 'Dependency installation')
  }
}

async function runTests(): Promise<boolean> {
  logStep(3, 'Running Test Suite')
  
  const tests = [
    { command: 'npm run type-check', name: 'TypeScript Type Check' },
    { command: 'npm run lint', name: 'ESLint Code Quality' },
    { command: 'npm test -- --passWithNoTests --silent', name: 'Unit Tests' }
  ]

  let allPassed = true
  for (const test of tests) {
    const passed = await runCommand(test.command, test.name)
    if (!passed) allPassed = false
  }

  return allPassed
}

async function buildApplication(): Promise<boolean> {
  logStep(4, 'Building Application')
  return await runCommand('npm run build', 'Next.js Production Build')
}

async function testConnections(): Promise<boolean> {
  logStep(5, 'Testing External Service Connections')
  
  // Test Supabase connection
  try {
    const testScript = `
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
supabase.from('profiles').select('count').limit(1).then(() => {
  console.log('Supabase connection: OK')
  process.exit(0)
}).catch(() => {
  console.log('Supabase connection: FAILED')
  process.exit(1)
})
`
    await fs.writeFile('temp-supabase-test.mjs', testScript)
    const supabaseOk = await runCommand('node temp-supabase-test.mjs', 'Supabase Connection')
    await fs.unlink('temp-supabase-test.mjs')
    
    if (supabaseOk) {
      logSuccess('Supabase connection successful')
    } else {
      logError('Supabase connection failed')
      return false
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logError(`Supabase test error: ${errorMessage}`)
    return false
  }

  // Test OpenAI connection
  try {
    const testScript = `
import OpenAI from 'openai'
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
openai.models.list().then(() => {
  console.log('OpenAI connection: OK')
  process.exit(0)
}).catch(() => {
  console.log('OpenAI connection: FAILED')
  process.exit(1)
})
`
    await fs.writeFile('temp-openai-test.mjs', testScript)
    const openaiOk = await runCommand('node temp-openai-test.mjs', 'OpenAI Connection')
    await fs.unlink('temp-openai-test.mjs')
    
    if (openaiOk) {
      logSuccess('OpenAI connection successful')
    } else {
      logError('OpenAI connection failed')
      return false
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logError(`OpenAI test error: ${errorMessage}`)
    return false
  }

  return true
}

async function startDevServer(): Promise<void> {
  logStep(6, 'Starting Development Server for Manual Testing')
  
  log('\n🚀 Starting Next.js development server...')
  log('📍 Server will be available at: http://localhost:3000')
  log('\n📋 Manual Testing Checklist:')
  log('1. ✅ Navigate to http://localhost:3000')
  log('2. ✅ Test authentication (login page)')
  log('3. ✅ Test document upload functionality')
  log('4. ✅ Test search functionality')
  log('5. ✅ Test chat interface')
  log('6. ✅ Check browser console for errors')
  log('\n⏹️  Press Ctrl+C to stop the server when testing is complete\n')
  
  try {
    const devServer: ChildProcess = spawn('npm', ['run', 'dev'], { 
      stdio: 'inherit',
      shell: true 
    })
    
    // Handle server shutdown
    process.on('SIGINT', () => {
      log('\n🛑 Shutting down development server...')
      devServer.kill('SIGINT')
      process.exit(0)
    })
    
    // Wait for server to start
    await new Promise<void>(resolve => setTimeout(resolve, 3000))
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logError(`Failed to start development server: ${errorMessage}`)
  }
}

async function askUserInput(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
  
  return new Promise<string>((resolve) => {
    rl.question(question, (answer: string) => {
      rl.close()
      resolve(answer)
    })
  })
}

async function main(): Promise<void> {
  log(`${colors.bold}🚀 Next.js RAG Chatbot - Local Testing Suite${colors.reset}`)
  log('Testing all functionality before Vercel deployment...\n')

  // Load environment variables
  try {
    await fs.access('.env.local')
    const { config } = await import('dotenv')
    config({ path: '.env.local' })
    logSuccess('Loaded .env.local file')
  } catch {
    logError('.env.local file not found')
    log('Please copy .env.example to .env.local and configure your environment variables')
    process.exit(1)
  }

  const results: boolean[] = []

  // Run all tests
  results.push(await checkEnvironment())
  results.push(await installDependencies())
  results.push(await runTests())
  results.push(await buildApplication())
  results.push(await testConnections())

  // Summary
  logStep(7, 'Test Results')
  const passed = results.filter(Boolean).length
  const total = results.length

  if (passed === total) {
    logSuccess(`All ${total} tests passed! ✨`)
    log('\n🎉 Your application is ready for deployment!')
    log('\nNext steps:')
    log('1. Test manually with the development server')
    log('2. Deploy to Vercel with: npx vercel --prod')
    log('')
    
    // Ask if user wants to start dev server
    const answer = await askUserInput('Start development server for manual testing? (y/n): ')
    
    if (answer.toLowerCase() === 'y') {
      await startDevServer()
    } else {
      log('\n✅ Ready for deployment!')
      log('Run: npx vercel --prod')
    }
  } else {
    logError(`${passed}/${total} tests passed`)
    log('\n❌ Please fix the failing tests before deploying')
    process.exit(1)
  }
}

// Handle errors
process.on('uncaughtException', (error: Error) => {
  logError(`Uncaught exception: ${error.message}`)
  process.exit(1)
})

process.on('unhandledRejection', (error: unknown) => {
  const errorMessage = error instanceof Error ? error.message : String(error)
  logError(`Unhandled rejection: ${errorMessage}`)
  process.exit(1)
})

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error: unknown) => {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logError(`Script failed: ${errorMessage}`)
    process.exit(1)
  })
}
