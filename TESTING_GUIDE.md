# 🧪 RAG Chatbot Testing Guide

## 🚀 Quick Start Testing

Your RAG Chatbot is now running at: **http://localhost:3000**

## 📋 Testing Checklist

### ✅ Phase 1: Basic Functionality
- [ ] **Health Check**: API endpoints responding
- [ ] **UI Loading**: Landing page displays correctly
- [ ] **Authentication**: Magic link login works
- [ ] **Navigation**: All pages accessible

### ✅ Phase 2: Core Features
- [ ] **Document Upload**: PDF/TXT file processing
- [ ] **Vector Embeddings**: Document indexing with OpenAI
- [ ] **Vector Storage**: Qdrant database integration
- [ ] **Chat Interface**: AI conversation functionality

### ✅ Phase 3: Advanced Features
- [ ] **Semantic Search**: Context-aware document retrieval
- [ ] **RAG Pipeline**: AI responses using document context
- [ ] **Streaming**: Real-time response streaming
- [ ] **Caching**: Redis performance optimization

## 🔧 Test Scenarios

### 1. Health Check Test
```bash
curl http://localhost:3000/api/health
```
**Expected**: JSON response with service status

### 2. Authentication Flow
1. Go to http://localhost:3000
2. Click "Sign In"
3. Enter your email address
4. Check email for magic link
5. Click magic link to authenticate

### 3. Document Upload Test
1. After login, go to Documents page
2. Upload a PDF or TXT file (max 10MB)
3. Wait for processing completion
4. Verify document appears in list

### 4. Chat Functionality Test
1. Go to Chat page
2. Ask a question about your uploaded document
3. Verify AI responds with relevant context
4. Test follow-up questions

### 5. Search Feature Test
1. Go to Search page
2. Enter keywords related to your document
3. Verify semantic search results
4. Test different search terms

## 🧪 Automated Testing

Let me run some automated tests for you: