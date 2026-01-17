#!/usr/bin/env ts-node
/**
 * Bundle Size Monitoring Script
 *
 * Checks bundle size and compares with baseline
 * Usage: npm run maintenance:bundle
 */

import { execSync } from 'child_process'
import { readFileSync, writeFileSync, existsSync } from 'fs'

const BASELINE_FILE = '.bundle-baseline.json'
const MAX_INCREASE_PERCENT = 5 // Alert if bundle grows more than 5%

console.log('📦 Analyzing bundle size...\n')

try {
  // Build the project
  console.log('Building project...')
  execSync('npm run build', { stdio: 'pipe' })

  // Extract bundle size from build output
  const buildOutput = execSync('npm run build 2>&1', { encoding: 'utf-8' })
  const sizeMatch = buildOutput.match(/First Load JS\s+(\d+(?:\.\d+)?)\s*(\w+)/)

  if (!sizeMatch) {
    throw new Error('Could not parse bundle size from build output')
  }

  const currentSize = parseFloat(sizeMatch[1])
  const unit = sizeMatch[2]

  console.log(`✅ Current bundle size: ${currentSize} ${unit}\n`)

  // Load baseline if exists
  if (existsSync(BASELINE_FILE)) {
    const baseline = JSON.parse(readFileSync(BASELINE_FILE, 'utf-8'))
    const baselineSize = baseline.size
    const increase = ((currentSize - baselineSize) / baselineSize) * 100

    console.log(`📊 Comparison with baseline:`)
    console.log(`- Baseline: ${baselineSize} ${unit}`)
    console.log(`- Current: ${currentSize} ${unit}`)
    console.log(`- Change: ${increase > 0 ? '+' : ''}${increase.toFixed(2)}%\n`)

    if (increase > MAX_INCREASE_PERCENT) {
      console.warn(`⚠️  WARNING: Bundle size increased by ${increase.toFixed(2)}%`)
      console.warn(`   This exceeds the ${MAX_INCREASE_PERCENT}% threshold!`)
      process.exit(1)
    }
  } else {
    console.log('📝 No baseline found. Creating baseline...')
  }

  // Save current size as baseline
  writeFileSync(
    BASELINE_FILE,
    JSON.stringify(
      {
        size: currentSize,
        unit,
        timestamp: new Date().toISOString(),
      },
      null,
      2
    )
  )

  console.log('✅ Bundle size check complete!')
} catch (error) {
  console.error('❌ Bundle size check failed:', error)
  process.exit(1)
}
