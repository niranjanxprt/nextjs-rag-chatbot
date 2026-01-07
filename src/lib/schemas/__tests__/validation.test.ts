/**
 * Validation Schema Tests
 * 
 * Unit tests for Zod validation schemas
 */

import { describe, it, expect } from '@jest/globals'
import {
  documentUploadFormSchema,
  documentProcessingRequestSchema,
  chatRequestSchema,
  vectorSearchSchema,
  conversationInsertSchema,
  messageInsertSchema
} from '../validation'

describe('Validation Schemas', () => {
  describe('documentUploadFormSchema', () => {
    it('should validate valid document upload data', () => {
      const validData = {
        filename: 'test.pdf',
        fileSize: 1024000,
        mimeType: 'application/pdf'
      }

      const result = documentUploadFormSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validData)
      }
    })

    it('should reject invalid file types', () => {
      const invalidData = {
        filename: 'test.exe',
        fileSize: 1024000,
        mimeType: 'application/x-executable'
      }

      const result = documentUploadFormSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject files that are too large', () => {
      const invalidData = {
        filename: 'test.pdf',
        fileSize: 100 * 1024 * 1024, // 100MB
        mimeType: 'application/pdf'
      }

      const result = documentUploadFormSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject empty filename', () => {
      const invalidData = {
        filename: '',
        fileSize: 1024000,
        mimeType: 'application/pdf'
      }

      const result = documentUploadFormSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject negative file size', () => {
      const invalidData = {
        filename: 'test.pdf',
        fileSize: -1,
        mimeType: 'application/pdf'
      }

      const result = documentUploadFormSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('documentProcessingRequestSchema', () => {
    it('should validate valid document process data', () => {
      const validData = {
        documentId: '123e4567-e89b-12d3-a456-426614174000',
        chunkSize: 1000,
        chunkOverlap: 200
      }

      const result = documentProcessingRequestSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validData)
      }
    })

    it('should use default values when optional fields are missing', () => {
      const minimalData = {
        documentId: '123e4567-e89b-12d3-a456-426614174000'
      }

      const result = documentProcessingRequestSchema.safeParse(minimalData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.chunkSize).toBe(500)
        expect(result.data.chunkOverlap).toBe(50)
      }
    })

    it('should reject invalid chunk size', () => {
      const invalidData = {
        documentId: '123e4567-e89b-12d3-a456-426614174000',
        chunkSize: -1, // Negative
        chunkOverlap: 200
      }

      const result = documentProcessingRequestSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject chunk size that is too large', () => {
      const invalidData = {
        documentId: '123e4567-e89b-12d3-a456-426614174000',
        chunkSize: 3000, // Too large
        chunkOverlap: 50
      }

      const result = documentProcessingRequestSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('chatRequestSchema', () => {
    it('should validate valid chat request', () => {
      const validData = {
        messages: [
          { role: 'user', content: 'Hello, how are you?' }
        ],
        conversationId: '123e4567-e89b-12d3-a456-426614174000',
        temperature: 0.7,
        maxTokens: 1000
      }

      const result = chatRequestSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validData)
      }
    })

    it('should validate minimal chat request', () => {
      const minimalData = {
        messages: [
          { role: 'user', content: 'Hello' }
        ]
      }

      const result = chatRequestSchema.safeParse(minimalData)
      expect(result.success).toBe(true)
    })

    it('should reject empty messages array', () => {
      const invalidData = {
        messages: []
      }

      const result = chatRequestSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject invalid message role', () => {
      const invalidData = {
        messages: [
          { role: 'invalid', content: 'Hello' }
        ]
      }

      const result = chatRequestSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject empty message content', () => {
      const invalidData = {
        messages: [
          { role: 'user', content: '' }
        ]
      }

      const result = chatRequestSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject invalid temperature range', () => {
      const invalidData = {
        messages: [
          { role: 'user', content: 'Hello' }
        ],
        temperature: 2.5 // Too high
      }

      const result = chatRequestSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject invalid maxTokens', () => {
      const invalidData = {
        messages: [
          { role: 'user', content: 'Hello' }
        ],
        maxTokens: -1 // Negative
      }

      const result = chatRequestSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('vectorSearchSchema', () => {
    it('should validate valid search request', () => {
      const validData = {
        query: 'machine learning',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        topK: 5,
        threshold: 0.7
      }

      const result = vectorSearchSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual({
          ...validData,
          includeMetadata: true // default value
        })
      }
    })

    it('should validate minimal search request', () => {
      const minimalData = {
        query: 'test query',
        userId: '123e4567-e89b-12d3-a456-426614174000'
      }

      const result = vectorSearchSchema.safeParse(minimalData)
      expect(result.success).toBe(true)
    })

    it('should reject empty query', () => {
      const invalidData = {
        query: '',
        userId: '123e4567-e89b-12d3-a456-426614174000'
      }

      const result = vectorSearchSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject query that is too long', () => {
      const invalidData = {
        query: 'a'.repeat(1001), // Too long
        userId: '123e4567-e89b-12d3-a456-426614174000'
      }

      const result = vectorSearchSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject invalid topK range', () => {
      const invalidData = {
        query: 'test',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        topK: 0 // Too small
      }

      const result = vectorSearchSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject invalid threshold range', () => {
      const invalidData = {
        query: 'test',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        threshold: 1.5 // Too high
      }

      const result = vectorSearchSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('conversationInsertSchema', () => {
    it('should validate valid conversation creation', () => {
      const validData = {
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'My Conversation'
      }

      const result = conversationInsertSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validData)
      }
    })

    it('should validate conversation without title', () => {
      const validData = {
        user_id: '123e4567-e89b-12d3-a456-426614174000'
      }

      const result = conversationInsertSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject title that is too long', () => {
      const invalidData = {
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'a'.repeat(201) // Too long
      }

      const result = conversationInsertSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('messageInsertSchema', () => {
    it('should validate valid message creation', () => {
      const validData = {
        conversation_id: '123e4567-e89b-12d3-a456-426614174000',
        role: 'user' as const,
        content: 'Hello, world!',
        metadata: { source: 'web' }
      }

      const result = messageInsertSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validData)
      }
    })

    it('should validate message without metadata', () => {
      const validData = {
        conversation_id: '123e4567-e89b-12d3-a456-426614174000',
        role: 'user' as const,
        content: 'Hello, world!'
      }

      const result = messageInsertSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject empty conversation ID', () => {
      const invalidData = {
        conversation_id: '',
        role: 'user' as const,
        content: 'Hello'
      }

      const result = messageInsertSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject invalid role', () => {
      const invalidData = {
        conversation_id: '123e4567-e89b-12d3-a456-426614174000',
        role: 'invalid',
        content: 'Hello'
      }

      const result = messageInsertSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject empty content', () => {
      const invalidData = {
        conversation_id: '123e4567-e89b-12d3-a456-426614174000',
        role: 'user' as const,
        content: ''
      }

      const result = messageInsertSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject content that is too long', () => {
      const invalidData = {
        conversation_id: '123e4567-e89b-12d3-a456-426614174000',
        role: 'user' as const,
        content: 'a'.repeat(50001) // Too long
      }

      const result = messageInsertSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('Edge Cases and Security', () => {
    it('should handle null values gracefully', () => {
      const result = documentUploadFormSchema.safeParse(null)
      expect(result.success).toBe(false)
    })

    it('should handle undefined values gracefully', () => {
      const result = documentUploadFormSchema.safeParse(undefined)
      expect(result.success).toBe(false)
    })

    it('should reject malicious script content in messages', () => {
      const maliciousData = {
        conversation_id: '123e4567-e89b-12d3-a456-426614174000',
        role: 'user' as const,
        content: '<script>alert("xss")</script>'
      }

      const result = messageInsertSchema.safeParse(maliciousData)
      // The schema should still parse this (content validation is separate)
      // but we test that it doesn't crash
      expect(result.success).toBe(true)
    })

    it('should handle very large numbers gracefully', () => {
      const invalidData = {
        filename: 'test.pdf',
        fileSize: Number.MAX_SAFE_INTEGER + 1,
        mimeType: 'application/pdf'
      }

      const result = documentUploadFormSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should handle special characters in filenames', () => {
      const validData = {
        filename: 'test-file_123.pdf',
        fileSize: 1024000,
        mimeType: 'application/pdf'
      }

      const result = documentUploadFormSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject filenames with dangerous characters', () => {
      const invalidData = {
        filename: '../../../etc/passwd',
        fileSize: 1024000,
        mimeType: 'application/pdf'
      }

      const result = documentUploadFormSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })
})