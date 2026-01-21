#!/usr/bin/env tsx

/**
 * Initialize Qdrant Collection
 * 
 * Creates the document_embeddings collection with proper schema
 */

import 'dotenv/config'
import { initializeCollection } from '../src/lib/services/vector-search'

async function main() {
  console.log('🚀 Initializing Qdrant collection...')
  
  try {
    await initializeCollection()
    console.log('✅ Qdrant collection initialized successfully!')
  } catch (error) {
    console.error('❌ Failed to initialize Qdrant collection:', error)
    process.exit(1)
  }
}

main()
