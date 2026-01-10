# Phase 10 - Testing & Deployment - Comprehensive Plan

**Date:** 2026-01-08
**Status:** ACTIVE
**Scope:** Complete testing infrastructure, E2E tests, performance profiling, accessibility audit
**Target:** 100% completion with production-ready deployment

---

## 🎯 Phase 10 Objectives

### Primary Goals
1. ✅ **Testing Infrastructure** - Jest + Playwright fully configured
2. 🔄 **Unit Tests** - Core hooks, contexts, components (70%+ coverage)
3. 🔄 **Integration Tests** - API routes, database operations
4. 🔄 **E2E Tests** - Critical user journeys (authentication, chat, document upload)
5. 🔄 **Performance Profiling** - Identify bottlenecks, optimize
6. 🔄 **Accessibility Audit** - Full WCAG AA compliance
7. 🔄 **Deployment** - Vercel setup, CI/CD pipeline

### Success Criteria
- [ ] 70%+ code coverage (unit + integration)
- [ ] All critical E2E flows passing
- [ ] Lighthouse score >90
- [ ] <2s page load time (p95)
- [ ] WCAG AA compliance
- [ ] Zero console errors in tests
- [ ] Successful Vercel deployment

---

## 📋 Testing Strategy

### Test Pyramid
```
         E2E Tests (Critical flows)
        /        \
    Integration   Tests (APIs, contexts)
   /        \
Unit Tests (Components, hooks)
```

### Coverage Targets

| Category | Target | Priority |
|----------|--------|----------|
| Unit Tests | 80%+ | HIGH |
| Integration Tests | 70%+ | HIGH |
| E2E Tests | All critical flows | HIGH |
| Performance | Lighthouse >90 | MEDIUM |
| Accessibility | WCAG AA | MEDIUM |
| Load Testing | <2s p95 | LOW |

---

## 🧪 Unit Tests (Jest)

### Tests to Create

#### 1. Hooks (src/lib/hooks/)
- [x] `useKeyboardShortcuts.test.ts` - Keyboard event handling
- [ ] `useConversations.test.ts` - Conversation context hook (if exists)
- [ ] `useProjects.test.ts` - Project context hook (if exists)
- [ ] `useTheme.test.ts` - Theme switching logic

**Focus Areas:**
- Hook initialization and cleanup
- Effect dependencies
- Event listeners
- State updates
- Error handling

#### 2. Components - UI (src/components/ui/)
- [x] `EmptyState.test.tsx` - Empty state rendering and actions
- [x] `StatCard.test.tsx` - Statistics display and trends
- [ ] `FileIcon.test.tsx` - File type detection
- [ ] `SearchInput.test.tsx` - Search functionality
- [ ] `BreadcrumbNav.test.tsx` - Navigation breadcrumbs
- [ ] `KeyboardShortcutsDialog.test.tsx` - Shortcuts help dialog

**Focus Areas:**
- Rendering with different props
- User interactions (click, type, etc.)
- Accessibility attributes
- Edge cases
- Error states

#### 3. Components - Feature (src/components/)
- [ ] `ChatInterface.test.tsx` - Chat message sending/receiving
- [ ] `ConversationSidebar.test.tsx` - Conversation list
- [ ] `ProjectCard.test.tsx` - Project display
- [ ] `PromptCard.test.tsx` - Prompt template rendering

#### 4. Utilities & Services
- [ ] `keyboard-shortcuts.test.ts` - Shortcut configuration
- [ ] `page-transitions.test.ts` - Animation configuration
- [ ] `langfuse.test.ts` - Observability service

### Running Unit Tests

```bash
# Run all unit tests
npm test

# Run specific test file
npm test -- EmptyState.test.tsx

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch

# Update snapshots
npm test -- -u
```

---

## 🔗 Integration Tests (Jest)

### Test Coverage

#### 1. API Routes (src/app/api/)
**Tests to create:**
- [ ] `tests/api/projects.integration.test.ts`
  - POST /api/projects (create)
  - GET /api/projects (list)
  - PATCH /api/projects/[id] (update)
  - DELETE /api/projects/[id] (delete)

- [ ] `tests/api/prompts.integration.test.ts`
  - CRUD operations
  - Favorite toggling
  - Usage tracking

- [ ] `tests/api/preferences.integration.test.ts`
  - GET preferences
  - PATCH preferences
  - Default creation

- [ ] `tests/api/chat.integration.test.ts`
  - Message creation
  - Streaming response
  - Error handling
  - Langfuse tracing

**Focus Areas:**
- Authentication & authorization
- Database operations
- Request validation
- Error responses
- Status codes

#### 2. Context Providers (src/lib/contexts/)
- [ ] `ProjectsContext.integration.test.tsx`
- [ ] `PromptsContext.integration.test.tsx`
- [ ] `ConversationsContext.integration.test.tsx`
- [ ] `ThemeContext.integration.test.tsx`

**Focus Areas:**
- Provider initialization
- Reducer logic
- State updates
- API calls
- Error handling

### Running Integration Tests

```bash
# Run integration tests
npm run test:integration

# Run specific integration test
npm test -- tests/integration/api/projects.test.ts

# With coverage
npm test:integration -- --coverage
```

---

## 🚀 E2E Tests (Playwright)

### Critical User Journeys

#### 1. Authentication Flow
```gherkin
Feature: User Authentication
  Scenario: User logs in with email
    Given user is on login page
    When user enters email and requests magic link
    Then confirmation message appears
    And user can continue to app
```

**Test File:** `tests/e2e/auth.spec.ts`
- Login with email
- Logout
- Session persistence
- Redirect to login when unauthorized

#### 2. Chat Flow
```gherkin
Feature: Chat Functionality
  Scenario: User sends a message
    Given user is logged in
    And user is on chat page
    When user types a message
    And user sends the message
    Then message appears in conversation
    And AI response appears
    And sources are displayed
```

**Test File:** `tests/e2e/chat.spec.ts`
- Send message
- Receive response
- View conversation history
- Pin/unpin conversation
- Delete conversation

#### 3. Document Upload Flow
```gherkin
Feature: Document Management
  Scenario: User uploads a document
    Given user is on documents page
    When user selects a PDF file
    And user clicks upload
    Then file is processed
    And status updates to completed
    And document appears in list
```

**Test File:** `tests/e2e/documents.spec.ts`
- Upload PDF
- Upload multiple files
- View upload progress
- See uploaded documents
- Search documents

#### 4. Project Management Flow
```gherkin
Feature: Project Management
  Scenario: User creates and manages project
    Given user is on projects page
    When user clicks "New Project"
    And user enters project details
    Then project appears in grid
    And user can switch to project
    And conversations are scoped to project
```

**Test File:** `tests/e2e/projects.spec.ts`
- Create project
- Edit project
- Delete project
- Switch projects
- View project statistics

#### 5. Settings Flow
```gherkin
Feature: User Settings
  Scenario: User changes preferences
    Given user is on settings page
    When user changes theme to dark
    Then theme updates immediately
    And setting is persisted
    And page reflects new theme
```

**Test File:** `tests/e2e/settings.spec.ts`
- Change theme
- Update chat settings
- View account info
- Persist preferences

### E2E Test Structure

```typescript
import { test, expect } from '@playwright/test'

test.describe('Chat Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to chat
    await page.goto('/auth/login')
    // ... login steps
    await page.goto('/chat')
  })

  test('should send message and receive response', async ({ page }) => {
    // 1. Find message input
    const input = page.getByPlaceholder('Type your message...')

    // 2. Type message
    await input.fill('What is the capital of France?')

    // 3. Send message
    const sendButton = page.getByRole('button', { name: 'Send' })
    await sendButton.click()

    // 4. Wait for response
    await page.waitForSelector('[data-testid="ai-response"]')

    // 5. Verify response
    const response = page.getByTestId('ai-response')
    await expect(response).toContainText('Paris')
  })
})
```

### Running E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npm run test:e2e -- auth.spec.ts

# Run in UI mode (visual)
npx playwright test --ui

# Run in debug mode
npx playwright test --debug

# Generate report
npm run test:e2e && npx playwright show-report
```

---

## 📊 Performance Profiling

### Performance Metrics

#### 1. Page Load Time
**Targets:**
- First Paint (FP): <1s
- First Contentful Paint (FCP): <1.5s
- Largest Contentful Paint (LCP): <2.5s
- Cumulative Layout Shift (CLS): <0.1
- Total Blocking Time (TBT): <200ms

#### 2. API Response Time
**Targets:**
- Chat API: <3s (including AI response)
- Search API: <500ms
- Project API: <200ms
- Preferences API: <100ms

#### 3. Bundle Size
**Targets:**
- Main bundle: <300KB gzipped
- CSS: <50KB gzipped
- JavaScript: <250KB gzipped

### Performance Tests

```typescript
// tests/performance/load-time.spec.ts
test('chat page should load under 2s', async ({ page }) => {
  const startTime = Date.now()

  await page.goto('/chat')
  await page.waitForLoadState('networkidle')

  const loadTime = Date.now() - startTime
  expect(loadTime).toBeLessThan(2000)
})

// tests/performance/api-latency.spec.ts
test('chat API should respond under 3s', async ({ page }) => {
  const startTime = Date.now()

  const response = await page.evaluate(() => {
    return fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message: 'test' }),
    })
  })

  const latency = Date.now() - startTime
  expect(latency).toBeLessThan(3000)
})
```

### Running Performance Tests

```bash
# Run Lighthouse audit
npm run build
npm run test:performance

# Check bundle size
npm run build -- --analyze

# Profile with DevTools
npx playwright test --trace on
```

---

## ♿ Accessibility Testing

### WCAG AA Compliance Checklist

#### 1. Keyboard Navigation
- [ ] All interactive elements are keyboard accessible
- [ ] Tab order is logical
- [ ] Focus indicators are visible
- [ ] Shortcuts don't conflict with browser defaults

#### 2. Screen Reader Support
- [ ] Semantic HTML is used correctly
- [ ] ARIA labels for icons and buttons
- [ ] Form fields have associated labels
- [ ] Skip links present

#### 3. Color & Contrast
- [ ] Text contrast ratio ≥4.5:1
- [ ] Color is not the only way to convey info
- [ ] Dark mode has sufficient contrast

#### 4. Motion & Animation
- [ ] `prefers-reduced-motion` is respected
- [ ] Auto-playing videos can be paused
- [ ] No flashing content (>3 per second)

#### 5. Forms
- [ ] Error messages are clear
- [ ] Labels are always present
- [ ] Form instructions are clear
- [ ] Field validation is user-friendly

### Accessibility Test Tools

```bash
# Install axe accessibility tool
npm install --save-dev axe-core @axe-core/react

# Create accessibility test
# tests/accessibility/wcag.spec.ts
test('chat page should have no accessibility violations', async ({ page }) => {
  await page.goto('/chat')

  const results = await checkA11y(page)
  expect(results.violations).toHaveLength(0)
})
```

### Running Accessibility Tests

```bash
# Run axe DevTools scans
npm run test:a11y

# Generate accessibility report
npm run test:a11y -- --report html
```

---

## 🚀 Deployment to Vercel

### Pre-Deployment Checklist

- [ ] All tests passing (unit, integration, E2E)
- [ ] No console errors
- [ ] Performance metrics met
- [ ] Accessibility compliant
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] API endpoints tested
- [ ] Build successful

### Deployment Steps

#### 1. Vercel Configuration

```bash
# Initialize Vercel
npm install -g vercel
vercel init

# Set environment variables in Vercel dashboard
# - OPENAI_API_KEY
# - SUPABASE_URL
# - SUPABASE_SERVICE_ROLE_KEY
# - QDRANT_URL
# - QDRANT_API_KEY
# - UPSTASH_REDIS_REST_URL
# - UPSTASH_REDIS_REST_TOKEN
# - LANGFUSE_PUBLIC_KEY
# - LANGFUSE_SECRET_KEY
```

#### 2. CI/CD Pipeline Setup

```yaml
# .github/workflows/test-and-deploy.yml
name: Test and Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test -- --coverage
      - run: npm run test:e2e
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm install -g vercel
      - run: vercel --prod --token ${{ secrets.VERCEL_TOKEN }}
```

#### 3. Deployment Commands

```bash
# Deploy to Vercel
vercel --prod

# Deploy with environment variables
vercel env pull
vercel --prod

# Check deployment status
vercel list
```

### Post-Deployment Verification

- [ ] Site is accessible at deployed URL
- [ ] All pages load correctly
- [ ] Chat functionality works
- [ ] Authentication works
- [ ] Documents upload and process
- [ ] Langfuse tracing active
- [ ] No console errors in production
- [ ] Monitor error rates

---

## 📈 Progress Tracking

### Phase 10 Timeline

**Week 1: Testing Infrastructure & Unit Tests**
- Day 1: Jest setup, first unit tests
- Day 2: Unit tests for components
- Day 3: Unit tests for hooks and utilities

**Week 2: Integration & E2E Tests**
- Day 4: Integration tests for APIs
- Day 5: E2E tests for critical flows
- Day 6: Performance profiling

**Week 3: Polish & Deployment**
- Day 7: Accessibility audit and fixes
- Day 8: Performance optimization
- Day 9: Vercel deployment and CI/CD
- Day 10: Production monitoring and hotfixes

---

## ✅ Quality Gates

### Must Pass Before Deployment
- [ ] Unit test coverage >70%
- [ ] Integration test coverage >60%
- [ ] All E2E tests passing
- [ ] No accessibility violations (WCAG AA)
- [ ] Lighthouse score >90
- [ ] <2s load time (p95)
- [ ] Zero console errors in tests

### Nice to Have
- [ ] Performance budget enforced
- [ ] Automated accessibility scanning
- [ ] Bundle size tracking
- [ ] Error rate monitoring

---

## 📚 Documentation to Create

1. **Testing Guide** - How to run tests
2. **Deployment Guide** - How to deploy to Vercel
3. **API Documentation** - Endpoint reference
4. **Architecture Guide** - System design overview
5. **Troubleshooting** - Common issues and fixes
6. **Performance Tuning** - Optimization tips

---

## 🎉 Success Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Unit Test Coverage | 80%+ | 0% (starting) |
| Integration Coverage | 70%+ | 0% |
| E2E Flow Coverage | 100% critical | 0% |
| Lighthouse Score | 90+ | TBD |
| Load Time (p95) | <2s | TBD |
| WCAG AA Violations | 0 | TBD |
| Console Errors | 0 | TBD |
| Deployment Status | ✅ | Pending |

---

## 🏁 Definition of Done

Phase 10 is complete when:
1. ✅ All critical tests passing (unit, integration, E2E)
2. ✅ Code coverage >70%
3. ✅ Lighthouse score >90
4. ✅ Zero accessibility violations (WCAG AA)
5. ✅ Performance metrics met
6. ✅ Successfully deployed to Vercel
7. ✅ Monitoring and alerts configured
8. ✅ Documentation completed
9. ✅ Team trained on processes
10. ✅ Project ready for production use

---

**Status:** Phase 10 ACTIVE
**Next Update:** After unit tests completed
**Final Target:** 100% completion with production deployment

*This plan is living document and will be updated as testing progresses.*
