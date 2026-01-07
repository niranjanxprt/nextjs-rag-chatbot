/**
 * Integration Tests for Document Processing Pipeline
 * 
 * End-to-end tests covering the complete document processing workflow
 * with proper mocking for Next.js API routes
 */

import { NextRequest } from 'next/server'
import { POST as uploadHandler } from '../upload/route'
import { POST as processHandler, GET as statusHandler } from '../[id]/process/route'
import { DocumentProcessingStatus } from '@/lib/types/database'
import { createClient } from '@/lib/supabase/server'
import { getDocument, updateDocument, createDocumentChunks } from '@/lib/database/queries'
import { processDocument } from '@/lib/services/document-processor'

// Mock all external dependencies
jest.mock('@/lib/supabase/server')
jest.mock('@/lib/database/queries')
jest.mock('@/lib/services/document-processor')

// Mock implementations
type MockSupabaseClient = {
  auth: {
    getUser: jest.Mock
  }
  storage: {
    from: jest.Mock
    upload: jest.Mock
    download: jest.Mock
  }
}

const mockSupabaseClient: MockSupabaseClient = {
  auth: {
    getUser: jest.fn().mockResolvedValue({
      data: { user: { id: '550e8400-e29b-41d4-a716-446655440000', email: 'test@example.com' } },
      error: null
    })
  },
  storage: {
    from: jest.fn().mockReturnThis(),
    upload: jest.fn().mockResolvedValue({ error: null }),
    download: jest.fn().mockResolvedValue({ data: { arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(100)) } })
  }
}

const mockGetDocument = getDocument as jest.MockedFunction<typeof getDocument>
const mockUpdateDocument = updateDocument as jest.MockedFunction<typeof updateDocument>
const mockCreateDocumentChunks = createDocumentChunks as jest.MockedFunction<typeof createDocumentChunks>
const mockProcessDocument = processDocument as jest.MockedFunction<typeof processDocument>

// Mock createClient to return our mock
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>
mockCreateClient.mockResolvedValue(mockSupabaseClient as any)

// Helper to create mock NextRequest
function createMockRequest(method: string, body?: any, headers?: Record<string, string>): NextRequest {
  const request = new Request('http://localhost', {
    method,
    headers: headers || {},
    body: body ? JSON.stringify(body) : undefined
  }) as NextRequest
  
  // Add formData method for POST requests
  if (method === 'POST' && body instanceof FormData) {
    request.formData = jest.fn().mockResolvedValue(body)
  } else if (method === 'POST') {
    request.json = jest.fn().mockResolvedValue(body)
  }
  
  return request
}

describe('Document Processing Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Complete Document Processing Workflow', () => {
    it('should successfully process a document from upload to completion', async () => {
      // Mock document data
      const testDocument = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        user_id: '550e8400-e29b-41d4-a716-446655440000',
        filename: 'test.pdf',
        file_size: 1024,
        mime_type: 'application/pdf',
        storage_path: '550e8400-e29b-41d4-a716-446655440000/1234567890-uuid.pdf',
        processing_status: 'pending' as DocumentProcessingStatus,
        chunk_count: 0,
        error_message: null,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      }

      // Mock file with proper arrayBuffer method
      const mockFile = {
        name: 'test.pdf',
        type: 'application/pdf',
        size: 1024,
        arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(1024))
      }

      // Mock form data
      const mockFormData = {
        get: jest.fn().mockReturnValue(mockFile)
      }

      // Mock request for upload
      const uploadRequest = createMockRequest('POST', mockFormData)
      uploadRequest.formData = jest.fn().mockResolvedValue(mockFormData)

      // Mock document creation and updates
      mockGetDocument.mockResolvedValueOnce(null) // Document doesn't exist yet
      mockGetDocument.mockResolvedValueOnce(testDocument) // After creation
      mockUpdateDocument.mockResolvedValueOnce({ ...testDocument, processing_status: 'processing' as DocumentProcessingStatus as DocumentProcessingStatus })
      mockUpdateDocument.mockResolvedValueOnce({ ...testDocument, processing_status: 'completed' as DocumentProcessingStatus as DocumentProcessingStatus, chunk_count: 3 })

      // Mock processing result
      mockProcessDocument.mockResolvedValue({
        chunks: [
          { content: 'chunk 1', tokenCount: 10, qdrantPointId: 'qdrant-1' },
          { content: 'chunk 2', tokenCount: 15, qdrantPointId: 'qdrant-2' },
          { content: 'chunk 3', tokenCount: 12, qdrantPointId: 'qdrant-3' }
        ],
        processingTime: 150
      })

      mockCreateDocumentChunks.mockResolvedValue([
        { id: 'chunk-1-id', document_id: testDocument.id, chunk_index: 0, content: 'chunk 1', token_count: 10, qdrant_point_id: 'qdrant-1', created_at: new Date().toISOString() },
        { id: 'chunk-2-id', document_id: testDocument.id, chunk_index: 1, content: 'chunk 2', token_count: 15, qdrant_point_id: 'qdrant-2', created_at: new Date().toISOString() },
        { id: 'chunk-3-id', document_id: testDocument.id, chunk_index: 2, content: 'chunk 3', token_count: 12, qdrant_point_id: 'qdrant-3', created_at: new Date().toISOString() }
      ])

      // Step 1: Upload document
      const uploadResponse = await uploadHandler(uploadRequest)
      const uploadData = await uploadResponse.json()

      expect(uploadResponse.status).toBe(201)
      expect(uploadData.success).toBe(true)
      expect(uploadData.data.document).toBeDefined()
      expect(uploadData.data.message).toContain('File uploaded successfully')

      // Step 2: Process document
      const processRequest = createMockRequest('POST', { chunkSize: 500, chunkOverlap: 50 })

      const processResponse = await processHandler(processRequest, {
        params: Promise.resolve({ id: testDocument.id })
      })
      const processData = await processResponse.json()

      expect(processResponse.status).toBe(200)
      expect(processData.success).toBe(true)
      expect(processData.data.chunksCreated).toBe(3)
      expect(processData.data.processingTime).toBe(150)
      expect(processData.message).toContain('Document processed successfully')

      // Step 3: Check processing status
      const statusRequest = createMockRequest('GET')

      const statusResponse = await statusHandler(statusRequest, {
        params: Promise.resolve({ id: testDocument.id })
      })
      const statusData = await statusResponse.json()

      expect(statusResponse.status).toBe(200)
      expect(statusData.success).toBe(true)
      expect(statusData.data.status).toBe('completed')
      expect(statusData.data.chunkCount).toBe(3)

      // Verify all mocks were called correctly
      expect(mockSupabaseClient.storage.upload).toHaveBeenCalled()
      expect(mockProcessDocument).toHaveBeenCalledWith(
        expect.objectContaining({ id: testDocument.id }),
        { chunkSize: 500, chunkOverlap: 50 }
      )
      expect(mockCreateDocumentChunks).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ content: 'chunk 1', token_count: 10 }),
          expect.objectContaining({ content: 'chunk 2', token_count: 15 }),
          expect.objectContaining({ content: 'chunk 3', token_count: 12 })
        ])
      )
    })

    it('should handle document processing errors gracefully', async () => {
      // Mock document data
      const testDocument = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        user_id: '550e8400-e29b-41d4-a716-446655440000',
        filename: 'test.pdf',
        file_size: 1024,
        mime_type: 'application/pdf',
        storage_path: '550e8400-e29b-41d4-a716-446655440000/1234567890-uuid.pdf',
        processing_status: 'pending' as DocumentProcessingStatus,
        chunk_count: 0,
        error_message: null,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      }

      // Mock processing error
      mockProcessDocument.mockRejectedValue(new Error('Processing failed: invalid file format'))
      mockUpdateDocument.mockResolvedValueOnce({ ...testDocument, processing_status: 'processing' as DocumentProcessingStatus as DocumentProcessingStatus })
      mockUpdateDocument.mockResolvedValueOnce({ ...testDocument, processing_status: 'failed' as DocumentProcessingStatus, error_message: 'Processing failed: invalid file format' })

      // Mock requests
      const processRequest = createMockRequest('POST', { chunkSize: 500, chunkOverlap: 50 })

      // Process document (should fail)
      const processResponse = await processHandler(processRequest, {
        params: Promise.resolve({ id: testDocument.id })
      })
      const processData = await processResponse.json()

      expect(processResponse.status).toBe(500)
      expect(processData.error).toBe('Processing Failed')
      expect(processData.message).toContain('Processing failed: invalid file format')

      // Check status shows failure
      const statusRequest = createMockRequest('GET')

      const statusResponse = await statusHandler(statusRequest, {
        params: Promise.resolve({ id: testDocument.id })
      })
      const statusData = await statusResponse.json()

      expect(statusResponse.status).toBe(200)
      expect(statusData.data.status).toBe('failed')
      expect(statusData.data.errorMessage).toContain('Processing failed: invalid file format')
    })

    it('should prevent processing documents that are already being processed', async () => {
      // Mock document that's already processing
      const testDocument = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        user_id: '550e8400-e29b-41d4-a716-446655440000',
        filename: 'test.pdf',
        file_size: 1024,
        mime_type: 'application/pdf',
        storage_path: '550e8400-e29b-41d4-a716-446655440000/1234567890-uuid.pdf',
        processing_status: 'processing' as DocumentProcessingStatus as DocumentProcessingStatus,
        chunk_count: 0,
        error_message: null,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      }

      mockGetDocument.mockResolvedValue(testDocument)

      const processRequest = createMockRequest('POST', { chunkSize: 500, chunkOverlap: 50 })

      const processResponse = await processHandler(processRequest, {
        params: Promise.resolve({ id: testDocument.id })
      })
      const processData = await processResponse.json()

      expect(processResponse.status).toBe(409)
      expect(processData.error).toBe('Conflict')
      expect(processData.message).toContain('Document is already being processed')
      expect(mockProcessDocument).not.toHaveBeenCalled()
    })

    it('should prevent processing documents that are already completed', async () => {
      // Mock document that's already completed
      const testDocument = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        user_id: '550e8400-e29b-41d4-a716-446655440000',
        filename: 'test.pdf',
        file_size: 1024,
        mime_type: 'application/pdf',
        storage_path: '550e8400-e29b-41d4-a716-446655440000/1234567890-uuid.pdf',
        processing_status: 'completed' as DocumentProcessingStatus as DocumentProcessingStatus,
        chunk_count: 5,
        error_message: null,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      }

      mockGetDocument.mockResolvedValue(testDocument)

      const processRequest = createMockRequest('POST', { chunkSize: 500, chunkOverlap: 50 })

      const processResponse = await processHandler(processRequest, {
        params: Promise.resolve({ id: testDocument.id })
      })
      const processData = await processResponse.json()

      expect(processResponse.status).toBe(409)
      expect(processData.error).toBe('Conflict')
      expect(processData.message).toContain('Document is already processed')
      expect(mockProcessDocument).not.toHaveBeenCalled()
    })

    it('should handle file upload validation errors', async () => {
      // Mock file that's too large
      const mockFile = {
        name: 'test.pdf',
        type: 'application/pdf',
        size: 11 * 1024 * 1024 // 11MB (over limit)
      }

      const mockFormData = {
        get: jest.fn().mockReturnValue(mockFile)
      }

      const uploadRequest = createMockRequest('POST', mockFormData)
      uploadRequest.formData = jest.fn().mockResolvedValue(mockFormData)

      const uploadResponse = await uploadHandler(uploadRequest)
      const uploadData = await uploadResponse.json()

      expect(uploadResponse.status).toBe(400)
      expect(uploadData.error).toBe('Invalid File Size')
      expect(uploadData.message).toContain('File size must be between 1 byte and 10MB')
      expect(mockSupabaseClient.storage.upload).not.toHaveBeenCalled()
    })

    it('should handle unsupported file types', async () => {
      // Mock file with unsupported type
      const mockFile = {
        name: 'test.exe',
        type: 'application/x-msdownload',
        size: 1024
      }

      const mockFormData = {
        get: jest.fn().mockReturnValue(mockFile)
      }

      const uploadRequest = createMockRequest('POST', mockFormData)
      uploadRequest.formData = jest.fn().mockResolvedValue(mockFormData)

      const uploadResponse = await uploadHandler(uploadRequest)
      const uploadData = await uploadResponse.json()

      expect(uploadResponse.status).toBe(400)
      expect(uploadData.error).toBe('Invalid File Type')
      expect(uploadData.message).toContain('File type application/x-msdownload is not supported')
      expect(mockSupabaseClient.storage.upload).not.toHaveBeenCalled()
    })

    it('should handle authentication errors', async () => {
      // Mock authentication failure
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: new Error('Not authenticated')
      })

      const uploadRequest = createMockRequest('POST', new FormData())
      uploadRequest.formData = jest.fn().mockResolvedValue(new FormData())

      const uploadResponse = await uploadHandler(uploadRequest)
      const uploadData = await uploadResponse.json()

      expect(uploadResponse.status).toBe(401)
      expect(uploadData.error).toBe('Unauthorized')
      expect(uploadData.message).toContain('Authentication required')
    })

    it('should handle document not found errors', async () => {
      // Mock document that doesn't exist
      mockGetDocument.mockResolvedValue(null)

      const processRequest = createMockRequest('POST', { chunkSize: 500, chunkOverlap: 50 })

      const processResponse = await processHandler(processRequest, {
        params: Promise.resolve({ id: '550e8400-e29b-41d4-a716-446655440001' })
      })
      const processData = await processResponse.json()

      expect(processResponse.status).toBe(404)
      expect(processData.error).toBe('Not Found')
      expect(processData.message).toContain('Document not found')
    })

    it('should handle validation errors for processing options', async () => {
      // Mock document
      const testDocument = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        user_id: '550e8400-e29b-41d4-a716-446655440000',
        filename: 'test.pdf',
        file_size: 1024,
        mime_type: 'application/pdf',
        storage_path: '550e8400-e29b-41d4-a716-446655440000/1234567890-uuid.pdf',
        processing_status: 'pending' as DocumentProcessingStatus,
        chunk_count: 0,
        error_message: null,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      }

      mockGetDocument.mockResolvedValue(testDocument)

      // Mock invalid processing options (chunkSize too large)
      const processRequest = createMockRequest('POST', { chunkSize: 3000, chunkOverlap: 50 })

      const processResponse = await processHandler(processRequest, {
        params: Promise.resolve({ id: testDocument.id })
      })
      const processData = await processResponse.json()

      expect(processResponse.status).toBe(400)
      expect(processData.error).toBe('Validation Error')
      expect(processData.message).toContain('Invalid processing options')
      expect(mockProcessDocument).not.toHaveBeenCalled()
    })

    it('should handle status checks for non-existent documents', async () => {
      // Mock document not found
      mockGetDocument.mockResolvedValue(null)

      const statusRequest = createMockRequest('GET')

      const statusResponse = await statusHandler(statusRequest, {
        params: Promise.resolve({ id: '550e8400-e29b-41d4-a716-446655440001' })
      })
      const statusData = await statusResponse.json()

      expect(statusResponse.status).toBe(404)
      expect(statusData.error).toBe('Not Found')
      expect(statusData.message).toContain('Document not found')
    })
  })

  describe('Document Processing Performance and Edge Cases', () => {
    it('should handle very large documents with many chunks', async () => {
      // Mock document with large file
      const testDocument = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        user_id: '550e8400-e29b-41d4-a716-446655440000',
        filename: 'large-document.pdf',
        file_size: 9 * 1024 * 1024, // 9MB
        mime_type: 'application/pdf',
        storage_path: '550e8400-e29b-41d4-a716-446655440000/1234567890-uuid.pdf',
        processing_status: 'pending' as DocumentProcessingStatus,
        chunk_count: 0,
        error_message: null,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      }

      // Mock processing result with many chunks
      const manyChunks = Array.from({ length: 50 }, (_, i) => ({
        content: `chunk ${i + 1} content`,
        tokenCount: 20,
        qdrantPointId: `qdrant-${i + 1}`
      }))

      mockProcessDocument.mockResolvedValue({
        chunks: manyChunks,
        processingTime: 5000 // 5 seconds
      })

      mockUpdateDocument.mockResolvedValueOnce({ ...testDocument, processing_status: 'processing' as DocumentProcessingStatus })
      mockUpdateDocument.mockResolvedValueOnce({ ...testDocument, processing_status: 'completed' as DocumentProcessingStatus as DocumentProcessingStatus, chunk_count: 50 })

      const processRequest = createMockRequest('POST', { chunkSize: 200, chunkOverlap: 20 })

      const processResponse = await processHandler(processRequest, {
        params: Promise.resolve({ id: testDocument.id })
      })
      const processData = await processResponse.json()

      expect(processResponse.status).toBe(200)
      expect(processData.data.chunksCreated).toBe(50)
      expect(processData.data.processingTime).toBe(5000)
      expect(mockCreateDocumentChunks).toHaveBeenCalledWith(expect.arrayContaining(manyChunks))
    })

    it('should handle documents with minimal content', async () => {
      // Mock document with minimal content
      const testDocument = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        user_id: '550e8400-e29b-41d4-a716-446655440000',
        filename: 'minimal.txt',
        file_size: 100,
        mime_type: 'text/plain',
        storage_path: '550e8400-e29b-41d4-a716-446655440000/1234567890-uuid.txt',
        processing_status: 'pending' as DocumentProcessingStatus,
        chunk_count: 0,
        error_message: null,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      }

      // Mock processing result with single chunk
      mockProcessDocument.mockResolvedValue({
        chunks: [
          { content: 'minimal content', tokenCount: 5, qdrantPointId: 'qdrant-1' }
        ],
        processingTime: 100
      })

      mockUpdateDocument.mockResolvedValueOnce({ ...testDocument, processing_status: 'processing' as DocumentProcessingStatus })
      mockUpdateDocument.mockResolvedValueOnce({ ...testDocument, processing_status: 'completed' as DocumentProcessingStatus as DocumentProcessingStatus, chunk_count: 1 })

      const processRequest = createMockRequest('POST', { chunkSize: 500, chunkOverlap: 50 })

      const processResponse = await processHandler(processRequest, {
        params: Promise.resolve({ id: testDocument.id })
      })
      const processData = await processResponse.json()

      expect(processResponse.status).toBe(200)
      expect(processData.data.chunksCreated).toBe(1)
      expect(processData.data.processingTime).toBe(100)
    })

    it('should handle different file types correctly', async () => {
      const fileTypes = [
        { type: 'application/pdf', extension: 'pdf' },
        { type: 'text/plain', extension: 'txt' },
        { type: 'text/markdown', extension: 'md' }
      ]

      for (const fileType of fileTypes) {
        // Mock document
        const testDocument = {
          id: '550e8400-e29b-41d4-a716-446655440001',
          user_id: '550e8400-e29b-41d4-a716-446655440000',
          filename: `test.${fileType.extension}`,
          file_size: 1024,
          mime_type: fileType.type,
          storage_path: `550e8400-e29b-41d4-a716-446655440000/1234567890-uuid.${fileType.extension}`,
          processing_status: 'pending' as DocumentProcessingStatus,
          chunk_count: 0,
          error_message: null,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z'
        }

        mockProcessDocument.mockResolvedValue({
          chunks: [
            { content: `content from ${fileType.type}`, tokenCount: 10, qdrantPointId: 'qdrant-1' }
          ],
          processingTime: 100
        })

        mockUpdateDocument.mockResolvedValueOnce({ ...testDocument, processing_status: 'processing' as DocumentProcessingStatus })
        mockUpdateDocument.mockResolvedValueOnce({ ...testDocument, processing_status: 'completed' as DocumentProcessingStatus as DocumentProcessingStatus, chunk_count: 1 })

        const processRequest = createMockRequest('POST', { chunkSize: 500, chunkOverlap: 50 })

        const processResponse = await processHandler(processRequest, {
          params: Promise.resolve({ id: testDocument.id })
        })
        const processData = await processResponse.json()

        expect(processResponse.status).toBe(200)
        expect(processData.data.chunksCreated).toBe(1)
        expect(processData.message).toContain('Document processed successfully')

        // Reset mocks for next iteration
        jest.clearAllMocks()
        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: { id: '550e8400-e29b-41d4-a716-446655440000', email: 'test@example.com' } },
          error: null
        })
      }
    })

    it('should handle processing with custom chunking parameters', async () => {
      // Mock document
      const testDocument = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        user_id: '550e8400-e29b-41d4-a716-446655440000',
        filename: 'test.pdf',
        file_size: 1024,
        mime_type: 'application/pdf',
        storage_path: '550e8400-e29b-41d4-a716-446655440000/1234567890-uuid.pdf',
        processing_status: 'pending' as DocumentProcessingStatus,
        chunk_count: 0,
        error_message: null,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      }

      // Test different chunking parameters
      const chunkingParams = [
        { chunkSize: 200, chunkOverlap: 20 },
        { chunkSize: 1000, chunkOverlap: 100 },
        { chunkSize: 500, chunkOverlap: 0 }
      ]

      for (const params of chunkingParams) {
        mockProcessDocument.mockResolvedValue({
          chunks: [
            { content: 'chunk 1', tokenCount: 10, qdrantPointId: 'qdrant-1' },
            { content: 'chunk 2', tokenCount: 15, qdrantPointId: 'qdrant-2' }
          ],
          processingTime: 100
        })

        mockUpdateDocument.mockResolvedValueOnce({ ...testDocument, processing_status: 'processing' as DocumentProcessingStatus })
        mockUpdateDocument.mockResolvedValueOnce({ ...testDocument, processing_status: 'completed' as DocumentProcessingStatus as DocumentProcessingStatus, chunk_count: 2 })

        const processRequest = createMockRequest('POST', params)

        const processResponse = await processHandler(processRequest, {
          params: Promise.resolve({ id: testDocument.id })
        })
        const processData = await processResponse.json()

        expect(processResponse.status).toBe(200)
        expect(processData.data.chunksCreated).toBe(2)
        expect(mockProcessDocument).toHaveBeenCalledWith(
          expect.objectContaining({ id: testDocument.id }),
          params
        )

        // Reset mocks for next iteration
        jest.clearAllMocks()
        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: { id: '550e8400-e29b-41d4-a716-446655440000', email: 'test@example.com' } },
          error: null
        })
      }
    })
  })
})