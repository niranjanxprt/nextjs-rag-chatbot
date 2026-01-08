import {
  estimateTokenCount,
  truncateToTokenLimit,
  fitContextToTokenLimit,
  calculateContextTokens,
  optimizeContextForModel,
} from '@/lib/utils/token-counter'

describe('Token Counter Utility', () => {
  describe('estimateTokenCount', () => {
    it('estimates token count for simple text', () => {
      const text = 'Hello world'
      const tokens = estimateTokenCount(text)
      
      // Should be approximately 3-4 tokens
      expect(tokens).toBeGreaterThan(2)
      expect(tokens).toBeLessThan(6)
    })

    it('estimates token count for longer text', () => {
      const text = 'This is a longer piece of text that should have more tokens than the simple example above.'
      const tokens = estimateTokenCount(text)
      
      // Should be approximately 20-25 tokens
      expect(tokens).toBeGreaterThan(15)
      expect(tokens).toBeLessThan(30)
    })

    it('handles empty string', () => {
      expect(estimateTokenCount('')).toBe(0)
    })

    it('handles single character', () => {
      expect(estimateTokenCount('a')).toBe(1)
    })

    it('handles special characters and punctuation', () => {
      const text = '!@#$%^&*()_+-=[]{}|;:,.<>?'
      const tokens = estimateTokenCount(text)
      
      expect(tokens).toBeGreaterThan(0)
      expect(tokens).toBeLessThan(15)
    })

    it('handles unicode characters', () => {
      const text = '你好世界 🌍 émojis'
      const tokens = estimateTokenCount(text)
      
      expect(tokens).toBeGreaterThan(0)
      expect(tokens).toBeLessThan(10)
    })
  })

  describe('truncateToTokenLimit', () => {
    it('returns original text when under limit', () => {
      const text = 'Short text'
      const result = truncateToTokenLimit(text, 100)
      
      expect(result).toBe(text)
    })

    it('truncates text when over limit', () => {
      const text = 'This is a very long piece of text that should be truncated when it exceeds the token limit'
      const result = truncateToTokenLimit(text, 10)
      
      expect(result).not.toBe(text)
      expect(result.endsWith('...')).toBe(true)
      expect(result.length).toBeLessThan(text.length)
    })

    it('truncates at word boundary when possible', () => {
      const text = 'This is a test sentence with multiple words'
      const result = truncateToTokenLimit(text, 5)
      
      expect(result.endsWith('...')).toBe(true)
      // Should not end with a partial word (unless forced)
      const withoutEllipsis = result.replace('...', '')
      expect(withoutEllipsis.endsWith(' ')).toBe(false)
    })

    it('handles very small token limits', () => {
      const text = 'Hello world'
      const result = truncateToTokenLimit(text, 1)
      
      expect(result).toBe('...')
    })

    it('handles zero token limit', () => {
      const text = 'Hello world'
      const result = truncateToTokenLimit(text, 0)
      
      expect(result).toBe('...')
    })

    it('preserves text structure when truncating', () => {
      const text = 'First sentence. Second sentence. Third sentence.'
      const result = truncateToTokenLimit(text, 8)
      
      expect(result.endsWith('...')).toBe(true)
      // Should maintain sentence structure
      expect(result.includes('First sentence')).toBe(true)
    })
  })

  describe('fitContextToTokenLimit', () => {
    const mockContexts = [
      { content: 'High relevance content', filename: 'doc1.txt', score: 0.9 },
      { content: 'Medium relevance content', filename: 'doc2.txt', score: 0.7 },
      { content: 'Lower relevance content', filename: 'doc3.txt', score: 0.5 },
      { content: 'Lowest relevance content', filename: 'doc4.txt', score: 0.3 },
    ]

    it('includes all contexts when under token limit', () => {
      const result = fitContextToTokenLimit(mockContexts, 1000)
      
      expect(result).toHaveLength(4)
      expect(result[0].score).toBe(0.9) // Should be sorted by score
    })

    it('limits contexts when over token limit', () => {
      const result = fitContextToTokenLimit(mockContexts, 10, 5)
      
      expect(result.length).toBeLessThan(4)
      expect(result[0].score).toBe(0.9) // Highest score should be first
    })

    it('respects reserve tokens', () => {
      const result = fitContextToTokenLimit(mockContexts, 20, 15)
      
      // With only 5 available tokens, should fit very few contexts
      expect(result.length).toBeLessThanOrEqual(2)
    })

    it('sorts contexts by relevance score', () => {
      const result = fitContextToTokenLimit(mockContexts, 1000)
      
      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i].score).toBeGreaterThanOrEqual(result[i + 1].score)
      }
    })

    it('handles empty contexts array', () => {
      const result = fitContextToTokenLimit([], 100)
      
      expect(result).toHaveLength(0)
    })

    it('handles contexts with documentId', () => {
      const contextsWithDocId = mockContexts.map((ctx, i) => ({
        ...ctx,
        documentId: `doc-${i}`,
      }))
      
      const result = fitContextToTokenLimit(contextsWithDocId, 1000)
      
      expect(result).toHaveLength(4)
      expect(result[0].documentId).toBe('doc-0')
    })

    it('truncates individual contexts if needed', () => {
      const longContexts = [
        {
          content: 'This is an extremely long piece of content that should be truncated to fit within the token limit while preserving the most important information',
          filename: 'long.txt',
          score: 0.9,
        },
      ]
      
      const result = fitContextToTokenLimit(longContexts, 15, 5)
      
      expect(result).toHaveLength(1)
      expect(result[0].content).not.toBe(longContexts[0].content)
      expect(result[0].content.endsWith('...')).toBe(true)
    })
  })

  describe('calculateContextTokens', () => {
    it('calculates total tokens for context array', () => {
      const contexts = [
        { content: 'First context', filename: 'doc1.txt', score: 0.9 },
        { content: 'Second context', filename: 'doc2.txt', score: 0.8 },
      ]
      
      const tokens = calculateContextTokens(contexts)
      
      expect(tokens).toBeGreaterThan(0)
      expect(tokens).toBe(
        estimateTokenCount(contexts[0].content) + 
        estimateTokenCount(contexts[1].content)
      )
    })

    it('handles empty context array', () => {
      const tokens = calculateContextTokens([])
      
      expect(tokens).toBe(0)
    })

    it('includes metadata in token calculation', () => {
      const contexts = [
        { content: 'Content', filename: 'document.txt', score: 0.9 },
      ]
      
      const tokens = calculateContextTokens(contexts, true)
      
      // Should include tokens for filename and formatting
      expect(tokens).toBeGreaterThan(estimateTokenCount('Content'))
    })
  })

  describe('optimizeContextForModel', () => {
    const mockContexts = [
      { content: 'Very relevant content about AI and machine learning', filename: 'ai.txt', score: 0.95 },
      { content: 'Somewhat relevant content about technology', filename: 'tech.txt', score: 0.8 },
      { content: 'Less relevant content about general topics', filename: 'general.txt', score: 0.6 },
      { content: 'Barely relevant content', filename: 'misc.txt', score: 0.4 },
    ]

    it('optimizes for GPT-4 model', () => {
      const result = optimizeContextForModel(mockContexts, 'gpt-4', 100)
      
      expect(result.contexts.length).toBeGreaterThan(0)
      expect(result.totalTokens).toBeLessThanOrEqual(100)
      expect(result.truncated).toBeDefined()
    })

    it('optimizes for GPT-3.5 model', () => {
      const result = optimizeContextForModel(mockContexts, 'gpt-3.5-turbo', 50)
      
      expect(result.contexts.length).toBeGreaterThan(0)
      expect(result.totalTokens).toBeLessThanOrEqual(50)
    })

    it('handles unknown model gracefully', () => {
      const result = optimizeContextForModel(mockContexts, 'unknown-model', 100)
      
      expect(result.contexts.length).toBeGreaterThan(0)
      expect(result.totalTokens).toBeLessThanOrEqual(100)
    })

    it('prioritizes high-scoring contexts', () => {
      const result = optimizeContextForModel(mockContexts, 'gpt-4', 30)
      
      // Should include highest scoring contexts first
      if (result.contexts.length > 0) {
        expect(result.contexts[0].score).toBe(0.95)
      }
    })

    it('returns metadata about optimization', () => {
      const result = optimizeContextForModel(mockContexts, 'gpt-4', 20)
      
      expect(result).toHaveProperty('contexts')
      expect(result).toHaveProperty('totalTokens')
      expect(result).toHaveProperty('truncated')
      expect(result).toHaveProperty('originalCount')
      expect(result.originalCount).toBe(4)
    })
  })

  describe('Edge Cases', () => {
    it('handles very long single context', () => {
      const longText = 'word '.repeat(1000) // 5000 characters
      const contexts = [{ content: longText, filename: 'long.txt', score: 0.9 }]
      
      const result = fitContextToTokenLimit(contexts, 100)
      
      expect(result).toHaveLength(1)
      expect(result[0].content.length).toBeLessThan(longText.length)
    })

    it('handles contexts with identical scores', () => {
      const contexts = [
        { content: 'First', filename: 'doc1.txt', score: 0.8 },
        { content: 'Second', filename: 'doc2.txt', score: 0.8 },
        { content: 'Third', filename: 'doc3.txt', score: 0.8 },
      ]
      
      const result = fitContextToTokenLimit(contexts, 100)
      
      expect(result).toHaveLength(3)
      // Should maintain stable sort
    })

    it('handles extreme token limits', () => {
      const contexts = [{ content: 'Test', filename: 'test.txt', score: 0.9 }]
      
      const resultZero = fitContextToTokenLimit(contexts, 0)
      const resultNegative = fitContextToTokenLimit(contexts, -10)
      
      expect(resultZero).toHaveLength(0)
      expect(resultNegative).toHaveLength(0)
    })

    it('handles malformed context objects', () => {
      const contexts = [
        { content: '', filename: 'empty.txt', score: 0.9 },
        { content: 'Valid content', filename: '', score: 0.8 },
      ]
      
      const result = fitContextToTokenLimit(contexts, 100)
      
      expect(result).toHaveLength(2)
      expect(result[0].content).toBe('Valid content')
    })
  })
})
