# 🧪 Local Testing & Deployment Guide

## Quick Start Testing

Run the comprehensive local test suite:

```bash
npm run test:local
```

This will:

- ✅ Check environment variables
- ✅ Install dependencies
- ✅ Run TypeScript type checking
- ✅ Run ESLint code quality checks
- ✅ Execute unit tests
- ✅ Build the application
- ✅ Test external service connections
- ✅ Start development server for manual testing

## Prerequisites

1. **Environment Setup**: Copy `.env.example` to `.env.local` and configure:

```bash
cp .env.example .env.local
```

Required variables:

```env
OPENAI_API_KEY=sk-proj-your-key-here
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Optional (for full functionality):

```env
QDRANT_URL=https://your-cluster.qdrant.io
QDRANT_API_KEY=your-qdrant-key
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token
```

## Manual Testing Checklist

When the dev server starts, test these features:

### 🔐 Authentication

- [ ] Visit `/auth/login`
- [ ] Enter email and click "Send Magic Link"
- [ ] Check success message appears
- [ ] Simulate login by visiting `/auth/callback?token=test`
- [ ] Verify redirect to dashboard

### 📄 Document Management

- [ ] Navigate to `/dashboard/documents` or `/documents`
- [ ] Upload a PDF, TXT, or Markdown file
- [ ] Verify upload progress indicator
- [ ] Check document appears in list
- [ ] Test file size limits (should reject >10MB)

### 🔍 Search Functionality

- [ ] Navigate to `/dashboard/search` or `/search`
- [ ] Enter a search query
- [ ] Verify search results appear
- [ ] Check relevance scores are shown
- [ ] Test empty query handling

### 💬 Chat Interface

- [ ] Navigate to `/dashboard/chat` or `/chat`
- [ ] Type a message about uploaded documents
- [ ] Verify streaming response appears
- [ ] Check context sources are displayed
- [ ] Test conversation continuity

### 🎨 UI/UX

- [ ] Test responsive design (resize browser)
- [ ] Check mobile navigation works
- [ ] Verify loading states appear
- [ ] Test error boundaries
- [ ] Check accessibility (tab navigation)

## Browser Console Check

Open Developer Tools (F12) and verify:

- [ ] No JavaScript errors in Console
- [ ] No failed network requests in Network tab
- [ ] No accessibility warnings

## Deploy to Vercel

Once all tests pass:

### 1. Install Vercel CLI

```bash
npm install -g vercel
```

### 2. Login to Vercel

```bash
vercel login
```

### 3. Deploy

```bash
vercel --prod
```

### 4. Set Environment Variables in Vercel Dashboard

Go to your Vercel project settings and add:

- `OPENAI_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `QDRANT_URL` (optional)
- `QDRANT_API_KEY` (optional)
- `UPSTASH_REDIS_REST_URL` (optional)
- `UPSTASH_REDIS_REST_TOKEN` (optional)

## Troubleshooting

### Common Issues

**Environment variables not found:**

```bash
# Make sure .env.local exists and has correct format
cp .env.example .env.local
# Edit .env.local with your actual values
```

**Build failures:**

```bash
# Check TypeScript errors
npm run type-check
# Fix any type errors shown
```

**Supabase connection issues:**

- Verify project URL and keys are correct
- Check Supabase project is active
- Ensure RLS policies are applied

**OpenAI API errors:**

- Verify API key is valid
- Check account has credits
- Ensure no rate limiting

**Dependencies issues:**

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

### Getting Help

- Check test output for specific error messages
- Review browser console for client-side errors
- Verify all environment variables are set correctly
- Test individual components in isolation

## Performance Tips

- Keep bundle size under 500KB
- Ensure API responses are under 2 seconds
- Monitor memory usage during testing
- Test with realistic document sizes

## Ready for Production?

✅ All automated tests pass  
✅ Manual testing completed successfully  
✅ No console errors  
✅ Environment variables configured  
✅ External services connected

**Deploy with confidence!** 🚀
