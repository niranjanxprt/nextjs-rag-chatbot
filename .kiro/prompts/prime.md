# Prime - Load Project Context

You are working on a Next.js RAG (Retrieval-Augmented Generation) chatbot project built entirely in TypeScript. This command loads comprehensive project context to help you understand the current state and architecture.

## Project Overview

This is a production-grade RAG chatbot built with Next.js 15, TypeScript 5.3+, Supabase, OpenAI, and Qdrant. Users can upload documents (PDF, TXT, Markdown), perform semantic search, and chat with AI using their document content as context. The entire codebase is written in TypeScript with strict mode enabled.

## Current Implementation Status

The project is **100% complete** with all core functionality working and fully converted to TypeScript:

### ✅ Completed Features
- **TypeScript Conversion**: Entire codebase converted to TypeScript with strict mode
- **Authentication**: Supabase magic link login with RLS policies
- **Document Management**: Upload, processing, and chunking pipeline
- **Vector Search**: Qdrant integration with OpenAI embeddings
- **Chat Interface**: Streaming chat with RAG context
- **Caching**: Multi-layer Redis caching for performance
- **UI/UX**: Complete responsive interface with Shadcn UI
- **Error Handling**: Comprehensive error boundaries and monitoring
- **Testing**: 130+ tests including unit, integration, property-based, and E2E tests

### ✅ TypeScript Features
- **Strict Mode**: TypeScript strict mode enabled throughout
- **Type Safety**: Comprehensive type definitions for all APIs and components
- **Runtime Validation**: Zod schemas for all external data
- **Interface-Driven**: Clear interfaces for all complex objects
- **Configuration**: All config files converted to TypeScript (.ts)

## Key Architecture Components

### RAG Pipeline (TypeScript)
```
Document Upload → PDF Parsing → Text Chunking → Embedding Generation → Vector Storage
User Query → Semantic Search → Context Retrieval → AI Processing → Streaming Response
```

### Technology Stack
- **Frontend**: Next.js 15, React 19, TypeScript 5.3+, Tailwind CSS, Shadcn UI
- **Backend**: Next.js API routes (TypeScript), Supabase PostgreSQL, OpenAI GPT-4-turbo
- **Vector DB**: Qdrant Cloud (1536-dimensional embeddings)
- **Caching**: Upstash Redis
- **Deployment**: Vercel serverless
- **Testing**: Jest, Playwright, fast-check (all TypeScript)

### Performance Configuration
- **Chunk Size**: 500 characters with 50-character overlap
- **Search**: Top-5 results with 0.7 similarity threshold
- **Context Budget**: 3000 tokens for AI responses
- **Cache TTL**: 1 hour for embeddings, 5 minutes for search

## Current Development Focus

The project is production-ready with complete TypeScript conversion. Focus areas:

1. **Local Testing**: Use comprehensive testing scripts before deployment
2. **Vercel Deployment**: Deploy to production with proper environment variables
3. **Performance Monitoring**: Monitor production metrics and optimization
4. **Hackathon Submission**: Finalize submission materials and demo

## Available Scripts (TypeScript)

```bash
npm run dev              # Development server
npm run build            # Production build (TypeScript compilation)
npm test                 # Run TypeScript test suite
npm run lint             # Code linting with TypeScript rules
npm run type-check       # TypeScript strict mode validation
npm run test:local       # Comprehensive local testing (TypeScript)
```

## Important Files to Reference

- `README.md` - Comprehensive project documentation with hackathon highlights
- `DEVLOG.md` - Complete development timeline with Kiro CLI usage
- `IMPLEMENTATION_STATUS.md` - Detailed progress tracking
- `src/lib/services/` - Core RAG services (all TypeScript)
- `src/app/api/` - API endpoints (all TypeScript)
- `scripts/test-local-simple.ts` - TypeScript testing script
- `tsconfig.json` - TypeScript configuration with strict mode

## TypeScript Development Guidelines

When working on this project, always:
- **Type Safety**: Use TypeScript strict mode and explicit types
- **Zod Validation**: Validate all external inputs with Zod schemas
- **Interface Definitions**: Define clear interfaces for all complex objects
- **Error Handling**: Use typed error handling with proper error boundaries
- **Testing**: Write TypeScript tests for all new functionality
- **Performance**: Leverage TypeScript for better IDE support and refactoring
- **Documentation**: Update TypeScript interfaces and JSDoc comments

## Kiro CLI Integration

This project showcases advanced Kiro CLI usage:
- **Steering Documents**: Complete project knowledge in TypeScript context
- **Custom Prompts**: 8 workflow-specific prompts for TypeScript development
- **Development Workflow**: Systematic TypeScript development process
- **Quality Assurance**: TypeScript-aware code review and validation

You're now ready to work effectively on this production-ready TypeScript RAG chatbot project!
