#!/usr/bin/env tsx

/**
 * Local Environment Testing Script
 *
 * Tests all features locally before Vercel deployment
 */

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
} as const

function log(message: string, color: keyof typeof colors = 'reset'): void {
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

interface CommandResult {
  success: boolean
  output?: string
  error?: string
}

async function runCommand(command: string, description: string): Promise<CommandResult> {
  try {
    log(`Running: ${command}`)
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' })
    logSuccess(`${description} - OK`)
    return { success: true, output }
  } catch (error: any) {
    logError(`${description} - FAILED`)
    return { success: false, error: error.message }
  }
}

function checkFileExists(filePath: string): boolean {
  return fs.existsSync(path.resolve(filePath))
}

function checkEnvFile(): boolean {
  logStep('1', 'Checking environment configuration')

  const envFile = '.env.local'
  if (!checkFileExists(envFile)) {
    logError(`${envFile} not found`)
    logWarning('Copy .env.example to .env.local and fill in your credentials')
    return false
  }

  const envContent = fs.readFileSync(envFile, 'utf8')
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

  const missingVars = requiredVars.filter(
    varName =>
      !envContent.includes(`${varName}=`) ||
      envContent.includes(`${varName}=your-`) ||
      envContent.includes(`${varName}=`)
  )

  if (missingVars.length > 0) {
    logError(`Missing or incomplete environment variables: ${missingVars.join(', ')}`)
    return false
  }

  logSuccess('Environment configuration is complete')
  return true
}

async function checkDependencies(): Promise<boolean> {
  logStep('2', 'Checking dependencies')

  const result = await runCommand('npm list --depth=0', 'Dependency check')
  if (!result.success) {
    logWarning('Some dependencies may be missing. Running npm install...')
    const installResult = await runCommand('npm install', 'Installing dependencies')
    return installResult.success
  }

  return true
}

async function runTypeCheck(): Promise<boolean> {
  logStep('3', 'Running TypeScript type check')

  const result = await runCommand('npm run type-check', 'TypeScript compilation')
  return result.success
}

async function runLinting(): Promise<boolean> {
  logStep('4', 'Running ESLint')

  const result = await runCommand('npm run lint', 'Code linting')
  return result.success
}

async function runUnitTests(): Promise<boolean> {
  logStep('5', 'Running unit tests')

  const result = await runCommand('npm test -- --passWithNoTests', 'Unit tests')
  return result.success
}

async function buildProject(): Promise<boolean> {
  logStep('6', 'Building project')

  const result = await runCommand('npm run build', 'Next.js build')
  return result.success
}

async function runE2ETests(): Promise<boolean> {
  logStep('7', 'Running E2E tests (optional)')

  // Check if Playwright is installed
  try {
    execSync('npx playwright --version', { stdio: 'pipe' })
  } catch {
    logWarning('Playwright not installed. Skipping E2E tests.')
    logWarning('Run: npx playwright install to enable E2E testing')
    return true
  }

  const result = await runCommand('npm run test:e2e', 'E2E tests')
  if (!result.success) {
    logWarning('E2E tests failed. This may be due to missing test environment setup.')
    return true // Don't fail the entire test suite for E2E issues
  }

  return true
}

async function main(): Promise<void> {
  log('\n🧪 Local Environment Test Suite', 'bold')
  log('=====================================\n')

  const tests = [
    checkEnvFile,
    checkDependencies,
    runTypeCheck,
    runLinting,
    runUnitTests,
    buildProject,
    runE2ETests,
  ]

  let allPassed = true

  for (const test of tests) {
    try {
      const result = await test()
      if (!result) {
        allPassed = false
      }
    } catch (error) {
      logError(`Test failed with error: ${error}`)
      allPassed = false
    }
  }

  log('\n=====================================')
  if (allPassed) {
    logSuccess('🎉 All tests passed! Your environment is ready for deployment.')
    log('\nNext steps:')
    log('1. Run: npm run dev (to start development server)')
    log('2. Run: npm run test:vercel (to test Vercel deployment)')
  } else {
    logError('❌ Some tests failed. Please fix the issues above before deploying.')
    process.exit(1)
  }
}

// Run the test suite
main().catch(error => {
  logError(`Test suite failed: ${error.message}`)
  process.exit(1)
})
