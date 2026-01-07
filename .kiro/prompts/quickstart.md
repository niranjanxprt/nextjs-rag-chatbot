# Quickstart - Project Setup Wizard

Welcome to the Next.js RAG Chatbot project setup! This interactive wizard will help you configure your development environment and understand the project structure.

## Project Overview

You're working with a production-grade RAG (Retrieval-Augmented Generation) chatbot that enables users to upload documents and have intelligent conversations with AI using their document content as context.

**Key Features:**
- Document upload and processing (PDF, TXT, Markdown)
- Semantic search with vector embeddings
- Streaming chat interface with AI responses
- Multi-layer caching for performance
- Production-ready architecture with full observability

## Prerequisites Check

Before we begin, ensure you have:

- [ ] **Node.js 18+** installed (`node --version`)
- [ ] **npm or yarn** package manager
- [ ] **Git** for version control
- [ ] **Supabase account** - [Create one](https://app.supabase.com)
- [ ] **OpenAI API key** - [Get one](https://platform.openai.com/api-keys)
- [ ] **Qdrant Cloud account** - [Sign up](https://cloud.qdrant.io)
- [ ] **Upstash Redis** - [Create free tier](https://console.upstash.com)

## Setup Process

### Step 1: Environment Configuration

1. **Copy environment template:**
   ```bash
   cp .env.example .env.local
   ```

2. **Configure your environment variables in `.env.local`:**

   ```bash
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

   # OpenAI Configuration
   OPENAI_API_KEY=your-openai-api-key

   # Qdrant Configuration
   QDRANT_URL=your-qdrant-cluster-url
   QDRANT_API_KEY=your-qdrant-api-key
   QDRANT_COLLECTION_NAME=rag-documents

   # Upstash Redis Configuration
   UPSTASH_REDIS_REST_URL=your-redis-rest-url
   UPSTASH_REDIS_REST_TOKEN=your-redis-rest-token
   ```

### Step 2: Database Setup

1. **Link to your Supabase project:**
   ```bash
   npx supabase link --project-ref your-project-ref
   ```

2. **Apply database migrations:**
   ```bash
   npx supabase db push
   ```

   This creates:
   - User profiles table
   - Documents and document chunks tables
   - Conversations and messages tables
   - Row Level Security (RLS) policies

### Step 3: Install Dependencies

```bash
npm install
```

### Step 4: Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your application.

## Project Structure Overview

```
src/
├── app/                 # Next.js App Router
│   ├── api/            # API routes (chat, documents, search)
│   ├── auth/           # Authentication pages
│   └── dashboard/      # Protected application pages
├── components/         # React components
│   ├── ui/            # Shadcn UI primitives
│   ├── chat/          # Chat interface components
│   └── documents/     # Document management components
└── lib/               # Business logic and utilities
    ├── services/      # Core RAG services
    ├── database/      # Database queries
    └── utils/         # Helper utilities
```

## Key Services Explained

### Document Processing Pipeline
- **Location**: `src/lib/services/document-processor.ts`
- **Function**: Parses PDFs, extracts text, creates chunks
- **Configuration**: 500-character chunks, 50-character overlap

### Embedding Service
- **Location**: `src/lib/services/embeddings.ts`
- **Function**: Generates OpenAI embeddings with caching
- **Model**: text-embedding-3-small (1536 dimensions)

### Vector Search
- **Location**: `src/lib/services/vector-search.ts`
- **Function**: Semantic search with hybrid ranking
- **Algorithm**: Semantic (70%) + Term Frequency (20%) + Length (10%)

### Chat Service
- **Location**: `src/app/api/chat/route.ts`
- **Function**: Streaming chat with RAG context
- **Model**: GPT-4-turbo with 3000-token context budget

## Testing Your Setup

### 1. Authentication Test
1. Navigate to `/auth/login`
2. Enter your email for magic link login
3. Check your email and click the login link
4. Should redirect to dashboard

### 2. Document Upload Test
1. Go to `/dashboard/documents`
2. Upload a PDF, TXT, or Markdown file
3. Watch the processing status update
4. Verify document appears in your list

### 3. Search Test
1. Navigate to `/dashboard/search`
2. Enter a query related to your uploaded document
3. Should return relevant chunks with similarity scores
4. Verify search results are contextually relevant

### 4. Chat Test
1. Go to `/dashboard/chat`
2. Start a conversation about your uploaded document
3. Should receive streaming responses with document context
4. Verify responses reference your document content

## Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm start                # Start production server

# Code Quality
npm run lint             # Run ESLint
npm run type-check       # TypeScript type checking

# Testing
npm test                 # Run Jest unit tests
npm run test:watch       # Watch mode for tests
npm run test:e2e         # Run Playwright E2E tests

# Database
npx supabase db push     # Push migrations to database
npx supabase db pull     # Pull latest schema
npx supabase db reset    # Reset database (dev only!)
```

## Kiro CLI Integration

This project is optimized for Kiro CLI development workflow:

### Available Custom Prompts
- **@prime** - Load comprehensive project context
- **@plan-feature** - Create detailed implementation plans
- **@execute** - Systematic feature implementation
- **@code-review** - Quality assurance and standards checking
- **@code-review-hackathon** - Hackathon submission evaluation

### Steering Documents
- **product.md** - Product overview and user needs
- **tech.md** - Technical architecture and standards
- **structure.md** - Project organization and conventions

### Recommended Workflow
1. **Start each session**: `@prime` to load project context
2. **Plan new features**: `@plan-feature` for systematic planning
3. **Implement features**: `@execute` for step-by-step implementation
4. **Quality assurance**: `@code-review` for code quality checks

## Troubleshooting

### Common Issues

**"Module not found" errors:**
- Check import paths use `@/` alias
- Verify file exists in correct location
- Run `npm run type-check` for TypeScript errors

**Build fails:**
- Run `npm run type-check` to identify issues
- Check environment variables are set correctly
- Verify all dependencies are installed

**Authentication not working:**
- Verify Supabase URL and keys in `.env.local`
- Check Supabase project is active
- Ensure RLS policies are applied

**Document processing fails:**
- Check OpenAI API key is valid and has credits
- Verify Qdrant cluster is running and accessible
- Check file size is under 10MB limit

**Search returns no results:**
- Verify documents are processed (status = 'completed')
- Lower similarity threshold from 0.7 to 0.5
- Check Qdrant collection exists and has data

**Redis connection errors:**
- Verify Upstash Redis URL and token
- Check Redis instance is active
- Test connection with Redis CLI

### Getting Help

- **Documentation**: Check README.md for detailed setup instructions
- **Error Logs**: Check browser console and terminal for error messages
- **Supabase Dashboard**: Monitor database and authentication
- **Qdrant Dashboard**: Check vector collection status
- **Vercel Analytics**: Monitor deployed application performance

## Next Steps

Once your setup is complete:

1. **Explore the codebase** using `@prime` to understand the architecture
2. **Plan new features** with `@plan-feature` for systematic development
3. **Implement improvements** using `@execute` for guided implementation
4. **Maintain quality** with `@code-review` for ongoing quality assurance

## Development Best Practices

### Code Standards
- Use TypeScript strict mode
- Validate inputs with Zod schemas
- Implement proper error boundaries
- Follow Next.js App Router patterns
- Maintain RLS policies for security

### Performance
- Leverage multi-layer caching
- Optimize for Vercel deployment
- Monitor token usage and costs
- Implement proper loading states
- Use streaming for better UX

### Testing
- Write unit tests for business logic
- Test API endpoints thoroughly
- Include property-based tests for complex logic
- Implement E2E tests for critical paths
- Maintain >80% test coverage

Your Next.js RAG Chatbot is now ready for development! Use the Kiro CLI prompts to maintain productivity and code quality throughout your development process.
