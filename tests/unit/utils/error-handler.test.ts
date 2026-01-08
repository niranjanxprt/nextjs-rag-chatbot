import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import {
  ErrorCode,
  AppError,
  createAppError,
  handleApiError,
  handleClientError,
  isAppError,
  getErrorMessage,
  logError,
} from '@/lib/utils/error-handler'

// Mock Next.js
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({ data, options })),
  },
}))

// Mock console methods
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation()
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation()

describe('Error Handler Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterAll(() => {
    mockConsoleError.mockRestore()
    mockConsoleWarn.mockRestore()
  })

  describe('createAppError', () => {
    it('creates an AppError with required fields', () => {
      const error = createAppError(ErrorCode.NOT_FOUND, 'Resource not found')

      expect(error).toEqual({
        code: ErrorCode.NOT_FOUND,
        message: 'Resource not found',
        statusCode: 404,
        timestamp: expect.any(String),
      })
    })

    it('creates an AppError with optional fields', () => {
      const error = createAppError(
        ErrorCode.VALIDATION_ERROR,
        'Invalid input',
        { field: 'email' },
        'user-123'
      )

      expect(error).toEqual({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Invalid input',
        statusCode: 400,
        details: { field: 'email' },
        userId: 'user-123',
        timestamp: expect.any(String),
      })
    })

    it('maps error codes to correct status codes', () => {
      const testCases = [
        { code: ErrorCode.UNAUTHORIZED, expectedStatus: 401 },
        { code: ErrorCode.FORBIDDEN, expectedStatus: 403 },
        { code: ErrorCode.NOT_FOUND, expectedStatus: 404 },
        { code: ErrorCode.VALIDATION_ERROR, expectedStatus: 400 },
        { code: ErrorCode.RATE_LIMIT_EXCEEDED, expectedStatus: 429 },
        { code: ErrorCode.INTERNAL_SERVER_ERROR, expectedStatus: 500 },
      ]

      testCases.forEach(({ code, expectedStatus }) => {
        const error = createAppError(code, 'Test message')
        expect(error.statusCode).toBe(expectedStatus)
      })
    })
  })

  describe('isAppError', () => {
    it('returns true for valid AppError objects', () => {
      const error = createAppError(ErrorCode.NOT_FOUND, 'Not found')
      expect(isAppError(error)).toBe(true)
    })

    it('returns false for regular Error objects', () => {
      const error = new Error('Regular error')
      expect(isAppError(error)).toBe(false)
    })

    it('returns false for non-error objects', () => {
      expect(isAppError({})).toBe(false)
      expect(isAppError(null)).toBe(false)
      expect(isAppError(undefined)).toBe(false)
      expect(isAppError('string')).toBe(false)
    })
  })

  describe('getErrorMessage', () => {
    it('returns message from AppError', () => {
      const error = createAppError(ErrorCode.NOT_FOUND, 'Resource not found')
      expect(getErrorMessage(error)).toBe('Resource not found')
    })

    it('returns message from regular Error', () => {
      const error = new Error('Regular error message')
      expect(getErrorMessage(error)).toBe('Regular error message')
    })

    it('returns string representation for non-Error objects', () => {
      expect(getErrorMessage('string error')).toBe('string error')
      expect(getErrorMessage({ message: 'object error' })).toBe('[object Object]')
    })

    it('returns default message for null/undefined', () => {
      expect(getErrorMessage(null)).toBe('Unknown error')
      expect(getErrorMessage(undefined)).toBe('Unknown error')
    })
  })

  describe('handleApiError', () => {
    it('handles AppError correctly', () => {
      const error = createAppError(ErrorCode.NOT_FOUND, 'Resource not found', { id: '123' })
      const response = handleApiError(error)

      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          error: {
            code: ErrorCode.NOT_FOUND,
            message: 'Resource not found',
            details: { id: '123' },
            timestamp: expect.any(String),
          },
        },
        { status: 404 }
      )
    })

    it('handles ZodError correctly', () => {
      const zodError = new ZodError([
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'number',
          path: ['email'],
          message: 'Expected string, received number',
        },
      ])

      const response = handleApiError(zodError)

      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Validation failed',
            details: {
              issues: [
                {
                  path: ['email'],
                  message: 'Expected string, received number',
                },
              ],
            },
            timestamp: expect.any(String),
          },
        },
        { status: 400 }
      )
    })

    it('handles regular Error objects', () => {
      const error = new Error('Something went wrong')
      const response = handleApiError(error)

      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          error: {
            code: ErrorCode.INTERNAL_SERVER_ERROR,
            message: 'Something went wrong',
            timestamp: expect.any(String),
          },
        },
        { status: 500 }
      )
    })

    it('handles unknown error types', () => {
      const error = 'String error'
      const response = handleApiError(error)

      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          error: {
            code: ErrorCode.INTERNAL_SERVER_ERROR,
            message: 'String error',
            timestamp: expect.any(String),
          },
        },
        { status: 500 }
      )
    })

    it('logs errors appropriately', () => {
      const error = createAppError(ErrorCode.INTERNAL_SERVER_ERROR, 'Server error')
      handleApiError(error)

      expect(mockConsoleError).toHaveBeenCalledWith('API Error:', {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: 'Server error',
        statusCode: 500,
        timestamp: expect.any(String),
      })
    })
  })

  describe('handleClientError', () => {
    it('handles AppError on client side', () => {
      const error = createAppError(ErrorCode.NOT_FOUND, 'Resource not found')
      const result = handleClientError(error)

      expect(result).toEqual({
        code: ErrorCode.NOT_FOUND,
        message: 'Resource not found',
        statusCode: 404,
        timestamp: expect.any(String),
      })
    })

    it('handles regular Error on client side', () => {
      const error = new Error('Network error')
      const result = handleClientError(error)

      expect(result).toEqual({
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: 'Network error',
        statusCode: 500,
        timestamp: expect.any(String),
      })
    })

    it('handles fetch errors', () => {
      const fetchError = new Error('Failed to fetch')
      fetchError.name = 'TypeError'
      const result = handleClientError(fetchError)

      expect(result).toEqual({
        code: ErrorCode.EXTERNAL_SERVICE_ERROR,
        message: 'Network request failed',
        statusCode: 500,
        timestamp: expect.any(String),
      })
    })

    it('logs client errors appropriately', () => {
      const error = new Error('Client error')
      handleClientError(error)

      expect(mockConsoleError).toHaveBeenCalledWith('Client Error:', expect.any(Object))
    })
  })

  describe('logError', () => {
    it('logs AppError with full context', () => {
      const error = createAppError(
        ErrorCode.VALIDATION_ERROR,
        'Invalid input',
        { field: 'email' },
        'user-123'
      )

      logError(error, { requestId: 'req-456' })

      expect(mockConsoleError).toHaveBeenCalledWith('Error:', {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Invalid input',
        statusCode: 400,
        details: { field: 'email' },
        userId: 'user-123',
        timestamp: expect.any(String),
        context: { requestId: 'req-456' },
      })
    })

    it('logs regular Error objects', () => {
      const error = new Error('Regular error')
      logError(error)

      expect(mockConsoleError).toHaveBeenCalledWith('Error:', {
        message: 'Regular error',
        stack: expect.any(String),
      })
    })

    it('logs with additional context', () => {
      const error = new Error('Test error')
      const context = { userId: 'user-123', action: 'upload' }

      logError(error, context)

      expect(mockConsoleError).toHaveBeenCalledWith('Error:', {
        message: 'Test error',
        stack: expect.any(String),
        context,
      })
    })
  })

  describe('Error Code Mapping', () => {
    it('maps authentication errors correctly', () => {
      const authErrors = [
        ErrorCode.UNAUTHORIZED,
        ErrorCode.FORBIDDEN,
        ErrorCode.INVALID_TOKEN,
      ]

      authErrors.forEach((code) => {
        const error = createAppError(code, 'Auth error')
        expect([401, 403]).toContain(error.statusCode)
      })
    })

    it('maps validation errors correctly', () => {
      const validationErrors = [
        ErrorCode.VALIDATION_ERROR,
        ErrorCode.INVALID_INPUT,
        ErrorCode.MISSING_REQUIRED_FIELD,
      ]

      validationErrors.forEach((code) => {
        const error = createAppError(code, 'Validation error')
        expect(error.statusCode).toBe(400)
      })
    })

    it('maps resource errors correctly', () => {
      const resourceErrors = [
        { code: ErrorCode.NOT_FOUND, expectedStatus: 404 },
        { code: ErrorCode.ALREADY_EXISTS, expectedStatus: 409 },
        { code: ErrorCode.RESOURCE_LIMIT_EXCEEDED, expectedStatus: 413 },
      ]

      resourceErrors.forEach(({ code, expectedStatus }) => {
        const error = createAppError(code, 'Resource error')
        expect(error.statusCode).toBe(expectedStatus)
      })
    })

    it('maps system errors correctly', () => {
      const systemErrors = [
        ErrorCode.INTERNAL_SERVER_ERROR,
        ErrorCode.TIMEOUT_ERROR,
        ErrorCode.MEMORY_LIMIT_EXCEEDED,
      ]

      systemErrors.forEach((code) => {
        const error = createAppError(code, 'System error')
        expect(error.statusCode).toBe(500)
      })
    })
  })

  describe('Integration Scenarios', () => {
    it('handles complete error flow for API route', () => {
      // Simulate an API route error
      const originalError = new Error('Database connection failed')
      const appError = createAppError(
        ErrorCode.SUPABASE_ERROR,
        'Failed to connect to database',
        { originalError: originalError.message },
        'user-123'
      )

      const response = handleApiError(appError)

      expect(response).toBeDefined()
      expect(mockConsoleError).toHaveBeenCalled()
    })

    it('handles error chain with context preservation', () => {
      const originalError = new Error('Network timeout')
      const wrappedError = createAppError(
        ErrorCode.EXTERNAL_SERVICE_ERROR,
        'OpenAI API request failed',
        { originalError: originalError.message, timeout: 30000 },
        'user-456'
      )

      logError(wrappedError, { requestId: 'req-789', endpoint: '/api/chat' })

      expect(mockConsoleError).toHaveBeenCalledWith('Error:', expect.objectContaining({
        code: ErrorCode.EXTERNAL_SERVICE_ERROR,
        message: 'OpenAI API request failed',
        details: expect.objectContaining({
          originalError: 'Network timeout',
          timeout: 30000,
        }),
        userId: 'user-456',
        context: expect.objectContaining({
          requestId: 'req-789',
          endpoint: '/api/chat',
        }),
      }))
    })
  })
})
