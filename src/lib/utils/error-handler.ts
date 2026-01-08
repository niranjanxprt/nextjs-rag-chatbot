/**
 * Error Handler Utilities
 *
 * Centralized error handling for API routes and client-side errors
 */

import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

// =============================================================================
// Error Types
// =============================================================================

export enum ErrorCode {
  // Authentication errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_TOKEN = 'INVALID_TOKEN',

  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',

  // Resource errors
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  RESOURCE_LIMIT_EXCEEDED = 'RESOURCE_LIMIT_EXCEEDED',

  // External service errors
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  OPENAI_ERROR = 'OPENAI_ERROR',
  SUPABASE_ERROR = 'SUPABASE_ERROR',
  QDRANT_ERROR = 'QDRANT_ERROR',
  REDIS_ERROR = 'REDIS_ERROR',

  // Processing errors
  DOCUMENT_PROCESSING_ERROR = 'DOCUMENT_PROCESSING_ERROR',
  EMBEDDING_GENERATION_ERROR = 'EMBEDDING_GENERATION_ERROR',
  VECTOR_SEARCH_ERROR = 'VECTOR_SEARCH_ERROR',

  // System errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  MEMORY_LIMIT_EXCEEDED = 'MEMORY_LIMIT_EXCEEDED',
}

export interface AppError {
  code: ErrorCode
  message: string
  details?: any
  statusCode: number
  timestamp: string
  requestId?: string
  userId?: string
}

export interface ErrorResponse {
  error: {
    code: string
    message: string
    details?: any
    timestamp: string
    requestId?: string
  }
}

// =============================================================================
// Custom Error Classes
// =============================================================================

export class AppErrorClass extends Error {
  public readonly code: ErrorCode
  public readonly statusCode: number
  public readonly details?: any
  public readonly timestamp: string
  public readonly requestId?: string
  public readonly userId?: string

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number = 500,
    details?: any,
    requestId?: string,
    userId?: string
  ) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.statusCode = statusCode
    this.details = details
    this.timestamp = new Date().toISOString()
    this.requestId = requestId
    this.userId = userId

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppErrorClass)
    }
  }

  toJSON(): AppError {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
      requestId: this.requestId,
      userId: this.userId,
    }
  }
}

// =============================================================================
// Error Factory Functions
// =============================================================================

export const createError = {
  unauthorized: (message = 'Unauthorized access', details?: any) =>
    new AppErrorClass(ErrorCode.UNAUTHORIZED, message, 401, details),

  forbidden: (message = 'Access forbidden', details?: any) =>
    new AppErrorClass(ErrorCode.FORBIDDEN, message, 403, details),

  notFound: (resource = 'Resource', details?: any) =>
    new AppErrorClass(ErrorCode.NOT_FOUND, `${resource} not found`, 404, details),

  validation: (message = 'Validation failed', details?: any) =>
    new AppErrorClass(ErrorCode.VALIDATION_ERROR, message, 400, details),

  alreadyExists: (resource = 'Resource', details?: any) =>
    new AppErrorClass(ErrorCode.ALREADY_EXISTS, `${resource} already exists`, 409, details),

  rateLimitExceeded: (message = 'Rate limit exceeded', details?: any) =>
    new AppErrorClass(ErrorCode.RATE_LIMIT_EXCEEDED, message, 429, details),

  externalService: (service: string, message?: string, details?: any) =>
    new AppErrorClass(
      ErrorCode.EXTERNAL_SERVICE_ERROR,
      message || `${service} service error`,
      502,
      details
    ),

  internal: (message = 'Internal server error', details?: any) =>
    new AppErrorClass(ErrorCode.INTERNAL_SERVER_ERROR, message, 500, details),

  timeout: (message = 'Request timeout', details?: any) =>
    new AppErrorClass(ErrorCode.TIMEOUT_ERROR, message, 408, details),

  documentProcessing: (message = 'Document processing failed', details?: any) =>
    new AppErrorClass(ErrorCode.DOCUMENT_PROCESSING_ERROR, message, 422, details),

  embeddingGeneration: (message = 'Embedding generation failed', details?: any) =>
    new AppErrorClass(ErrorCode.EMBEDDING_GENERATION_ERROR, message, 422, details),

  vectorSearch: (message = 'Vector search failed', details?: any) =>
    new AppErrorClass(ErrorCode.VECTOR_SEARCH_ERROR, message, 422, details),
}

// =============================================================================
// Error Handler Functions
// =============================================================================

export function handleZodError(error: ZodError): AppErrorClass {
  const details = error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code,
  }))

  return createError.validation('Invalid request data', details)
}

export function handleSupabaseError(error: any): AppErrorClass {
  console.error('Supabase error:', error)

  // Map common Supabase error codes
  if (error.code === 'PGRST116') {
    return createError.notFound('Resource')
  }

  if (error.code === '23505') {
    return createError.alreadyExists('Resource')
  }

  if (error.code === '42501') {
    return createError.forbidden('Insufficient permissions')
  }

  return createError.externalService('Supabase', error.message, {
    code: error.code,
    details: error.details,
    hint: error.hint,
  })
}

export function handleOpenAIError(error: any): AppErrorClass {
  console.error('OpenAI error:', error)

  if (error.status === 401) {
    return createError.externalService('OpenAI', 'Invalid API key')
  }

  if (error.status === 429) {
    return createError.rateLimitExceeded('OpenAI rate limit exceeded')
  }

  if (error.status === 400) {
    return createError.validation('Invalid OpenAI request', error.message)
  }

  return createError.externalService('OpenAI', error.message, {
    status: error.status,
    type: error.type,
  })
}

export function handleQdrantError(error: any): AppErrorClass {
  console.error('Qdrant error:', error)

  if (error.status === 404) {
    return createError.notFound('Vector collection or point')
  }

  if (error.status === 400) {
    return createError.validation('Invalid Qdrant request', error.message)
  }

  return createError.externalService('Qdrant', error.message, {
    status: error.status,
  })
}

export function handleRedisError(error: any): AppErrorClass {
  console.error('Redis error:', error)

  return createError.externalService('Redis', error.message, {
    code: error.code,
  })
}

// =============================================================================
// API Response Helpers
// =============================================================================

export function createErrorResponse(error: AppErrorClass | Error): NextResponse<ErrorResponse> {
  let appError: AppErrorClass

  if (error instanceof AppErrorClass) {
    appError = error
  } else if (error instanceof ZodError) {
    appError = handleZodError(error)
  } else {
    // Generic error
    appError = createError.internal(error.message)
  }

  // Log error for monitoring
  console.error('API Error:', {
    code: appError.code,
    message: appError.message,
    statusCode: appError.statusCode,
    details: appError.details,
    stack: appError.stack,
    timestamp: appError.timestamp,
  })

  const response: ErrorResponse = {
    error: {
      code: appError.code,
      message: appError.message,
      timestamp: appError.timestamp,
      requestId: appError.requestId,
    },
  }

  // Include details in development
  if (process.env.NODE_ENV === 'development' && appError.details) {
    response.error.details = appError.details
  }

  return NextResponse.json(response, { status: appError.statusCode })
}

export function createSuccessResponse<T>(data: T, status: number = 200): NextResponse<T> {
  return NextResponse.json(data, { status })
}

// =============================================================================
// Client-Side Error Handling
// =============================================================================

export interface ClientError {
  code: string
  message: string
  details?: any
  timestamp: string
}

export function parseApiError(response: any): ClientError {
  if (response?.error) {
    return {
      code: response.error.code || 'UNKNOWN_ERROR',
      message: response.error.message || 'An unknown error occurred',
      details: response.error.details,
      timestamp: response.error.timestamp || new Date().toISOString(),
    }
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: 'An unknown error occurred',
    timestamp: new Date().toISOString(),
  }
}

export function getErrorMessage(error: any): string {
  if (error instanceof AppErrorClass) {
    return error.message
  }

  if (error?.error?.message) {
    return error.error.message
  }

  if (error?.message) {
    return error.message
  }

  return 'An unexpected error occurred'
}

export function isRetryableError(error: any): boolean {
  if (error instanceof AppErrorClass) {
    return [
      ErrorCode.TIMEOUT_ERROR,
      ErrorCode.RATE_LIMIT_EXCEEDED,
      ErrorCode.EXTERNAL_SERVICE_ERROR,
      ErrorCode.INTERNAL_SERVER_ERROR,
    ].includes(error.code)
  }

  return false
}

// =============================================================================
// Error Logging and Monitoring
// =============================================================================

export function logError(error: Error | AppErrorClass, context?: any) {
  const errorLog = {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    context,
    ...(error instanceof AppErrorClass && {
      code: error.code,
      statusCode: error.statusCode,
      details: error.details,
      requestId: error.requestId,
      userId: error.userId,
    }),
  }

  console.error('Error Log:', errorLog)

  // In production, send to monitoring service
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to error monitoring service (e.g., Sentry, DataDog)
    // sendToMonitoringService(errorLog)
  }
}

// =============================================================================
// Async Error Handler Wrapper
// =============================================================================

export function withErrorHandling<T extends any[], R>(fn: (...args: T) => Promise<R>) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args)
    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }
}
