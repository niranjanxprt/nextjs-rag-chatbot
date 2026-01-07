# Local Testing Suite

Comprehensive testing script that validates the entire Next.js RAG chatbot application before Vercel deployment.

## Usage

```bash
# Run the comprehensive test suite
node scripts/test-local.js

# Or use npm script (if added to package.json)
npm run test:local:comprehensive
```

## Test Phases

### Phase 1: Environment & Dependencies
- ✅ Validates all required environment variables
- ✅ Tests external service connections (Supabase, OpenAI, Qdrant, Redis)
- ✅ Checks project dependencies

### Phase 2: Build & Code Quality
- ✅ TypeScript type checking
- ✅ ESLint code quality checks
- ✅ Unit tests execution
- ✅ Integration tests (if available)
- ✅ Next.js production build
- ✅ Build output validation
- ✅ Bundle size analysis
- ✅ Security audit

### Phase 3: API Endpoints
- ✅ Health check endpoints
- ✅ Monitoring endpoints
- ✅ Document management APIs
- ✅ Search functionality
- ✅ Chat endpoints
- ✅ Error handling validation
- ✅ Rate limiting tests
- ✅ CORS configuration

### Phase 4: Feature Integration
- ✅ Database schema validation
- ✅ Document processing pipeline
- ✅ Embedding generation
- ✅ Vector search functionality
- ✅ RAG pipeline integration
- ✅ Authentication flow
- ✅ Caching system
- ✅ Error handling & recovery
- ✅ Performance benchmarks
- ✅ End-to-end workflow tests

## Test Modules

The testing suite is modular and consists of:

- `env-validator.js` - Environment and service connection validation
- `build-tester.js` - Build process and code quality testing
- `api-tester.js` - API endpoint functionality testing
- `feature-tester.js` - Core feature integration testing

## Output

The script generates:
- Real-time console output with color-coded results
- Detailed test report saved to `test-report.json`
- Exit code 0 for success, 1 for failure

## Requirements

- Node.js 18+
- All project dependencies installed (`npm install`)
- Environment variables configured in `.env.local`
- External services (Supabase, OpenAI, etc.) accessible

## Error Handling

The script includes comprehensive error handling:
- Graceful cleanup of test resources
- Proper server shutdown
- Detailed error reporting
- Non-blocking optional tests

## Integration with CI/CD

This script can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions step
- name: Run comprehensive tests
  run: node scripts/test-local.js
```

## Troubleshooting

Common issues and solutions:

1. **Environment variables missing**: Copy `.env.example` to `.env.local` and fill in values
2. **Service connection failures**: Check API keys and service availability
3. **Build failures**: Run `npm run type-check` and `npm run lint` individually
4. **Port conflicts**: Ensure port 3000 is available for testing

## Performance Benchmarks

The script includes performance validation:
- Bundle size analysis (warns if chunks > 500KB)
- Build time monitoring
- API response time validation
- Memory usage checks (where applicable)