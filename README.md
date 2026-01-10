# Next.js RAG Chatbot

🏆 **Dynamous Kiro Hackathon 2026 Submission**

A production-grade retrieval-augmented generation (RAG) chatbot built with Next.js 15, Supabase, OpenAI, and Qdrant. Upload documents, perform semantic search, and chat with AI using your own data.

## Quick Start

```bash
git clone https://github.com/niranjanthimmappa/nextjs-rag-chatbot.git
cd nextjs-rag-chatbot
npm install
cp .env.example .env.local
# Add your API keys to .env.local
npm run dev
```

## Key Features

- 📄 **Document Management** - Upload PDF, TXT, Markdown files
- 🔍 **Semantic Search** - Vector similarity search with Qdrant
- 💬 **RAG Chat** - AI responses using document context
- 🔐 **Authentication** - Passwordless magic link login
- ⚡ **Real-time Streaming** - Live chat responses
- 🎨 **Modern UI** - Shadcn components with Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Backend**: Supabase PostgreSQL, OpenAI GPT-4
- **Vector DB**: Qdrant Cloud
- **Caching**: Upstash Redis
- **Deployment**: Vercel

## Documentation

📚 **[Complete Documentation](./docs/README.md)**

- [Setup Guide](./docs/LOCAL_TESTING.md)
- [Development Patterns](./docs/CLAUDE.md)
- [Testing Guide](./docs/TESTING.md)
- [Hackathon Summary](./docs/EXECUTIVE_SUMMARY.md)

## Architecture

```
Document Upload → PDF Parsing → Text Chunking → Embeddings → Vector Storage
User Query → Semantic Search → Context Retrieval → AI Chat → Streaming Response
```

## License

MIT

---

Built with ❤️ using Kiro CLI for AI-powered document search.
