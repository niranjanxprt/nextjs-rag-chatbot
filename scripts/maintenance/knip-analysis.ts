#!/usr/bin/env ts-node
/**
 * Knip Analysis Script
 *
 * Runs Knip analysis and generates a report
 * Usage: npm run maintenance:knip
 */

import { execSync } from 'child_process'
import { writeFileSync } from 'fs'

console.log('🔍 Running Knip analysis...\n')

try {
  // Run Knip and capture output
  const output = execSync('npx knip --no-exit-code', {
    encoding: 'utf-8',
    stdio: 'pipe',
  })

  // Parse output
  const lines = output.split('\n')
  const unusedFiles = lines.filter(l => l.includes('Unused files')).length
  const unusedExports = lines.filter(l => l.includes('Unused exports')).length

  console.log('✅ Knip analysis complete!\n')
  console.log('Summary:')
  console.log(`- Unused files: ${unusedFiles}`)
  console.log(`- Unused exports: ${unusedExports}`)

  // Save report
  const timestamp = new Date().toISOString()
  const report = `# Knip Analysis Report\n\nGenerated: ${timestamp}\n\n${output}`
  writeFileSync('knip-report.txt', report)

  console.log('\n📄 Report saved to knip-report.txt')
} catch (error) {
  console.error('❌ Knip analysis failed:', error)
  process.exit(1)
}
