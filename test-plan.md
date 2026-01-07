# RAG Chatbot Testing Plan - Stuck Instance Resolution

## Critical Issues Identified
1. **Stream timeout protection missing** in chat API
2. **Memory cache unbounded growth** causing memory leaks
3. **Blocking operations** in vector search reranking
4. **Connection pool exhaustion** in Qdrant client
5. **Unhandled promise rejections** in multiple services

## Testing Strategy

### Phase 1: Quick Fixes (Immediate)
- [ ] Add stream timeout protection
- [ ] Implement memory cache limits
- [ ] Add resource cleanup
- [ ] Fix promise rejection handling

### Phase 2: Load Testing
- [ ] Test chat API under concurrent requests
- [ ] Test document upload with large files
- [ ] Test search performance with high query volume
- [ ] Monitor memory usage patterns

### Phase 3: Integration Testing
- [ ] Test complete RAG workflow end-to-end
- [ ] Verify error handling in failure scenarios
- [ ] Test service recovery after failures

## Test Execution Order
1. Apply critical fixes
2. Run unit tests
3. Run integration tests
4. Perform load testing
5. Monitor for stuck instances
