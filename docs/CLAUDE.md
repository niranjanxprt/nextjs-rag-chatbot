# CLAUDE.md - Development Rules for Next.js RAG Chatbot

This document defines development patterns, architectural guidelines, and best practices for AI coding assistants working on this repository.

---

## 1. Project Overview & Architecture

### Project Description

**Next.js RAG Chatbot** is a production-grade retrieval-augmented generation (RAG) application that combines:

- Modern Next.js 15.1.3 frontend/backend with App Router
- Supabase for authentication, database, and file storage
- OpenAI for embeddings and chat completions
- Qdrant for vector similarity search
- Upstash Redis for distributed caching
- Shadcn UI + Tailwind CSS for beautiful interfaces

### Core Architecture

**Unified App Router Pattern**: Not a separated frontend/backend:

- `/src/app/` contains both Next.js pages AND API routes
- `/src/lib/` contains all business logic accessible from both
- Server Components by default (Server-First approach)
- Client Components only when interaction needed (`'use client'`)

### Technology Stack

- **Framework**: Next.js 15.1.3, React 19.0.0, TypeScript 5.3.3 (strict mode)
- **Styling**: Tailwind CSS 3.4.1, Shadcn UI components, Lucide React icons
- **Auth**: Supabase with @supabase/ssr (passwordless)
- **Database**: Supabase PostgreSQL with Row Level Security (RLS)
- **Vector DB**: Qdrant (1536-dimensional embeddings)
- **LLM**: OpenAI GPT-4-turbo + text-embedding-3-small
- **Cache**: Upstash Redis (HTTP-based, serverless)
- **Testing**: Jest + Playwright
- **Code Quality**: ESLint + Prettier

### Directory Structure

```
/src/app/               → Pages + API routes
/src/components/        → React components (ui/, chat/, documents/, auth/, layouts/)
/src/lib/
  ├── auth/            → Authentication (context, hooks)
  ├── supabase/        → Supabase clients (client.ts, server.ts, middleware.ts)
  ├── database/        → All database queries
  ├── services/        → Core RAG logic (embeddings, search, processor, conversation-state)
  ├── schemas/         → Zod validation schemas
  ├── types/           → TypeScript definitions
  └── utils/           → Helper functions
/supabase/migrations/   → Database schema
/scripts/              → Utility scripts
```

---

## 2. TypeScript & Type Safety Guidelines

### Configuration

- **tsconfig.json**: Strict mode enabled with `noImplicitAny`, `noUnusedLocals`, `noUnusedParameters`
- **Path alias**: `@/*` for absolute imports
- **Types location**: All types centralized in `/src/lib/types/database.ts` (301 lines)

### Type Patterns

```typescript
// Types from Supabase schema
import type { Database } from '@/lib/types/supabase'
export type Document = Database['public']['Tables']['documents']['Row']

// Service types with metadata
export interface EmbeddingResult {
  embedding: number[]
  tokenCount: number
  cached: boolean
}

// Status discriminated unions
export type DocumentStatus = 'pending' | 'processing' | 'completed' | 'failed'
```

### Guidelines

- Let TypeScript infer for internal variables
- Be explicit for public function signatures
- Avoid `any`, use `unknown` instead
- Use type parameters for generic utilities

---

## 3. Authentication & Authorization

### Supabase SSR Pattern (CRITICAL)

**Browser Client** (`/src/lib/supabase/client.ts`):

```typescript
import { createBrowserClient } from '@supabase/ssr'
export function createClient() { ... }
// Use in: Client Components ('use client')
```

**Server Client** (`/src/lib/supabase/server.ts`):

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
export async function createClient() {
  const cookieStore = await cookies()  // CRITICAL: Must await in Next.js 15+
  return createServerClient(..., { cookies: { getAll: () => ... } })
}
// Use in: Server Components, API routes, middleware
```

### Protected Routes

```typescript
export default async function Page() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')
}
```

### API Route Protection

```typescript
export async function POST(request: NextRequest) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })
}
```

### Row Level Security

- ALL tables have RLS enforced
- Queries automatically scoped to authenticated user
- Never manually add `WHERE user_id = ...`

### Common Pitfalls

❌ Using browser client in Server Component
❌ Forgetting `await cookies()` in Next.js 15+
❌ Not checking auth in API routes

---

## 4. RAG Pipeline Architecture (CRITICAL SECTION)

### Complete Workflow

**Upload → Process → Embed → Store → Search → Chat**

### Document Processing

1. Upload file (validated: type, size ≤10MB)
2. Download from Supabase Storage
3. Extract text (PDF parsing with pdf-parse)
4. Chunk text (500 chars, 50 char overlap with LangChain)
5. Generate embeddings (OpenAI text-embedding-3-small, 1536D)
6. Upsert to Qdrant vector database
7. Store metadata in PostgreSQL

### Embedding Generation with Caching

```typescript
const EMBEDDING_CONFIG = {
  model: 'text-embedding-3-small',
  dimensions: 1536,
  maxTokens: 8191,
  batchSize: 100,
  cacheTTL: 3600, // 1 hour
}

await generateEmbedding(text, { useCache: true })
// Cache key: embedding:{SHA256(text:model:dimensions)}
```

### Vector Search & Reranking

```typescript
const results = await searchDocuments(query, {
  userId,
  topK: 5,
  threshold: 0.7, // Minimum similarity score
})
// Returns: Semantic (70%) + Term Frequency (20%) + Length (10%)
```

### Chat API with RAG Context

```typescript
const CHAT_CONFIG = {
  model: 'gpt-4-turbo',
  maxTokens: 1000,
  temperature: 0.1,
  maxContextChunks: 5,
  contextThreshold: 0.7,
  maxContextTokens: 3000,
}
```

### Configuration Values (Reference)

| Setting              | Value                  | Purpose                        |
| -------------------- | ---------------------- | ------------------------------ |
| Chunk Size           | 500 chars              | Balance quality vs granularity |
| Chunk Overlap        | 50 chars               | Prevent context loss           |
| Embedding Model      | text-embedding-3-small | Fast, cost-effective           |
| Similarity Threshold | 0.7                    | Minimum relevance              |
| Context Budget       | 3000 tokens            | Reserve for system + history   |
| Max Results          | 5 chunks               | Balance context vs latency     |

---

## 5. Caching Strategy

### Three-Tier Caching

**Embeddings** (`embedding:{hash}`):

- TTL: 1 hour (3600s)
- Hit rate target: >70%
- Generated by OpenAI API

**Search Results** (`search:{hash}`):

- TTL: 5 minutes (300s)
- Invalidate on document updates
- Fresher results for UI

**Conversation State** (`conversation:{id}`):

- TTL: 7 days (604800s)
- Stores last 100 messages, ≤8000 tokens
- Reduces database queries

### Cache Invalidation Pattern

```typescript
// When documents updated
await invalidateSearchCache(userId)

// Clear specific cache
await redis.del(cacheKey)

// Check stats
const stats = await getEmbeddingCacheStats()
```

---

## 6. Database Patterns

### Standard Query Pattern

```typescript
const supabase = await createClient()

const { data, error } = await supabase
  .from('documents')
  .select('*')
  .eq('id', documentId)
  .eq('user_id', userId) // RLS enforcement
  .single()

if (error) throw new DatabaseError(error.message)
return data
```

### Pagination

```typescript
const { count } = await supabase.from('documents').select('*', { count: 'exact', head: true })

const from = (page - 1) * limit
const { data } = await supabase
  .from('documents')
  .select('*')
  .range(from, from + limit - 1)
  .order('created_at', { ascending: false })
```

### Relationship Queries

```typescript
const { data } = await supabase
  .from('documents')
  .select('*, chunks:document_chunks(*)')
  .eq('id', documentId)
```

### Key Pattern

Location: `/src/lib/database/queries.ts` (714 lines)

- Always use server client
- Validate data with Zod before mutations
- Handle errors explicitly
- Include RLS enforcement (backup to policies)

---

## 7. Validation & Schemas

**Location**: `/src/lib/schemas/validation.ts` (367 lines)

All validation uses **Zod**:

```typescript
export const chatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string().min(1).max(10000),
      })
    )
    .min(1),
})

// In API route:
const validated = chatRequestSchema.parse(body) // Throws on invalid
```

### File Upload Constraints

- Max size: 10MB
- Types: PDF, TXT, Markdown
- Supported MIME: `application/pdf`, `text/plain`, `text/markdown`

---

## 8. API Route Patterns

### Standard Structure

```typescript
export async function POST(request: NextRequest) {
  try {
    // 1. Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return new Response('Unauthorized', { status: 401 })

    // 2. Validate request
    const body = await request.json()
    const validated = requestSchema.parse(body)

    // 3. Process
    const result = await performOperation(validated, user.id)

    // 4. Return
    return Response.json({ success: true, data: result })
  } catch (error) {
    if (error instanceof ZodError) {
      return new Response('Invalid request', { status: 400 })
    }
    return new Response('Internal error', { status: 500 })
  }
}
```

### Streaming Response (Chat)

```typescript
const readable = new ReadableStream({
  async start(controller) {
    for await (const chunk of stream) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`))
    }
    controller.close()
  },
})

return new Response(readable, {
  headers: {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  },
})
```

---

## 9. Component Architecture

### Server vs Client Components

**Default: Server Components**

```typescript
export default async function Page() {
  const data = await fetchData()
  return <Component data={data} />
}
```

**Client Components for Interactivity**

```typescript
'use client'
export function InteractiveForm() {
  const [state, setState] = useState()
  return <form onClick={...} />
}
```

### Organization

```
/components/
├── ui/        → Shadcn primitives
├── chat/      → Chat feature
├── documents/ → Document feature
├── auth/      → Auth forms
└── layouts/   → Page layouts
```

### Styling with Tailwind + `cn()`

```typescript
import { cn } from '@/lib/utils/cn'

className={cn(
  'p-4 rounded-lg',
  role === 'user' ? 'bg-blue-100' : 'bg-gray-100'
)}
```

---

## 10. Testing Strategy

### Stack

- **Unit/Integration**: Jest + Testing Library
- **E2E**: Playwright
- **Commands**: `npm test`, `npm run test:e2e`, `npm run test:watch`

### Test Pattern

```typescript
describe('generateEmbedding', () => {
  it('should cache embeddings', async () => {
    const result1 = await generateEmbedding('test', { useCache: true })
    expect(result1.cached).toBe(false)

    const result2 = await generateEmbedding('test', { useCache: true })
    expect(result2.cached).toBe(true)
  })
})
```

---

## 11. Environment Variables

### Required Variables

```bash
# Next.js
NODE_ENV=development|production|test
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Server-only, NEVER expose to client

# OpenAI
OPENAI_API_KEY=sk-proj-...

# Qdrant
QDRANT_URL=https://xxx.qdrant.io
QDRANT_API_KEY=xxx
QDRANT_COLLECTION_NAME=documents

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx

# Optional
LANGFUSE_PUBLIC_KEY=pk-lf-...
```

### Validation

- Location: `/src/lib/env.ts`
- Uses Zod schema to validate on startup
- Throws on missing required variables

### Security

❌ Never commit `.env.local`
❌ Never expose `SUPABASE_SERVICE_ROLE_KEY` to client
✅ Use `NEXT_PUBLIC_` prefix for client variables
✅ Rotate API keys regularly
✅ Use Vercel environment variables for production

---

## 12. Deployment Guidelines

### Vercel Deployment

```bash
npm install -g vercel
vercel login
vercel link
vercel env add NEXT_PUBLIC_SUPABASE_URL
# ... add all env vars
vercel --prod
```

### Pre-Deployment Checklist

- ✅ `npm run type-check` passes
- ✅ `npm run lint` passes
- ✅ `npm test` passes
- ✅ All env vars in Vercel
- ✅ Supabase migrations applied (`supabase db push`)
- ✅ Qdrant collection exists
- ✅ Redis connection verified

### Post-Deployment

1. Test auth flow (magic link login)
2. Upload sample document
3. Test RAG chat works
4. Check Vercel Analytics for errors

---

## 13. Common Pitfalls & Solutions

❌ **Using browser client in Server Component**
✅ Use `await createClient()` from server module

❌ **Forgetting `await cookies()` in Next.js 15+**
✅ Always `await cookies()` before using

❌ **Not checking auth in API routes**
✅ Always verify user before processing

❌ **Not handling empty search results**
✅ Check `results.length > 0` before accessing

❌ **Exceeding token limits**
✅ Use `fitContextToTokenLimit()` to constrain

❌ **Not invalidating cache on updates**
✅ Call `invalidateSearchCache(userId)` after updates

❌ **Caching sensitive data**
✅ Never cache API keys or passwords

❌ **Using `any` type**
✅ Use `unknown` and type guards

❌ **Not validating external data**
✅ Always parse with Zod before using

❌ **N+1 query problem**
✅ Use relationship queries with `select('*, relations(*)')`

---

## 14. Code Style & Conventions

### File Naming

| Type       | Pattern    | Example              |
| ---------- | ---------- | -------------------- |
| Components | PascalCase | `ChatMessage.tsx`    |
| Services   | kebab-case | `vector-search.ts`   |
| Types      | kebab-case | `database.ts`        |
| API Routes | route.ts   | `/api/chat/route.ts` |

### Import Order

1. External: `import { createHash } from 'crypto'`
2. Absolute: `import { createClient } from '@/lib/supabase/server'`
3. Relative: `import { helper } from './utils'`

### JSDoc Commenting

```typescript
/**
 * Generates embeddings with Redis caching
 *
 * @param text - Text to embed (max 8191 tokens)
 * @param options - Cache configuration
 * @returns Result with vector and metadata
 * @throws EmbeddingError if API call fails
 */
```

---

## 15. Performance Optimization

### Caching Strategy

- Embeddings: 1-hour TTL (expensive)
- Search results: 5-minute TTL (medium cost)
- Conversation state: 7-day TTL (cheap)

### Database Optimization

1. Use indexes on frequently queried columns
2. Implement pagination for large sets
3. Select only needed columns
4. Batch operations when possible
5. Use relationship queries (avoid N+1)

### RAG Optimization

1. Limit search to top 5 chunks
2. Use reranking for relevance
3. Implement token limiting
4. Cache search results

---

## 16. Security Best Practices

### Authentication

- Never expose `SUPABASE_SERVICE_ROLE_KEY`
- Always validate session in API routes
- Use RLS policies for access control
- Rate limit auth endpoints

### Data

- Validate all inputs with Zod
- Sanitize file uploads (type, size, name)
- Use parameterized queries
- Never trust client user IDs

### Files

```typescript
// Validate type
if (!['application/pdf', 'text/plain'].includes(file.type)) throw Error

// Validate size
if (file.size > 10 * 1024 * 1024) throw Error

// Sanitize name
const safe = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
```

---

## 17. Monitoring & Debugging

### Logging

```typescript
// Dev
console.log('Processing:', documentId)

// Prod - Structured
console.error('Failed:', { documentId, error: error.message, userId, timestamp })
```

### Error Tracking

- Use Vercel Analytics
- Log with context (userId, operation, timestamp)
- Set up alerts for critical errors

### Debug Scenarios

```typescript
// Embeddings not caching
const stats = await getEmbeddingCacheStats()

// Search not finding results
const results = await searchDocuments(query, { threshold: 0 })

// Auth issues
const { data, error } = await supabase.auth.getSession()
```

---

## 18. Development Workflow

### Setup

```bash
git clone <repo>
npm install
cp .env.example .env.local  # Fill in variables
npx supabase link --project-ref xxxxx
npx supabase db pull
npm run dev
```

### Branch Strategy

- `main`: Production
- `develop`: Integration
- `feature/*`: Features
- `bugfix/*`: Bug fixes

### Commit Convention

```
feat: Add document reprocessing
fix: Handle empty search results
refactor: Extract caching logic
docs: Update documentation
test: Add integration tests
```

### Code Review Checklist

- ✅ Types properly defined
- ✅ Zod validation present
- ✅ Auth checked in routes
- ✅ Error handling exists
- ✅ Tests added
- ✅ No hardcoded secrets
- ✅ Performance considered

---

## 19. RAG Advanced Patterns

### Hybrid Search

```typescript
const results = await hybridSearch(query, {
  semanticWeight: 0.7,
  keywordWeight: 0.3,
  recencyWeight: 0.1,
})
```

### Conversation Memory

```typescript
// Auto token limiting
const state = await getConversationState(id, {
  maxMessages: 10,
  maxTokens: 3000,
})

// Auto trimming on add
await addMessageToConversation(id, { role: 'user', content })
```

### Context Management

```typescript
const fitted = fitContextToTokenLimit(results, { maxContextTokens: 3000, reserve: 200 })
```

### Document Reprocessing

```typescript
await reprocessDocument(doc, {
  chunkSize: 1000,
  chunkOverlap: 100,
  deleteOldVectors: true,
})
```

---

## 20. Quick Reference

### Commands

```bash
npm run dev              # Dev server
npm run build            # Build
npm run type-check       # Type checking
npm test                 # Tests
npm run test:e2e         # E2E tests
npm run lint             # Linting
```

### Common Imports

```typescript
import { createClient } from '@/lib/supabase/server'
import { generateEmbedding } from '@/lib/services/embeddings'
import { searchDocuments } from '@/lib/services/vector-search'
import { chatRequestSchema } from '@/lib/schemas/validation'
import type { Document } from '@/lib/types/database'
```

### Protected Page

```typescript
const supabase = await createClient()
const {
  data: { user },
} = await supabase.auth.getUser()
if (!user) redirect('/login')
```

### API Route

```typescript
const {
  data: { user },
} = await supabase.auth.getUser()
if (!user) return new Response('Unauthorized', { status: 401 })

const validated = schema.parse(await request.json())
const result = await processRequest(validated, user.id)
return Response.json({ success: true, data: result })
```

---

## Summary

This document is your reference for all development patterns in this Next.js RAG chatbot. Key principles:

1. **Type-Safe**: Strict TypeScript + Zod validation
2. **Server-First**: Minimize client-side code
3. **RLS-Enforced**: All data scoped to authenticated user
4. **Cache-Optimized**: Redis for expensive operations
5. **Well-Tested**: Jest + Playwright patterns
6. **Production-Ready**: Security, error handling, monitoring

Reference specific sections as needed during development. When in doubt, check the actual implementation files referenced throughout this guide.
