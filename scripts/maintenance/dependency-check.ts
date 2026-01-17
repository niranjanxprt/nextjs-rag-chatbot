#!/usr/bin/env ts-node
/**
 * Dependency Check Script
 *
 * Checks for outdated dependencies and security vulnerabilities
 * Usage: npm run maintenance:deps
 */

import { execSync } from 'child_process'

console.log('🔒 Checking dependencies...\n')

try {
  // Check for security vulnerabilities
  console.log('1️⃣ Security Audit')
  console.log('─'.repeat(50))
  try {
    const auditOutput = execSync('npm audit --production', { encoding: 'utf-8' })
    console.log(auditOutput)
  } catch (error: any) {
    if (error.stdout) {
      console.log(error.stdout)
    }
    if (error.status === 1) {
      console.warn('⚠️  Vulnerabilities found! Run `npm audit fix` to resolve.')
    }
  }

  console.log('\n2️⃣ Outdated Packages')
  console.log('─'.repeat(50))
  try {
    const outdatedOutput = execSync('npm outdated', { encoding: 'utf-8' })
    console.log(outdatedOutput || '✅ All packages are up to date!')
  } catch (error: any) {
    // npm outdated exits with code 1 if there are outdated packages
    if (error.stdout) {
      console.log(error.stdout)
      console.log('\n💡 Run `npm update` to update packages')
    }
  }

  console.log('\n3️⃣ Unused Dependencies (via Knip)')
  console.log('─'.repeat(50))
  try {
    const knipOutput = execSync('npx knip --dependencies --no-exit-code', {
      encoding: 'utf-8',
      stdio: 'pipe',
    })
    const unusedDeps = knipOutput.match(/Unlisted dependencies.*?\n([\s\S]*?)(?=\n\n|$)/)
    if (unusedDeps) {
      console.log(unusedDeps[0])
    } else {
      console.log('✅ No unused dependencies found!')
    }
  } catch (error) {
    console.log('⚠️  Could not check for unused dependencies')
  }

  console.log('\n✅ Dependency check complete!')
} catch (error) {
  console.error('❌ Dependency check failed:', error)
  process.exit(1)
}
