#!/usr/bin/env tsx

/**
 * Simple Deployment Script for Vercel
 * Tests locally then deploys to Vercel
 */

import { execSync } from 'child_process'

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
} as const

function log(message: string, color: keyof typeof colors = 'reset'): void {
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

async function runCommand(command: string, description: string): Promise<boolean> {
  try {
    log(`Running: ${command}`)
    execSync(command, { encoding: 'utf8', stdio: 'inherit' })
    logSuccess(`${description} - SUCCESS`)
    return true
  } catch (error) {
    logError(`${description} - FAILED`)
    return false
  }
}

async function main(): Promise<void> {
  log(`${colors.bold}🚀 Next.js RAG Chatbot - Deployment to Vercel${colors.reset}`)
  log('Testing locally then deploying to production...\n')

  // Step 1: Run local tests
  logStep(1, 'Running Local Tests')
  const testsPass = await runCommand('npm run test:local', 'Local Testing Suite')
  
  if (!testsPass) {
    logError('Local tests failed. Please fix issues before deploying.')
    process.exit(1)
  }

  // Step 2: Install Vercel CLI if needed
  logStep(2, 'Checking Vercel CLI')
  try {
    execSync('vercel --version', { stdio: 'pipe' })
    logSuccess('Vercel CLI is installed')
  } catch {
    log('Installing Vercel CLI...')
    const installed = await runCommand('npm install -g vercel', 'Vercel CLI Installation')
    if (!installed) {
      logError('Failed to install Vercel CLI')
      process.exit(1)
    }
  }

  // Step 3: Deploy to Vercel
  logStep(3, 'Deploying to Vercel')
  log('\n📋 Make sure you have set these environment variables in Vercel Dashboard:')
  log('- OPENAI_API_KEY')
  log('- NEXT_PUBLIC_SUPABASE_URL')
  log('- NEXT_PUBLIC_SUPABASE_ANON_KEY')
  log('- SUPABASE_SERVICE_ROLE_KEY')
  log('- QDRANT_URL (optional)')
  log('- QDRANT_API_KEY (optional)')
  log('- UPSTASH_REDIS_REST_URL (optional)')
  log('- UPSTASH_REDIS_REST_TOKEN (optional)')
  log('')

  const deployed = await runCommand('vercel --prod', 'Vercel Production Deployment')
  
  if (deployed) {
    logSuccess('🎉 Deployment successful!')
    log('\n✅ Your RAG chatbot is now live on Vercel!')
    log('🔗 Check your Vercel dashboard for the production URL')
    log('📊 Monitor performance and errors in Vercel Analytics')
  } else {
    logError('Deployment failed. Check Vercel logs for details.')
    process.exit(1)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error: unknown) => {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logError(`Deployment failed: ${errorMessage}`)
    process.exit(1)
  })
}
