# Next.js RAG Chatbot - Technical Architecture

## Technology Stack

### Frontend Framework
- **Next.js 15**: App Router with React 19, server-first architecture
- **TypeScript**: Strict mode enabled for type safety
- **Tailwind CSS**: Utility-first styling with custom design system
- **Shadcn UI**: High-quality, accessible component library

### Backend & API
- **Next.js API Routes**: Serverless functions for all backend logic
- **Supabase**: PostgreSQL database with Row Level Security (RLS)
- **OpenAI API**: GPT-4-turbo for chat, text-embedding-3-small for embeddings
- **Qdrant Cloud**: Vector database for semantic search (1536-dimensional vectors)

### Infrastructure & Deployment
- **Vercel**: Serverless hosting with edge functions
- **Upstash Redis**: Caching layer for embeddings and search results
- **Supabase Auth**: Passwordless magic link authentication
- **GitHub Actions**: CI/CD pipeline for testing and deployment

### Development Tools
- **Jest**: Unit and integration testing
- **Playwright**: End-to-end testing
- **ESLint**: Code linting with TypeScript rules
- **Prettier**: Code formatting
- **Zod**: Runtime type validation

## Architecture Patterns

### Server-First Design
- **Server Components**: Default to server-side rendering for better performance
- **Streaming**: Real-time streaming for chat responses and document processing
- **Edge Functions**: Utilize Vercel edge runtime for global performance
- **Static Generation**: Pre-render pages where possible

### Data Flow Architecture
```
Document Upload → PDF Parsing → Text Chunking → Embedding Generation → Vector Storage
User Query → Semantic Search → Context Retrieval → AI Processing → Streaming Response
```

### Security Model
- **Row Level Security**: All database queries scoped to authenticated users
- **API Route Protection**: Middleware-based authentication for all endpoints
- **Input Validation**: Zod schemas for all user inputs and API responses
- **Error Boundaries**: Comprehensive error handling with structured logging

## Code Standards

### TypeScript Guidelines
- **Strict Mode**: Enable all strict TypeScript checks
- **Type Definitions**: Comprehensive types in `src/lib/types/`
- **Zod Validation**: Runtime validation for all external data
- **No Any Types**: Explicit typing required for all variables and functions

### File Organization
```
src/
├── app/                 # Next.js App Router pages and layouts
│   ├── api/            # API routes (chat, documents, search)
│   ├── auth/           # Authentication pages
│   └── dashboard/      # Protected application pages
├── components/         # React components
│   ├── ui/            # Shadcn UI primitives
│   ├── chat/          # Chat interface components
│   ├── documents/     # Document management components
│   └── layouts/       # Page layout components
└── lib/               # Business logic and utilities
    ├── services/      # Core business services
    ├── database/      # Database queries and operations
    ├── utils/         # Helper utilities
    └── types/         # TypeScript type definitions
```

### Naming Conventions
- **Files**: kebab-case for components, camelCase for utilities
- **Components**: PascalCase with descriptive names
- **Functions**: camelCase with verb-noun pattern
- **Constants**: UPPER_SNAKE_CASE for environment variables
- **Types**: PascalCase with descriptive suffixes (UserData, ApiResponse)

### Component Patterns
- **Server Components**: Default choice, use 'use client' only when necessary
- **Props Interface**: Define explicit interfaces for all component props
- **Error Boundaries**: Wrap components that might fail with error boundaries
- **Loading States**: Implement skeleton loading for better UX

## Performance Standards

### Bundle Optimization
- **Code Splitting**: Dynamic imports for large components
- **Tree Shaking**: Eliminate unused code from bundles
- **Image Optimization**: Next.js Image component with proper sizing
- **Font Optimization**: Self-hosted fonts with proper preloading

### Caching Strategy
- **Multi-Layer Caching**: Memory → Redis → Database
- **Cache Keys**: Structured naming with TTL management
- **Invalidation**: Tag-based cache invalidation for data consistency
- **Hit Rate Targets**: >70% for embeddings, >50% for search results

### Database Optimization
- **Indexes**: Proper indexing on user_id, created_at, document_id
- **Pagination**: Limit result sets to prevent memory issues
- **Connection Pooling**: Efficient database connection management
- **Query Optimization**: Avoid N+1 queries with proper joins

## Testing Standards

### Unit Testing
- **Jest Configuration**: Custom setup for Next.js and TypeScript
- **Test Coverage**: Minimum 80% coverage for core business logic
- **Mock Strategy**: Mock external services (OpenAI, Qdrant, Supabase)
- **Property-Based Testing**: Use fast-check for complex business logic

### Integration Testing
- **API Testing**: Test all API routes with realistic data
- **Database Testing**: Test database operations with test database
- **Authentication Flow**: Test complete auth workflows
- **Error Scenarios**: Test error handling and edge cases

### End-to-End Testing
- **Playwright Setup**: Cross-browser testing configuration
- **User Journeys**: Test complete user workflows
- **Performance Testing**: Monitor response times and resource usage
- **Accessibility Testing**: Automated a11y checks

## Security Requirements

### Authentication & Authorization
- **Supabase Auth**: Secure magic link implementation
- **Session Management**: Proper session handling and refresh
- **Route Protection**: Middleware-based route protection
- **API Security**: All API routes require authentication

### Data Protection
- **Input Sanitization**: Validate and sanitize all user inputs
- **SQL Injection Prevention**: Use parameterized queries only
- **XSS Protection**: Proper output encoding and CSP headers
- **Rate Limiting**: Implement rate limiting for API endpoints

### Infrastructure Security
- **Environment Variables**: Secure handling of secrets and API keys
- **HTTPS Only**: Force HTTPS in production
- **CORS Configuration**: Proper CORS setup for API endpoints
- **Security Headers**: Implement security headers via Next.js config

## Deployment Configuration

### Vercel Settings
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Node.js Version**: 18.x
- **Environment Variables**: Secure storage of all secrets

### Environment Management
- **Development**: `.env.local` with development services
- **Production**: Vercel environment variables with production services
- **Staging**: Separate environment for testing deployments

### Monitoring & Observability
- **Error Tracking**: Structured error logging with context
- **Performance Monitoring**: Response time and resource usage tracking
- **Health Checks**: API endpoint for service health monitoring
- **Analytics**: User interaction and feature usage tracking

## Development Workflow

### Git Workflow
- **Branch Strategy**: Feature branches with descriptive names
- **Commit Messages**: Conventional commits format
- **Pull Requests**: Required for all changes with code review
- **CI/CD**: Automated testing and deployment pipeline

### Code Quality
- **Pre-commit Hooks**: Linting and formatting on commit
- **Type Checking**: TypeScript strict mode validation
- **Test Requirements**: All new features must include tests
- **Documentation**: Update documentation for API changes

### Performance Monitoring
- **Bundle Analysis**: Regular bundle size monitoring
- **Lighthouse Scores**: Maintain >90 performance scores
- **Core Web Vitals**: Monitor and optimize user experience metrics
- **Database Performance**: Query performance monitoring and optimization
