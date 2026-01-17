# ⚠️ CRITICAL: Resend API Key Required

## Why You're Not Getting Emails

The authentication system has been **fully migrated to Convex Auth**, but you need a **Resend API key** to send emails.

## Quick Fix (2 minutes)

### 1. Get Free Resend API Key

1. Visit: **https://resend.com/signup**
2. Sign up (free, no credit card)
3. Go to: **https://resend.com/api-keys**
4. Click "Create API Key"
5. Copy the key (starts with `re_`)

### 2. Add to .env.local

Open `.env.local` and add:

```bash
# Resend Email Configuration (for Convex Auth)
AUTH_RESEND_KEY=re_YourActualKeyHere
```

### 3. Restart Convex

```bash
# Kill the Convex process (Ctrl+C or kill process 3)
npx convex dev
```

### 4. Test

```bash
curl -X POST http://localhost:3001/api/auth/passwordless \
  -H "Content-Type: application/json" \
  -d '{"email":"niranjanxprt@gmail.com","method":"magic_link"}'
```

You should get:
```json
{
  "success": true,
  "message": "Magic link sent to your email",
  "method": "magic_link"
}
```

And receive an email within seconds!

## What's Been Done

✅ **Convex Auth configured** with Resend providers
✅ **Schema updated** with auth tables
✅ **Backend endpoint** uses Convex Auth
✅ **Frontend updated** to call backend API
✅ **Supabase removed** completely

## What's Missing

❌ **Resend API key** - You need to add this!

## Free Tier

Resend free tier:
- 100 emails/day
- 3,000 emails/month
- Perfect for development

## Need Help?

See full guide: `CONVEX_AUTH_SETUP.md`

---

**Once you add the Resend API key and restart Convex, authentication will work!**
