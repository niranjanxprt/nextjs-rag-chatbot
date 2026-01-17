# Convex Authentication Setup Guide

## Overview

The application now uses **Convex Auth** for passwordless authentication instead of Supabase. This provides:
- Magic Link authentication (email with sign-in link)
- OTP authentication (6-digit code via email)
- Integrated with Convex backend
- Email delivery via Resend

## 🚨 Required: Resend API Key

To send authentication emails, you need a **Resend API key**.

### Step 1: Get Resend API Key

1. **Sign up for Resend** (free tier available)
   - Go to: https://resend.com/signup
   - Create an account (free tier includes 100 emails/day)

2. **Get your API key**
   - After signing up, go to: https://resend.com/api-keys
   - Click "Create API Key"
   - Give it a name (e.g., "RAG Chatbot Dev")
   - Copy the API key (starts with `re_`)

3. **Add to environment variables**
   
   Add to `.env.local`:
   ```bash
   # Resend Email Configuration (for Convex Auth)
   AUTH_RESEND_KEY=re_your_actual_api_key_here
   ```

4. **Restart Convex dev server**
   ```bash
   # Stop the current Convex process (Ctrl+C or kill process)
   # Then restart:
   npx convex dev
   ```

### Step 2: Verify Configuration

Test the authentication endpoint:

```bash
curl -X POST http://localhost:3001/api/auth/passwordless \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com","method":"magic_link"}'
```

**Expected response:**
```json
{
  "success": true,
  "message": "Magic link sent to your email",
  "method": "magic_link"
}
```

**If you see an error about AUTH_RESEND_KEY:**
- Make sure you added the key to `.env.local`
- Make sure you restarted the Convex dev server
- Check that the key starts with `re_`

## 📧 Email Configuration

### Default Email Sender

By default, emails are sent from:
```
RAG Chatbot <onboarding@resend.dev>
```

### Custom Domain (Optional)

To use your own domain for sending emails:

1. **Add your domain in Resend**
   - Go to: https://resend.com/domains
   - Click "Add Domain"
   - Follow DNS configuration instructions

2. **Update email sender in Convex auth files**
   
   Edit `convex/auth/ResendMagicLink.ts`:
   ```typescript
   from: "RAG Chatbot <noreply@yourdomain.com>",
   ```
   
   Edit `convex/auth/ResendOTP.ts`:
   ```typescript
   from: "RAG Chatbot <noreply@yourdomain.com>",
   ```

## 🔧 Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Vite React Frontend (http://localhost:8081)            │
│  - User enters email                                    │
│  - Calls /api/auth/passwordless                         │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  Next.js API Backend (http://localhost:3001/api)        │
│  - Validates email and method                           │
│  - Calls Convex auth.signIn action                      │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  Convex Backend (https://resolute-tern-881.convex.cloud)│
│  - Generates magic link or OTP code                     │
│  - Calls Resend API to send email                       │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  Resend Email Service                                   │
│  - Delivers email to user                               │
│  - Tracks delivery status                               │
└─────────────────────────────────────────────────────────┘
```

## 🧪 Testing Authentication

### Test Magic Link

1. Open frontend: http://localhost:8081
2. Click "Login" or "Sign In"
3. Enter your email: `niranjanxprt@gmail.com`
4. Select "Magic Link" method
5. Click "Send Magic Link"
6. Check your email inbox
7. Click the link in the email
8. You should be redirected and logged in

### Test OTP

1. Open frontend: http://localhost:8081
2. Click "Login" or "Sign In"
3. Enter your email: `niranjanxprt@gmail.com`
4. Select "One-Time Code" method
5. Click "Send Code"
6. Check your email inbox
7. Enter the 6-digit code
8. You should be logged in

## 🐛 Troubleshooting

### No Email Received

**Check 1: Resend API Key**
```bash
# Check if AUTH_RESEND_KEY is set
grep AUTH_RESEND_KEY .env.local
```

**Check 2: Convex Logs**
```bash
# Check Convex dashboard for errors
# Visit: https://dashboard.convex.dev
# Go to: Logs tab
```

**Check 3: Resend Dashboard**
- Go to: https://resend.com/emails
- Check if email was sent
- Check delivery status

**Check 4: Spam Folder**
- Check your spam/junk folder
- Add `onboarding@resend.dev` to contacts

### Error: "AUTH_RESEND_KEY environment variable is not set"

**Solution:**
1. Add the key to `.env.local`
2. Restart Convex: `npx convex dev`
3. Restart Next.js: `npm run dev`

### Error: "Email service not configured"

**Solution:**
1. Verify `NEXT_PUBLIC_CONVEX_URL` is set in `.env.local`
2. Verify Convex is running: `ps aux | grep convex`
3. Check Convex dashboard: https://dashboard.convex.dev

## 📊 Current Status

- ✅ Convex auth configured with ResendMagicLink and ResendOTP
- ✅ Backend endpoint `/api/auth/passwordless` created
- ✅ CORS configured for frontend-backend communication
- ⚠️ **Resend API key required** - Add `AUTH_RESEND_KEY` to `.env.local`
- ⏳ Frontend needs update to use Convex auth (next step)

## 🎯 Next Steps

1. **Get Resend API key** (see Step 1 above)
2. **Add to .env.local** and restart Convex
3. **Test authentication** with your email
4. **Update frontend** to use Convex auth (optional - backend handles it)

## 📚 Resources

- Resend Documentation: https://resend.com/docs
- Convex Auth Documentation: https://docs.convex.dev/auth
- Resend API Keys: https://resend.com/api-keys
- Resend Email Dashboard: https://resend.com/emails

---

**Important:** The free tier of Resend includes:
- 100 emails per day
- 3,000 emails per month
- Perfect for development and testing

For production, consider upgrading to a paid plan or using your own SMTP server.
