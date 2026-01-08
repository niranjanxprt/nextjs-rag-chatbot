/**
 * Structured Logging Utility
 *
 * Centralized logging system with different log levels,
 * structured output, and performance monitoring
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogContext {
  userId?: string
  requestId?: string
  operation?: string
  duration?: number
  metadata?: Record<string, any>
}

export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: LogContext
  error?: {
    name: string
    message: string
    stack?: string
  }
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private isTest = process.env.NODE_ENV === 'test'

  private formatLog(entry: LogEntry): string {
    if (this.isDevelopment) {
      // Pretty format for development
      const timestamp = new Date(entry.timestamp).toLocaleTimeString()
      const level = entry.level.toUpperCase().padEnd(5)
      const context = entry.context ? ` [${JSON.stringify(entry.context)}]` : ''
      const error = entry.error
        ? `\n  Error: ${entry.error.message}\n  Stack: ${entry.error.stack}`
        : ''

      return `${timestamp} ${level} ${entry.message}${context}${error}`
    } else {
      // JSON format for production
      return JSON.stringify(entry)
    }
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    // Skip logging in test environment unless explicitly enabled
    if (this.isTest && !process.env.ENABLE_TEST_LOGGING) {
      return
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
    }

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      }
    }

    const formattedLog = this.formatLog(entry)

    switch (level) {
      case 'debug':
        console.debug(formattedLog)
        break
      case 'info':
        console.info(formattedLog)
        break
      case 'warn':
        console.warn(formattedLog)
        break
      case 'error':
        console.error(formattedLog)
        break
    }
  }

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context)
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context)
  }

  warn(message: string, context?: LogContext, error?: Error): void {
    this.log('warn', message, context, error)
  }

  error(message: string, context?: LogContext, error?: Error): void {
    this.log('error', message, context, error)
  }

  // Performance monitoring helpers
  startTimer(operation: string, context?: Omit<LogContext, 'duration'>): () => void {
    const startTime = Date.now()

    return () => {
      const duration = Date.now() - startTime
      this.info(`Operation completed: ${operation}`, {
        ...context,
        operation,
        duration,
      })
    }
  }

  // API request logging
  logRequest(method: string, path: string, context?: LogContext): void {
    this.info(`${method} ${path}`, {
      ...context,
      operation: 'api_request',
    })
  }

  logResponse(
    method: string,
    path: string,
    status: number,
    duration: number,
    context?: LogContext
  ): void {
    const level = status >= 400 ? 'warn' : 'info'
    this.log(level, `${method} ${path} - ${status}`, {
      ...context,
      operation: 'api_response',
      duration,
    })
  }

  // Database operation logging
  logDatabaseOperation(operation: string, table: string, context?: LogContext): void {
    this.debug(`Database ${operation}: ${table}`, {
      ...context,
      operation: 'database',
    })
  }

  // Authentication logging
  logAuth(event: string, context?: LogContext): void {
    this.info(`Auth event: ${event}`, {
      ...context,
      operation: 'auth',
    })
  }

  // Document processing logging
  logDocumentProcessing(event: string, documentId: string, context?: LogContext): void {
    this.info(`Document processing: ${event}`, {
      ...context,
      operation: 'document_processing',
      metadata: { documentId },
    })
  }

  // Vector search logging
  logVectorSearch(query: string, results: number, duration: number, context?: LogContext): void {
    this.info(`Vector search completed`, {
      ...context,
      operation: 'vector_search',
      duration,
      metadata: {
        queryLength: query.length,
        resultsCount: results,
      },
    })
  }

  // Chat logging
  logChatInteraction(messageCount: number, responseTime: number, context?: LogContext): void {
    this.info(`Chat interaction completed`, {
      ...context,
      operation: 'chat',
      duration: responseTime,
      metadata: { messageCount },
    })
  }
}

// Export singleton instance
export const logger = new Logger()

// Export utility functions for common patterns
export const withLogging = <T extends (...args: any[]) => any>(
  fn: T,
  operation: string,
  context?: Omit<LogContext, 'duration'>
): T => {
  return ((...args: Parameters<T>) => {
    const endTimer = logger.startTimer(operation, context)

    try {
      const result = fn(...args)

      // Handle async functions
      if (result instanceof Promise) {
        return result
          .then(value => {
            endTimer()
            return value
          })
          .catch(error => {
            logger.error(`Operation failed: ${operation}`, context, error)
            endTimer()
            throw error
          })
      }

      endTimer()
      return result
    } catch (error) {
      logger.error(`Operation failed: ${operation}`, context, error as Error)
      endTimer()
      throw error
    }
  }) as T
}

// Request ID generation for tracing
export const generateRequestId = (): string => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Context helpers
export const createLogContext = (
  userId?: string,
  requestId?: string,
  metadata?: Record<string, any>
): LogContext => ({
  userId,
  requestId,
  metadata,
})
