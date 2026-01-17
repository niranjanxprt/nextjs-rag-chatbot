# Testing Checklist - Next.js RAG Chatbot

**Date:** January 17, 2026  
**Status:** Post-Refactoring Testing

---

## 🎯 Testing Overview

This checklist covers all critical functionality after the Knip refactoring and Convex migration.

---

## ✅ Pre-Testing Setup

### 1. Environment Variables

```bash
# Check required variables are set
✓ CONVEX_DEPLOYMENT
✓ NEXT_PUBLIC_CONVEX_URL
✓ OPENAI_API_KEY
✓ AUTH_RESEND_KEY (for authentication)
```

### 2. Dependencies

```bash
npm install          # ✅ Install dependencies
npm run build        # ✅ Verify build works
```

### 3. Convex Backend

```bash
npx convex dev       # Start Convex backend
# OR
npx convex deploy    # Deploy to production
```

---

## 🧪 Automated Tests

### Build & Quality Checks

```bash
# 1. Production Build
npm run build
# Expected: ✅ Successful build, 318 kB bundle

# 2. Type Checking
npx tsc --noEmit
# Expected: ✅ No errors in src/ (test errors OK)

# 3. Linting
npm run lint
# Expected: ✅ 0 warnings/errors

# 4. Security Audit
npm audit --production
# Expected: ✅ 0 vulnerabilities

# 5. Dead Code Analysis
npm run knip
# Expected: ✅ 0 unused files, ~137 unused exports (library components)
```

### Unit Tests

```bash
# Run all unit tests
npm run test:unit

# Run specific test suites
npm run test:components    # Component tests
npm run test:api          # API tests
npm run test:auth         # Authentication tests
```

### Integration Tests

```bash
# Run integration tests
npm run test:integration

# Test specific integrations
npm test -- tests/integration/api/
npm test -- tests/integration/contexts/
```

### Property-Based Tests

```bash
# Run property tests
npm test -- tests/property/

# Specific property tests
npm test -- tests/property/mutations.property.test.ts
npm test -- tests/property/queries.property.test.ts
npm test -- tests/property/schema-migration.property.test.ts
```

### E2E Tests

```bash
# Run Playwright tests
npm run test:e2e
```

---

## 🖥️ Manual Testing

### 1. Application Startup

```bash
# Terminal 1: Start Convex
npx convex dev

# Terminal 2: Start Next.js
npm run dev

# Expected:
# ✅ Convex functions deployed
# ✅ Next.js running on http://localhost:3000
# ✅ No console errors
```

### 2. Authentication Flow

#### Magic Link Authentication

- [ ] Navigate to `/auth/login`
- [ ] Enter email address
- [ ] Select "Magic Link" method
- [ ] Click "Send Magic Link"
- [ ] Check email for magic link
- [ ] Click link in email
- [ ] Verify redirect to dashboard
- [ ] Verify user is authenticated

#### OTP Authentication

- [ ] Navigate to `/auth/login`
- [ ] Enter email address
- [ ] Select "OTP" method
- [ ] Click "Send OTP"
- [ ] Check email for 6-digit code
- [ ] Enter OTP code
- [ ] Click "Verify"
- [ ] Verify redirect to dashboard
- [ ] Verify user is authenticated

### 3. Document Management

#### Upload Document

- [ ] Navigate to `/documents`
- [ ] Click "Upload Document"
- [ ] Select a PDF/TXT/Markdown file (<10MB)
- [ ] Verify upload progress indicator
- [ ] Verify document appears in list
- [ ] Verify processing status updates

#### View Documents

- [ ] Verify document list displays
- [ ] Check document metadata (name, size, date)
- [ ] Verify status indicators (pending/processing/completed/failed)
- [ ] Test pagination if >20 documents

#### Delete Document

- [ ] Click delete button on a document
- [ ] Verify confirmation dialog
- [ ] Confirm deletion
- [ ] Verify document removed from list

### 4. Chat Functionality

#### Start Conversation

- [ ] Navigate to `/chat`
- [ ] Type a message
- [ ] Send message
- [ ] Verify message appears in chat
- [ ] Verify AI response streams in
- [ ] Verify response uses document context (if documents uploaded)

#### Conversation Management

- [ ] Create new conversation
- [ ] Switch between conversations
- [ ] Rename conversation
- [ ] Delete conversation
- [ ] Verify conversation history persists

### 5. Search Functionality

- [ ] Navigate to `/search`
- [ ] Enter search query
- [ ] Verify semantic search results
- [ ] Verify result relevance
- [ ] Test search with no results

### 6. Projects & Collaboration

- [ ] Navigate to `/projects`
- [ ] Create new project
- [ ] Edit project details
- [ ] Invite team member (if applicable)
- [ ] Delete project

### 7. Prompts Library

- [ ] Navigate to `/prompts`
- [ ] View prompt library
- [ ] Create custom prompt
- [ ] Edit prompt
- [ ] Use prompt in chat
- [ ] Delete prompt

### 8. User Settings

- [ ] Navigate to `/settings`
- [ ] Update profile information
- [ ] Change preferences
- [ ] Verify changes persist

---

## 🔄 Real-Time Features

### Convex Real-Time Updates

- [ ] Open app in two browser windows
- [ ] Create document in window 1
- [ ] Verify document appears in window 2 (real-time)
- [ ] Send chat message in window 1
- [ ] Verify message appears in window 2 (real-time)

---

## 📱 Responsive Design

### Desktop (>1024px)

- [ ] Test all pages at 1920x1080
- [ ] Verify sidebar navigation
- [ ] Verify layout is optimal

### Tablet (768px - 1024px)

- [ ] Test all pages at 768px width
- [ ] Verify responsive layout
- [ ] Verify collapsible sidebar

### Mobile (<768px)

- [ ] Test all pages at 375px width
- [ ] Verify mobile menu
- [ ] Verify touch interactions
- [ ] Verify readable text sizes

---

## 🚀 Performance Testing

### Page Load Times

- [ ] Home page loads in <2s
- [ ] Dashboard loads in <3s
- [ ] Chat interface loads in <2s
- [ ] Document list loads in <2s

### Bundle Size

```bash
npm run build
# Check: First Load JS = 318 kB ✅
```

### Lighthouse Scores

- [ ] Performance: >90
- [ ] Accessibility: >90
- [ ] Best Practices: >90
- [ ] SEO: >90

---

## 🔒 Security Testing

### Authentication

- [ ] Cannot access protected routes without login
- [ ] Session persists across page refreshes
- [ ] Logout works correctly
- [ ] Session expires appropriately

### API Security

- [ ] API routes require authentication
- [ ] Cannot access other users' data
- [ ] Input validation works
- [ ] XSS protection active

### Data Privacy

- [ ] User data is isolated
- [ ] Documents are user-specific
- [ ] No data leakage between users

---

## 🐛 Error Handling

### Network Errors

- [ ] Disconnect internet
- [ ] Verify error messages display
- [ ] Reconnect internet
- [ ] Verify app recovers

### Invalid Input

- [ ] Try uploading invalid file type
- [ ] Try uploading file >10MB
- [ ] Enter invalid email format
- [ ] Verify validation messages

### API Errors

- [ ] Simulate API failure
- [ ] Verify error boundaries catch errors
- [ ] Verify user-friendly error messages
- [ ] Verify app doesn't crash

---

## 📊 Test Results Summary

### Automated Tests

- [ ] Build: ✅ / ❌
- [ ] Type Check: ✅ / ❌
- [ ] Linting: ✅ / ❌
- [ ] Security: ✅ / ❌
- [ ] Unit Tests: ✅ / ❌ (**_/_** passed)
- [ ] Integration Tests: ✅ / ❌ (**_/_** passed)
- [ ] E2E Tests: ✅ / ❌ (**_/_** passed)

### Manual Tests

- [ ] Authentication: ✅ / ❌
- [ ] Document Management: ✅ / ❌
- [ ] Chat Functionality: ✅ / ❌
- [ ] Search: ✅ / ❌
- [ ] Projects: ✅ / ❌
- [ ] Prompts: ✅ / ❌
- [ ] Settings: ✅ / ❌
- [ ] Real-Time: ✅ / ❌
- [ ] Responsive: ✅ / ❌
- [ ] Performance: ✅ / ❌
- [ ] Security: ✅ / ❌
- [ ] Error Handling: ✅ / ❌

---

## 🎯 Critical Issues Found

| Issue | Severity | Status | Notes |
| ----- | -------- | ------ | ----- |
|       |          |        |       |

---

## ✅ Sign-Off

- [ ] All automated tests passing
- [ ] All manual tests completed
- [ ] No critical issues found
- [ ] Performance targets met
- [ ] Security validated
- [ ] Ready for production

**Tested By:** ******\_\_\_******  
**Date:** ******\_\_\_******  
**Approved By:** ******\_\_\_******  
**Date:** ******\_\_\_******

---

## 📝 Notes

Add any additional observations or recommendations here:
