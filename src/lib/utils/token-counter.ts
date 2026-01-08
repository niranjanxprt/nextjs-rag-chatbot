/**
 * Token Counter Utility
 *
 * Estimates token counts for text to manage context windows
 */

// Simple token estimation (rough approximation)
// In production, you might want to use tiktoken for accurate counting
export function estimateTokenCount(text: string): number {
  // Rough estimation: 1 token ≈ 4 characters for English text
  // This includes some padding for special tokens
  return Math.ceil(text.length / 3.5)
}

export function truncateToTokenLimit(text: string, maxTokens: number): string {
  const estimatedTokens = estimateTokenCount(text)

  if (estimatedTokens <= maxTokens) {
    return text
  }

  // Calculate approximate character limit
  const maxChars = Math.floor(maxTokens * 3.5)

  // Truncate at word boundary
  const truncated = text.substring(0, maxChars)
  const lastSpaceIndex = truncated.lastIndexOf(' ')

  if (lastSpaceIndex > maxChars * 0.8) {
    return truncated.substring(0, lastSpaceIndex) + '...'
  }

  return truncated + '...'
}

export function fitContextToTokenLimit(
  contexts: Array<{ content: string; filename: string; score: number; documentId?: string }>,
  maxTokens: number,
  reserveTokens: number = 100 // Reserve tokens for system prompt and user message
): Array<{ content: string; filename: string; score: number; documentId?: string }> {
  const availableTokens = maxTokens - reserveTokens
  let usedTokens = 0
  const fittedContexts: Array<{
    content: string
    filename: string
    score: number
    documentId?: string
  }> = []

  // Sort by relevance score (highest first)
  const sortedContexts = [...contexts].sort((a, b) => b.score - a.score)

  for (const context of sortedContexts) {
    const contextTokens = estimateTokenCount(context.content)

    if (usedTokens + contextTokens <= availableTokens) {
      fittedContexts.push(context)
      usedTokens += contextTokens
    } else {
      // Try to fit a truncated version
      const remainingTokens = availableTokens - usedTokens
      if (remainingTokens > 50) {
        // Only if we have meaningful space left
        const truncatedContent = truncateToTokenLimit(context.content, remainingTokens)
        fittedContexts.push({
          ...context,
          content: truncatedContent,
        })
        break
      }
    }
  }

  return fittedContexts
}
