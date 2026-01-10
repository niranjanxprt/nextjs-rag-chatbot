/**
 * Langfuse Integration Module
 *
 * Provides observability and monitoring for LLM calls using Langfuse
 */

import { Langfuse } from 'langfuse'

// Define our own ChatMessage type since it's not exported from langfuse
interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

// =============================================================================
// Configuration
// =============================================================================

const LANGFUSE_ENABLED = !!process.env.LANGFUSE_PUBLIC_KEY && !!process.env.LANGFUSE_SECRET_KEY

let langfuseClient: Langfuse | null = null

/**
 * Initialize Langfuse client
 */
export function initializeLangfuse(): Langfuse | null {
  if (!LANGFUSE_ENABLED) {
    console.warn('Langfuse is not configured. Set LANGFUSE_PUBLIC_KEY and LANGFUSE_SECRET_KEY environment variables.')
    return null
  }

  if (langfuseClient) {
    return langfuseClient
  }

  try {
    langfuseClient = new Langfuse({
      publicKey: process.env.LANGFUSE_PUBLIC_KEY!,
      secretKey: process.env.LANGFUSE_SECRET_KEY!,
      baseUrl: process.env.LANGFUSE_BASE_URL || 'https://cloud.langfuse.com',
      enabled: true,
      flushInterval: 10000, // Flush every 10 seconds
    })

    console.log('Langfuse initialized successfully')
    return langfuseClient
  } catch (error) {
    console.error('Failed to initialize Langfuse:', error)
    return null
  }
}

/**
 * Get Langfuse client instance
 */
export function getLangfuse(): Langfuse | null {
  if (!langfuseClient && LANGFUSE_ENABLED) {
    return initializeLangfuse()
  }
  return langfuseClient
}

/**
 * Create a trace for a chat completion
 */
export async function traceChatCompletion(params: {
  userId: string
  conversationId: string
  userMessage: string
  systemPrompt: string
  contextSources: Array<{
    documentId?: string
    filename: string
    score: number
  }>
  model: string
  temperature: number
  maxTokens: number
  searchResults: number
  contextUsed: number
  searchTimeMs: number
}) {
  const client = getLangfuse()
  if (!client) {
    return null
  }

  try {
    const trace = client.trace({
      userId: params.userId,
      sessionId: params.conversationId,
      name: 'chat-completion',
      metadata: {
        conversationId: params.conversationId,
        model: params.model,
        temperature: params.temperature,
        maxTokens: params.maxTokens,
      },
      tags: ['chat', 'rag'],
    })

    // Log input generation (search step)
    trace.generation({
      name: 'document-search',
      input: {
        query: params.userMessage,
        topK: params.contextSources.length,
      },
      output: {
        results: params.searchResults,
        used: params.contextUsed,
      },
      metadata: {
        searchTimeMs: params.searchTimeMs,
        threshold: 0.7,
      },
      startTime: new Date(Date.now() - params.searchTimeMs),
      endTime: new Date(),
    })

    // Log RAG context preparation
    trace.event({
      name: 'rag-context-prepared',
      metadata: {
        systemPromptLength: params.systemPrompt.length,
        contextSourcesCount: params.contextSources.length,
        contextSources: params.contextSources.map(s => ({
          filename: s.filename,
          score: s.score,
        })),
      },
    })

    return trace
  } catch (error) {
    console.error('Failed to create Langfuse trace:', error)
    return null
  }
}

/**
 * Log chat generation to Langfuse
 */
export async function logChatGeneration(params: {
  traceId?: string
  model: string
  messages: ChatMessage[]
  output: string
  usage: {
    inputTokens: number
    outputTokens: number
    totalTokens: number
  }
  temperature: number
  maxTokens: number
  finishReason?: string
  latencyMs?: number
}) {
  const client = getLangfuse()
  if (!client || !params.traceId) {
    return
  }

  try {
    // Create a new trace for the generation since traceWithId might not be available
    const trace = client.trace({
      id: params.traceId,
      name: 'openai-completion',
      metadata: {
        model: params.model,
        temperature: params.temperature,
        maxTokens: params.maxTokens,
        finishReason: params.finishReason,
        latencyMs: params.latencyMs,
      },
    })

    trace.generation({
      name: 'openai-completion',
      input: {
        messages: params.messages.map(m => ({
          role: m.role,
          content: m.content.substring(0, 500), // Truncate long messages
        })),
        model: params.model,
        temperature: params.temperature,
        maxTokens: params.maxTokens,
      },
      output: params.output.substring(0, 1000), // Truncate long outputs
      usage: {
        input: params.usage.inputTokens,
        output: params.usage.outputTokens,
        total: params.usage.totalTokens,
      },
    })
  } catch (error) {
    console.error('Failed to log chat generation to Langfuse:', error)
  }
}

/**
 * Log error to Langfuse
 */
export async function logLangfuseError(params: {
  traceId?: string
  userId: string
  conversationId: string
  error: Error | string
  context?: Record<string, any>
}) {
  const client = getLangfuse()
  if (!client) {
    return
  }

  try {
    if (params.traceId) {
      // Create a new trace for the error since traceWithId might not be available
      const trace = client.trace({
        id: params.traceId,
        userId: params.userId,
        sessionId: params.conversationId,
        name: 'chat-error',
        tags: ['error'],
        metadata: {
          error: params.error instanceof Error ? params.error.message : String(params.error),
          ...params.context,
        },
      })
      
      trace.event({
        name: 'chat-error',
        level: 'ERROR',
        metadata: {
          errorMessage: params.error instanceof Error ? params.error.message : String(params.error),
          ...params.context,
        },
      })
    } else {
      // Create a new trace for the error
      client.trace({
        userId: params.userId,
        sessionId: params.conversationId,
        name: 'chat-error',
        tags: ['error'],
        metadata: {
          error: params.error instanceof Error ? params.error.message : String(params.error),
          ...params.context,
        },
      })
    }
  } catch (error) {
    console.error('Failed to log error to Langfuse:', error)
  }
}

/**
 * Track vector search performance
 */
export async function trackVectorSearch(params: {
  traceId?: string
  query: string
  results: number
  latencyMs: number
  threshold: number
  topK: number
}) {
  const client = getLangfuse()
  if (!client) {
    return
  }

  try {
    if (params.traceId) {
      // Create a new trace for the search since traceWithId might not be available
      const trace = client.trace({
        id: params.traceId,
        name: 'vector-search',
        metadata: {
          queryLength: params.query.length,
          resultsCount: params.results,
          latencyMs: params.latencyMs,
          threshold: params.threshold,
          topK: params.topK,
        },
      })
      
      trace.event({
        name: 'vector-search',
        metadata: {
          queryLength: params.query.length,
          resultsCount: params.results,
          latencyMs: params.latencyMs,
          threshold: params.threshold,
          topK: params.topK,
        },
      })
    }
  } catch (error) {
    console.error('Failed to track vector search in Langfuse:', error)
  }
}

/**
 * Flush pending data to Langfuse
 */
export async function flushLangfuse() {
  const client = getLangfuse()
  if (!client) {
    return
  }

  try {
    await client.flush()
  } catch (error) {
    console.error('Failed to flush Langfuse data:', error)
  }
}

/**
 * Check if Langfuse is configured
 */
export function isLangfuseEnabled(): boolean {
  return LANGFUSE_ENABLED
}

/**
 * Get Langfuse status
 */
export function getLangfuseStatus(): {
  enabled: boolean
  configured: boolean
  initialized: boolean
} {
  return {
    enabled: LANGFUSE_ENABLED,
    configured: !!process.env.LANGFUSE_PUBLIC_KEY && !!process.env.LANGFUSE_SECRET_KEY,
    initialized: langfuseClient !== null,
  }
}
