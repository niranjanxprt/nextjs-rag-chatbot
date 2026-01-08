# Testing Guide - Next.js RAG Chatbot

## Overview

This project uses Jest as the primary testing framework with comprehensive test coverage across all layers of the application. The testing strategy follows full-stack JavaScript best practices with separation of concerns, proper mocking, and performance monitoring.

## Testing Architecture

### Test Types

1. **Unit Tests** (`tests/unit/`) - Test individual functions and utilities
2. **Component Tests** (`tests/components/`) - Test React components in isolation
3. **Integration Tests** (`tests/integration/`) - Test service interactions and data flow
4. **API Tests** (`tests/api/`) - Test API endpoints and request/response handling
5. **Performance Tests** (`tests/performance/`) - Test performance benchmarks and load handling
6. **E2E Tests** (`tests/e2e/`) - Test complete user workflows with Playwright

### Test Environment Configuration

```typescript
// jest.config.ts - Multi-project setup
projects: [
  {
    displayName: 'unit',
    testMatch: ['<rootDir>/tests/unit/**/*.test.{js,jsx,ts,tsx}'],
    testEnvironment: 'jest-environment-jsdom',
  },
  {
    displayName: 'integration',
    testMatch: ['<rootDir>/tests/integration/**/*.test.{js,jsx,ts,tsx}'],
    testEnvironment: 'jest-environment-node',
  },
  // ... more projects
]
```

## Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run specific test types
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:api          # API tests only
npm run test:components   # Component tests only
npm run test:performance  # Performance tests only

# Development workflow
npm run test:watch        # Watch mode for development
npm run test:coverage     # Generate coverage report
npm run test:ci          # CI mode with coverage
```

### Advanced Testing

```bash
# Run tests matching pattern
npm test -- --testNamePattern="auth"
npm test -- --testPathPattern="chat"

# Run tests with specific configuration
npm test -- --verbose
npm test -- --detectOpenHandles
npm test -- --forceExit
```

## Test Structure and Best Practices

### 1. Unit Testing

**Purpose**: Test individual functions, utilities, and business logic in isolation.

```typescript
// tests/unit/utils.test.ts
import { tokenCounter } from '@/lib/utils/token-counter'

describe('Token Counter', () => {
  it('should count tokens accurately', () => {
    const text = 'Hello world'
    const count = tokenCounter.count(text)

    expect(count).toBeGreaterThan(0)
    expect(typeof count).toBe('number')
  })

  // Property-based testing with fast-check
  it('should always return non-negative integers', () => {
    fc.assert(
      fc.property(fc.string(), text => {
        const count = tokenCounter.count(text)
        expect(count).toBeGreaterThanOrEqual(0)
        expect(Number.isInteger(count)).toBe(true)
      })
    )
  })
})
```

**Best Practices**:

- Use property-based testing for edge cases
- Test pure functions without side effects
- Mock external dependencies
- Focus on business logic correctness

### 2. Component Testing

**Purpose**: Test React components with user interactions and state management.

```typescript
// tests/components/chat-interface.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ChatInterface from '@/components/chat/chat-interface'

describe('ChatInterface', () => {
  it('sends message when form is submitted', async () => {
    const user = userEvent.setup()
    render(<ChatInterface />)

    const input = screen.getByPlaceholderText(/type your message/i)
    await user.type(input, 'Hello, AI!')
    await user.click(screen.getByRole('button', { name: /send/i }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hello, AI!' }],
        }),
      })
    })
  })
})
```

**Best Practices**:

- Use Testing Library for user-centric testing
- Test user interactions, not implementation details
- Mock API calls and external services
- Test accessibility and keyboard navigation
- Use custom render with providers

### 3. Integration Testing

**Purpose**: Test service interactions, data flow, and system integration points.

```typescript
// tests/integration/rag-pipeline.test.ts
describe('RAG Pipeline Integration', () => {
  it('should complete full RAG pipeline', async () => {
    // 1. Upload and process document
    const file = new File(['AI content'], 'ai-doc.txt', { type: 'text/plain' })
    const processResult = await documentProcessor.processDocument(file, userId)
    expect(processResult.success).toBe(true)

    // 2. Search for relevant content
    const searchResults = await vectorSearch.search('machine learning', userId)
    expect(searchResults.length).toBeGreaterThan(0)

    // 3. Verify search results
    expect(searchResults[0].content).toContain('AI')
  })
})
```

**Best Practices**:

- Test complete workflows end-to-end
- Use real-like data and scenarios
- Mock external APIs but test internal integrations
- Verify data consistency across operations
- Test error handling and recovery

### 4. API Testing

**Purpose**: Test API endpoints, request validation, authentication, and response handling.

```typescript
// tests/api/chat.test.ts
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/chat/route'

describe('/api/chat', () => {
  it('should return 401 for unauthenticated requests', async () => {
    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages: [{ role: 'user', content: 'Hello' }] }),
    })

    const response = await POST(request)
    expect(response.status).toBe(401)
  })

  it('should handle streaming responses', async () => {
    // Mock authenticated user and streaming response
    const response = await POST(authenticatedRequest)
    expect(response.headers.get('content-type')).toBe('text/event-stream')
  })
})
```

**Best Practices**:

- Test all HTTP methods and status codes
- Validate request/response schemas
- Test authentication and authorization
- Test rate limiting and error handling
- Mock external API dependencies

### 5. Performance Testing

**Purpose**: Ensure application meets performance requirements and scales properly.

```typescript
// tests/performance/performance.test.ts
describe('Performance Tests', () => {
  it('should generate embeddings within time threshold', async () => {
    const startTime = performance.now()
    await embeddings.generateEmbedding(text)
    const endTime = performance.now()

    const duration = endTime - startTime
    expect(duration).toBeLessThan(2000) // 2 seconds
  })

  it('should not leak memory during repeated operations', async () => {
    const initialMemory = process.memoryUsage().heapUsed

    for (let i = 0; i < 100; i++) {
      await embeddings.generateEmbedding(`Test ${i}`)
    }

    if (global.gc) global.gc()

    const finalMemory = process.memoryUsage().heapUsed
    const memoryIncrease = finalMemory - initialMemory
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024) // 50MB
  })
})
```

**Best Practices**:

- Set realistic performance thresholds
- Test memory usage and leaks
- Test concurrent operations
- Monitor resource utilization
- Test under load conditions

## Mocking Strategies

### External Services

```typescript
// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn().mockReturnValue({
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: mockUser } }) },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: [mockDocument] }),
      }),
    }),
  }),
}))

// Mock OpenAI
jest.mock('openai', () => ({
  OpenAI: jest.fn(() => ({
    embeddings: {
      create: jest.fn().mockResolvedValue({
        data: [{ embedding: new Array(1536).fill(0.1) }],
      }),
    },
  })),
}))
```

### API Responses

```typescript
// Mock fetch for API calls
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  status: 200,
  json: () => Promise.resolve({ message: 'Success' }),
})

// Mock streaming responses
const mockStreamingResponse = (chunks: string[]) => {
  return new ReadableStream({
    start(controller) {
      chunks.forEach(chunk => controller.enqueue(chunk))
      controller.close()
    },
  })
}
```

## Test Data Management

### Mock Data Factory

```typescript
// tests/test-utils.ts
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  created_at: new Date().toISOString(),
}

export const createMockDocument = (overrides = {}) => ({
  id: 'test-doc-id',
  title: 'Test Document',
  content: 'Test content',
  user_id: mockUser.id,
  status: 'completed',
  ...overrides,
})
```

### Test Utilities

```typescript
// Custom render with providers
const customRender = (ui: ReactElement, options = {}) => {
  return render(ui, {
    wrapper: ({ children }) => (
      <AuthProvider value={{ user: mockUser, loading: false }}>
        {children}
      </AuthProvider>
    ),
    ...options,
  })
}

// Performance measurement
export const measureExecutionTime = async (fn: () => Promise<any>) => {
  const start = performance.now()
  await fn()
  return performance.now() - start
}
```

## Coverage Requirements

### Coverage Thresholds

```typescript
// jest.config.ts
coverageThreshold: {
  global: {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80,
  },
}
```

### Coverage Exclusions

- Layout components (`layout.tsx`, `loading.tsx`)
- Type definitions (`*.d.ts`)
- Story files (`*.stories.tsx`)
- Configuration files

## Continuous Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
- name: Run unit tests
  run: npm run test:unit

- name: Run integration tests
  run: npm run test:integration

- name: Generate coverage report
  run: npm run test:coverage

- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v3
```

### Test Environment Variables

```bash
# Test-specific environment variables
OPENAI_API_KEY=test-key
NEXT_PUBLIC_SUPABASE_URL=https://test.supabase.co
SUPABASE_SERVICE_ROLE_KEY=test-service-key
QDRANT_URL=https://test.qdrant.io
UPSTASH_REDIS_REST_URL=https://test.upstash.io
```

## Debugging Tests

### Common Issues

1. **Async Operations**: Use `waitFor` for async state updates
2. **Timer Issues**: Mock timers with `jest.useFakeTimers()`
3. **Memory Leaks**: Clear mocks and cleanup in `afterEach`
4. **Environment Variables**: Set test-specific env vars in `jest.setup.ts`

### Debugging Commands

```bash
# Run tests with debugging
npm test -- --detectOpenHandles --forceExit

# Run single test file
npm test -- tests/unit/utils.test.ts

# Run tests with verbose output
npm test -- --verbose

# Debug specific test
npm test -- --testNamePattern="should generate embeddings"
```

## Best Practices Summary

### General Testing Principles

1. **Test Behavior, Not Implementation** - Focus on what the code does, not how
2. **Arrange, Act, Assert** - Structure tests clearly
3. **One Assertion Per Test** - Keep tests focused and specific
4. **Descriptive Test Names** - Make test intent clear
5. **Fast and Reliable** - Tests should run quickly and consistently

### Full-Stack Specific

1. **Layer Separation** - Test each layer independently
2. **Mock External Dependencies** - Control external service responses
3. **Test Error Scenarios** - Verify error handling and edge cases
4. **Performance Monitoring** - Include performance assertions
5. **End-to-End Coverage** - Test complete user workflows

### Maintenance

1. **Keep Tests Updated** - Update tests when code changes
2. **Refactor Test Code** - Apply same quality standards to tests
3. **Monitor Coverage** - Maintain high coverage without obsessing over 100%
4. **Review Test Failures** - Investigate and fix flaky tests promptly

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/docs/)
- [Next.js Testing](https://nextjs.org/docs/testing)
- [Fast-Check Property Testing](https://fast-check.dev/)
- [Playwright E2E Testing](https://playwright.dev/)

This comprehensive testing setup ensures high code quality, catches regressions early, and provides confidence in deployments while following full-stack JavaScript testing best practices.
