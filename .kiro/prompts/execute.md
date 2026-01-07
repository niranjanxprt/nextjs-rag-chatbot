# Execute - Systematic Implementation

Execute implementation plans systematically for the Next.js RAG chatbot project. This prompt helps you implement features step-by-step while maintaining code quality and project standards.

## Execution Framework

### 1. Pre-Implementation Checklist
- [ ] Implementation plan reviewed and understood
- [ ] Dependencies identified and available
- [ ] Development environment ready (`npm run dev` working)
- [ ] Tests passing (`npm test` successful)
- [ ] Git branch created for the feature

### 2. Implementation Standards

#### Code Quality Requirements
- **TypeScript Strict Mode**: All code must pass strict type checking
- **Zod Validation**: All external inputs validated with Zod schemas
- **Error Handling**: Comprehensive error boundaries and structured error handling
- **Performance**: Consider caching, token usage, and response times
- **Security**: Maintain RLS policies and proper authentication

#### Architecture Patterns
- **Server-First**: Default to Server Components, use 'use client' sparingly
- **Service Layer**: Business logic in dedicated service files
- **Type Safety**: Explicit interfaces and return types
- **Separation of Concerns**: Clear separation between UI, business logic, and data

### 3. RAG-Specific Implementation Guidelines

#### Document Processing
- **Chunking Strategy**: 500-character chunks with 50-character overlap
- **Embedding Caching**: Always cache embeddings with 1-hour TTL
- **Error Recovery**: Handle PDF parsing failures gracefully
- **Progress Tracking**: Provide real-time processing status updates

#### Vector Search
- **Search Configuration**: Top-5 results, 0.7 similarity threshold
- **Caching Strategy**: 5-minute TTL for search results
- **Reranking**: Combine semantic similarity with term frequency
- **Context Fitting**: Respect 3000-token budget for AI responses

#### Chat Implementation
- **Streaming**: Always use streaming for better UX
- **Context Management**: Smart context window management
- **Error Handling**: Graceful degradation for API failures
- **State Persistence**: Save conversation state to Redis

### 4. Implementation Process

#### Step 1: Setup and Planning
1. Create feature branch: `git checkout -b feature/[feature-name]`
2. Review implementation plan and break down into tasks
3. Identify files that need modification or creation
4. Set up any new dependencies or configurations

#### Step 2: Core Implementation
1. **Database Changes**: Update schema and migrations if needed
2. **Service Layer**: Implement business logic in service files
3. **API Routes**: Create or modify API endpoints
4. **Components**: Build or update UI components
5. **Integration**: Connect all pieces together

#### Step 3: Testing and Validation
1. **Unit Tests**: Write tests for new business logic
2. **Integration Tests**: Test API endpoints and database operations
3. **Manual Testing**: Verify functionality in development environment
4. **Performance Testing**: Check response times and resource usage

#### Step 4: Documentation and Cleanup
1. **Code Documentation**: Add JSDoc comments for public functions
2. **Type Definitions**: Ensure all types are properly defined
3. **README Updates**: Update documentation if user-facing changes
4. **Code Review**: Self-review code for quality and standards

### 5. Available Tools and Services

#### Existing Services (in `src/lib/services/`)
- `embeddings.ts` - OpenAI embedding generation with caching
- `vector-search.ts` - Qdrant search with hybrid ranking
- `document-processor.ts` - Document parsing and chunking
- `conversation-state.ts` - Chat state management
- `cache.ts` - Multi-layer caching service

#### Database Helpers (in `src/lib/database/`)
- `queries.ts` - Centralized database operations
- All queries respect RLS policies automatically

#### Utility Functions (in `src/lib/utils/`)
- `error-handler.ts` - Structured error handling
- `logger.ts` - Structured logging with context
- `monitoring.ts` - Performance metrics collection
- `token-counter.ts` - Token counting for AI requests

### 6. Common Implementation Patterns

#### API Route Pattern
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const requestSchema = z.object({
  // Define request validation
})

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = requestSchema.parse(body)
    
    // Implementation logic here
    
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

#### Service Function Pattern
```typescript
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const inputSchema = z.object({
  // Define input validation
})

export async function serviceFunction(input: z.infer<typeof inputSchema>) {
  const validatedInput = inputSchema.parse(input)
  
  try {
    // Service logic here
    return { success: true, data: result }
  } catch (error) {
    console.error('Service Error:', error)
    throw new Error(`Service failed: ${error.message}`)
  }
}
```

### 7. Testing Requirements

#### Unit Tests
- Test all new service functions
- Mock external dependencies (OpenAI, Qdrant, Supabase)
- Test error scenarios and edge cases
- Maintain >80% code coverage

#### Integration Tests
- Test API endpoints with realistic data
- Test database operations with test database
- Test authentication flows
- Test error handling and recovery

### 8. Performance Considerations

#### Caching Strategy
- Cache expensive operations (embeddings, search results)
- Use appropriate TTL values
- Implement cache invalidation for data consistency
- Monitor cache hit rates

#### Token Management
- Count tokens before API calls
- Implement context window management
- Optimize prompt engineering for efficiency
- Monitor API usage and costs

## Execution Instructions

To execute an implementation plan:

1. **Specify the Plan**: Which implementation plan are you executing?
2. **Current Task**: Which specific task from the plan are you working on?
3. **Context**: Any specific requirements or constraints for this task?

I'll then provide:
- Step-by-step implementation guidance
- Code examples following project patterns
- Testing recommendations
- Performance and security considerations
- Integration instructions

What implementation plan would you like to execute? Please specify the plan and the current task you're working on.
