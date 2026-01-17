# 🚨 URGENT: Setup Resend API Key

## Why You're Not Receiving Emails

The authentication system uses **Convex Auth** with **Resend** to send emails. You need a Resend API key to send magic links and OTP codes.

## Quick Setup (5 minutes)

### 1. Get Free Resend API Key

1. Go to: **https://resend.com/signup**
2. Sign up (free - no credit card required)
3. After signup, go to: **https://resend.com/api-keys**
4. Click "Create API Key"
5. Name it: `RAG Chatbot Dev`
6. Copy the key (starts with `re_`)

### 2. Add to Environment Variables

Open `.env.local` in the project root and add:

```bash
# Resend Email Configuration (for Convex Auth)
AUTH_RESEND_KEY=re_your_actual_key_here
```

Replace `re_your_actual_key_here` with your actual Resend API key.

### 3. Restart Services

```bash
# Stop Convex (Ctrl+C or kill process 3)
# Then restart:
npx convex dev

# In another terminal, restart Next.js if needed
npm run dev
```

### 4. Test Authentication

1. Open: http://localhost:8081
2. Enter email: `niranjanxprt@gmail.com`
3. Click "Send Magic Link" or "Send Code"
4. Check your email inbox (and spam folder)
5. You should receive the email within seconds!

## Free Tier Limits

Resend free tier includes:
- ✅ 100 emails per day
- ✅ 3,000 emails per month
- ✅ Perfect for development

## Troubleshooting

### Still no email?

1. **Check Resend dashboard**: https://resend.com/emails
   - See if email was sent
   - Check delivery status

2. **Check spam folder**
   - Emails come from `onboarding@resend.dev`
   - Add to contacts to avoid spam

3. **Check Convex logs**
   - Visit: https://dashboard.convex.dev
   - Go to your project
   - Check Logs tab for errors

4. **Verify environment variable**
   ```bash
   grep AUTH_RESEND_KEY .env.local
   ```
   Should show your key starting with `re_`

## What Changed?

- ❌ **Removed**: Supabase authentication
- ✅ **Added**: Convex Auth with Resend
- ✅ **Backend**: `/api/auth/passwordless` now uses Convex
- ✅ **Frontend**: Updated to call backend API

## Need Help?

See full documentation in: `CONVEX_AUTH_SETUP.md`

---

**Quick Links:**
- Resend Signup: https://resend.com/signup
- Resend API Keys: https://resend.com/api-keys
- Resend Dashboard: https://resend.com/emails
- Convex Dashboard: https://dashboard.convex.dev
