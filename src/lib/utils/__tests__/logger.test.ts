/**
 * Logger Unit Tests
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals'
import { logger, withLogging, generateRequestId, createLogContext } from '../logger'

// Mock console methods
const mockConsole = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

describe('Logger', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Mock console methods
    global.console = mockConsole as any

    // Set test environment
    ;(process.env as any).NODE_ENV = 'test'
    process.env.ENABLE_TEST_LOGGING = 'true'
  })

  afterEach(() => {
    delete process.env.ENABLE_TEST_LOGGING
  })

  describe('Basic Logging', () => {
    it('should log debug messages', () => {
      logger.debug('Test debug message')

      expect(mockConsole.debug).toHaveBeenCalledWith(expect.stringContaining('Test debug message'))
    })

    it('should log info messages', () => {
      logger.info('Test info message')

      expect(mockConsole.info).toHaveBeenCalledWith(expect.stringContaining('Test info message'))
    })

    it('should log warn messages', () => {
      logger.warn('Test warn message')

      expect(mockConsole.warn).toHaveBeenCalledWith(expect.stringContaining('Test warn message'))
    })

    it('should log error messages', () => {
      logger.error('Test error message')

      expect(mockConsole.error).toHaveBeenCalledWith(expect.stringContaining('Test error message'))
    })
  })

  describe('Context Logging', () => {
    it('should include context in log messages', () => {
      const context = {
        userId: 'user-123',
        requestId: 'req-456',
        operation: 'test',
      }

      logger.info('Test with context', context)

      expect(mockConsole.info).toHaveBeenCalledWith(expect.stringContaining('Test with context'))
    })

    it('should handle metadata in context', () => {
      const context = {
        operation: 'test',
        metadata: { key: 'value', count: 42 },
      }

      logger.info('Test with metadata', context)

      expect(mockConsole.info).toHaveBeenCalledWith(expect.stringContaining('Test with metadata'))
    })
  })

  describe('Error Logging', () => {
    it('should log error objects', () => {
      const error = new Error('Test error')
      error.stack = 'Error stack trace'

      logger.error('Error occurred', undefined, error)

      expect(mockConsole.error).toHaveBeenCalledWith(expect.stringContaining('Error occurred'))
    })

    it('should handle errors in warn level', () => {
      const error = new Error('Warning error')

      logger.warn('Warning with error', undefined, error)

      expect(mockConsole.warn).toHaveBeenCalledWith(expect.stringContaining('Warning with error'))
    })
  })

  describe('Performance Timing', () => {
    it('should create timer and log completion', () => {
      const endTimer = logger.startTimer('test_operation')

      // Simulate some work
      setTimeout(() => {
        endTimer()
      }, 10)

      // Timer creation doesn't log immediately
      expect(mockConsole.info).not.toHaveBeenCalled()
    })

    it('should include context in timer', () => {
      const context = { userId: 'user-123' }
      const endTimer = logger.startTimer('test_operation', context)

      endTimer()

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('Operation completed: test_operation')
      )
    })
  })

  describe('Specialized Logging Methods', () => {
    it('should log API requests', () => {
      logger.logRequest('GET', '/api/test', { requestId: 'req-123' })

      expect(mockConsole.info).toHaveBeenCalledWith(expect.stringContaining('GET /api/test'))
    })

    it('should log API responses', () => {
      logger.logResponse('POST', '/api/test', 200, 150, { requestId: 'req-123' })

      expect(mockConsole.info).toHaveBeenCalledWith(expect.stringContaining('POST /api/test - 200'))
    })

    it('should log API responses as warnings for 4xx/5xx status', () => {
      logger.logResponse('GET', '/api/test', 404, 50)

      expect(mockConsole.warn).toHaveBeenCalledWith(expect.stringContaining('GET /api/test - 404'))
    })

    it('should log database operations', () => {
      logger.logDatabaseOperation('SELECT', 'users', { userId: 'user-123' })

      expect(mockConsole.debug).toHaveBeenCalledWith(
        expect.stringContaining('Database SELECT: users')
      )
    })

    it('should log authentication events', () => {
      logger.logAuth('login_success', { userId: 'user-123' })

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('Auth event: login_success')
      )
    })

    it('should log document processing', () => {
      logger.logDocumentProcessing('upload_complete', 'doc-123', { userId: 'user-123' })

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('Document processing: upload_complete')
      )
    })

    it('should log vector search', () => {
      logger.logVectorSearch('test query', 5, 150, { userId: 'user-123' })

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('Vector search completed')
      )
    })

    it('should log chat interactions', () => {
      logger.logChatInteraction(3, 500, { userId: 'user-123' })

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('Chat interaction completed')
      )
    })
  })

  describe('Test Environment Behavior', () => {
    it('should not log in test environment without flag', () => {
      delete process.env.ENABLE_TEST_LOGGING

      logger.info('Should not log')

      expect(mockConsole.info).not.toHaveBeenCalled()
    })

    it('should log in test environment with flag', () => {
      process.env.ENABLE_TEST_LOGGING = 'true'

      logger.info('Should log')

      expect(mockConsole.info).toHaveBeenCalled()
    })
  })
})

describe('withLogging Utility', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.console = mockConsole as any
    ;(process.env as any).NODE_ENV = 'test'
    process.env.ENABLE_TEST_LOGGING = 'true'
  })

  it('should wrap synchronous functions', () => {
    const testFn = jest.fn((x: number) => x * 2)
    const wrappedFn = withLogging(testFn, 'multiply')

    const result = wrappedFn(5)

    expect(result).toBe(10)
    expect(testFn).toHaveBeenCalledWith(5)
    expect(mockConsole.info).toHaveBeenCalledWith(
      expect.stringContaining('Operation completed: multiply')
    )
  })

  it('should wrap asynchronous functions', async () => {
    const testFn = jest.fn(async (x: number) => {
      await new Promise(resolve => setTimeout(resolve, 10))
      return x * 2
    })

    const wrappedFn = withLogging(testFn, 'async_multiply')

    const result = await wrappedFn(5)

    expect(result).toBe(10)
    expect(testFn).toHaveBeenCalledWith(5)
    expect(mockConsole.info).toHaveBeenCalledWith(
      expect.stringContaining('Operation completed: async_multiply')
    )
  })

  it('should handle synchronous errors', () => {
    const testFn = jest.fn(() => {
      throw new Error('Test error')
    })

    const wrappedFn = withLogging(testFn, 'error_function')

    expect(() => wrappedFn()).toThrow('Test error')
    expect(mockConsole.error).toHaveBeenCalledWith(
      expect.stringContaining('Operation failed: error_function')
    )
  })

  it('should handle asynchronous errors', async () => {
    const testFn = jest.fn(async () => {
      throw new Error('Async test error')
    })

    const wrappedFn = withLogging(testFn, 'async_error_function')

    await expect(wrappedFn()).rejects.toThrow('Async test error')
    expect(mockConsole.error).toHaveBeenCalledWith(
      expect.stringContaining('Operation failed: async_error_function')
    )
  })
})

describe('Utility Functions', () => {
  it('should generate unique request IDs', () => {
    const id1 = generateRequestId()
    const id2 = generateRequestId()

    expect(id1).toMatch(/^req_\d+_[a-z0-9]+$/)
    expect(id2).toMatch(/^req_\d+_[a-z0-9]+$/)
    expect(id1).not.toBe(id2)
  })

  it('should create log context', () => {
    const context = createLogContext('user-123', 'req-456', { key: 'value' })

    expect(context).toEqual({
      userId: 'user-123',
      requestId: 'req-456',
      metadata: { key: 'value' },
    })
  })

  it('should create log context with optional parameters', () => {
    const context = createLogContext()

    expect(context).toEqual({
      userId: undefined,
      requestId: undefined,
      metadata: undefined,
    })
  })
})
