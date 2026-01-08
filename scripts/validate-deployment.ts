#!/usr/bin/env tsx

/**
 * Comprehensive Pre-Deployment Validation Script
 *
 * Validates the entire Next.js RAG Chatbot application before Vercel deployment
 * Ensures all TypeScript files are properly configured and all features work
 */

import { execSync, spawn } from 'child_process'
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Types
interface TestResult {
  name: string
  success: boolean
  duration: number
  error?: string
  details?: string
}

interface ValidationReport {
  timestamp: string
  totalTests: number
  passed: number
  failed: number
  duration: number
  results: TestResult[]
  readyForDeployment: boolean
}

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
} as const

class Logger {
  static log(message: string, color: keyof typeof colors = 'reset'): void {
    console.log(`${colors[color]}${message}${colors.reset}`)
  }

  static step(step: number, message: string): void {
    Logger.log(`\n${colors.bold}[STEP ${step}]${colors.reset} ${message}`, 'blue')
  }

  static success(message: string): void {
    Logger.log(`✅ ${message}`, 'green')
  }

  static error(message: string): void {
    Logger.log(`❌ ${message}`, 'red')
  }

  static warning(message: string): void {
    Logger.log(`⚠️  ${message}`, 'yellow')
  }

  static info(message: string): void {
    Logger.log(`ℹ️  ${message}`, 'cyan')
  }
}

class ValidationRunner {
  private results: TestResult[] = []
  private startTime: number = Date.now()

  async runTest(name: string, testFn: () => Promise<boolean>): Promise<TestResult> {
    const start = Date.now()
    Logger.info(`Running: ${name}`)

    try {
      const success = await testFn()
      const duration = Date.now() - start
      const result: TestResult = { name, success, duration }

      if (success) {
        Logger.success(`${name} - PASSED (${duration}ms)`)
      } else {
        Logger.error(`${name} - FAILED (${duration}ms)`)
      }

      this.results.push(result)
      return result
    } catch (error) {
      const duration = Date.now() - start
      const errorMessage = error instanceof Error ? error.message : String(error)
      const result: TestResult = {
        name,
        success: false,
        duration,
        error: errorMessage,
      }

      Logger.error(`${name} - ERROR (${duration}ms): ${errorMessage}`)
      this.results.push(result)
      return result
    }
  }

  async runCommand(command: string, description: string): Promise<boolean> {
    try {
      execSync(command, {
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 60000, // 60 second timeout
      })
      return true
    } catch (error) {
      Logger.error(
        `${description} failed: ${error instanceof Error ? error.message : String(error)}`
      )
      return false
    }
  }

  generateReport(): ValidationReport {
    const totalDuration = Date.now() - this.startTime
    const passed = this.results.filter(r => r.success).length
    const failed = this.results.length - passed

    return {
      timestamp: new Date().toISOString(),
      totalTests: this.results.length,
      passed,
      failed,
      duration: totalDuration,
      results: this.results,
      readyForDeployment: failed === 0,
    }
  }
}

class PreDeploymentValidator {
  private runner = new ValidationRunner()

  async validateTypeScriptSetup(): Promise<boolean> {
    Logger.step(1, 'Validating TypeScript Configuration')

    // Check TypeScript config files exist
    const tsConfigExists = await fs
      .access('tsconfig.json')
      .then(() => true)
      .catch(() => false)
    if (!tsConfigExists) {
      Logger.error('tsconfig.json not found')
      return false
    }
    Logger.success('tsconfig.json exists')

    // Check all JS files are converted to TS
    const jsFiles = await this.findJavaScriptFiles()
    if (jsFiles.length > 0) {
      Logger.error(`Found ${jsFiles.length} JavaScript files that should be TypeScript:`)
      jsFiles.forEach(file => Logger.error(`  - ${file}`))
      return false
    }
    Logger.success('All JavaScript files converted to TypeScript')

    return true
  }

  async findJavaScriptFiles(): Promise<string[]> {
    const jsFiles: string[] = []

    const searchDirs = ['src', 'scripts', '.']
    const excludeDirs = ['node_modules', '.next', '.git', 'dist', 'build']

    for (const dir of searchDirs) {
      try {
        const files = await this.getFilesRecursively(dir)
        const jsFilesInDir = files.filter(file => {
          const isJs = file.endsWith('.js') && !file.endsWith('.config.js')
          const isExcluded = excludeDirs.some(excludeDir => file.includes(excludeDir))
          return isJs && !isExcluded
        })
        jsFiles.push(...jsFilesInDir)
      } catch (error) {
        // Directory might not exist, continue
      }
    }

    return jsFiles
  }

  async getFilesRecursively(dir: string): Promise<string[]> {
    const files: string[] = []
    const entries = await fs.readdir(dir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        const subFiles = await this.getFilesRecursively(fullPath)
        files.push(...subFiles)
      } else if (entry.isFile()) {
        files.push(fullPath)
      }
    }

    return files
  }

  async validateEnvironment(): Promise<boolean> {
    Logger.step(2, 'Validating Environment Variables')

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

    let allPresent = true
    for (const varName of requiredVars) {
      if (process.env[varName]) {
        Logger.success(`${varName} is configured`)
      } else {
        Logger.error(`${varName} is missing`)
        allPresent = false
      }
    }

    return allPresent
  }

  async validateDependencies(): Promise<boolean> {
    Logger.step(3, 'Validating Dependencies')

    // Check package.json exists
    const packageJsonExists = await fs
      .access('package.json')
      .then(() => true)
      .catch(() => false)
    if (!packageJsonExists) {
      Logger.error('package.json not found')
      return false
    }
    Logger.success('package.json exists')

    // Check node_modules exists
    const nodeModulesExists = await fs
      .access('node_modules')
      .then(() => true)
      .catch(() => false)
    if (!nodeModulesExists) {
      Logger.error('node_modules not found - run: npm install')
      return false
    }
    Logger.success('node_modules exists')

    // Check TypeScript is installed
    const tsExists = await fs
      .access('node_modules/typescript')
      .then(() => true)
      .catch(() => false)
    if (!tsExists) {
      Logger.error('TypeScript not installed')
      return false
    }
    Logger.success('TypeScript is installed')

    return true
  }

  async validateBuild(): Promise<boolean> {
    Logger.step(4, 'Validating Build Process')

    const tests = [
      { name: 'TypeScript Type Check', command: 'npx tsc --noEmit' },
      { name: 'ESLint Code Quality', command: 'npm run lint' },
      { name: 'Unit Tests', command: 'npm test -- --passWithNoTests --silent' },
      { name: 'Next.js Build', command: 'npm run build' },
    ]

    let allPassed = true
    for (const test of tests) {
      const success = await this.runner.runCommand(test.command, test.name)
      if (!success) allPassed = false
    }

    return allPassed
  }

  async validateExternalServices(): Promise<boolean> {
    Logger.step(5, 'Validating External Service Connections')

    const services = [
      { name: 'Supabase', test: () => this.testSupabaseConnection() },
      { name: 'OpenAI', test: () => this.testOpenAIConnection() },
      { name: 'Qdrant', test: () => this.testQdrantConnection() },
      { name: 'Upstash Redis', test: () => this.testRedisConnection() },
    ]

    let allConnected = true
    for (const service of services) {
      try {
        const connected = await service.test()
        if (connected) {
          Logger.success(`${service.name} connection successful`)
        } else {
          Logger.error(`${service.name} connection failed`)
          allConnected = false
        }
      } catch (error) {
        Logger.error(
          `${service.name} connection error: ${error instanceof Error ? error.message : String(error)}`
        )
        allConnected = false
      }
    }

    return allConnected
  }

  async testSupabaseConnection(): Promise<boolean> {
    const { createClient } = await import('@supabase/supabase-js')

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    try {
      const { error } = await supabase.from('profiles').select('count').limit(1)
      // PGRST116 is "relation does not exist" which is OK for empty DB
      return !error || error.code === 'PGRST116'
    } catch (error) {
      return false
    }
  }

  async testOpenAIConnection(): Promise<boolean> {
    const { OpenAI } = await import('openai')

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    try {
      await openai.models.list()
      return true
    } catch (error) {
      return false
    }
  }

  async testQdrantConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${process.env.QDRANT_URL}/collections`, {
        headers: {
          'api-key': process.env.QDRANT_API_KEY!,
        },
      })
      return response.ok
    } catch (error) {
      return false
    }
  }

  async testRedisConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/ping`, {
        headers: {
          Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN!}`,
        },
      })
      return response.ok
    } catch (error) {
      return false
    }
  }

  async validateProjectStructure(): Promise<boolean> {
    Logger.step(6, 'Validating Project Structure')

    const requiredFiles = [
      'package.json',
      'tsconfig.json',
      'next.config.ts',
      'tailwind.config.ts',
      'src/app/layout.tsx',
      'src/app/page.tsx',
      'src/lib/env.ts',
      '.env.example',
    ]

    const requiredDirs = ['src/app', 'src/components', 'src/lib', '.kiro/steering', '.kiro/prompts']

    let allPresent = true

    // Check files
    for (const file of requiredFiles) {
      const exists = await fs
        .access(file)
        .then(() => true)
        .catch(() => false)
      if (exists) {
        Logger.success(`${file} exists`)
      } else {
        Logger.error(`${file} is missing`)
        allPresent = false
      }
    }

    // Check directories
    for (const dir of requiredDirs) {
      const exists = await fs
        .access(dir)
        .then(() => true)
        .catch(() => false)
      if (exists) {
        Logger.success(`${dir}/ exists`)
      } else {
        Logger.error(`${dir}/ is missing`)
        allPresent = false
      }
    }

    return allPresent
  }

  async run(): Promise<ValidationReport> {
    Logger.log(`${colors.bold}🚀 Next.js RAG Chatbot - Pre-Deployment Validation${colors.reset}`)
    Logger.log('Ensuring TypeScript setup and all features work before Vercel deployment...\n')

    // Load environment variables
    const { config } = await import('dotenv')
    config({ path: '.env.local' })

    // Run all validation tests
    await this.runner.runTest('TypeScript Setup', () => this.validateTypeScriptSetup())
    await this.runner.runTest('Environment Variables', () => this.validateEnvironment())
    await this.runner.runTest('Dependencies', () => this.validateDependencies())
    await this.runner.runTest('Project Structure', () => this.validateProjectStructure())
    await this.runner.runTest('Build Process', () => this.validateBuild())
    await this.runner.runTest('External Services', () => this.validateExternalServices())

    // Generate and display report
    const report = this.runner.generateReport()
    await this.displayReport(report)

    return report
  }

  async displayReport(report: ValidationReport): Promise<void> {
    Logger.step(7, 'Validation Report')

    Logger.log(`\n${colors.bold}📊 VALIDATION SUMMARY${colors.reset}`)
    Logger.log(`Total Tests: ${report.totalTests}`)
    Logger.log(`Passed: ${colors.green}${report.passed}${colors.reset}`)
    Logger.log(`Failed: ${colors.red}${report.failed}${colors.reset}`)
    Logger.log(`Duration: ${report.duration}ms`)

    if (report.readyForDeployment) {
      Logger.log(`\n${colors.green}${colors.bold}🎉 READY FOR DEPLOYMENT!${colors.reset}`)
      Logger.log('\nNext steps:')
      Logger.log('1. Install Vercel CLI: npm install -g vercel')
      Logger.log('2. Login to Vercel: vercel login')
      Logger.log('3. Deploy: vercel --prod')
      Logger.log("\nDon't forget to set environment variables in Vercel Dashboard!")
    } else {
      Logger.log(`\n${colors.red}${colors.bold}❌ NOT READY FOR DEPLOYMENT${colors.reset}`)
      Logger.log('\nFailed tests:')
      report.results
        .filter(r => !r.success)
        .forEach(r => Logger.error(`- ${r.name}: ${r.error || 'Unknown error'}`))
      Logger.log('\nPlease fix the issues above before deploying.')
    }

    // Save report to file
    await fs.writeFile('validation-report.json', JSON.stringify(report, null, 2))
    Logger.info('Detailed report saved to validation-report.json')
  }
}

// Main execution
async function main(): Promise<void> {
  try {
    const validator = new PreDeploymentValidator()
    const report = await validator.run()

    process.exit(report.readyForDeployment ? 0 : 1)
  } catch (error) {
    Logger.error(`Validation failed: ${error instanceof Error ? error.message : String(error)}`)
    process.exit(1)
  }
}

// Handle process signals
process.on('SIGINT', () => {
  Logger.warning('\nValidation interrupted by user')
  process.exit(1)
})

process.on('uncaughtException', error => {
  Logger.error(`Uncaught exception: ${error.message}`)
  process.exit(1)
})

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export type { PreDeploymentValidator, ValidationReport, TestResult }
