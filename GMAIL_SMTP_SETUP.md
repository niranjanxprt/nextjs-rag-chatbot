# Gmail SMTP Setup for Authentication

## Quick Setup (3 minutes)

The app now sends emails directly using Gmail SMTP - no external services needed!

### Step 1: Enable 2-Factor Authentication on Gmail

1. Go to: https://myaccount.google.com/security
2. Click "2-Step Verification"
3. Follow the steps to enable it (if not already enabled)

### Step 2: Create App Password

1. Go to: https://myaccount.google.com/apppasswords
2. Select "Mail" and "Other (Custom name)"
3. Name it: "RAG Chatbot"
4. Click "Generate"
5. Copy the 16-character password (no spaces)

### Step 3: Add to .env.local

Add these lines to `.env.local`:

```bash
# Gmail SMTP Configuration
GMAIL_USER=niranjanxprt@gmail.com
GMAIL_APP_PASSWORD=your_16_character_app_password_here
```

Replace `your_16_character_app_password_here` with the password from Step 2.

### Step 4: Restart Next.js

```bash
# Stop the Next.js server (Ctrl+C or kill process 4)
npm run dev
```

### Step 5: Test!

1. Open: http://localhost:8081
2. Enter email: `niranjanxprt@gmail.com`
3. Click "Send Magic Link" or "Send Code"
4. Check your Gmail inbox!

## How It Works

```
User enters email
       ↓
Frontend calls /api/auth/passwordless
       ↓
Backend uses Nodemailer + Gmail SMTP
       ↓
Email sent directly to your Gmail
       ↓
You receive the email instantly!
```

## Benefits

✅ **No external services** - Uses your Gmail directly
✅ **Free** - No cost, no limits for personal use
✅ **Instant** - Emails arrive in seconds
✅ **Reliable** - Gmail's infrastructure
✅ **Simple** - Just 2 environment variables

## Troubleshooting

### "Gmail credentials not configured"

**Solution:** Add `GMAIL_USER` and `GMAIL_APP_PASSWORD` to `.env.local`

### "Invalid login"

**Solution:** 
1. Make sure 2FA is enabled on your Google account
2. Generate a new App Password
3. Copy it exactly (no spaces)

### Still no email?

1. Check spam folder
2. Verify the app password is correct
3. Check backend console for errors
4. Try generating a new app password

## Security Notes

- **App Password** is NOT your Gmail password
- It's a special 16-character password for apps
- You can revoke it anytime at: https://myaccount.google.com/apppasswords
- Never share your app password

## Testing

Test the endpoint directly:

```bash
curl -X POST http://localhost:3001/api/auth/passwordless \
  -H "Content-Type: application/json" \
  -d '{"email":"niranjanxprt@gmail.com","method":"magic_link"}'
```

Expected response:
```json
{
  "success": true,
  "message": "Magic link sent to your email",
  "method": "magic_link"
}
```

Check your Gmail - you should receive the email within seconds!

---

**Quick Links:**
- Enable 2FA: https://myaccount.google.com/security
- App Passwords: https://myaccount.google.com/apppasswords
- Gmail Settings: https://mail.google.com/mail/u/0/#settings/fwdandpop
