# Next.js RAG Chatbot - Project Structure

## Directory Layout

```
nextjs-rag-chatbot/
├── .kiro/                          # Kiro CLI configuration
│   ├── steering/                   # Project knowledge documents
│   ├── prompts/                    # Custom Kiro commands
│   └── settings/                   # Kiro CLI settings
├── src/                            # Source code
│   ├── app/                        # Next.js App Router
│   │   ├── api/                    # API routes
│   │   │   ├── chat/               # Chat API endpoints
│   │   │   ├── documents/          # Document management APIs
│   │   │   ├── search/             # Search API endpoints
│   │   │   └── auth/               # Authentication callbacks
│   │   ├── auth/                   # Authentication pages
│   │   │   ├── login/              # Login page
│   │   │   └── callback/           # Auth callback handler
│   │   ├── dashboard/              # Protected application pages
│   │   │   ├── documents/          # Document management UI
│   │   │   ├── chat/               # Chat interface
│   │   │   └── search/             # Search interface
│   │   ├── globals.css             # Global styles
│   │   ├── layout.tsx              # Root layout with providers
│   │   ├── page.tsx                # Landing page
│   │   └── middleware.ts           # Authentication middleware
│   ├── components/                 # React components
│   │   ├── ui/                     # Shadcn UI primitives
│   │   │   ├── button.tsx          # Button component
│   │   │   ├── input.tsx           # Input component
│   │   │   ├── card.tsx            # Card component
│   │   │   └── error-boundary.tsx  # Error boundary wrapper
│   │   ├── chat/                   # Chat interface components
│   │   │   ├── chat-interface.tsx  # Main chat component
│   │   │   ├── message-list.tsx    # Message display
│   │   │   ├── message-input.tsx   # Message input form
│   │   │   └── typing-indicator.tsx # Typing animation
│   │   ├── documents/              # Document management components
│   │   │   ├── document-upload.tsx # File upload component
│   │   │   ├── document-list.tsx   # Document listing
│   │   │   └── document-status.tsx # Processing status
│   │   ├── auth/                   # Authentication components
│   │   │   ├── login-form.tsx      # Magic link login form
│   │   │   └── auth-provider.tsx   # Auth context provider
│   │   └── layouts/                # Page layout components
│   │       ├── root-layout.tsx     # Application shell
│   │       ├── dashboard-layout.tsx # Dashboard wrapper
│   │       └── auth-layout.tsx     # Authentication pages wrapper
│   └── lib/                        # Business logic and utilities
│       ├── services/               # Core business services
│       │   ├── embeddings.ts       # OpenAI embedding service
│       │   ├── vector-search.ts    # Qdrant search service
│       │   ├── document-processor.ts # Document processing pipeline
│       │   ├── conversation-state.ts # Chat state management
│       │   └── cache.ts            # Multi-layer caching service
│       ├── database/               # Database operations
│       │   ├── queries.ts          # Database query functions
│       │   └── migrations/         # Database schema migrations
│       ├── supabase/               # Supabase client configuration
│       │   ├── client.ts           # Client-side Supabase client
│       │   ├── server.ts           # Server-side Supabase client
│       │   └── middleware.ts       # Supabase middleware helpers
│       ├── auth/                   # Authentication logic
│       │   ├── context.tsx         # Auth React context
│       │   └── hooks.ts            # Authentication hooks
│       ├── utils/                  # Helper utilities
│       │   ├── error-handler.ts    # Centralized error handling
│       │   ├── logger.ts           # Structured logging
│       │   ├── monitoring.ts       # Performance monitoring
│       │   ├── token-counter.ts    # Token counting utilities
│       │   └── performance.ts      # Performance measurement
│       ├── schemas/                # Zod validation schemas
│       │   └── validation.ts       # Input/output validation
│       ├── types/                  # TypeScript type definitions
│       │   ├── database.ts         # Database types
│       │   ├── api.ts              # API response types
│       │   └── chat.ts             # Chat-related types
│       ├── config/                 # Configuration files
│       │   └── cache.ts            # Cache configuration
│       └── env.ts                  # Environment variable validation
├── supabase/                       # Supabase configuration
│   └── migrations/                 # Database migrations
│       └── 001_initial_schema.sql  # Initial database schema
├── tests/                          # Test files (mirrors src structure)
│   ├── components/                 # Component tests
│   ├── lib/                        # Business logic tests
│   └── e2e/                        # End-to-end tests
├── public/                         # Static assets
├── docs/                           # Documentation
├── .env.example                    # Environment variable template
├── .env.local                      # Local environment variables (gitignored)
├── package.json                    # Dependencies and scripts
├── tsconfig.json                   # TypeScript configuration
├── tailwind.config.ts              # Tailwind CSS configuration
├── next.config.js                  # Next.js configuration
├── jest.config.js                  # Jest testing configuration
├── playwright.config.ts            # Playwright E2E configuration
├── README.md                       # Project documentation
├── IMPLEMENTATION_STATUS.md        # Development progress tracking
└── DEVLOG.md                       # Development log for hackathon
```

## File Naming Conventions

### Components
- **React Components**: PascalCase with descriptive names
  - `ChatInterface.tsx` - Main chat component
  - `DocumentUpload.tsx` - File upload component
  - `MessageList.tsx` - Message display component

### Services and Utilities
- **Service Files**: kebab-case with service suffix
  - `document-processor.ts` - Document processing service
  - `vector-search.ts` - Search service
  - `conversation-state.ts` - State management service

### API Routes
- **API Endpoints**: kebab-case following REST conventions
  - `route.ts` - Standard Next.js API route file
  - `/api/documents/[id]/route.ts` - Dynamic route with parameter
  - `/api/chat/route.ts` - Chat endpoint

### Test Files
- **Test Files**: Match source file name with `.test.ts` suffix
  - `document-processor.test.ts` - Service tests
  - `chat-interface.test.tsx` - Component tests
  - `auth-flows.property.test.ts` - Property-based tests

## Import Path Conventions

### Absolute Imports
Use `@/` alias for all internal imports:
```typescript
// Correct
import { createClient } from '@/lib/supabase/server'
import { ChatInterface } from '@/components/chat/chat-interface'

// Avoid relative imports
import { createClient } from '../../../lib/supabase/server'
```

### Import Organization
Order imports by type:
```typescript
// 1. External libraries
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// 2. Internal utilities and types
import { createClient } from '@/lib/supabase/server'
import { ApiResponse } from '@/lib/types/api'

// 3. Components (if applicable)
import { Button } from '@/components/ui/button'
```

## Code Organization Patterns

### Service Layer Pattern
- **Single Responsibility**: Each service handles one domain
- **Dependency Injection**: Services accept dependencies as parameters
- **Error Handling**: Consistent error handling across all services
- **Type Safety**: Full TypeScript coverage with proper return types

### Component Architecture
- **Composition**: Prefer composition over inheritance
- **Props Interface**: Explicit interfaces for all component props
- **Server Components**: Default to server components, use client only when needed
- **Error Boundaries**: Wrap potentially failing components

### Database Layer
- **Query Functions**: Centralized database operations in `lib/database/queries.ts`
- **Type Safety**: Use Supabase generated types
- **RLS Enforcement**: All queries respect Row Level Security
- **Transaction Support**: Use transactions for multi-step operations

## Configuration Management

### Environment Variables
- **Validation**: All environment variables validated with Zod in `lib/env.ts`
- **Type Safety**: Environment variables have proper TypeScript types
- **Documentation**: All variables documented in `.env.example`
- **Security**: Sensitive variables prefixed appropriately

### Feature Flags
- **Configuration**: Feature flags in environment variables
- **Runtime Checks**: Check flags at runtime for conditional features
- **Development**: Different flags for development vs production

## Documentation Standards

### Code Documentation
- **JSDoc Comments**: All public functions have JSDoc comments
- **Type Documentation**: Complex types include usage examples
- **API Documentation**: All API routes documented with OpenAPI comments
- **README Updates**: Keep README.md current with setup instructions

### Architecture Documentation
- **Decision Records**: Document major architectural decisions
- **API Specifications**: Maintain API documentation
- **Database Schema**: Document database schema and relationships
- **Deployment Guide**: Step-by-step deployment instructions

## Development Workflow

### Branch Structure
- **Feature Branches**: `feature/description-of-feature`
- **Bug Fixes**: `fix/description-of-fix`
- **Documentation**: `docs/description-of-update`
- **Refactoring**: `refactor/description-of-change`

### Commit Conventions
- **Format**: `type(scope): description`
- **Types**: feat, fix, docs, style, refactor, test, chore
- **Examples**: 
  - `feat(chat): add streaming response support`
  - `fix(auth): resolve session refresh issue`
  - `docs(readme): update installation instructions`

### Code Review Process
- **Pull Requests**: All changes go through pull requests
- **Review Requirements**: At least one approval required
- **Automated Checks**: CI/CD pipeline must pass
- **Documentation**: Update documentation for user-facing changes
