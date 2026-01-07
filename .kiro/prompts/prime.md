# Prime - Load Project Context

You are working on a Next.js RAG (Retrieval-Augmented Generation) chatbot project. This command loads comprehensive project context to help you understand the current state and architecture.

## Project Overview

This is a production-grade RAG chatbot built with Next.js 15, Supabase, OpenAI, and Qdrant. Users can upload documents (PDF, TXT, Markdown), perform semantic search, and chat with AI using their document content as context.

## Current Implementation Status

The project is **85% complete** with all core functionality working:

### ✅ Completed Features
- **Authentication**: Supabase magic link login with RLS policies
- **Document Management**: Upload, processing, and chunking pipeline
- **Vector Search**: Qdrant integration with OpenAI embeddings
- **Chat Interface**: Streaming chat with RAG context
- **Caching**: Multi-layer Redis caching for performance
- **UI/UX**: Complete responsive interface with Shadcn UI
- **Error Handling**: Comprehensive error boundaries and monitoring
- **Testing**: 110+ unit tests, property-based testing framework

### ⚠️ Remaining Tasks
- Fix property-based tests (float precision, empty string handling)
- Complete integration and E2E test suites
- Production deployment preparation
- Final documentation polish

## Key Architecture Components

### RAG Pipeline
```
Document Upload → PDF Parsing → Text Chunking → Embedding Generation → Vector Storage
User Query → Semantic Search → Context Retrieval → AI Processing → Streaming Response
```

### Technology Stack
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Next.js API routes, Supabase PostgreSQL, OpenAI GPT-4-turbo
- **Vector DB**: Qdrant Cloud (1536-dimensional embeddings)
- **Caching**: Upstash Redis
- **Deployment**: Vercel serverless

### Performance Configuration
- **Chunk Size**: 500 characters with 50-character overlap
- **Search**: Top-5 results with 0.7 similarity threshold
- **Context Budget**: 3000 tokens for AI responses
- **Cache TTL**: 1 hour for embeddings, 5 minutes for search

## Current Development Focus

Based on the implementation status, prioritize:

1. **Testing Improvements**: Fix property-based tests and add integration tests
2. **Production Readiness**: Security hardening and performance optimization
3. **Documentation**: Complete setup guides and API documentation
4. **Hackathon Preparation**: Ensure submission meets all criteria

## Available Scripts

```bash
npm run dev              # Development server
npm run build            # Production build
npm test                 # Run test suite
npm run lint             # Code linting
npm run type-check       # TypeScript validation
```

## Important Files to Reference

- `README.md` - Comprehensive project documentation
- `IMPLEMENTATION_STATUS.md` - Detailed progress tracking
- `src/lib/services/` - Core RAG services (embeddings, search, processing)
- `src/app/api/` - API endpoints for chat, documents, search
- `supabase/migrations/` - Database schema with RLS policies

When working on this project, always consider:
- **Type Safety**: Use TypeScript strict mode and Zod validation
- **Performance**: Leverage caching and optimize for Vercel deployment
- **Security**: Maintain RLS policies and proper authentication
- **Testing**: Add tests for new functionality
- **Documentation**: Update relevant docs for changes

You're now ready to work effectively on this RAG chatbot project!
