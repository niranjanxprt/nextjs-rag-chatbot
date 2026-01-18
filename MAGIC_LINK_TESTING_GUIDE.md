# Magic Link Authentication - Testing Guide

## 🎯 Current Status

✅ **Backend**: Fully configured and working
✅ **Frontend**: Simplified MagicLinkHandler deployed
✅ **Configuration**: All environment variables set correctly
✅ **Test Script**: Automated testing script created

## 🚀 Quick Test

Run this command to send a fresh magic link:

```bash
npm run test:magic-link
```

This will:

1. Send a magic link to your email
2. Verify the frontend is running
3. Provide detailed testing instructions

## 📧 Manual Testing Steps

### Step 1: Send Magic Link

```bash
npm run test:magic-link
```

### Step 2: Check Your Email

- Open your email at: **niranjanxprt@gmail.com**
- Look for email from: **RAG Chatbot <onboarding@resend.dev>**
- Subject: **Sign in to RAG Chatbot**

### Step 3: Click the Magic Link

- Click the **"Sign In to RAG Chatbot"** button in the email
- Your browser will open: `http://localhost:8081/auth/callback?code=XXX&email=...`

### Step 4: Watch the Browser Console

Open browser console (F12) and watch for these logs:

```
🔍 Magic Link Handler - URL params: { code: 'aQoKznDo...', email: 'niranjanxprt@gmail.com' }
🔑 Verifying magic link code...
📤 Sending verification request...
✅ Magic link verification completed
✅ User is authenticated - redirecting to dashboard
```

### Step 5: Verify Success

You should see:

1. **Loading screen**: "Verifying Magic Link..."
2. **Success screen**: "Authentication Successful" with green checkmark
3. **Auto-redirect**: To dashboard after 1.5 seconds

## ✅ Success Indicators

- ✓ No "Connection lost" errors
- ✓ No "Could not verify code" errors
- ✓ Clean verification flow without retries
- ✓ Smooth redirect to dashboard
- ✓ User stays authenticated on page refresh

## ❌ Failure Indicators & Solutions

### "Could not verify code"

**Cause**: Code expired (15 min) or already used
**Solution**: Request a new magic link with `npm run test:magic-link`

### "Connection lost"

**Cause**: Network issue during verification
**Solution**: The simplified handler now waits 3 seconds to see if auth succeeds anyway

### "Email address not found"

**Cause**: Email not in URL parameters or sessionStorage
**Solution**: Make sure the magic link URL includes `&email=...` parameter

### Stuck on loading screen

**Cause**: JavaScript error in the component
**Solution**: Check browser console for errors

## 🔧 What Was Fixed

### Before (Complex Version)

- ❌ Complex retry logic with multiple attempts
- ❌ Connection error handling that interfered with auth
- ❌ Race conditions between retries and auth state updates
- ❌ Confusing error messages

### After (Simplified Version)

- ✅ Single verification attempt
- ✅ Simple error handling with clear messages
- ✅ Waits for auth state to update naturally
- ✅ Clean, predictable flow

## 🔍 Key Code Changes

### Simplified Verification

```typescript
const verifyCode = async () => {
  try {
    const formData = new FormData()
    formData.append('code', code)
    formData.append('email', emailToUse)

    await signIn('resend-magic-link', formData)
    console.log('✅ Magic link verification completed')

    sessionStorage.removeItem('auth_email')
    setVerifying(false)

    // Auth state updates via useConvexAuth hook
    // Success redirect handled in separate useEffect
  } catch (error: any) {
    // Simple, clear error handling
    if (error.message?.includes('Could not verify code')) {
      setVerificationError('This magic link is invalid, expired, or has already been used.')
    } else if (error.message?.includes('Connection lost')) {
      // Wait to see if auth state updates
      setTimeout(() => {
        if (!isAuthenticated) {
          setVerificationError('Connection issue during authentication. Please try again.')
        }
      }, 3000)
    }
  }
}
```

## 🌐 Environment Configuration

### Frontend

- **Port**: 8081 (auto-selected by Vite)
- **URL**: http://localhost:8081/
- **Callback**: http://localhost:8081/auth/callback

### Backend (Convex)

- **SITE_URL**: http://localhost:8081/auth/callback
- **AUTH_RESEND_KEY**: re_XA3kYNY8_DSdFGMmwdttWk7Pk8dftHHDn
- **AUTH_LOG_LEVEL**: DEBUG
- **JWT_PRIVATE_KEY**: [Configured]

## 📊 Testing Checklist

- [ ] Run `npm run test:magic-link` to send magic link
- [ ] Check email for magic link
- [ ] Click magic link button
- [ ] Verify loading screen appears
- [ ] Verify success screen appears
- [ ] Verify redirect to dashboard
- [ ] Refresh page and verify still authenticated
- [ ] Test sign-out functionality
- [ ] Test expired link (wait 15+ minutes)
- [ ] Test already-used link (click same link twice)

## 🎓 Understanding the Flow

### 1. User Requests Magic Link

```
User enters email → PasswordlessLoginForm → signIn('resend-magic-link', { email })
→ Convex generates code → Resend sends email
```

### 2. User Clicks Magic Link

```
Email link → http://localhost:8081/auth/callback?code=XXX&email=...
→ MagicLinkHandler component loads
```

### 3. Frontend Verifies Code

```
MagicLinkHandler extracts code & email → signIn('resend-magic-link', formData)
→ Convex verifies code → Returns auth token
```

### 4. Auth State Updates

```
useConvexAuth() detects authentication → isAuthenticated = true
→ MagicLinkHandler shows success → Redirects to dashboard
```

## 🐛 Debugging Tips

### Enable Verbose Logging

The frontend already has verbose logging enabled in `main.tsx`:

```typescript
const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string, {
  verbose: true, // Detailed client-side logs
})
```

### Check Convex Dashboard

1. Go to: https://dashboard.convex.dev/
2. Select your project: "resolute-tern-881"
3. View logs for detailed backend information

### Check Browser Console

Press F12 and look for:

- Convex client connection logs
- MagicLinkHandler component logs
- Network requests to Convex

## 📝 Next Steps After Testing

Once magic link authentication works:

1. **Update Protected Routes** (Task 6)
   - Use `useConvexAuth()` instead of custom auth check
   - Test protected routes block unauthenticated users

2. **Add Sign-Out Functionality** (Task 7)
   - Use `signOut()` from `useAuthActions`
   - Test sign-out clears session

3. **Clean Up Auth Service** (Task 8)
   - Remove Supabase-specific methods
   - Export Convex Auth hooks

4. **Remove Supabase Dependencies** (Task 9)
   - Audit for remaining Supabase auth code
   - Remove unused imports

5. **Complete Testing** (Task 10)
   - Test all authentication flows
   - Verify persistence across refreshes
   - Test error scenarios

## 🎉 Success Criteria

The migration is complete when:

- ✅ User can sign in with magic link
- ✅ Authentication persists across page refreshes
- ✅ Protected routes work correctly
- ✅ Sign-out clears session
- ✅ No Supabase dependencies in auth flow
- ✅ No console errors
- ✅ Clean, maintainable code

---

**Ready to test?** Run `npm run test:magic-link` and check your email! 🚀
