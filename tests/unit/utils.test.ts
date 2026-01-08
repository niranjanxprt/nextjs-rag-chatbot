import fc from 'fast-check'
import { estimateTokenCount, truncateToTokenLimit, fitContextToTokenLimit } from '@/lib/utils/token-counter'
import { createError, AppErrorClass } from '@/lib/utils/error-handler'
import { PerformanceTimer, withPerformanceTracking } from '@/lib/utils/performance'

describe('Utility Functions', () => {
  describe('Token Counter', () => {
    it('should count tokens accurately for simple text', () => {
      const text = 'Hello world'
      const count = tokenCounter.count(text)

      expect(count).toBeGreaterThan(0)
      expect(typeof count).toBe('number')
    })

    it('should handle empty strings', () => {
      const count = tokenCounter.count('')
      expect(count).toBe(0)
    })

    it('should handle unicode characters', () => {
      const text = '你好世界 🌍'
      const count = tokenCounter.count(text)

      expect(count).toBeGreaterThan(0)
    })

    // Property-based testing
    it('should always return non-negative integers', () => {
      fc.assert(
        fc.property(fc.string(), text => {
          const count = tokenCounter.count(text)
          expect(count).toBeGreaterThanOrEqual(0)
          expect(Number.isInteger(count)).toBe(true)
        })
      )
    })

    it('should be monotonic for concatenated strings', () => {
      fc.assert(
        fc.property(fc.string(), fc.string(), (text1, text2) => {
          const count1 = tokenCounter.count(text1)
          const count2 = tokenCounter.count(text2)
          const combinedCount = tokenCounter.count(text1 + text2)

          // Combined count should be at least the sum (due to tokenization)
          expect(combinedCount).toBeGreaterThanOrEqual(Math.max(count1, count2))
        })
      )
    })

    it('should fit text within token budget', () => {
      const longText =
        'This is a very long text that needs to be truncated to fit within the token budget. '.repeat(
          100
        )
      const budget = 100

      const fittedText = tokenCounter.fitToBudget(longText, budget)
      const fittedCount = tokenCounter.count(fittedText)

      expect(fittedCount).toBeLessThanOrEqual(budget)
    })
  })

  describe('Error Handler', () => {
    it('should format errors consistently', () => {
      const error = new Error('Test error')
      const context = { userId: 'test-user', operation: 'test-op' }

      const formatted = errorHandler.format(error, context)

      expect(formatted).toMatchObject({
        message: 'Test error',
        context: expect.objectContaining(context),
        timestamp: expect.any(String),
      })
    })

    it('should handle different error types', () => {
      const errors = [
        new Error('Standard error'),
        new TypeError('Type error'),
        new RangeError('Range error'),
        { message: 'Custom error object' },
        'String error',
        null,
        undefined,
      ]

      errors.forEach(error => {
        const formatted = errorHandler.format(error)
        expect(formatted).toHaveProperty('message')
        expect(formatted).toHaveProperty('timestamp')
      })
    })

    it('should sanitize sensitive information', () => {
      const error = new Error('Database connection failed: password=secret123')
      const formatted = errorHandler.format(error)

      expect(formatted.message).not.toContain('secret123')
      expect(formatted.message).toContain('[REDACTED]')
    })

    // Property-based testing for error handling
    it('should never throw when formatting errors', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.string(),
            fc.record({ message: fc.string() }),
            fc.constant(null),
            fc.constant(undefined)
          ),
          error => {
            expect(() => errorHandler.format(error)).not.toThrow()
          }
        )
      )
    })
  })

  describe('Performance Monitor', () => {
    it('should measure execution time', async () => {
      const timer = performance.startTimer('test-operation')

      // Simulate some work
      await new Promise(resolve => setTimeout(resolve, 10))

      const duration = timer.end()

      expect(duration).toBeGreaterThan(0)
      expect(typeof duration).toBe('number')
    })

    it('should track multiple operations', () => {
      const timer1 = performance.startTimer('operation-1')
      const timer2 = performance.startTimer('operation-2')

      timer1.end()
      timer2.end()

      const metrics = performance.getMetrics()

      expect(metrics).toHaveProperty('operation-1')
      expect(metrics).toHaveProperty('operation-2')
    })

    it('should calculate statistics', () => {
      // Record multiple measurements
      for (let i = 0; i < 10; i++) {
        const timer = performance.startTimer('test-stats')
        timer.end()
      }

      const stats = performance.getStats('test-stats')

      expect(stats).toMatchObject({
        count: 10,
        average: expect.any(Number),
        min: expect.any(Number),
        max: expect.any(Number),
      })
    })

    it('should handle concurrent timers', async () => {
      const promises = Array.from({ length: 5 }, async (_, i) => {
        const timer = performance.startTimer(`concurrent-${i}`)
        await new Promise(resolve => setTimeout(resolve, Math.random() * 20))
        return timer.end()
      })

      const durations = await Promise.all(promises)

      durations.forEach(duration => {
        expect(duration).toBeGreaterThan(0)
      })
    })

    // Property-based testing for performance monitoring
    it('should handle arbitrary operation names', () => {
      fc.assert(
        fc.property(
          fc.string().filter(s => s.length > 0),
          operationName => {
            const timer = performance.startTimer(operationName)
            const duration = timer.end()

            expect(duration).toBeGreaterThanOrEqual(0)
            expect(performance.getMetrics()).toHaveProperty(operationName)
          }
        )
      )
    })
  })

  describe('Text Processing Utilities', () => {
    // Property-based testing for text chunking
    it('should chunk text consistently', () => {
      fc.assert(
        fc.property(
          fc.string().filter(s => s.length > 0),
          fc.integer({ min: 10, max: 1000 }),
          fc.integer({ min: 0, max: 100 }),
          (text, chunkSize, overlap) => {
            const chunks = tokenCounter.chunkText(text, chunkSize, overlap)

            // All chunks should be within size limits
            chunks.forEach(chunk => {
              expect(chunk.length).toBeLessThanOrEqual(chunkSize + overlap)
            })

            // Should preserve all text (approximately)
            const reconstructed = chunks.join('')
            expect(reconstructed.length).toBeGreaterThanOrEqual(text.length * 0.8)
          }
        )
      )
    })

    it('should handle edge cases in text processing', () => {
      const edgeCases = [
        '',
        ' ',
        '\n\n\n',
        'a'.repeat(10000),
        '🌍'.repeat(100),
        'Mixed content 123 !@# 你好',
      ]

      edgeCases.forEach(text => {
        expect(() => tokenCounter.count(text)).not.toThrow()
        expect(() => tokenCounter.chunkText(text, 100, 10)).not.toThrow()
      })
    })
  })

  describe('Cache Key Generation', () => {
    it('should generate consistent cache keys', () => {
      const input = { query: 'test', userId: '123' }

      const key1 = tokenCounter.generateCacheKey(input)
      const key2 = tokenCounter.generateCacheKey(input)

      expect(key1).toBe(key2)
    })

    it('should generate different keys for different inputs', () => {
      const input1 = { query: 'test1', userId: '123' }
      const input2 = { query: 'test2', userId: '123' }

      const key1 = tokenCounter.generateCacheKey(input1)
      const key2 = tokenCounter.generateCacheKey(input2)

      expect(key1).not.toBe(key2)
    })

    // Property-based testing for cache key generation
    it('should generate valid cache keys for any input', () => {
      fc.assert(
        fc.property(
          fc.record({
            query: fc.string(),
            userId: fc.string(),
            timestamp: fc.integer(),
          }),
          input => {
            const key = tokenCounter.generateCacheKey(input)

            expect(typeof key).toBe('string')
            expect(key.length).toBeGreaterThan(0)
            expect(key).toMatch(/^[a-zA-Z0-9_-]+$/) // Valid cache key format
          }
        )
      )
    })
  })
})
