#!/usr/bin/env tsx

/**
 * Vercel Environment Variable Setup Script
 * Generates commands to set environment variables in Vercel
 */

import { config } from 'dotenv'
import path from 'path'

const colors = {
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
}

function log(message: string, color: keyof typeof colors = 'reset'): void {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

async function main(): Promise<void> {
  log('\n🚀 Vercel Environment Setup Helper\n', 'bold')

  // Load .env.local
  config({ path: path.join(process.cwd(), '.env.local') })

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

  log('✅ Found the following variables in .env.local:\n', 'green')

  const commands: string[] = []
  let missingCount = 0

  for (const varName of requiredVars) {
    const value = process.env[varName]
    if (value) {
      log(`  ✓ ${varName}`, 'green')
      commands.push(varName)
    } else {
      log(`  ✗ ${varName} - NOT SET`, 'yellow')
      missingCount++
    }
  }

  log('\n📋 Optional Variables:\n', 'cyan')
  for (const varName of optionalVars) {
    const value = process.env[varName]
    if (value) {
      log(`  ✓ ${varName}`, 'green')
      commands.push(varName)
    } else {
      log(`  ⚠️  ${varName} - Not set`, 'yellow')
    }
  }

  if (missingCount > 0) {
    log(`\n⚠️  Warning: ${missingCount} required variables are missing from .env.local!`, 'yellow')
    log('Please ensure all variables are set before deploying to Vercel.\n', 'yellow')
  }

  log('\n' + '='.repeat(70), 'reset')
  log('\n📝 Setup Instructions:\n', 'bold')

  log('Option 1: Using Vercel CLI (Recommended)\n', 'blue')
  log('1. Install Vercel CLI:', 'reset')
  log('   npm install -g vercel\n', 'cyan')

  log('2. Login to Vercel:', 'reset')
  log('   vercel login\n', 'cyan')

  log('3. Link your project:', 'reset')
  log('   vercel link\n', 'cyan')

  log('4. Set environment variables (you\'ll be prompted for values):', 'reset')
  const cliCommands = commands.map((v) => `   vercel env add ${v} production`)
  log(cliCommands.join('\n') + '\n', 'cyan')

  log('5. Verify variables were set:', 'reset')
  log('   vercel env list\n', 'cyan')

  log('Option 2: Using Vercel Dashboard (GUI)\n', 'blue')
  log('1. Go to: https://vercel.com/dashboard', 'reset')
  log('2. Select your project', 'reset')
  log('3. Navigate to: Settings → Environment Variables', 'reset')
  log('4. Add all required variables from .env.local', 'reset')
  log('5. Make sure to set them for Production, Preview, and Development\n', 'cyan')

  log('Option 3: Using vercel env pull (for local verification)\n', 'blue')
  log('After setting variables via CLI or Dashboard:', 'reset')
  log('   vercel env pull .env.vercel\n', 'cyan')
  log('This pulls your Vercel environment variables to verify they\'re set correctly.\n', 'reset')

  log('='.repeat(70), 'reset')
  log('\n✅ Next Steps:\n', 'bold')
  log('1. Complete one of the setup options above', 'reset')
  log('2. Verify all variables are set: vercel env list', 'reset')
  log('3. Run deployment validation: npm run validate:deployment', 'reset')
  log('4. Deploy to preview: vercel', 'reset')
  log('5. Test preview thoroughly', 'reset')
  log('6. Deploy to production: vercel --prod\n', 'reset')

  log('📚 Required Variables Reference:\n', 'bold')
  log('These are the minimum variables needed for your application:\n', 'reset')

  const varDescriptions: Record<string, string> = {
    OPENAI_API_KEY: 'OpenAI API key (for embeddings and chat)',
    NEXT_PUBLIC_SUPABASE_URL: 'Supabase project URL (public)',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'Supabase anonymous key (public)',
    SUPABASE_SERVICE_ROLE_KEY: 'Supabase service role key (secret)',
    QDRANT_URL: 'Qdrant vector database URL',
    QDRANT_API_KEY: 'Qdrant API key',
    QDRANT_COLLECTION_NAME: 'Qdrant collection name (default: documents)',
    UPSTASH_REDIS_REST_URL: 'Upstash Redis REST URL',
    UPSTASH_REDIS_REST_TOKEN: 'Upstash Redis access token',
  }

  for (const [varName, description] of Object.entries(varDescriptions)) {
    log(`  • ${varName}`, 'cyan')
    log(`    └─ ${description}\n`, 'reset')
  }

  log('💡 Pro Tips:\n', 'bold')
  log('• Keep your API keys secure - never commit .env files', 'reset')
  log('• Use different keys for development and production if possible', 'reset')
  log('• Test thoroughly in preview before deploying to production', 'reset')
  log('• Monitor Vercel logs after deployment for any environment issues\n', 'reset')
}

main().catch((error) => {
  log(`\n❌ Setup script error: ${error.message}`, 'red')
  process.exit(1)
})
