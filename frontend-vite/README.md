# DocInsight - RAG Chatbot Frontend

Frontend application for the DocInsight RAG Chatbot, built with React, TypeScript, and Vite.

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **TanStack Query** - Data fetching and caching
- **Radix UI** - Accessible component primitives
- **Tailwind CSS** - Styling
- **Supabase** - Backend services integration

## Getting Started

### Prerequisites

- Node.js 20+ and npm 10+

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The application will be available at `http://localhost:8080`

### Building for Production

```bash
npm run build
```

The production build will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
frontend/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/         # Page components
│   ├── services/      # API service layer
│   ├── hooks/         # Custom React hooks
│   ├── constants/     # Application constants
│   └── main.tsx       # Application entry point
├── public/            # Static assets
└── vite.config.ts     # Vite configuration
```

## Environment Variables

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Deployment

The frontend is deployed to Vercel. See `vercel.json` for deployment configuration.

### Auto-Deployment

Deployments are automatically triggered on push to the `main` branch.

### Manual Deployment

```bash
cd frontend
vercel --prod
```

## Testing

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e
```

## License

MIT


<!-- Test auto-deployment: 2024-12-22 12:00 CET -->
# Auto-deployment test: Mon Dec 22 21:22:33 CET 2025
Testing Vercel pipeline deployment
