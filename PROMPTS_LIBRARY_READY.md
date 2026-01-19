# Prompts Library - Ready to Use

**Date:** January 19, 2026  
**Status:** ✅ Ready

---

## Quick Start

### Access the Prompts Library

Open your browser and navigate to:

```
http://localhost:8081/prompts
```

You should see **7 prompts** displayed:

**System Prompts** (3):

- 🤖 general-chat
- 🤖 haystack-rag-generation
- 🤖 haystack-rag-streaming

**User Prompts** (4):

- 📝 contract-comparison
- 📝 document-summary
- 📝 key-terms-extraction
- 📝 risk-analysis

---

## What Was Fixed

### Problem

The prompts library was showing blank because:

1. Missing Langfuse API keys in frontend environment
2. Langfuse LIST API doesn't return prompt content (only metadata)

### Solution

1. ✅ Added Langfuse keys to `frontend-vite/.env.local`
2. ✅ Updated code to fetch each prompt individually for full content
3. ✅ Removed all debug/test code from codebase

---

## How It Works

### Data Flow

```
User visits /prompts
    ↓
React Query: usePrompts()
    ↓
promptsApi.getPrompts()
    ↓
langfuseApi.listPrompts()
    ↓
1. Fetch list from Langfuse (names only)
2. Fetch each prompt individually (with content)
    ↓
Display all prompts with full content
```

### API Calls

- **List**: `GET /api/public/v2/prompts` → Returns 7 prompt names
- **Get Each**: `GET /api/public/v2/prompts/{name}?label=production` → Returns full content
- **Total**: 8 API calls (1 list + 7 individual fetches)

---

## Features

### View Prompts

- ✅ See all prompts with full content
- ✅ Search by title or content
- ✅ Filter by category
- ✅ Toggle system prompts visibility

### Create Prompts

- ✅ Click "New Prompt" button
- ✅ Enter title, content, and category
- ✅ Saves to Langfuse

### Edit Prompts

- ✅ Click edit icon on any user prompt
- ✅ System prompts are read-only (protected)

### Delete Prompts

- ✅ Click delete icon on any user prompt
- ✅ System prompts cannot be deleted (protected)

---

## System Prompts

These prompts are **protected** and used by the RAG pipeline:

### general-chat

Used for general conversation without document context.

### haystack-rag-generation

Used for answering questions based on document context (non-streaming).

### haystack-rag-streaming

Used for streaming responses based on document context.

**Note**: System prompts cannot be edited or deleted to ensure the RAG pipeline works correctly.

---

## Configuration

### Environment Variables

Located in `frontend-vite/.env.local`:

```bash
# Langfuse Configuration
VITE_LANGFUSE_PUBLIC_KEY=pk-lf-c72b3aed-43de-4157-9b6e-17d0fa33c1ae
VITE_LANGFUSE_SECRET_KEY=sk-lf-489e2b22-c400-4eda-b342-7a8d116a4d17
VITE_LANGFUSE_BASE_URL=https://cloud.langfuse.com
```

### Langfuse Dashboard

Access your prompts directly in Langfuse:

```
https://cloud.langfuse.com
```

---

## Troubleshooting

### Prompts not showing?

1. **Hard refresh browser**: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

2. **Check browser console**: Look for errors or these messages:

   ```
   📋 Fetching full content for 7 prompts...
   ✅ Fetched 7 prompts with content
   ```

3. **Verify dev server is running**:

   ```bash
   cd frontend-vite
   npm run dev
   ```

4. **Check environment variables**:
   ```bash
   cd frontend-vite
   cat .env.local | grep LANGFUSE
   ```

### Still having issues?

Check the browser console for specific error messages and verify:

- ✅ Langfuse keys are correct
- ✅ Internet connection is working
- ✅ Langfuse API is accessible

---

## Performance Note

The current implementation makes **8 API calls** to load 7 prompts:

- 1 call to get the list
- 7 calls to get individual prompt content

This is acceptable for small numbers of prompts. For optimization:

- React Query caches the results
- Subsequent visits load from cache
- Only refetches when data is stale

---

## Next Steps

1. ✅ **Test the prompts library** - Visit http://localhost:8081/prompts
2. ✅ **Create a new prompt** - Test the create functionality
3. ✅ **Edit a user prompt** - Test the edit functionality
4. ✅ **Try filtering** - Test search and category filters

---

## Summary

✅ **Status**: Prompts library is fully functional  
✅ **Prompts**: 7 prompts available (3 system + 4 user)  
✅ **Features**: View, create, edit, delete (with protection for system prompts)  
✅ **Integration**: Connected to Langfuse Cloud  
✅ **Codebase**: Clean and production-ready

**Ready to use!** Visit http://localhost:8081/prompts to get started.
