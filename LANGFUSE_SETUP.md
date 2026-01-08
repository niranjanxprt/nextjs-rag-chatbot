# Langfuse Integration Guide

**Last Updated:** 2025-01-08
**Version:** 1.0
**Status:** ✅ Implemented

---

## Overview

Langfuse is an open-source LLM observability platform that provides comprehensive monitoring and analytics for LLM applications. This guide covers the integration of Langfuse into the RAG Chatbot for tracking chat completions, monitoring token usage, and analyzing LLM performance.

**Project:** https://langfuse.io
**GitHub:** https://github.com/langfuse/langfuse

---

## What is Langfuse?

Langfuse provides:
- 📊 **Observability** - Track all LLM calls with detailed metrics
- 🔍 **Tracing** - Understand request/response flows
- 📈 **Analytics** - Analyze costs, latency, and performance
- 🎯 **Testing** - Compare model outputs and versions
- 🔐 **Privacy** - Self-hosted or cloud options

---

## Setup Instructions

### 1. Create Langfuse Account

**Cloud (Recommended for getting started):**
1. Go to https://cloud.langfuse.com
2. Sign up with email or GitHub
3. Create a new project
4. Copy your API keys

**Self-Hosted:**
```bash
# Run Langfuse locally with Docker
docker run -d -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:password@localhost:5432/langfuse" \
  langfuse/langfuse
```

### 2. Get Your API Keys

From Langfuse dashboard:
1. Go to Settings → API Keys
2. Create a new API key pair
3. Copy:
   - `Public Key` (used for client-side initialization)
   - `Secret Key` (used for server-side initialization)

### 3. Set Environment Variables

Add to `.env.local` or `.env`:

```bash
# Langfuse Configuration
LANGFUSE_PUBLIC_KEY=pk_prod_xxxxxxxxxxxxx
LANGFUSE_SECRET_KEY=sk_prod_xxxxxxxxxxxxx

# Optional: Custom Langfuse endpoint (for self-hosted)
LANGFUSE_BASE_URL=https://cloud.langfuse.com  # Default: https://cloud.langfuse.com
```

### 4. Install Dependencies

```bash
npm install langfuse
```

---

## Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `LANGFUSE_PUBLIC_KEY` | Langfuse public API key | `pk_prod_xxxxxxxxxxxxx` |
| `LANGFUSE_SECRET_KEY` | Langfuse secret API key | `sk_prod_xxxxxxxxxxxxx` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `LANGFUSE_BASE_URL` | Langfuse API endpoint | `https://cloud.langfuse.com` |
| `LANGFUSE_ENABLED` | Enable/disable Langfuse | Auto-detected from keys |

---

## Implementation Details

### Architecture

```
Chat Request
    ↓
Initialize Langfuse Client
    ↓
Create Trace (Session + User)
    ↓
Search Documents (Vector DB)
    ├→ Log Search Performance
    ├→ Log Context Preparation
    └→ Log RAG Metrics
    ↓
Call OpenAI with AI SDK
    ↓
Stream Response
    ↓
Log Generation Results
    ├→ Token Usage
    ├→ Latency
    ├→ Finish Reason
    └→ Error Handling
    ↓
Flush & Return Response
```

### Files Modified/Created

**Created:**
- `src/lib/services/langfuse.ts` - Core Langfuse integration module
- `src/app/api/monitoring/langfuse/route.ts` - Langfuse status endpoint
- `LANGFUSE_SETUP.md` - This documentation file

**Modified:**
- `src/app/api/chat/route.ts` - Added Langfuse tracing throughout

---

## API Integration

### Chat API with Langfuse Tracing

The chat API automatically traces:

1. **Vector Search Performance**
   - Query text
   - Results count
   - Latency (ms)
   - Relevance threshold
   - Top-K parameter

2. **RAG Context Preparation**
   - System prompt length
   - Context sources count
   - Source document metadata
   - Relevance scores

3. **OpenAI Completion**
   - Input messages
   - Output text
   - Token usage (input/output/total)
   - Model and parameters
   - Finish reason
   - Total latency

4. **Error Handling**
   - Error type and message
   - Contextual information
   - User and conversation IDs

### Monitoring Endpoint

**GET /api/monitoring/langfuse**

Returns Langfuse configuration and status:

```json
{
  "langfuse": {
    "enabled": true,
    "configured": true,
    "initialized": true,
    "baseUrl": "https://cloud.langfuse.com",
    "environment": "production"
  },
  "success": true
}
```

---

## Usage Examples

### Manual Trace Creation

```typescript
import { traceChatCompletion, logChatGeneration } from '@/lib/services/langfuse'

// Create trace
const trace = await traceChatCompletion({
  userId: user.id,
  conversationId: conversation.id,
  userMessage: 'What is AI?',
  systemPrompt: 'You are a helpful assistant...',
  contextSources: [{ filename: 'document.pdf', score: 0.95 }],
  model: 'gpt-4-turbo',
  temperature: 0.1,
  maxTokens: 1000,
  searchResults: 5,
  contextUsed: 3,
  searchTimeMs: 234,
})

// Log generation
await logChatGeneration({
  traceId: trace.id,
  model: 'gpt-4-turbo',
  messages: messages,
  output: 'AI stands for Artificial Intelligence...',
  usage: { inputTokens: 150, outputTokens: 50, totalTokens: 200 },
  temperature: 0.1,
  maxTokens: 1000,
  finishReason: 'stop',
  latencyMs: 1200,
})
```

### Error Logging

```typescript
import { logLangfuseError } from '@/lib/services/langfuse'

await logLangfuseError({
  userId: user.id,
  conversationId: conversation.id,
  error: new Error('Vector search failed'),
  context: { phase: 'document-search', query: 'user input' }
})
```

### Check Status

```typescript
import { getLangfuseStatus, isLangfuseEnabled } from '@/lib/services/langfuse'

const status = getLangfuseStatus()
console.log('Langfuse enabled:', status.enabled)
console.log('Langfuse configured:', status.configured)
console.log('Langfuse initialized:', status.initialized)

if (isLangfuseEnabled()) {
  // Langfuse is available
}
```

---

## Viewing Data in Langfuse

### Dashboard

1. Go to your Langfuse project dashboard
2. View **Traces** for individual requests
3. Check **Metrics** for analytics
4. Review **Costs** for token usage
5. Monitor **Performance** for latency trends

### Trace Details

Each trace includes:
- **User ID** - Which user made the request
- **Session ID** - Conversation context
- **Timestamps** - Request timing
- **Metadata** - Custom properties
- **Events** - Component-level events
- **Generations** - LLM completions
- **Tags** - For filtering and organization

### Sample Trace

```
Session: conversation-123
User: user-456
Duration: 1.2s

Events:
├── document-search (234ms)
├── rag-context-prepared (5ms)
└── openai-completion (961ms)

Tokens: 150 input + 50 output = 200 total
Cost: $0.002
```

---

## Monitoring & Analytics

### Key Metrics to Track

1. **Latency**
   - Search latency (document retrieval)
   - Generation latency (model response)
   - Total request latency

2. **Token Usage**
   - Input tokens (prompt + context)
   - Output tokens (response)
   - Cost per request

3. **Relevance**
   - Context source scores
   - Number of results used
   - Search precision

4. **Error Rate**
   - Failed searches
   - Generation errors
   - API timeouts

### Alerts & Notifications

Set up in Langfuse:
- High latency threshold alerts
- Error rate monitoring
- Cost anomaly detection
- Token usage spikes

---

## Performance Considerations

### Optimization Tips

1. **Batch Flushes** - Langfuse automatically batches data
   - Default flush interval: 10 seconds
   - Adjustable via `flushInterval` config

2. **Async Logging** - Never blocks request handling
   - Fire-and-forget for non-critical events
   - Errors logged asynchronously

3. **Token Estimation** - Uses local token counting
   - No additional API calls
   - Immediate feedback

4. **Data Retention**
   - Cloud: 90 days default (configurable)
   - Self-hosted: Your policy
   - Archives available for export

---

## Troubleshooting

### Langfuse Not Initializing

**Check:**
1. Environment variables are set correctly
2. Keys are not rotated (regenerate if needed)
3. Network connectivity to Langfuse endpoint
4. Console logs for initialization errors

```typescript
import { getLangfuseStatus } from '@/lib/services/langfuse'
const status = getLangfuseStatus()
console.log(status) // Check enabled, configured, initialized
```

### Data Not Appearing in Dashboard

**Check:**
1. Wait 1-2 minutes for data to appear
2. Verify flushLangfuse() is called
3. Check browser network tab for POST requests
4. Verify API keys are correct
5. Check Langfuse project access

### Performance Impact

**Measurement:**
- Langfuse overhead: <50ms per request
- Does not block response streaming
- Asynchronous data transmission

---

## Security & Privacy

### API Key Management

✅ **Do:**
- Store keys in environment variables
- Use different keys for dev/prod
- Rotate keys regularly
- Restrict key permissions in Langfuse

❌ **Don't:**
- Commit keys to git
- Share keys in logs
- Use same key for multiple projects
- Expose keys in client-side code

### Data Handled

Langfuse receives:
- User messages (prompt content)
- AI responses
- Token counts
- Latency metrics
- Error information

**Not sent:**
- API keys
- Passwords or credentials
- Database connection strings
- Internal server data

---

## Cost Estimation

### Langfuse Pricing

**Cloud (Langfuse Cloud):**
- Free: Up to 100K traces/month
- Pro: Pay-as-you-go ($0.001 per trace)
- Enterprise: Volume pricing

**Self-Hosted:**
- Free (open-source)
- Infrastructure costs only

### RAG Chatbot Cost

For typical usage (100 users, 10 messages/day):
- ~30K traces/month
- $30/month on Langfuse Pro
- Plus OpenAI API costs

---

## API Reference

### Core Functions

```typescript
// Initialize client
initializeLangfuse(): Langfuse | null

// Get client instance
getLangfuse(): Langfuse | null

// Create chat trace
traceChatCompletion(params): Promise<Trace | null>

// Log generation
logChatGeneration(params): Promise<void>

// Log error
logLangfuseError(params): Promise<void>

// Track vector search
trackVectorSearch(params): Promise<void>

// Flush data
flushLangfuse(): Promise<void>

// Check status
isLangfuseEnabled(): boolean
getLangfuseStatus(): Status
```

---

## Integration Checklist

- [x] Langfuse client initialization
- [x] Chat API integration
- [x] Search performance tracking
- [x] Token usage monitoring
- [x] Error logging
- [x] Status endpoint
- [x] Environment variables
- [x] Type definitions
- [x] Error handling
- [x] Documentation

---

## Next Steps

1. **Set up Langfuse account** - https://cloud.langfuse.com
2. **Get API keys** from Langfuse dashboard
3. **Add environment variables** to `.env.local`
4. **Restart development server**
5. **Make chat requests** to generate traces
6. **View traces** in Langfuse dashboard

---

## Resources

- **Langfuse Docs:** https://langfuse.com/docs
- **GitHub:** https://github.com/langfuse/langfuse
- **Community:** https://discord.gg/7NXusKK2d5
- **Issues:** https://github.com/langfuse/langfuse/issues

---

## Support

For issues or questions:

1. **Check Langfuse Docs** - Most questions answered there
2. **Review Logs** - Check browser console and server logs
3. **Verify Configuration** - Ensure env vars are correct
4. **Check Status Endpoint** - `GET /api/monitoring/langfuse`
5. **Open GitHub Issue** - If bug is suspected

---

**Langfuse Integration Complete!** 🚀

Your RAG Chatbot now has production-ready observability.
