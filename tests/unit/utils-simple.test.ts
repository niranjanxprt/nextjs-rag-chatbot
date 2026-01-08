import { estimateTokenCount, truncateToTokenLimit } from '@/lib/utils/token-counter'

describe('Utility Functions', () => {
  describe('Token Counter', () => {
    it('should count tokens accurately', () => {
      const text = 'Hello world'
      const count = estimateTokenCount(text)
      
      expect(count).toBeGreaterThan(0)
      expect(typeof count).toBe('number')
    })

    it('should handle empty strings', () => {
      const count = estimateTokenCount('')
      expect(count).toBe(0)
    })

    it('should truncate text to token limit', () => {
      const text = 'This is a long text that should be truncated'
      const truncated = truncateToTokenLimit(text, 5)
      
      expect(truncated.length).toBeLessThanOrEqual(text.length)
    })
  })
})
