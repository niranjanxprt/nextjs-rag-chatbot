# Next Steps for Frontend Completion

**Progress:** Phases 1-2 Complete (Database, Types, and APIs)
**Date:** 2025-01-08

## What's Done ✅

### Core Infrastructure
- [x] Database migration with 3 new tables (projects, prompts, user_preferences)
- [x] Complete TypeScript types for all new entities
- [x] 300+ lines of database query functions
- [x] Full Projects API (list, create, read, update, delete)
- [x] Full Prompts API (list, create, read, update, delete, usage tracking)
- [x] Chat API migrated to Vercel AI SDK

### Files Created
1. `supabase/migrations/002_add_projects_prompts_preferences.sql` - Database schema
2. `src/app/api/projects/route.ts` - Projects list/create
3. `src/app/api/projects/[id]/route.ts` - Project detail/update/delete
4. `src/app/api/prompts/route.ts` - Prompts list/create
5. `src/app/api/prompts/[id]/route.ts` - Prompt detail/update/delete/usage
6. `IMPLEMENTATION_STATUS.md` - Current progress tracking
7. `NEXT_STEPS.md` - This file

### Code Changes
1. `src/lib/types/database.ts` - Added Project, Prompt, UserPreferences types
2. `src/lib/database/queries.ts` - Added 20 new CRUD functions
3. `src/app/api/chat/route.ts` - Migrated to AI SDK streamText

## Immediate Next Steps (Phase 3-4)

### 1. Create Preferences API (Quick - 1 hour)
```bash
touch src/app/api/preferences/route.ts
```

File should handle:
- GET: Return user preferences (create if not exists)
- PATCH: Update user preferences

### 2. Create Context Providers (Phase 3 - 2 days)

**Critical for frontend - MUST DO BEFORE COMPONENTS**

```bash
mkdir -p src/lib/contexts
touch src/lib/contexts/projects-context.tsx
touch src/lib/contexts/prompts-context.tsx
touch src/lib/contexts/conversations-context.tsx
touch src/lib/contexts/theme-context.tsx
```

See `/plan` file for detailed context provider implementations.

### 3. Update Layout with Providers (Phase 3 - 30 min)

Update `src/app/layout.tsx` to wrap root with all providers:
```tsx
<ProjectsProvider>
  <PromptsProvider>
    <ConversationsProvider>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </ConversationsProvider>
  </PromptsProvider>
</ProjectsProvider>
```

### 4. Migrate ChatInterface to useChat Hook (Phase 5 - 3 hours)

Update `src/components/chat/ChatInterface.tsx`:
```tsx
import { useChat } from 'ai/react'
import { useProjects } from '@/lib/contexts/projects-context'

const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
  api: '/api/chat',
  body: {
    projectId: currentProject?.id,
    useKnowledgeBase: true
  }
})
```

## Implementation Order

**STRICT ORDER - DO NOT SKIP:**

1. ✅ Database & Types (DONE)
2. ✅ Projects & Prompts APIs (DONE)
3. ⏳ **Preferences API** (Phase 4)
4. ⏳ **Context Providers** (Phase 3) - BLOCKS all frontend components
5. ⏳ Update ChatInterface to useChat (Phase 5)
6. ⏳ ConversationSidebar component (Phase 5)
7. ⏳ Projects page (Phase 6)
8. ⏳ Prompts library page (Phase 7)
9. ⏳ Settings page (Phase 8)
10. ⏳ Install UI components (Phase 9)
11. ⏳ Test & Deploy (Phase 10)

## Testing Strategy

### API Testing (Before Frontend)
```bash
# Test Projects API
curl -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Project"}' \
  http://localhost:3000/api/projects

# Test Prompts API
curl -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Prompt","content":"Hello {{name}}"}' \
  http://localhost:3000/api/prompts
```

### Chat API Testing
```bash
# Verify AI SDK streaming works
curl -N http://localhost:3000/api/chat \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "messages":[{"role":"user","content":"Hello"}],
    "projectId":"your-project-id"
  }'
```

## Critical Implementation Details

### Context Providers Pattern
All contexts should follow this pattern:
```tsx
'use client'
import { createContext, useContext } from 'react'

interface ContextType { /* ... */ }

export const Context = createContext<ContextType | null>(null)

export function Provider({ children }: { children: React.ReactNode }) {
  // Implementation
  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function useContext() {
  const ctx = useContext(Context)
  if (!ctx) throw new Error('Must be used within Provider')
  return ctx
}
```

### useChat Hook Integration
```tsx
import { useChat } from 'ai/react'

const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
  api: '/api/chat',
  id: conversationId, // For persistence
  body: {
    conversationId,
    projectId: currentProject?.id,
    useKnowledgeBase: true
  }
})
```

### Component Structure
```
Chat Interface
├── ConversationSidebar
│   ├── SearchInput
│   └── ConversationItem (repeated)
├── MainChat
│   ├── ChatHeader (with KB toggle)
│   ├── MessageList
│   │   └── SourceCitations
│   └── ChatInput
└── DocumentsPanel (right sidebar)
```

## Database Migration Deployment

When ready to deploy:

```bash
# 1. Push to Supabase
npx supabase db push

# 2. Verify migration
npx supabase migration list

# 3. Check RLS policies are active
# Via Supabase dashboard: SQL Editor
SELECT * FROM pg_policies WHERE schemaname = 'public';
```

## File Structure After All Phases

```
src/
├── app/
│   ├── api/
│   │   ├── chat/route.ts (✅ migrated to AI SDK)
│   │   ├── projects/
│   │   │   ├── route.ts (✅ created)
│   │   │   └── [id]/route.ts (✅ created)
│   │   ├── prompts/
│   │   │   ├── route.ts (✅ created)
│   │   │   └── [id]/route.ts (✅ created)
│   │   └── preferences/route.ts (⏳ todo)
│   ├── chat/
│   │   ├── page.tsx (existing)
│   │   └── [conversationId]/page.tsx (⏳ todo)
│   ├── projects/page.tsx (⏳ todo)
│   ├── prompts/page.tsx (⏳ todo)
│   ├── settings/page.tsx (⏳ todo)
│   └── layout.tsx (⏳ update with providers)
├── components/
│   ├── chat/
│   │   ├── ChatInterface.tsx (⏳ update to useChat)
│   │   ├── ConversationSidebar.tsx (⏳ todo)
│   │   ├── ConversationItem.tsx (⏳ todo)
│   │   └── SourceCitations.tsx (⏳ todo)
│   ├── projects/
│   │   ├── ProjectCard.tsx (⏳ todo)
│   │   ├── CreateProjectDialog.tsx (⏳ todo)
│   │   └── ProjectSwitcher.tsx (⏳ todo)
│   ├── prompts/
│   │   ├── PromptCard.tsx (⏳ todo)
│   │   ├── PromptEditor.tsx (⏳ todo)
│   │   └── PromptSelector.tsx (⏳ todo)
│   └── settings/
│       ├── AppearanceSettings.tsx (⏳ todo)
│       ├── ChatSettings.tsx (⏳ todo)
│       └── ProfileSettings.tsx (⏳ todo)
└── lib/
    ├── contexts/
    │   ├── projects-context.tsx (⏳ todo)
    │   ├── prompts-context.tsx (⏳ todo)
    │   ├── conversations-context.tsx (⏳ todo)
    │   └── theme-context.tsx (⏳ todo)
    ├── database/queries.ts (✅ updated)
    └── types/database.ts (✅ updated)
```

## Quick Commands for Next Session

```bash
# Start where we left off
cd /Users/niranjanthimmappa/Downloads/Projects/nextjs-rag-chatbot

# Check current status
cat IMPLEMENTATION_STATUS.md

# TypeScript check
npm run type-check

# Linting
npm run lint:fix

# Development
npm run dev
```

## Success Criteria

When complete, the application should:

- [x] Use Vercel AI SDK for streaming (DONE)
- [ ] Support multiple projects for organizing documents
- [ ] Support conversation history with pinning/archiving
- [ ] Provide reusable prompt templates library
- [ ] Toggle Knowledge Base mode on/off
- [ ] Display source citations for responses
- [ ] Persist user preferences (theme, chat settings)
- [ ] Fully type-safe TypeScript throughout
- [ ] All APIs working with proper auth
- [ ] E2E tests for critical flows
- [ ] Lighthouse score >90
- [ ] Zero console errors in dev mode

## Commit Readiness

All code in this session is ready to commit with message:
```
feat: phase 1-2 - database schema and AI SDK migration

- Create database migration with projects, prompts, preferences tables
- Add comprehensive TypeScript types for all entities
- Implement 20+ database query functions
- Create Projects API (CRUD operations)
- Create Prompts API (CRUD + usage tracking)
- Migrate chat API to Vercel AI SDK with streamText
- Maintain full backward compatibility with existing chat interface
- Add RLS policies for data security
```

## Questions & Support

If stuck on any phase:
1. Check the detailed plan in `/plan`
2. Reference the pattern implementations in completed APIs
3. Use TypeScript strict mode for type safety
4. Test API endpoints before building UI components

Good luck! 🚀
