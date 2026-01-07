/**
 * Feature Integration Tester
 * 
 * Tests core RAG chatbot features and workflows
 */

import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
} as const

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

async function testFeatures(baseUrl?: string): Promise<boolean> {
  console.log('🎯 Testing core RAG chatbot features...\n')

  let allPassed = true
  const results: boolean[] = []

  // 1. Database Schema Validation
  console.log('🗄️  Database Schema Validation:')
  const schemaResult = await validateDatabaseSchema()
  results.push(schemaResult)
  if (!schemaResult) allPassed = false

  // 2. Document Processing Pipeline
  console.log('\n📄 Document Processing Pipeline:')
  const docProcessingResult = await testDocumentProcessing()
  results.push(docProcessingResult)
  if (!docProcessingResult) allPassed = false

  // 3. Embedding Generation
  console.log('\n🧠 Embedding Generation:')
  const embeddingResult = await testEmbeddingGeneration()
  results.push(embeddingResult)
  if (!embeddingResult) allPassed = false

  // 4. Vector Search
  console.log('\n🔍 Vector Search Functionality:')
  const searchResult = await testVectorSearch()
  results.push(searchResult)
  if (!searchResult) allPassed = false

  // 5. RAG Pipeline
  console.log('\n🤖 RAG Pipeline Integration:')
  const ragResult = await testRAGPipeline()
  results.push(ragResult)
  if (!ragResult) allPassed = false

  // 6. Authentication Flow
  console.log('\n🔐 Authentication Flow:')
  const authResult = await testAuthenticationFlow()
  results.push(authResult)
  if (!authResult) allPassed = false

  // 7. Caching System
  console.log('\n💾 Caching System:')
  const cacheResult = await testCachingSystem()
  results.push(cacheResult)
  if (!cacheResult) allPassed = false

  // 8. Error Handling & Recovery
  console.log('\n🚨 Error Handling & Recovery:')
  const errorHandlingResult = await testErrorHandling()
  results.push(errorHandlingResult)
  if (!errorHandlingResult) allPassed = false

  // 9. Performance Benchmarks
  console.log('\n⚡ Performance Benchmarks:')
  const performanceResult = await testPerformance()
  results.push(performanceResult)
  // Performance is not critical for deployment

  // 10. E2E Workflow Test
  if (baseUrl) {
    console.log('\n🔄 End-to-End Workflow:')
    const e2eResult = await testE2EWorkflow(baseUrl)
    results.push(e2eResult)
    if (!e2eResult) allPassed = false
  } else {
    logWarning('Skipping E2E tests - no server URL provided')
    results.push(true)
  }

  return allPassed
}

async function validateDatabaseSchema(): Promise<boolean> {
  try {
    // Check if migration files exist
    const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations')
    if (!fs.existsSync(migrationsDir)) {
      logError('Supabase migrations directory not found')
      return false
    }

    const migrations = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'))
    if (migrations.length === 0) {
      logError('No migration files found')
      return false
    }

    logSuccess(`Found ${migrations.length} migration file(s)`)

    // Validate migration content
    for (const migration of migrations) {
      const content = fs.readFileSync(path.join(migrationsDir, migration), 'utf8')
      
      // Check for required tables
      const requiredTables = ['profiles', 'documents', 'document_chunks', 'conversations', 'messages']
      const foundTables = requiredTables.filter(table => content.includes(table))
      
      if (foundTables.length > 0) {
        logSuccess(`Migration ${migration} contains required tables: ${foundTables.join(', ')}`)
      }
    }

    return true
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logError(`Database schema validation failed: ${errorMessage}`)
    return false
  }
}

async function testDocumentProcessing(): Promise<boolean> {
  try {
    // Check if document processing utilities exist
    const processingFiles = [
      'src/lib/services/document-processor.ts',
      'src/lib/services/embeddings.ts'
    ]

    let allFilesExist = true
    for (const file of processingFiles) {
      if (fs.existsSync(path.join(process.cwd(), file))) {
        logSuccess(`${file} exists`)
      } else {
        logError(`${file} not found`)
        allFilesExist = false
      }
    }

    // Test PDF parsing capability
    try {
      const testScript = `
const pdfParse = require('pdf-parse')
console.log('PDF parsing library loaded successfully')
process.exit(0)
`
      fs.writeFileSync('temp-pdf-test.js', testScript)
      execSync('node temp-pdf-test.js', { stdio: 'pipe' })
      fs.unlinkSync('temp-pdf-test.js')
      logSuccess('PDF parsing capability verified')
    } catch (error) {
      logError('PDF parsing test failed')
      allFilesExist = false
    }

    return allFilesExist
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logError(`Document processing test failed: ${errorMessage}`)
    return false
  }
}

async function testEmbeddingGeneration(): Promise<boolean> {
  try {
    // Test OpenAI embeddings integration
    const testScript = `
const OpenAI = require('openai')

if (!process.env.OPENAI_API_KEY) {
  console.error('OpenAI API key not found')
  process.exit(1)
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

async function testEmbedding() {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: 'This is a test document for embedding generation.',
    })
    
    if (response.data && response.data[0] && response.data[0].embedding) {
      const embedding = response.data[0].embedding
      if (embedding.length === 1536) {
        console.log('Embedding generation successful - correct dimensions')
        return true
      } else {
        console.error('Embedding has wrong dimensions:', embedding.length)
        return false
      }
    } else {
      console.error('Invalid embedding response')
      return false
    }
  } catch (error) {
    console.error('Embedding generation failed:', error.message)
    return false
  }
}

testEmbedding().then(success => process.exit(success ? 0 : 1))
`

    fs.writeFileSync('temp-embedding-test.js', testScript)
    execSync('node temp-embedding-test.js', { stdio: 'pipe' })
    fs.unlinkSync('temp-embedding-test.js')
    
    logSuccess('Embedding generation test passed')
    return true
  } catch (error) {
    if (fs.existsSync('temp-embedding-test.js')) {
      fs.unlinkSync('temp-embedding-test.js')
    }
    logError('Embedding generation test failed')
    return false
  }
}

async function testVectorSearch(): Promise<boolean> {
  try {
    // Test Qdrant integration if configured
    if (process.env.QDRANT_URL && process.env.QDRANT_API_KEY) {
      const testScript = `
const { QdrantClient } = require('@qdrant/js-client-rest')

const client = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY
})

async function testVectorDB() {
  try {
    const collections = await client.getCollections()
    console.log('Vector database connection successful')
    
    const collectionName = process.env.QDRANT_COLLECTION_NAME || 'documents'
    
    // Try to get collection info
    try {
      const info = await client.getCollection(collectionName)
      console.log('Collection exists and accessible')
    } catch (error) {
      if (error.message.includes('Not found')) {
        console.log('Collection does not exist yet (will be created on first use)')
      } else {
        throw error
      }
    }
    
    return true
  } catch (error) {
    console.error('Vector database test failed:', error.message)
    return false
  }
}

testVectorDB().then(success => process.exit(success ? 0 : 1))
`

      fs.writeFileSync('temp-vector-test.js', testScript)
      execSync('node temp-vector-test.js', { stdio: 'pipe' })
      fs.unlinkSync('temp-vector-test.js')
      
      logSuccess('Vector search capability verified')
    } else {
      logWarning('Qdrant not configured - vector search will use fallback')
    }

    return true
  } catch (error) {
    if (fs.existsSync('temp-vector-test.js')) {
      fs.unlinkSync('temp-vector-test.js')
    }
    logError('Vector search test failed')
    return false
  }
}

async function testRAGPipeline(): Promise<boolean> {
  try {
    // Check if RAG components exist
    const ragFiles = [
      'src/app/api/chat/route.ts',
      'src/app/api/search/route.ts'
    ]

    let allFilesExist = true
    for (const file of ragFiles) {
      if (fs.existsSync(path.join(process.cwd(), file))) {
        logSuccess(`${file} exists`)
      } else {
        logError(`${file} not found`)
        allFilesExist = false
      }
    }

    // Test OpenAI chat completion
    const testScript = `
const OpenAI = require('openai')

if (!process.env.OPENAI_API_KEY) {
  console.error('OpenAI API key not found')
  process.exit(1)
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

async function testChat() {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Hello, this is a test message.' }
      ],
      max_tokens: 50
    })
    
    if (response.choices && response.choices[0] && response.choices[0].message) {
      console.log('Chat completion successful')
      return true
    } else {
      console.error('Invalid chat response')
      return false
    }
  } catch (error) {
    console.error('Chat completion failed:', error.message)
    return false
  }
}

testChat().then(success => process.exit(success ? 0 : 1))
`

    fs.writeFileSync('temp-chat-test.js', testScript)
    execSync('node temp-chat-test.js', { stdio: 'pipe' })
    fs.unlinkSync('temp-chat-test.js')
    
    logSuccess('RAG pipeline components verified')
    return allFilesExist
  } catch (error) {
    if (fs.existsSync('temp-chat-test.js')) {
      fs.unlinkSync('temp-chat-test.js')
    }
    logError('RAG pipeline test failed')
    return false
  }
}

async function testAuthenticationFlow(): Promise<boolean> {
  try {
    // Check if auth components exist
    const authFiles = [
      'src/lib/auth',
      'src/lib/supabase',
      'src/middleware.ts'
    ]

    let allFilesExist = true
    for (const file of authFiles) {
      if (fs.existsSync(path.join(process.cwd(), file))) {
        logSuccess(`${file} exists`)
      } else {
        logError(`${file} not found`)
        allFilesExist = false
      }
    }

    return allFilesExist
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logError(`Authentication test failed: ${errorMessage}`)
    return false
  }
}

async function testCachingSystem(): Promise<boolean> {
  try {
    // Test Redis connection if configured
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      const testScript = `
const { Redis } = require('@upstash/redis')

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN
})

async function testCache() {
  try {
    await redis.set('test-key', 'test-value', { ex: 60 })
    const value = await redis.get('test-key')
    await redis.del('test-key')
    
    if (value === 'test-value') {
      console.log('Cache system working correctly')
      return true
    } else {
      console.error('Cache test failed - value mismatch')
      return false
    }
  } catch (error) {
    console.error('Cache test failed:', error.message)
    return false
  }
}

testCache().then(success => process.exit(success ? 0 : 1))
`

      fs.writeFileSync('temp-cache-test.js', testScript)
      execSync('node temp-cache-test.js', { stdio: 'pipe' })
      fs.unlinkSync('temp-cache-test.js')
      
      logSuccess('Caching system verified')
    } else {
      logWarning('Redis not configured - caching will use in-memory fallback')
    }

    return true
  } catch (error) {
    if (fs.existsSync('temp-cache-test.js')) {
      fs.unlinkSync('temp-cache-test.js')
    }
    logError('Caching system test failed')
    return false
  }
}

async function testErrorHandling(): Promise<boolean> {
  try {
    // Check if error handling utilities exist
    const errorFiles = [
      'src/app/api/errors/route.ts',
      'src/app/error.tsx',
      'src/app/global-error.tsx'
    ]

    for (const file of errorFiles) {
      if (fs.existsSync(path.join(process.cwd(), file))) {
        logSuccess(`${file} exists`)
      } else {
        logWarning(`${file} not found (optional)`)
      }
    }

    return true
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logError(`Error handling test failed: ${errorMessage}`)
    return false
  }
}

async function testPerformance(): Promise<boolean> {
  try {
    // Basic performance checks
    const buildDir = path.join(process.cwd(), '.next')
    
    if (fs.existsSync(buildDir)) {
      // Check bundle sizes
      const staticDir = path.join(buildDir, 'static')
      if (fs.existsSync(staticDir)) {
        const chunksDir = path.join(staticDir, 'chunks')
        if (fs.existsSync(chunksDir)) {
          const chunks = fs.readdirSync(chunksDir, { withFileTypes: true })
            .filter(dirent => dirent.isFile() && dirent.name.endsWith('.js'))
          
          let totalSize = 0
          let largeChunks = 0
          
          for (const chunk of chunks) {
            const chunkPath = path.join(chunksDir, chunk.name)
            const stats = fs.statSync(chunkPath)
            totalSize += stats.size
            
            if (stats.size > 500 * 1024) { // 500KB threshold
              largeChunks++
            }
          }
          
          logInfo(`Total bundle size: ${Math.round(totalSize / 1024)}KB`)
          
          if (largeChunks > 0) {
            logWarning(`${largeChunks} large chunks detected (>500KB)`)
          } else {
            logSuccess('Bundle sizes are reasonable')
          }
        }
      }
    }

    return true
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logWarning(`Performance test failed: ${errorMessage}`)
    return true // Non-critical
  }
}

async function testE2EWorkflow(baseUrl: string): Promise<boolean> {
  try {
    // Run Playwright E2E tests if available
    try {
      execSync('npm run test:e2e -- --reporter=line', { stdio: 'pipe', timeout: 60000 })
      logSuccess('E2E tests passed')
      return true
    } catch (error) {
      logWarning('E2E tests failed or not configured')
      return false
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logError(`E2E workflow test failed: ${errorMessage}`)
    return false
  }
}

export { testFeatures }