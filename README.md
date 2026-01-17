# Next.js RAG Chatbot

🏆 **Dynamous Kiro Hackathon 2026 Submission**

A production-grade retrieval-augmented generation (RAG) chatbot built with Next.js 15, Convex, OpenAI, and Qdrant. Upload documents, perform semantic search, and chat with AI using your own data.

## Quick Start

```bash
git clone https://github.com/niranjanthimmappa/nextjs-rag-chatbot.git
cd nextjs-rag-chatbot
npm install
cp .env.example .env.local
# Add your API keys to .env.local
npx convex dev  # Start Convex backend
npm run dev     # Start Next.js frontend
```

## Key Features

- 📄 **Document Management** - Upload PDF, TXT, Markdown files
- 🔍 **Semantic Search** - Vector similarity search with Qdrant
- 💬 **RAG Chat** - AI responses using document context
- 🔐 **Authentication** - Passwordless magic link and OTP login
- ⚡ **Real-time Updates** - Live data synchronization with Convex
- 🎨 **Modern UI** - Shadcn components with Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Backend**: Convex (Database + Auth + Storage)
- **AI**: OpenAI GPT-4 + Embeddings
- **Vector DB**: Qdrant Cloud
- **Email**: Resend
- **Deployment**: Vercel + Convex Cloud

## Environment Variables

```bash
# Convex
CONVEX_DEPLOYMENT=your-convex-deployment-url
NEXT_PUBLIC_CONVEX_URL=your-convex-url

# Authentication
AUTH_RESEND_KEY=your-resend-api-key

# OpenAI
OPENAI_API_KEY=your-openai-api-key

# Qdrant (optional - for vector search)
QDRANT_URL=your-qdrant-url
QDRANT_API_KEY=your-qdrant-api-key
```

## Documentation

📚 **[Complete Documentation](./docs/README.md)**

- [Setup Guide](./docs/LOCAL_TESTING.md)
- [Development Patterns](./docs/CLAUDE.md)
- [Testing Guide](./docs/TESTING.md)
- [Hackathon Summary](./docs/EXECUTIVE_SUMMARY.md)

## Architecture

```
Document Upload → PDF Parsing → Text Chunking → Embeddings → Convex Storage
User Query → Semantic Search → Context Retrieval → AI Chat → Streaming Response
```

## Convex Setup

1. **Install Convex CLI**: `npm install -g convex`
2. **Initialize Convex**: `npx convex dev`
3. **Deploy Functions**: Functions auto-deploy on save
4. **Configure Auth**: Set up Resend for magic links and OTP

## Development

```bash
# Start Convex backend (in one terminal)
npx convex dev

# Start Next.js frontend (in another terminal)
npm run dev

# Code quality checks
npm run lint        # ESLint
npm run knip        # Dead code analysis
npm test            # Run tests
```

## Code Quality

This project maintains high code quality standards:

- ✅ **Zero ESLint warnings/errors**
- ✅ **Zero security vulnerabilities** (npm audit)
- ✅ **Knip analysis** - No unused files, minimal unused exports
- ✅ **TypeScript strict mode** - Full type safety
- ✅ **Optimized bundle** - 318 kB First Load JS

### Recent Refactoring (Jan 2026)

- Removed 44 unused files (~8,000+ lines)
- Cleaned up all Supabase migration artifacts
- 9% bundle size reduction
- See [KNIP_FINAL_ANALYSIS.md](./KNIP_FINAL_ANALYSIS.md) for details

## Deployment

1. **Deploy Convex**: `npx convex deploy`
2. **Deploy to Vercel**: Connect your GitHub repo
3. **Set Environment Variables**: Add Convex URLs and API keys

## License

MIT

---

Built with ❤️ using Kiro CLI for AI-powered document search.
