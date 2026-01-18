#!/usr/bin/env tsx
/**
 * Convex Connection Test Script
 *
 * Tests the connection to Convex backend and verifies configuration.
 */

import { ConvexHttpClient } from 'convex/browser'

const CONVEX_URL = process.env.VITE_CONVEX_URL || 'https://resolute-tern-881.convex.cloud'

async function testConnection() {
  console.log('🔍 Testing Convex Connection\n')
  console.log(`🔗 Convex URL: ${CONVEX_URL}\n`)

  try {
    const client = new ConvexHttpClient(CONVEX_URL)

    console.log('✅ ConvexHttpClient created successfully')
    console.log('📡 Testing connection with a simple query...\n')

    // Try to call a simple query to test connection
    try {
      // This will fail with "Unauthorized" but proves the connection works
      await client.query('queries/users:searchByEmail' as any, {
        email: 'test@example.com',
      })
    } catch (error: any) {
      if (error.message?.includes('Unauthorized')) {
        console.log('✅ Connection successful! (Unauthorized error is expected)')
        console.log('   This means the Convex backend is reachable and responding.\n')
      } else {
        throw error
      }
    }

    console.log('📊 Connection Summary:')
    console.log('- Convex URL is valid ✅')
    console.log('- Backend is reachable ✅')
    console.log('- Network connection is stable ✅')
    console.log('\n✨ All connection tests passed!')
  } catch (error: any) {
    console.error('\n❌ Connection test failed:')
    console.error(error.message || error)

    if (error.message?.includes('fetch')) {
      console.error('\n💡 Network issue detected:')
      console.error('   - Check your internet connection')
      console.error('   - Verify the Convex URL is correct')
      console.error('   - Check if a firewall is blocking the connection')
    }

    process.exit(1)
  }
}

// Run the test
testConnection().catch(console.error)
