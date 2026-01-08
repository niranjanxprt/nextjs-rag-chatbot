#!/usr/bin/env tsx

/**
 * Code Quality & Refactoring Script
 * Runs quality checks and applies basic refactoring
 */

import { execSync } from 'child_process'

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

function runCommand(command: string, description: string): boolean {
  try {
    log(`\n🔍 ${description}...`, 'blue')
    execSync(command, { encoding: 'utf8', stdio: 'inherit' })
    log(`✅ ${description} - PASSED`, 'green')
    return true
  } catch (error) {
    log(`❌ ${description} - FAILED`, 'red')
    return false
  }
}

async function main(): Promise<void> {
  log(`${colors.bold}🔧 Code Quality & Refactoring Suite${colors.reset}`)
  log('Running quality checks and applying improvements...\n')

  const results: boolean[] = []

  // 1. ESLint check
  results.push(runCommand('npm run lint', 'ESLint Code Quality Check'))

  // 2. TypeScript check (with --skipLibCheck for faster execution)
  results.push(runCommand('npx tsc --noEmit --skipLibCheck', 'TypeScript Type Check (Fast)'))

  // 3. Build check
  results.push(runCommand('npm run build', 'Next.js Build Check'))

  // 4. Basic test run (unit tests only)
  results.push(
    runCommand(
      'npm test -- --testPathPattern="unit|property" --passWithNoTests',
      'Unit & Property Tests'
    )
  )

  const passed = results.filter(Boolean).length
  const total = results.length

  log(
    `\n📊 Quality Report: ${passed}/${total} checks passed`,
    passed === total ? 'green' : 'yellow'
  )

  if (passed === total) {
    log('🎉 All quality checks passed! Code is ready for deployment.', 'green')
  } else {
    log('⚠️  Some quality checks failed. Review and fix issues above.', 'yellow')
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error: unknown) => {
    const errorMessage = error instanceof Error ? error.message : String(error)
    log(`💥 Quality check failed: ${errorMessage}`, 'red')
    process.exit(1)
  })
}
