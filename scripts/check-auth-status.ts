#!/usr/bin/env tsx
/**
 * Check Authentication Status Script
 *
 * Checks if the user is currently authenticated by trying to access a protected resource
 */

import { ConvexHttpClient } from 'convex/browser'

const CONVEX_URL = process.env.VITE_CONVEX_URL || 'https://resolute-tern-881.convex.cloud'
const TEST_EMAIL = process.env.TEST_EMAIL || 'niranjanxprt@gmail.com'

const client = new ConvexHttpClient(CONVEX_URL)

async function checkAuthStatus() {
  console.log('🔍 Checking Authentication Status\n')
  console.log(`🔗 Convex URL: ${CONVEX_URL}`)
  console.log(`📧 Test Email: ${TEST_EMAIL}\n`)

  try {
    // Try to access a protected resource
    console.log('🔐 Attempting to access protected resource...')

    const users = await client.query('queries/users:searchByEmail' as any, {
      email: TEST_EMAIL,
    })

    console.log('✅ SUCCESS: User is authenticated!')
    console.log('👤 User data:', JSON.stringify(users, null, 2))
  } catch (error: any) {
    if (error.message?.includes('Unauthorized')) {
      console.log('❌ User is NOT authenticated')
      console.log('   This means the session is not active or has expired')
    } else {
      console.error('❌ Unexpected error:', error.message)
    }
  }

  // Try to get current user info
  try {
    console.log('\n🔍 Checking current user...')
    const currentUser = await client.query('queries/users:getCurrentUser' as any)

    if (currentUser) {
      console.log('✅ Current user found:', JSON.stringify(currentUser, null, 2))
    } else {
      console.log('❌ No current user (not authenticated)')
    }
  } catch (error: any) {
    console.log('❌ Cannot get current user:', error.message)
  }
}

// Run the check
checkAuthStatus().catch(console.error)
