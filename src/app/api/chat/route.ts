/**
 * Chat API Route with OpenAI SDK
 *
 * Handles streaming chat responses with RAG context integration
 */

import { NextRequest } from 'next/server'
import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { createClient } from '@/lib/supabase/server'
import { searchDocuments } from '@/lib/services/vector-search'
import { createMessage, createConversation, getConversation } from '@/lib/database/queries'
import { chatRequestSchema } from '@/lib/schemas/validation'
import { fitContextToTokenLimit, estimateTokenCount } from '@/lib/utils/token-counter'
import {
  getConversationState,
  createConversationState,
  addMessageToConversation,
  type ConversationMessage,
} from '@/lib/services/conversation-state'
import {
  createErrorResponse,
  createError,
  handleSupabaseError,
  withErrorHandling,
  logError,
} from '@/lib/utils/error-handler'
import {
  initializeLangfuse,
  traceChatCompletion,
  logChatGeneration,
  logLangfuseError,
  flushLangfuse,
  isLangfuseEnabled,
} from '@/lib/services/langfuse'

// =============================================================================
// Configuration
// =============================================================================

const CHAT_CONFIG = {
  model: 'gpt-4-turbo',
  maxTokens: 1000,
  temperature: 0.1,
  maxContextChunks: 5,
  contextThreshold: 0.7,
  maxContextTokens: 3000, // Reserve tokens for context
  systemPromptReserve: 200, // Reserve tokens for system prompt
  conversationHistoryLimit: 10, // Max previous messages to include
  systemPromptTemplate: `You are a helpful AI assistant that answers questions based on the user's uploaded documents. 

IMPORTANT INSTRUCTIONS:
1. Always base your answers on the provided context from the user's documents
2. If the context doesn't contain relevant information, clearly state that you cannot find the information in the uploaded documents
3. When referencing information, mention which document it came from
4. Be concise but comprehensive in your responses
5. If asked about something not in the documents, politely redirect to document-based queries

CONTEXT FROM USER'S DOCUMENTS:
{context}

If no relevant context is provided above, inform the user that you need them to upload relevant documents to answer their question.`,
}

// =============================================================================
// Helper Functions
// =============================================================================

function buildSystemPrompt(context: string): string {
  return CHAT_CONFIG.systemPromptTemplate.replace('{context}', context)
}

function formatContextFromResults(results: any[]): string {
  if (results.length === 0) {
    return 'No relevant information found in your uploaded documents.'
  }

  return results
    .map(
      result =>
        `Document: ${result.filename}\n` +
        `Content: ${result.content}\n` +
        `Relevance Score: ${result.score.toFixed(3)}`
    )
    .join('\n\n---\n\n')
}

async function getOrCreateConversation(
  conversationId: string | undefined,
  userId: string
): Promise<string> {
  try {
    if (conversationId) {
      // Check if conversation exists in Redis state
      const conversationState = await getConversationState(conversationId)
      if (conversationState && conversationState.userId === userId) {
        return conversationId
      }

      // Fallback to database check
      const conversation = await getConversation(conversationId, userId)
      if (conversation) {
        // Create Redis state from database if it doesn't exist
        await createConversationState(conversationId, userId)
        return conversationId
      }
    }

    // Create new conversation
    const newConversation = await createConversation({
      user_id: userId,
      title: null, // Will be generated from first message
    })

    // Create Redis state for new conversation
    await createConversationState(newConversation.id, userId)

    return newConversation.id
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), {
      context: 'get_or_create_conversation',
      conversationId,
      userId,
    })
    throw createError.internal('Failed to get or create conversation')
  }
}

// =============================================================================
// Main Chat Handler
// =============================================================================

export const POST = withErrorHandling(async (request: NextRequest) => {
  let traceId: string | undefined
  let activeConversationId!: string
  const startTime = Date.now()

  try {
    // Initialize Langfuse for observability
    if (isLangfuseEnabled()) {
      initializeLangfuse()
    }

    // Check authentication
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      throw handleSupabaseError(authError)
    }

    if (!user) {
      throw createError.unauthorized('Authentication required')
    }

    // Parse and validate request
    let body
    try {
      body = await request.json()
    } catch (error) {
      throw createError.validation('Invalid JSON in request body')
    }

    const validatedRequest = chatRequestSchema.parse(body)
    const { messages, conversationId, temperature, maxTokens } = validatedRequest

    // Validate messages
    if (!messages || messages.length === 0) {
      throw createError.validation('Messages array cannot be empty')
    }

    // Get the latest user message
    const lastMessage = messages[messages.length - 1]
    if (lastMessage.role !== 'user') {
      throw createError.validation('Last message must be from user')
    }

    if (!lastMessage.content || lastMessage.content.trim().length === 0) {
      throw createError.validation('Message content cannot be empty')
    }

    // Get or create conversation
    activeConversationId = await getOrCreateConversation(conversationId, user.id)

    // Get conversation state for context
    const conversationState = await getConversationState(activeConversationId, {
      maxMessages: CHAT_CONFIG.conversationHistoryLimit,
      maxTokens: CHAT_CONFIG.maxContextTokens,
    })

    // Use conversation history from Redis state if available, otherwise use provided messages
    const conversationHistory = conversationState?.messages.slice(0, -1) || messages.slice(0, -1)

    // Search for relevant context
    console.log('Searching for relevant context...')
    const searchStartTime = Date.now()
    const searchResults = await searchDocuments(lastMessage.content, {
      userId: user.id,
      topK: CHAT_CONFIG.maxContextChunks,
      threshold: CHAT_CONFIG.contextThreshold,
      useCache: true,
      rerankResults: true,
    })
    const searchTimeMs = Date.now() - searchStartTime

    // Create Langfuse trace for this chat completion
    if (isLangfuseEnabled()) {
      const trace = await traceChatCompletion({
        userId: user.id,
        conversationId: activeConversationId,
        userMessage: lastMessage.content,
        systemPrompt: buildSystemPrompt(formatContextFromResults([])),
        contextSources: searchResults.results
          .slice(0, CHAT_CONFIG.maxContextChunks)
          .map(r => ({
            documentId: r.documentId,
            filename: r.filename,
            score: r.score,
          })),
        model: CHAT_CONFIG.model,
        temperature: temperature || CHAT_CONFIG.temperature,
        maxTokens: maxTokens || CHAT_CONFIG.maxTokens,
        searchResults: searchResults.results.length,
        contextUsed: 0, // Will be updated later
        searchTimeMs,
      })
      if (trace) {
        traceId = trace.id
      }
    }

    // Apply token limit management to context
    const fittedContext = fitContextToTokenLimit(
      searchResults.results,
      CHAT_CONFIG.maxContextTokens,
      CHAT_CONFIG.systemPromptReserve
    )

    // Format context for the system prompt
    const contextString = formatContextFromResults(fittedContext)
    const systemPrompt = buildSystemPrompt(contextString)

    // Calculate token usage for monitoring
    const systemPromptTokens = estimateTokenCount(systemPrompt)
    const conversationTokens = conversationHistory.reduce(
      (total, msg) => total + estimateTokenCount(msg.content),
      0
    )
    const userMessageTokens = estimateTokenCount(lastMessage.content)
    const totalInputTokens = systemPromptTokens + conversationTokens + userMessageTokens

    console.log(
      `Token usage - System: ${systemPromptTokens}, History: ${conversationTokens}, User: ${userMessageTokens}, Total: ${totalInputTokens}`
    )

    // Add user message to conversation state
    await addMessageToConversation(activeConversationId, {
      role: 'user',
      content: lastMessage.content,
      metadata: {
        searchResults: searchResults.results.length,
        contextUsed: fittedContext.length,
        tokenUsage: {
          input: totalInputTokens,
        },
      },
    })

    // Save user message to database as well
    await createMessage({
      conversation_id: activeConversationId,
      role: 'user',
      content: lastMessage.content,
      metadata: {
        searchResults: searchResults.results.length,
        contextUsed: fittedContext.length,
        searchTime: searchResults.searchTime,
        tokenUsage: {
          input: totalInputTokens,
        },
      },
    })

    // Prepare messages for AI (convert conversation state messages to AI format)
    const aiMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...conversationHistory.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      { role: 'user' as const, content: lastMessage.content },
    ]

    // Generate streaming response using AI SDK
    const result = await streamText({
      model: openai('gpt-4-turbo'),
      messages: aiMessages,
      temperature: temperature || CHAT_CONFIG.temperature,
      maxTokens: maxTokens || CHAT_CONFIG.maxTokens,
      onFinish: async ({ text, finishReason }) => {
        try {
          const responseTokens = estimateTokenCount(text)
          const latencyMs = Date.now() - startTime

          // Prepare source metadata
          const contextSources = fittedContext
            .filter(r => r.documentId)
            .map(r => ({
              documentId: r.documentId!,
              filename: r.filename,
              score: r.score,
            }))

          // Add to conversation state
          await addMessageToConversation(activeConversationId, {
            role: 'assistant',
            content: text,
            metadata: {
              contextSources,
              tokenUsage: {
                output: responseTokens,
                total: totalInputTokens + responseTokens,
              },
            },
          })

          // Save to database
          await createMessage({
            conversation_id: activeConversationId,
            role: 'assistant',
            content: text,
            metadata: {
              contextSources,
              tokenUsage: {
                output: responseTokens,
                total: totalInputTokens + responseTokens,
              },
            },
          })

          // Log to Langfuse
          if (isLangfuseEnabled() && traceId) {
            await logChatGeneration({
              traceId,
              model: CHAT_CONFIG.model,
              messages: aiMessages,
              output: text,
              usage: {
                inputTokens: totalInputTokens,
                outputTokens: responseTokens,
                totalTokens: totalInputTokens + responseTokens,
              },
              temperature: temperature || CHAT_CONFIG.temperature,
              maxTokens: maxTokens || CHAT_CONFIG.maxTokens,
              finishReason,
              latencyMs,
            })
          }
        } catch (error) {
          logError(error instanceof Error ? error : new Error(String(error)), {
            context: 'saving_assistant_message',
            conversationId: activeConversationId,
            userId: user.id,
          })

          // Log error to Langfuse
          if (isLangfuseEnabled()) {
            await logLangfuseError({
              traceId,
              userId: user.id,
              conversationId: activeConversationId,
              error: error instanceof Error ? error : new Error(String(error)),
              context: { phase: 'saving_assistant_message' },
            })
          }
        }
      },
    })

    // Convert to data stream response with custom headers
    return result.toDataStreamResponse({
      headers: {
        'X-Conversation-Id': activeConversationId,
        'X-Context-Results': searchResults.results.length.toString(),
        'X-Context-Used': fittedContext.length.toString(),
        'X-Search-Time': searchResults.searchTime.toString(),
        'X-Token-Usage': totalInputTokens.toString(),
        'X-Sources': JSON.stringify(
          fittedContext
            .filter(r => r.documentId)
            .map(r => ({
              documentId: r.documentId,
              filename: r.filename,
            score: r.score,
          }))
        ),
      },
    })
  } catch (error) {
    console.error('Chat API error:', error)

    // Log error to Langfuse with trace info
    if (isLangfuseEnabled()) {
      try {
        const supabase = await createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          await logLangfuseError({
            traceId,
            userId: user.id,
            conversationId: activeConversationId || 'unknown',
            error: error instanceof Error ? error : new Error(String(error)),
            context: { phase: 'chat-api' },
          })

          // Flush before returning error
          await flushLangfuse()
        }
      } catch (langfuseError) {
        console.error('Failed to log error to Langfuse:', langfuseError)
      }
    }

    return createErrorResponse(error instanceof Error ? error : new Error(String(error)))
  }
})
