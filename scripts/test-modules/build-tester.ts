/**
 * Build & Code Quality Tester
 * 
 * Tests TypeScript compilation, linting, unit tests, and build process
 */

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
} as const

interface CommandResult {
  success: boolean
  output?: string
  error?: string
}

interface CommandOptions {
  silent?: boolean
  timeout?: number
}

function logSuccess(message: string): void {
  console.log(`${colors.green}✅ ${message}${colors.reset}`)
}

function logError(message: string): void {
  console.log(`${colors.red}❌ ${message}${colors.reset}`)
}

function logWarning(message: string): void {
  console.log(`${colors.yellow}⚠️  ${message}${colors.reset}`)
}

function logInfo(message: string): void {
  console.log(`${colors.blue}ℹ️  ${message}${colors.reset}`)
}

async function runCommand(command: string, description: string, options: CommandOptions = {}): Promise<CommandResult> {
  try {
    logInfo(`Running: ${command}`)
    const output = execSync(command, { 
      encoding: 'utf8', 
      stdio: options.silent ? 'pipe' : 'inherit',
      timeout: options.timeout || 120000
    })
    logSuccess(`${description} - PASSED`)
    return { success: true, output }
  } catch (error) {
    logError(`${description} - FAILED`)
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (!options.silent) {
      console.log(`Error: ${errorMessage}`)
    }
    return { success: false, error: errorMessage }
  }
}

async function testBuild(): Promise<boolean> {
  console.log('🔨 Testing build process and code quality...\n')

  let allPassed = true
  const results: boolean[] = []

  // 1. TypeScript Type Checking
  console.log('📝 TypeScript Type Checking:')
  const typeCheckResult = await runCommand('npm run type-check', 'TypeScript compilation')
  results.push(typeCheckResult.success)
  if (!typeCheckResult.success) allPassed = false

  // 2. ESLint Code Quality
  console.log('\n🔍 ESLint Code Quality Check:')
  const lintResult = await runCommand('npm run lint', 'ESLint linting')
  results.push(lintResult.success)
  if (!lintResult.success) allPassed = false

  // 3. Unit Tests
  console.log('\n🧪 Unit Tests:')
  const testResult = await runCommand('npm test -- --passWithNoTests --verbose', 'Jest unit tests')
  results.push(testResult.success)
  if (!testResult.success) allPassed = false

  // 4. Integration Tests (if they exist)
  console.log('\n🔗 Integration Tests:')
  try {
    const integrationResult = await runCommand('npm run test:integration -- --passWithNoTests', 'Integration tests')
    results.push(integrationResult.success)
    if (!integrationResult.success) allPassed = false
  } catch (error) {
    logWarning('Integration tests not configured or failed')
    results.push(false)
  }

  // 5. Next.js Build
  console.log('\n🏗️  Next.js Production Build:')
  const buildResult = await runCommand('npm run build', 'Next.js build', { timeout: 180000 })
  results.push(buildResult.success)
  if (!buildResult.success) allPassed = false

  // 6. Build Output Validation
  console.log('\n📦 Build Output Validation:')
  const buildValidation = validateBuildOutput()
  results.push(buildValidation)
  if (!buildValidation) allPassed = false

  // 7. Bundle Analysis (optional)
  console.log('\n📊 Bundle Size Analysis:')
  try {
    analyzeBundleSize()
    logSuccess('Bundle analysis completed')
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logWarning(`Bundle analysis failed: ${errorMessage}`)
  }

  // 8. Security Audit
  console.log('\n🔒 Security Audit:')
  try {
    const auditResult = await runCommand('npm audit --audit-level=high', 'Security audit', { silent: true })
    if (auditResult.success) {
      logSuccess('No high-severity security vulnerabilities found')
    } else {
      logWarning('Security vulnerabilities detected - review npm audit output')
    }
  } catch (error) {
    logWarning('Security audit failed or found issues')
  }

  return allPassed
}

function validateBuildOutput(): boolean {
  const buildDir = path.join(process.cwd(), '.next')
  
  if (!fs.existsSync(buildDir)) {
    logError('.next build directory not found')
    return false
  }

  // Check for essential build files
  const requiredFiles = [
    '.next/BUILD_ID',
    '.next/build-manifest.json',
    '.next/routes-manifest.json'
  ]

  let allFilesExist = true
  for (const file of requiredFiles) {
    if (fs.existsSync(path.join(process.cwd(), file))) {
      logSuccess(`${file} exists`)
    } else {
      logError(`${file} missing`)
      allFilesExist = false
    }
  }

  // Check for server directory
  const serverDir = path.join(buildDir, 'server')
  if (fs.existsSync(serverDir)) {
    logSuccess('Server build directory exists')
  } else {
    logError('Server build directory missing')
    allFilesExist = false
  }

  // Check for static assets
  const staticDir = path.join(buildDir, 'static')
  if (fs.existsSync(staticDir)) {
    logSuccess('Static assets directory exists')
  } else {
    logError('Static assets directory missing')
    allFilesExist = false
  }

  return allFilesExist
}

interface BuildManifest {
  pages?: Record<string, string[]>
  [key: string]: any
}

function analyzeBundleSize(): void {
  const buildManifestPath = path.join(process.cwd(), '.next', 'build-manifest.json')
  
  if (!fs.existsSync(buildManifestPath)) {
    throw new Error('Build manifest not found')
  }

  const manifest: BuildManifest = JSON.parse(fs.readFileSync(buildManifestPath, 'utf8'))
  
  // Analyze page bundles
  const pages = manifest.pages || {}
  const totalPages = Object.keys(pages).length
  
  logInfo(`📄 Total pages: ${totalPages}`)
  
  // Check for large bundles (warning threshold)
  const largeBundleThreshold = 500 * 1024 // 500KB
  
  for (const [page, files] of Object.entries(pages)) {
    const pageFiles = Array.isArray(files) ? files : []
    logInfo(`Page ${page}: ${pageFiles.length} chunks`)
  }

  // Check static chunks
  const staticDir = path.join(process.cwd(), '.next', 'static')
  if (fs.existsSync(staticDir)) {
    const chunksDir = path.join(staticDir, 'chunks')
    if (fs.existsSync(chunksDir)) {
      const chunks = fs.readdirSync(chunksDir, { withFileTypes: true })
        .filter(dirent => dirent.isFile() && dirent.name.endsWith('.js'))
      
      logInfo(`📦 JavaScript chunks: ${chunks.length}`)
      
      // Check for excessively large chunks
      for (const chunk of chunks) {
        const chunkPath = path.join(chunksDir, chunk.name)
        const stats = fs.statSync(chunkPath)
        
        if (stats.size > largeBundleThreshold) {
          logWarning(`Large chunk detected: ${chunk.name} (${Math.round(stats.size / 1024)}KB)`)
        }
      }
    }
  }
}

export { testBuild }