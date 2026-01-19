# Langfuse Integration Guide

## Quick Reference

### ✅ Correct Architecture

```
Frontend → Backend Proxy → Langfuse API
```

### ❌ Incorrect Architecture (Will Fail)

```
Frontend → Langfuse API (401 Unauthorized)
```

## Why Backend Proxy is Required

Langfuse API authentication requires:

```
Authorization: Basic base64(publicKey:secretKey)
```

- Frontend only has public key (secret key would be exposed in browser)
- Langfuse requires BOTH keys for authentication
- Solution: Backend proxy handles authentication with both keys

## Implementation

### Backend Proxy Endpoint

**File**: `src/app/api/prompts/route.ts`

```typescript
export async function GET(request: NextRequest) {
  const publicKey = process.env.LANGFUSE_PUBLIC_KEY
  const secretKey = process.env.LANGFUSE_SECRET_KEY

  // Create Basic Auth with BOTH keys
  const credentials = Buffer.from(`${publicKey}:${secretKey}`).toString('base64')

  const response = await fetch('https://cloud.langfuse.com/api/public/v2/prompts', {
    headers: { Authorization: `Basic ${credentials}` },
  })

  return NextResponse.json(await response.json())
}
```

### Frontend API Client

**File**: `frontend-vite/src/services/api/prompts.ts`

```typescript
// Use backend proxy, NOT Langfuse directly
const USE_LANGFUSE_DIRECT_FOR_READS = false

export const promptsApi = {
  async getPrompts() {
    // Call backend proxy
    const prompts = await apiFetch<Prompt[]>('/prompts')
    return { data: prompts, success: true }
  },
}
```

## Environment Variables

### Backend (.env.local)

```bash
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_SECRET_KEY=sk-lf-...  # Keep secure!
LANGFUSE_BASE_URL=https://cloud.langfuse.com
```

### Frontend (frontend-vite/.env.local)

```bash
VITE_API_BASE_URL=http://localhost:3001/api
# DO NOT add LANGFUSE_SECRET_KEY here!
```

## Testing

```bash
# Test backend proxy
curl http://localhost:3001/api/prompts | jq '. | length'

# Should return number of prompts (e.g., 7)
```

## Common Issues

### 401 Unauthorized Errors

- **Cause**: Missing secret key in authentication
- **Solution**: Ensure backend uses both keys, route through proxy

### Hundreds of Failed Requests

- **Cause**: Frontend calling Langfuse directly
- **Solution**: Set `USE_LANGFUSE_DIRECT_FOR_READS = false`

## Security Checklist

- [ ] Secret key only in backend environment
- [ ] Secret key never sent to frontend
- [ ] All Langfuse calls go through backend proxy
- [ ] Backend uses both public and secret keys
- [ ] Frontend calls backend, not Langfuse directly

## More Information

See `.kiro/steering/langfuse-integration.md` for complete architecture documentation.
