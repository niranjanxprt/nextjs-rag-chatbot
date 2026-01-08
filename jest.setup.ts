import '@testing-library/jest-dom'

// Polyfill fetch for Node.js environment
import { TextEncoder, TextDecoder } from 'util'
global.TextEncoder = TextEncoder as any
global.TextDecoder = TextDecoder as any

// Polyfill ReadableStream for Node.js environment (needed for langchain)
import { ReadableStream } from 'web-streams-polyfill'
global.ReadableStream = ReadableStream as any

// Mock fetch for tests
global.fetch = jest.fn() as any
global.Request = jest.fn() as any
global.Response = jest.fn() as any

// Mock crypto for Supabase
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: (arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256)
      }
      return arr
    },
    subtle: {
      digest: jest.fn().mockResolvedValue(new ArrayBuffer(32)),
    },
  },
})

// Mock environment variables for tests
Object.defineProperty(process.env, 'NODE_ENV', {
  value: 'test',
  writable: true,
})
process.env.OPENAI_API_KEY = 'test-openai-key'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
process.env.QDRANT_URL = 'https://test.qdrant.io'
process.env.QDRANT_API_KEY = 'test-qdrant-key'
process.env.QDRANT_COLLECTION_NAME = 'test-collection'
process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io'
process.env.UPSTASH_REDIS_REST_TOKEN = 'test-redis-token'

// Suppress console warnings in tests
const originalWarn = console.warn
const originalError = console.error

beforeAll(() => {
  console.warn = jest.fn()
  console.error = jest.fn()
})

afterAll(() => {
  console.warn = originalWarn
  console.error = originalError
})

// Global test timeout
jest.setTimeout(30000)
