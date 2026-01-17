# 🚀 Quick Start Testing Guide

## ✅ All Services Running!

### Current Status
- **Convex Backend**: ✅ Running (Process 3)
- **Next.js API Backend**: ✅ Running on http://localhost:3001 (Process 4)
- **Vite React Frontend**: ✅ Running on http://localhost:8081 (Process 5)

### Access Points
1. **Frontend Application**: http://localhost:8081
2. **Next.js Backend**: http://localhost:3001
3. **Convex Dashboard**: https://dashboard.convex.dev

---

## 🎯 Quick Test Steps

### 1. Test Frontend Access
```bash
# Open in browser
open http://localhost:8081
```

### 2. Test Authentication
- Navigate to login page
- Enter your email
- Check for magic link email (Supabase Auth)
- Complete login flow

### 3. Test API Connectivity
The frontend is configured to use:
- **API Backend**: http://localhost:3001/api
- **Convex**: https://resolute-tern-881.convex.cloud
- **Supabase Auth**: https://gicmddezphctalcmehzq.supabase.co

### 4. Check Backend Logs
Backend is already receiving requests (401 responses indicate auth is working):
```
GET /api/projects 401
GET /api/prompts 401
GET /api/conversations 401
```

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│  Vite React Frontend (http://localhost:8081)            │
│  - React Router SPA                                     │
│  - Supabase Auth for login                             │
│  - API calls to Next.js backend                        │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  Next.js API Backend (http://localhost:3001/api)        │
│  - API Routes for all operations                       │
│  - Uses Convex for data storage                        │
│  - Handles authentication validation                   │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  Convex Backend (https://resolute-tern-881.convex.cloud)│
│  - Real-time database                                  │
│  - Queries and mutations                               │
│  - Schema validation                                   │
└─────────────────────────────────────────────────────────┘
```

---

## 🧪 What to Test

### ✅ Priority 1: Authentication Flow
1. Open http://localhost:8081
2. Click "Login" or navigate to login page
3. Enter email and request magic link
4. Check email and click magic link
5. Verify redirect back to app with authenticated session

### ✅ Priority 2: Dashboard Access
1. After login, check if dashboard loads
2. Verify API calls are successful (check Network tab)
3. Check for any console errors

### ✅ Priority 3: Core Features
1. **Projects**: Create, view, edit projects
2. **Conversations**: Start new chat, view history
3. **Documents**: Upload documents (if implemented)
4. **Prompts**: View and use prompt library

---

## 🔍 What to Look For

### ✅ Good Signs
- Frontend loads at http://localhost:8081
- Login page displays correctly
- API calls reach backend (check Network tab)
- 401 responses (means auth is working, just need to login)
- No console errors

### ⚠️ Warning Signs
- Blank pages
- CORS errors (cross-origin issues)
- 500 errors (backend crashes)
- Connection refused errors
- Console errors in browser DevTools

---

## 🐛 Troubleshooting

### Frontend Not Loading
- Check process 5 is running: `ps aux | grep vite`
- Check browser console for errors
- Verify .env.local has correct API URL

### API Calls Failing
- Check process 4 is running: `ps aux | grep next`
- Check Network tab for 401/403 errors (auth issue)
- Check Network tab for 500 errors (backend issue)
- Verify CORS is configured correctly

### Authentication Issues
- Verify Supabase credentials in .env.local
- Check Supabase dashboard for auth logs
- Clear browser cookies and try again
- Check email for magic link

---

## 🛑 Stop All Services

```bash
# Stop Vite frontend
pkill -f "vite"

# Stop Next.js backend
pkill -f "next-server"

# Stop Convex
pkill -f "convex dev"
```

---

## 🔄 Restart Services

```bash
# Start Convex (in project root)
npx convex dev

# Start Next.js backend (in project root)
npm run dev

# Start Vite frontend (in frontend-vite directory)
cd frontend-vite && npm run dev
```

---

## 📊 Next Steps After Testing

1. **If frontend works**: Test all features and note any issues
2. **If auth works**: Test CRUD operations for projects, conversations, etc.
3. **If everything works**: Consider migrating Vite frontend to Next.js App Router
4. **If issues found**: Document them and we'll fix them together

---

## 📝 Report Issues

If you find issues, note:

1. **What page** you were on
2. **What you did** (clicked, typed, etc.)
3. **What happened** (error message, blank page, etc.)
4. **Console errors** (F12 → Console tab)
5. **Network errors** (F12 → Network tab)

---

## 🎉 Ready to Test!

**Open http://localhost:8081 in your browser and start exploring!** 🚀

All three services are running and ready for testing. The backend is already receiving API calls (401 responses are expected until you login).
