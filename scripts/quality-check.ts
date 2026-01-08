#!/usr/bin/env node

import { execSync } from 'child_process'
import { performance } from 'perf_hooks'

interface QualityCheck {
  name: string
  command: string
  required: boolean
}

const qualityChecks: QualityCheck[] = [
  { name: 'TypeScript Type Check', command: 'npm run type-check', required: true },
  { name: 'ESLint', command: 'npm run lint', required: true },
  { name: 'Prettier Format Check', command: 'npm run format:check', required: true },
  { name: 'Unit Tests', command: 'npm run test:unit', required: true },
  { name: 'Integration Tests', command: 'npm run test:integration', required: false },
  { name: 'API Tests', command: 'npm run test:api', required: false },
  { name: 'Component Tests', command: 'npm run test:components', required: false },
]

async function runQualityChecks() {
  console.log('🔍 Running code quality checks...\n')

  const results: Array<{ name: string; success: boolean; duration: number; error?: string }> = []
  let allPassed = true

  for (const check of qualityChecks) {
    const startTime = performance.now()

    try {
      console.log(`⏳ Running ${check.name}...`)
      execSync(check.command, { stdio: 'pipe' })

      const duration = performance.now() - startTime
      results.push({ name: check.name, success: true, duration })
      console.log(`✅ ${check.name} passed (${Math.round(duration)}ms)`)
    } catch (error) {
      const duration = performance.now() - startTime
      const errorMessage = error instanceof Error ? error.message : String(error)

      results.push({
        name: check.name,
        success: false,
        duration,
        error: errorMessage,
      })

      if (check.required) {
        console.log(`❌ ${check.name} failed (${Math.round(duration)}ms)`)
        allPassed = false
      } else {
        console.log(`⚠️  ${check.name} failed (${Math.round(duration)}ms) - optional`)
      }
    }
  }

  // Summary
  console.log('\n📊 Quality Check Summary:')
  console.log('='.repeat(50))

  const passed = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0)

  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`⏱️  Total time: ${Math.round(totalDuration)}ms`)

  if (failed > 0) {
    console.log('\n❌ Failed checks:')
    results
      .filter(r => !r.success)
      .forEach(r => {
        console.log(`  • ${r.name}`)
        if (r.error) {
          console.log(`    Error: ${r.error.split('\n')[0]}`)
        }
      })
  }

  if (allPassed) {
    console.log('\n🎉 All required quality checks passed!')
    process.exit(0)
  } else {
    console.log('\n💥 Some required quality checks failed!')
    process.exit(1)
  }
}

// Auto-fix option
if (process.argv.includes('--fix')) {
  console.log('🔧 Running auto-fix...')
  try {
    execSync('npm run quality:fix', { stdio: 'inherit' })
    console.log('✅ Auto-fix completed')
  } catch (error) {
    console.log('❌ Auto-fix failed')
    process.exit(1)
  }
}

runQualityChecks().catch(error => {
  console.error('💥 Quality check runner failed:', error)
  process.exit(1)
})
