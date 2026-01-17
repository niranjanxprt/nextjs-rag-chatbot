# 🚀 Quick Start Testing Guide

## ✅ All Tasks Complete!

Both specs are now 100% complete:

- ✅ Knip Refactoring: Complete
- ✅ Supabase to Convex Migration: Complete

---

## 🎯 Start Testing NOW

### Step 1: Start Convex Backend

Open Terminal 1:

```bash
npx convex dev
```

**Expected Output:**

```
✔ Convex functions deployed
✔ Watching for changes...
```

### Step 2: Start Next.js

Open Terminal 2:

```bash
npm run dev
```

**Expected Output:**

```
✔ Ready on http://localhost:3000
```

### Step 3: Open Browser

```bash
open http://localhost:3000
```

Or manually navigate to: **http://localhost:3000**

---

## 🧪 Quick Smoke Tests

### Test 1: Home Page Loads

- [ ] Navigate to http://localhost:3000
- [ ] Page loads without errors
- [ ] No console errors in browser DevTools

### Test 2: Authentication Page

- [ ] Navigate to http://localhost:3000/auth/login
- [ ] Login form displays
- [ ] Can enter email address
- [ ] Can select Magic Link or OTP method

### Test 3: Protected Routes

- [ ] Try to access http://localhost:3000/dashboard
- [ ] Should redirect to login (if not authenticated)
- [ ] OR show dashboard (if authenticated)

### Test 4: Build Verification

```bash
npm run build
```

- [ ] Build completes successfully
- [ ] No errors in output
- [ ] Bundle size: ~318 kB

---

## 🔍 What to Look For

### ✅ Good Signs

- Pages load quickly
- No console errors
- Forms are interactive
- Navigation works
- Convex functions respond

### ⚠️ Warning Signs

- Console errors (check browser DevTools F12)
- Blank pages
- "Unauthorized" errors everywhere
- Slow loading (>5 seconds)

---

## 🐛 If You See Issues

### Issue: "Unauthorized" or "Authentication Required"

**Solution:** You need to authenticate first

1. Go to `/auth/login`
2. Enter your email
3. Complete authentication flow

### Issue: "Convex deployment not found"

**Solution:** Check environment variables

```bash
# Check .env.local has:
CONVEX_DEPLOYMENT=your-deployment-url
NEXT_PUBLIC_CONVEX_URL=your-convex-url
```

### Issue: Page won't load

**Solution:** Check both terminals

1. Convex dev should be running (Terminal 1)
2. Next.js dev should be running (Terminal 2)
3. No error messages in either terminal

---

## 📊 Testing Checklist

Use the comprehensive checklist in `TESTING_CHECKLIST.md` for full testing.

### Priority Tests (Do These First)

1. **Authentication** (Critical)
   - [ ] Magic Link login works
   - [ ] OTP login works
   - [ ] Can access dashboard after login

2. **Documents** (High Priority)
   - [ ] Can navigate to /documents
   - [ ] Upload form displays
   - [ ] Can select a file

3. **Chat** (High Priority)
   - [ ] Can navigate to /chat
   - [ ] Chat interface displays
   - [ ] Can type a message

4. **Navigation** (Medium Priority)
   - [ ] Sidebar menu works
   - [ ] Can navigate between pages
   - [ ] URLs update correctly

---

## 🎉 Success Criteria

Your app is working if:

- ✅ Home page loads
- ✅ Can access login page
- ✅ No critical console errors
- ✅ Build completes successfully
- ✅ Convex backend responds

---

## 📝 Report Issues

If you find issues, note:

1. **What page** you were on
2. **What you did** (clicked, typed, etc.)
3. **What happened** (error message, blank page, etc.)
4. **Console errors** (F12 → Console tab)

---

## 🚀 Ready? Let's Test!

1. Start Convex: `npx convex dev`
2. Start Next.js: `npm run dev`
3. Open browser: http://localhost:3000
4. Report what you see!

**Good luck! 🎯**
