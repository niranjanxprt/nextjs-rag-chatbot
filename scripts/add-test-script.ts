#!/usr/bin/env node

/**
 * Script to add the comprehensive test command to package.json
 */

import fs from 'fs'
import path from 'path'

interface PackageJson {
  scripts: Record<string, string>
  [key: string]: any
}

const packageJsonPath = path.join(process.cwd(), 'package.json')

if (!fs.existsSync(packageJsonPath)) {
  console.error('❌ package.json not found')
  process.exit(1)
}

const packageJson: PackageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))

// Add the new script
packageJson.scripts['test:local:comprehensive'] = 'node scripts/test-local-comprehensive.js'

// Write back to file
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n')

console.log('✅ Added "test:local:comprehensive" script to package.json')
console.log('📝 You can now run: npm run test:local:comprehensive')