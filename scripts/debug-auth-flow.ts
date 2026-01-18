#!/usr/bin/env tsx
/**
 * Debug Auth Flow - Deep Dive
 *
 * This script helps debug the exact issue with magic link verification
 */

import { ConvexHttpClient } from 'convex/browser'

const CONVEX_URL = process.env.VITE_CONVEX_URL || 'https://resolute-tern-881.convex.cloud'
const TEST_EMAIL = 'niranjanxprt@gmail.com'

const client = new ConvexHttpClient(CONVEX_URL)

async function debugAuthFlow() {
  console.log('🔍 Deep Dive: Debugging Convex Auth Flow\n')
  console.log('='.repeat(70))
  console.log('STEP 1: Request Magic Link')
  console.log('='.repeat(70))

  try {
    // Step 1: Request magic link (this works)
    console.log("\n📤 Calling auth:signIn with provider='resend-magic-link'")
    console.log('Parameters:', { email: TEST_EMAIL })

    const result1 = await client.action('auth:signIn' as any, {
      provider: 'resend-magic-link',
      params: {
        email: TEST_EMAIL,
      },
    })

    console.log('✅ Magic link request successful')
    console.log('Result:', result1)

    console.log('\n' + '='.repeat(70))
    console.log('STEP 2: Understanding the Verification Flow')
    console.log('='.repeat(70))

    console.log('\n📋 According to Convex Auth Email provider docs:')
    console.log("   'By default it checks that there is an email field during")
    console.log('    token verification that matches the email used during the')
    console.log("    initial signIn call.'")

    console.log('\n🔑 This means when verifying, we MUST pass:')
    console.log('   1. code: The verification code from the URL')
    console.log('   2. email: The SAME email used in step 1')

    console.log('\n' + '='.repeat(70))
    console.log('STEP 3: What the Frontend Should Do')
    console.log('='.repeat(70))

    console.log('\n📱 When the user clicks the magic link:')
    console.log('   URL: http://localhost:8081/auth/callback?code=XXX&email=...')
    console.log('\n   The MagicLinkHandler should:')
    console.log("   1. Extract 'code' from URL params")
    console.log("   2. Extract 'email' from URL params")
    console.log("   3. Call signIn('resend-magic-link', { code, email })")

    console.log('\n⚠️  CRITICAL: The params must be a plain object, NOT FormData!')
    console.log("   ❌ WRONG: const formData = new FormData(); formData.append('code', code);")
    console.log("   ✅ RIGHT: await signIn('resend-magic-link', { code, email });")

    console.log('\n' + '='.repeat(70))
    console.log('STEP 4: Testing Verification (Manual)')
    console.log('='.repeat(70))

    console.log('\n📧 Check your email for the magic link')
    console.log("📋 Copy the 'code' parameter from the URL")
    console.log('🧪 Test verification with this command:\n')

    console.log(
      `   npx tsx -e "import {ConvexHttpClient} from 'convex/browser'; const c=new ConvexHttpClient('${CONVEX_URL}'); c.action('auth:signIn',{provider:'resend-magic-link',params:{code:'PASTE_CODE_HERE',email:'${TEST_EMAIL}'}}).then(r=>console.log('✅ Success:',r)).catch(e=>console.error('❌ Error:',e.message))"`
    )

    console.log('\n' + '='.repeat(70))
    console.log('STEP 5: The Fix')
    console.log('='.repeat(70))

    console.log('\n🔧 The issue is in MagicLinkHandler.tsx:')
    console.log('   Current code uses FormData, but Convex Auth expects a plain object')
    console.log('\n   Change from:')
    console.log('   ```typescript')
    console.log('   const formData = new FormData();')
    console.log("   formData.append('code', code);")
    console.log("   formData.append('email', emailToUse);")
    console.log("   await signIn('resend-magic-link', formData);")
    console.log('   ```')
    console.log('\n   To:')
    console.log('   ```typescript')
    console.log("   await signIn('resend-magic-link', {")
    console.log('     code: code,')
    console.log('     email: emailToUse')
    console.log('   });')
    console.log('   ```')

    console.log('\n' + '='.repeat(70))
    console.log('✨ SUMMARY')
    console.log('='.repeat(70))

    console.log('\n🎯 Root Cause:')
    console.log('   Using FormData instead of plain object for signIn params')

    console.log('\n🔧 Solution:')
    console.log('   Pass params as plain object: { code, email }')

    console.log('\n📝 Files to Update:')
    console.log('   - frontend-vite/src/components/auth/MagicLinkHandler.tsx')
    console.log(
      '   - frontend-vite/src/components/auth/PasswordlessLoginForm.tsx (if using FormData)'
    )

    console.log('\n✅ After fixing, the magic link should work without errors!')
  } catch (error: any) {
    console.error('\n❌ Error:', error.message)
  }
}

debugAuthFlow().catch(console.error)
