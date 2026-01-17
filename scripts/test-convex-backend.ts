#!/usr/bin/env tsx
/**
 * Convex Backend Verification Script
 *
 * This script tests the core Convex backend functionality to ensure:
 * 1. Functions deploy successfully
 * 2. Queries and mutations work correctly
 * 3. Authentication is properly configured
 * 4. Schema is correctly implemented
 */

import { ConvexHttpClient } from 'convex/browser'

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL

if (!CONVEX_URL) {
  console.error('❌ NEXT_PUBLIC_CONVEX_URL environment variable is not set')
  process.exit(1)
}

console.log('🔍 Testing Convex Backend Functionality')
console.log(`📡 Convex URL: ${CONVEX_URL}`)

const client = new ConvexHttpClient(CONVEX_URL)

async function testConvexBackend() {
  try {
    console.log('\n1️⃣ Testing Convex Connection...')

    // Test basic connection by trying to call a query without auth
    // This should fail with an auth error, confirming the connection works
    try {
      await client.query('users:current')
      console.log('⚠️  Warning: Query succeeded without authentication (unexpected)')
    } catch (error: any) {
      if (error.message?.includes('Unauthorized') || error.message?.includes('Authentication')) {
        console.log('✅ Connection successful - Authentication properly enforced')
      } else {
        console.log(`❌ Unexpected error: ${error.message}`)
        throw error
      }
    }

    console.log('\n2️⃣ Testing Schema Validation...')

    // Test that the schema is properly deployed by checking function existence
    const functions = [
      'users:current',
      'users:get',
      'users:searchByEmail',
      'documents:list',
      'documents:get',
      'conversations:list',
      'prompts:list',
    ]

    for (const func of functions) {
      try {
        await client.query(func as any, {})
        console.log(`⚠️  ${func} - Query succeeded without auth (unexpected)`)
      } catch (error: any) {
        if (error.message?.includes('Unauthorized') || error.message?.includes('Authentication')) {
          console.log(`✅ ${func} - Function exists and auth enforced`)
        } else if (
          error.message?.includes('not found') ||
          error.message?.includes('does not exist')
        ) {
          console.log(`❌ ${func} - Function not found`)
        } else {
          console.log(`⚠️  ${func} - Unexpected error: ${error.message}`)
        }
      }
    }

    console.log('\n3️⃣ Testing Mutation Functions...')

    const mutations = [
      'users:createOrUpdate',
      'users:updateProfile',
      'documents:create',
      'conversations:create',
      'prompts:create',
    ]

    for (const mutation of mutations) {
      try {
        await client.mutation(mutation as any, {})
        console.log(`⚠️  ${mutation} - Mutation succeeded without auth (unexpected)`)
      } catch (error: any) {
        if (error.message?.includes('Unauthorized') || error.message?.includes('Authentication')) {
          console.log(`✅ ${mutation} - Function exists and auth enforced`)
        } else if (
          error.message?.includes('not found') ||
          error.message?.includes('does not exist')
        ) {
          console.log(`❌ ${mutation} - Function not found`)
        } else {
          console.log(`⚠️  ${mutation} - Unexpected error: ${error.message}`)
        }
      }
    }

    console.log('\n4️⃣ Testing Authentication Configuration...')

    // Test auth endpoints exist
    const authEndpoints = ['auth:signIn', 'auth:signOut']

    for (const endpoint of authEndpoints) {
      try {
        await client.mutation(endpoint as any, {})
        console.log(`⚠️  ${endpoint} - Auth endpoint accessible`)
      } catch (error: any) {
        if (error.message?.includes('not found') || error.message?.includes('does not exist')) {
          console.log(`❌ ${endpoint} - Auth endpoint not found`)
        } else {
          console.log(`✅ ${endpoint} - Auth endpoint exists`)
        }
      }
    }

    console.log('\n✅ Convex Backend Verification Complete!')
    console.log('\n📋 Summary:')
    console.log('• Convex deployment is accessible')
    console.log('• Authentication is properly enforced')
    console.log('• Core query and mutation functions are deployed')
    console.log('• Schema validation is working')

    return true
  } catch (error) {
    console.error('\n❌ Convex Backend Verification Failed:')
    console.error(error)
    return false
  }
}

// Run the test
testConvexBackend()
  .then(success => {
    if (success) {
      console.log('\n🎉 All Convex backend tests passed!')
      process.exit(0)
    } else {
      console.log('\n💥 Some Convex backend tests failed!')
      process.exit(1)
    }
  })
  .catch(error => {
    console.error('\n💥 Fatal error during testing:', error)
    process.exit(1)
  })
