# 🚀 Deployment Checklist

## Pre-Deployment Validation

Run this comprehensive validation before deploying to Vercel:

```bash
npm run validate:deployment
```

This script will:
- ✅ Verify all JavaScript files are converted to TypeScript
- ✅ Check environment variables are configured
- ✅ Validate project dependencies
- ✅ Test TypeScript compilation
- ✅ Run ESLint code quality checks
- ✅ Execute unit tests
- ✅ Build the Next.js application
- ✅ Test external service connections (Supabase, OpenAI)
- ✅ Validate project structure

## Manual Testing Checklist

After validation passes, test these features locally:

### 🔐 Authentication
- [ ] Visit `/auth/login`
- [ ] Enter email and send magic link
- [ ] Test callback URL works
- [ ] Verify dashboard access

### 📄 Document Management
- [ ] Upload PDF/TXT/Markdown file
- [ ] Check processing status
- [ ] Verify document appears in list
- [ ] Test file size limits (10MB)

### 🔍 Search Functionality
- [ ] Enter search query
- [ ] Verify results appear
- [ ] Check relevance scores
- [ ] Test empty query handling

### 💬 Chat Interface
- [ ] Send message about uploaded document
- [ ] Verify streaming response
- [ ] Check context sources shown
- [ ] Test conversation continuity

### 🎨 UI/UX
- [ ] Test responsive design
- [ ] Check mobile navigation
- [ ] Verify loading states
- [ ] Test error boundaries

## Deployment Commands

Once validation passes:

```bash
# Install Vercel CLI (if not installed)
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

## Environment Variables for Vercel

Set these in Vercel Dashboard > Settings > Environment Variables:

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

After deployment:
- [ ] Test all features on production URL
- [ ] Check Vercel Analytics for errors
- [ ] Monitor performance metrics
- [ ] Verify environment variables are set correctly

## Troubleshooting

### Common Issues:
- **Build failures**: Run `npm run type-check` to find TypeScript errors
- **Environment errors**: Verify all required variables are set
- **Service connection issues**: Check API keys and URLs are correct
- **Performance issues**: Monitor bundle size and optimize if needed

### Getting Help:
- Check validation report: `validation-report.json`
- Review Vercel deployment logs
- Test locally with `npm run dev`
