# RAG System Testing Guide

## Quick Testing Checklist

Use this guide to verify your RAG system is working correctly.

## Prerequisites

1. ✅ Environment variables set in `.env.local`:
   ```bash
   OPENAI_API_KEY=sk-proj-...
   QDRANT_URL=https://...
   QDRANT_API_KEY=...
   NEXT_PUBLIC_CONVEX_URL=https://...
   ```

2. ✅ Development server running:
   ```bash
   npm run dev
   ```

3. ✅ Convex backend running:
   ```bash
   npx convex dev
   ```

## Test 1: Document Upload

### Test PDF Upload

```bash
# Create a test PDF or use an existing one
curl -X POST http://localhost:3000/api/documents/upload \
  -F "file=@test.pdf" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "document_id": "k1234567890",
    "status": "processing",
    "message": "File uploaded successfully. Processing in background."
  }
}
```

### Test TXT Upload

```bash
# Create a test text file
echo "This is a test document about machine learning." > test.txt

curl -X POST http://localhost:3000/api/documents/upload \
  -F "file=@test.txt"
```

### Verify Processing

Check Convex dashboard or query:
```typescript
// In Convex dashboard or via API
const doc = await ctx.db.get(documentId)
console.log(doc.status) // Should be "ready" after processing
console.log(doc.chunk_count) // Should show number of chunks
```

## Test 2: Semantic Search

### Direct Search Test

```bash
curl -X POST http://localhost:3000/api/search/semantic \
  -H "Content-Type: application/json" \
  -d '{
    "query": "machine learning",
    "user_id": "user-id-placeholder",
    "top_k": 5,
    "score_threshold": 0.7
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "results": [
    {
      "chunk_id": "...",
      "document_id": "...",
      "document_name": "test.txt",
      "content": "This is a test document about machine learning.",
      "score": 0.95,
      "position": 0
    }
  ],
  "count": 1
}
```

## Test 3: RAG Chat

### Create a Conversation

```bash
# First, create a conversation via Convex or your app
# Get the conversation_id
```

### Chat with RAG Enabled

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What does the document say about machine learning?",
    "conversationId": "YOUR_CONVERSATION_ID",
    "ragEnabled": true
  }'
```

**Expected Behavior:**
- Response streams back in real-time
- Response includes information from the document
- Sources are tracked in the database

### Chat with RAG Disabled

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello, how are you?",
    "conversationId": "YOUR_CONVERSATION_ID",
    "ragEnabled": false
  }'
```

**Expected Behavior:**
- Response streams back
- No document context used
- General AI response

## Test 4: Verify Data in Databases

### Check Convex

1. Open Convex dashboard
2. Check `documents` table:
   - Document should have status "ready"
   - chunk_count should be > 0

3. Check `chunks` table:
   - Should have entries for your document
   - Each chunk should have a qdrant_id

4. Check `messages` table:
   - Should have user and assistant messages
   - Assistant messages should have sources array

### Check Qdrant

```bash
# Using Qdrant API
curl -X GET "https://your-cluster.qdrant.io/collections/document_embeddings" \
  -H "api-key: YOUR_QDRANT_API_KEY"
```

**Expected Response:**
```json
{
  "result": {
    "status": "green",
    "vectors_count": 10,
    "points_count": 10
  }
}
```

## Test 5: Error Handling

### Test File Size Limit

```bash
# Create a file > 10MB
dd if=/dev/zero of=large.pdf bs=1M count=11

curl -X POST http://localhost:3000/api/documents/upload \
  -F "file=@large.pdf"
```

**Expected Response:**
```json
{
  "error": "Invalid File Size",
  "message": "File size must be between 1 byte and 10MB"
}
```

### Test Invalid File Type

```bash
curl -X POST http://localhost:3000/api/documents/upload \
  -F "file=@image.jpg"
```

**Expected Response:**
```json
{
  "error": "Invalid File Type",
  "message": "File type image/jpeg is not supported..."
}
```

### Test Missing Query

```bash
curl -X POST http://localhost:3000/api/search/semantic \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user-123"
  }'
```

**Expected Response:**
```json
{
  "error": "Query is required and must be a non-empty string"
}
```

## Test 6: Multi-Tenancy

### Upload as User A

```bash
# Upload document with user_id: "user-a"
curl -X POST http://localhost:3000/api/documents/upload \
  -F "file=@doc-a.pdf"
```

### Upload as User B

```bash
# Upload document with user_id: "user-b"
curl -X POST http://localhost:3000/api/documents/upload \
  -F "file=@doc-b.pdf"
```

### Search as User A

```bash
curl -X POST http://localhost:3000/api/search/semantic \
  -H "Content-Type: application/json" \
  -d '{
    "query": "test",
    "user_id": "user-a"
  }'
```

**Expected Behavior:**
- Should only return results from doc-a.pdf
- Should NOT return results from doc-b.pdf

## Test 7: Performance

### Measure Document Processing Time

```bash
time curl -X POST http://localhost:3000/api/documents/upload \
  -F "file=@large-doc.pdf"
```

**Target:** < 30 seconds for 10MB PDF

### Measure Search Latency

```bash
time curl -X POST http://localhost:3000/api/search/semantic \
  -H "Content-Type: application/json" \
  -d '{
    "query": "test query",
    "user_id": "user-123"
  }'
```

**Target:** < 500ms

### Measure Chat Response Time

```bash
time curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "test",
    "conversationId": "conv-123",
    "ragEnabled": true
  }'
```

**Target:** < 3 seconds to first token

## Test 8: Integration Test

### Complete Flow Test

```bash
#!/bin/bash

echo "1. Upload document..."
UPLOAD_RESPONSE=$(curl -s -X POST http://localhost:3000/api/documents/upload \
  -F "file=@test.pdf")
DOC_ID=$(echo $UPLOAD_RESPONSE | jq -r '.data.document_id')
echo "Document ID: $DOC_ID"

echo "2. Wait for processing..."
sleep 10

echo "3. Search for content..."
SEARCH_RESPONSE=$(curl -s -X POST http://localhost:3000/api/search/semantic \
  -H "Content-Type: application/json" \
  -d "{
    \"query\": \"test query\",
    \"user_id\": \"user-123\"
  }")
echo "Search results: $SEARCH_RESPONSE"

echo "4. Chat with RAG..."
CHAT_RESPONSE=$(curl -s -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"What does the document say?\",
    \"conversationId\": \"conv-123\",
    \"ragEnabled\": true
  }")
echo "Chat response: $CHAT_RESPONSE"

echo "✅ Integration test complete!"
```

## Troubleshooting

### Issue: Document stuck in "processing"

**Check:**
1. Console logs for errors
2. OpenAI API key validity
3. Qdrant connectivity
4. Network issues

**Debug:**
```bash
# Check document status
curl http://localhost:3000/api/documents/YOUR_DOC_ID

# Check Convex logs
# Open Convex dashboard → Logs

# Check Qdrant health
curl -X GET "https://your-cluster.qdrant.io/collections" \
  -H "api-key: YOUR_API_KEY"
```

### Issue: Search returns no results

**Check:**
1. Document status is "ready"
2. Chunks have qdrant_ids
3. user_id matches
4. score_threshold not too high

**Debug:**
```bash
# Lower threshold
curl -X POST http://localhost:3000/api/search/semantic \
  -H "Content-Type: application/json" \
  -d '{
    "query": "test",
    "user_id": "user-123",
    "score_threshold": 0.5
  }'
```

### Issue: Chat response fails

**Check:**
1. OpenAI API status
2. API key permissions
3. Conversation exists
4. Network connectivity

**Debug:**
```bash
# Test without RAG
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "test",
    "conversationId": "conv-123",
    "ragEnabled": false
  }'
```

## Success Criteria

✅ Documents upload successfully
✅ Processing completes within 30 seconds
✅ Chunks stored in Convex with qdrant_ids
✅ Vectors stored in Qdrant
✅ Semantic search returns relevant results
✅ Chat with RAG includes document context
✅ Source citations tracked correctly
✅ Multi-tenancy enforced (users isolated)
✅ Error handling works gracefully
✅ Performance meets targets

## Next Steps After Testing

1. ✅ Verify all tests pass
2. 🔧 Integrate real authentication
3. 📊 Add monitoring and logging
4. 🎨 Update frontend UI
5. 🚀 Deploy to production

## Support

If tests fail:
1. Check environment variables
2. Review console logs
3. Verify external services (OpenAI, Qdrant)
4. Check network connectivity
5. Review error messages

For detailed documentation, see:
- `docs/RAG_IMPLEMENTATION.md`
- `docs/RAG_IMPLEMENTATION_SUMMARY.md`
