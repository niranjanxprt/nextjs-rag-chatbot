/**
 * Chat Engine Service
 * 
 * Orchestrates RAG pipeline and generates streaming responses
 */

import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { encoding_for_model } from 'tiktoken'
import { 
  ChatContext, 
  ChatOptions, 
  StreamingResponse, 
  Message, 
  SearchResult,
  SourceCitation 
} from '@/lib/types/rag'
import { embedQuery } from './embeddings'
import { search } from './vector-search'

// =============================================================================
// Constants
// =============================================================================

const CHAT_MODEL = 'gpt-4-turbo'
const DEFAULT_TEMPERATURE = 0.7
const DEFAULT_MAX_CONTEXT_TOKENS = 3000
const MAX_HISTORY_MESSAGES = 10

// =============================================================================
// Token Counting
// =============================================================================

let tokenEncoder: any = null

function getTokenEncoder() {
  if (!tokenEncoder) {
    tokenEncoder = encoding_for_model('gpt-4')
  }
  return tokenEncoder
}

/**
 * Count tokens in text using tiktoken
 * @param text - Text to count tokens for
 * @returns Number of tokens
 */
export function countTokens(text: string): number {
  try {
    const encoder = getTokenEncoder()
    const tokens = encoder.encode(text)
    return tokens.length
  } catch (error) {
    // Fallback: rough estimation (1 token ≈ 4 characters)
    return Math.ceil(text.length / 4)
  }
}

// =============================================================================
// Prompt Building
// =============================================================================

/**
 * Build system prompt with retrieved context
 * @param retrievedChunks - Relevant document chunks
 * @param conversationHistory - Recent messages
 * @returns Formatted system prompt
 */
export function buildPrompt(
  retrievedChunks: SearchResult[],
  conversationHistory: Message[]
): string {
  let prompt = `You are a helpful assistant with access to a knowledge base.
Use the following context to answer the user's question. If the context doesn't 
contain relevant information, say so clearly.

`

  // Add context if available
  if (retrievedChunks.length > 0) {
    prompt += `Context:\n`
    retrievedChunks.forEach((chunk, index) => {
      prompt += `[${index + 1}] ${chunk.content}\n\n`
    })
    
    prompt += `Sources:\n`
    retrievedChunks.forEach((chunk, index) => {
      prompt += `[${index + 1}] ${chunk.document_name} (similarity: ${chunk.score.toFixed(2)})\n`
    })
    
    prompt += `\nAlways cite sources using [1], [2], etc. when using information from the context.
If you cannot answer based on the context, clearly state that.\n\n`
  }

  return prompt
}

/**
 * Manage token budget for context
 * @param chunks - Retrieved chunks
 * @param maxTokens - Maximum tokens allowed for context
 * @returns Truncated chunks that fit within budget
 */
export function manageTokenBudget(
  chunks: SearchResult[],
  maxTokens: number = DEFAULT_MAX_CONTEXT_TOKENS
): SearchResult[] {
  if (chunks.length === 0) {
    return []
  }

  const result: SearchResult[] = []
  let totalTokens = 0

  for (const chunk of chunks) {
    const chunkTokens = countTokens(chunk.content)
    
    if (totalTokens + chunkTokens <= maxTokens) {
      result.push(chunk)
      totalTokens += chunkTokens
    } else {
      // Stop adding chunks if we exceed budget
      break
    }
  }

  return result
}

// =============================================================================
// RAG Pipeline
// =============================================================================

/**
 * Process a chat message with RAG pipeline
 * @param message - User message
 * @param context - Conversation and user context
 * @param options - RAG configuration
 * @param conversationHistory - Recent messages for context
 * @returns Streaming response with sources
 */
export async function processMessage(
  message: string,
  context: ChatContext,
  options: ChatOptions,
  conversationHistory: Message[] = []
): Promise<StreamingResponse> {
  try {
    let retrievedChunks: SearchResult[] = []
    let systemPrompt = ''

    // RAG pipeline if enabled
    if (options.ragEnabled) {
      try {
        // 1. Embed query
        const queryVector = await embedQuery(message)

        // 2. Search Qdrant
        const searchResults = await search(
          queryVector,
          {
            user_id: context.user_id,
            project_id: context.project_id,
          },
          {
            topK: 5,
            scoreThreshold: 0.7,
          }
        )

        // 3. Manage token budget
        retrievedChunks = manageTokenBudget(searchResults, options.maxContextTokens)

        // 4. Build prompt with context
        systemPrompt = buildPrompt(retrievedChunks, conversationHistory)
      } catch (error) {
        console.error('RAG pipeline error, falling back to non-RAG mode:', error)
        // Fall back to non-RAG mode
        systemPrompt = 'You are a helpful assistant.'
      }
    } else {
      // Non-RAG mode
      systemPrompt = 'You are a helpful assistant.'
    }

    // Prepare messages for the model
    const messages: any[] = [
      { role: 'system', content: systemPrompt },
    ]

    // Add conversation history (last N messages)
    const recentHistory = conversationHistory.slice(-MAX_HISTORY_MESSAGES)
    for (const msg of recentHistory) {
      messages.push({
        role: msg.role,
        content: msg.content,
      })
    }

    // Add current user message
    messages.push({
      role: 'user',
      content: message,
    })

    // Generate streaming response
    const result = await streamText({
      model: openai(CHAT_MODEL),
      messages,
      temperature: options.temperature || DEFAULT_TEMPERATURE,
    })

    // Extract sources for citation
    const sources: SourceCitation[] = retrievedChunks.map(chunk => ({
      id: chunk.chunk_id,
      document_name: chunk.document_name,
      snippet: chunk.content.substring(0, 200) + '...',
      score: chunk.score,
    }))

    return {
      stream: result.textStream,
      sources,
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Chat processing failed: ${error.message}`)
    }
    throw new Error('Chat processing failed: Unknown error')
  }
}

/**
 * Generate response without RAG (fallback mode)
 * @param message - User message
 * @param conversationHistory - Recent messages
 * @returns Streaming response
 */
export async function generateWithoutRAG(
  message: string,
  conversationHistory: Message[] = []
): Promise<StreamingResponse> {
  try {
    const messages: any[] = [
      { role: 'system', content: 'You are a helpful assistant.' },
    ]

    // Add conversation history
    const recentHistory = conversationHistory.slice(-MAX_HISTORY_MESSAGES)
    for (const msg of recentHistory) {
      messages.push({
        role: msg.role,
        content: msg.content,
      })
    }

    // Add current message
    messages.push({
      role: 'user',
      content: message,
    })

    // Generate streaming response
    const result = await streamText({
      model: openai(CHAT_MODEL),
      messages,
      temperature: DEFAULT_TEMPERATURE,
    })

    return {
      stream: result.textStream,
      sources: [],
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Response generation failed: ${error.message}`)
    }
    throw new Error('Response generation failed: Unknown error')
  }
}

// =============================================================================
// Exports
// =============================================================================

export const ChatEngine = {
  processMessage,
  generateWithoutRAG,
  buildPrompt,
  manageTokenBudget,
  countTokens,
}
