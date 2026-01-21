/**
 * RAG Error Handler
 * 
 * Centralized error handling for RAG system with structured error types
 */

export class RAGError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number,
    public details?: unknown
  ) {
    super(message)
    this.name = 'RAGError'
  }
}

export const ErrorCodes = {
  // Validation
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_INPUT: 'INVALID_INPUT',
  
  // Processing
  TEXT_EXTRACTION_FAILED: 'TEXT_EXTRACTION_FAILED',
  EMBEDDING_FAILED: 'EMBEDDING_FAILED',
  VECTOR_STORE_FAILED: 'VECTOR_STORE_FAILED',
  CHUNKING_FAILED: 'CHUNKING_FAILED',
  
  // External Services
  OPENAI_API_ERROR: 'OPENAI_API_ERROR',
  QDRANT_ERROR: 'QDRANT_ERROR',
  CONVEX_ERROR: 'CONVEX_ERROR',
  
  // Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  
  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // Generic
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const

export function handleError(error: unknown): RAGError {
  if (error instanceof RAGError) {
    return error
  }
  
  // OpenAI errors
  if (error instanceof Error && (
    error.message.includes('OpenAI') || 
    error.message.includes('API key') ||
    error.message.includes('rate limit')
  )) {
    return new RAGError(
      'Failed to communicate with OpenAI API',
      ErrorCodes.OPENAI_API_ERROR,
      502,
      error
    )
  }
  
  // Qdrant errors
  if (error instanceof Error && error.message.includes('Qdrant')) {
    return new RAGError(
      'Failed to communicate with vector database',
      ErrorCodes.QDRANT_ERROR,
      502,
      error
    )
  }
  
  // Convex errors
  if (error instanceof Error && error.message.includes('Convex')) {
    return new RAGError(
      'Failed to communicate with database',
      ErrorCodes.CONVEX_ERROR,
      502,
      error
    )
  }
  
  // Generic error
  return new RAGError(
    error instanceof Error ? error.message : 'An unexpected error occurred',
    ErrorCodes.INTERNAL_ERROR,
    500,
    error
  )
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error | undefined
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      
      if (attempt < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, attempt)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  
  throw lastError || new Error('Max retries exceeded')
}
