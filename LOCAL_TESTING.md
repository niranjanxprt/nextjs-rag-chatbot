# Local Testing Guide

## Pre-Deployment Testing Checklist

Before deploying to Vercel, ensure all features work locally.

### 1. Environment Setup ✅

Check your `.env.local` file has all required variables:

```bash
# Required
OPENAI_API_KEY=sk-proj-...
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...

# Optional (for full functionality)
QDRANT_URL=https://...
QDRANT_API_KEY=...
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

### 2. Quick Automated Tests

```bash
# Install dependencies
npm install

# Type checking
npm run type-check

# Linting
npm run lint

# Unit tests
npm test

# Build test
npm run build
```

### 3. Start Development Server

```bash
npm run dev
```

Visit: http://localhost:3000

### 4. Manual Feature Testing

#### 🔐 Authentication Flow
- [ ] Navigate to `/auth/login`
- [ ] Enter email address
- [ ] Click "Send Magic Link"
- [ ] Check for success message
- [ ] Simulate login by visiting `/auth/callback?token=test`
- [ ] Should redirect to `/dashboard`

#### 📄 Document Management
- [ ] Navigate to `/dashboard/documents`
- [ ] Click upload area or drag & drop a file
- [ ] Upload a PDF, TXT, or Markdown file (<10MB)
- [ ] Verify upload progress indicator
- [ ] Check document appears in list
- [ ] Verify processing status updates

#### 🔍 Search Functionality
- [ ] Navigate to `/dashboard/search`
- [ ] Enter a search query
- [ ] Click search button
- [ ] Verify search results appear
- [ ] Check result relevance scores
- [ ] Test empty query handling

#### 💬 Chat Interface
- [ ] Navigate to `/dashboard/chat`
- [ ] Type a message about your uploaded document
- [ ] Send message
- [ ] Verify streaming response appears
- [ ] Check context sources are shown
- [ ] Test conversation continuity

#### 🎨 UI/UX Elements
- [ ] Test responsive design (resize browser)
- [ ] Check mobile menu functionality
- [ ] Verify loading states work
- [ ] Test error boundaries (navigate to `/test-error`)
- [ ] Check accessibility (tab navigation)

### 5. Browser Console Check

Open Developer Tools (F12) and check:
- [ ] No JavaScript errors in Console
- [ ] No failed network requests in Network tab
- [ ] No accessibility warnings

### 6. Performance Check

- [ ] Page load times <3 seconds
- [ ] Search responses <2 seconds
- [ ] Chat responses <5 seconds
- [ ] No memory leaks (check Memory tab)

### 7. Error Scenarios

Test error handling:
- [ ] Upload unsupported file type
- [ ] Upload file >10MB
- [ ] Search with empty query
- [ ] Send empty chat message
- [ ] Test with network disconnected

## Common Issues & Solutions

### "Module not found" errors
```bash
rm -rf node_modules package-lock.json
npm install
```

### Build failures
```bash
npm run type-check
# Fix any TypeScript errors
```

### Supabase connection issues
- Verify URLs and keys in `.env.local`
- Check Supabase project is active
- Ensure RLS policies are applied

### OpenAI API errors
- Verify API key is valid
- Check account has credits
- Ensure no rate limiting

## Ready for Deployment?

If all tests pass:

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

## Environment Variables for Vercel

Add these in Vercel Dashboard > Settings > Environment Variables:

```
OPENAI_API_KEY
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
QDRANT_URL
QDRANT_API_KEY
QDRANT_COLLECTION_NAME
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
```

## Post-Deployment Testing

After deploying to Vercel:
- [ ] Test all features on production URL
- [ ] Check Vercel Analytics for errors
- [ ] Monitor performance metrics
- [ ] Verify all environment variables are set
