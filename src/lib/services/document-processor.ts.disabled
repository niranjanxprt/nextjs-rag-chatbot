/**
 * Document Processing Service
 *
 * Handles text extraction, chunking, and embedding generation
 * for uploaded documents
 */

import { createClient } from '@/lib/supabase/server'
import type { Document } from '@/lib/types/database'
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'
import { generateEmbeddings } from './embeddings'
import { upsertVectors, type VectorPoint } from './qdrant'
import { v4 as uuidv4 } from 'uuid'
import pdfParse from 'pdf-parse'

// =============================================================================
// Types
// =============================================================================

export interface ProcessingOptions {
  chunkSize?: number
  chunkOverlap?: number
}

export interface ProcessedChunk {
  content: string
  tokenCount: number
  qdrantPointId?: string
}

export interface ProcessingResult {
  chunks: ProcessedChunk[]
  processingTime: number
}

// =============================================================================
// Configuration
// =============================================================================

const DEFAULT_CHUNK_SIZE = 500
const DEFAULT_CHUNK_OVERLAP = 50

// Services are imported from separate modules

// =============================================================================
// Text Extraction Functions
// =============================================================================

async function extractTextFromPDF(buffer: ArrayBuffer): Promise<string> {
  try {
    const data = await pdfParse(Buffer.from(buffer))
    return data.text
  } catch (error) {
    console.error('PDF extraction error:', error)
    throw new Error('Failed to extract text from PDF')
  }
}

async function extractTextFromPlainText(buffer: ArrayBuffer): Promise<string> {
  try {
    const decoder = new TextDecoder('utf-8')
    return decoder.decode(buffer)
  } catch (error) {
    console.error('Text extraction error:', error)
    throw new Error('Failed to extract text from file')
  }
}

async function extractTextFromMarkdown(buffer: ArrayBuffer): Promise<string> {
  try {
    const decoder = new TextDecoder('utf-8')
    return decoder.decode(buffer)
  } catch (error) {
    console.error('Markdown extraction error:', error)
    throw new Error('Failed to extract text from Markdown file')
  }
}

async function extractTextFromDocument(buffer: ArrayBuffer, mimeType: string): Promise<string> {
  switch (mimeType) {
    case 'application/pdf':
      return extractTextFromPDF(buffer)

    case 'text/plain':
      return extractTextFromPlainText(buffer)

    case 'text/markdown':
      return extractTextFromMarkdown(buffer)

    case 'application/msword':
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      // For now, treat as plain text - in production, use proper Word parser
      return extractTextFromPlainText(buffer)

    default:
      throw new Error(`Unsupported file type: ${mimeType}`)
  }
}

// =============================================================================
// Text Chunking Functions
// =============================================================================

async function chunkText(text: string, options: ProcessingOptions = {}): Promise<string[]> {
  const chunkSize = options.chunkSize || DEFAULT_CHUNK_SIZE
  const chunkOverlap = options.chunkOverlap || DEFAULT_CHUNK_OVERLAP

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap,
    separators: ['\n\n', '\n', '. ', ' ', ''],
  })

  const chunks = await splitter.splitText(text)

  // Filter out very small chunks
  return chunks.filter(chunk => chunk.trim().length > 10)
}

// =============================================================================
// Token Counting Functions
// =============================================================================

function estimateTokenCount(text: string): number {
  // Rough estimation: 1 token ≈ 4 characters for English text
  // This is a simplified approach - in production, use tiktoken for accuracy
  return Math.ceil(text.length / 4)
}

// =============================================================================
// Embedding and Vector Storage Functions
// =============================================================================

async function generateAndStoreVectors(chunks: string[], document: Document): Promise<string[]> {
  try {
    console.log('Generating embeddings for chunks...')

    // Generate embeddings for all chunks
    const embeddingResult = await generateEmbeddings(chunks, {
      useCache: true,
    })

    console.log(`Generated ${embeddingResult.embeddings.length} embeddings`)

    // Prepare vector points for Qdrant
    const vectorPoints: VectorPoint[] = chunks.map((chunk, index) => ({
      id: uuidv4(),
      vector: embeddingResult.embeddings[index],
      payload: {
        document_id: document.id,
        user_id: document.user_id,
        chunk_index: index,
        content: chunk,
        filename: document.filename,
        created_at: new Date().toISOString(),
      },
    }))

    // Store vectors in Qdrant
    console.log('Storing vectors in Qdrant...')
    await upsertVectors(vectorPoints)

    return vectorPoints.map(point => point.id)
  } catch (error) {
    console.error('Error generating and storing vectors:', error)
    throw new Error('Failed to generate embeddings and store vectors')
  }
}

// =============================================================================
// File Download Functions
// =============================================================================

async function downloadDocumentFromStorage(document: Document): Promise<ArrayBuffer> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.storage.from('documents').download(document.storage_path)

    if (error) {
      console.error('Storage download error:', error)
      throw new Error('Failed to download document from storage')
    }

    return await data.arrayBuffer()
  } catch (error) {
    console.error('Document download error:', error)
    throw new Error('Failed to download document')
  }
}

// =============================================================================
// Main Processing Function
// =============================================================================

export async function processDocument(
  document: Document,
  options: ProcessingOptions = {}
): Promise<ProcessingResult> {
  const startTime = Date.now()

  try {
    console.log(`Starting processing for document: ${document.id}`)

    // Step 1: Download document from storage
    console.log('Downloading document from storage...')
    const buffer = await downloadDocumentFromStorage(document)

    // Step 2: Extract text content
    console.log('Extracting text content...')
    const text = await extractTextFromDocument(buffer, document.mime_type)

    if (!text || text.trim().length === 0) {
      throw new Error('No text content found in document')
    }

    console.log(`Extracted ${text.length} characters of text`)

    // Step 3: Chunk the text
    console.log('Chunking text...')
    const chunks = await chunkText(text, options)

    if (chunks.length === 0) {
      throw new Error('No chunks generated from document')
    }

    console.log(`Generated ${chunks.length} chunks`)

    // Step 4: Generate embeddings and store vectors
    console.log('Generating embeddings and storing vectors...')
    const qdrantPointIds = await generateAndStoreVectors(chunks, document)

    // Step 5: Prepare result
    const processedChunks: ProcessedChunk[] = chunks.map((chunk, index) => ({
      content: chunk,
      tokenCount: estimateTokenCount(chunk),
      qdrantPointId: qdrantPointIds[index],
    }))

    const processingTime = Date.now() - startTime

    console.log(`Document processing completed in ${processingTime}ms`)

    return {
      chunks: processedChunks,
      processingTime,
    }
  } catch (error) {
    console.error('Document processing failed:', error)
    throw error
  }
}

// =============================================================================
// Utility Functions
// =============================================================================

export async function reprocessDocument(
  document: Document,
  options: ProcessingOptions = {}
): Promise<ProcessingResult> {
  try {
    // Delete existing vectors from Qdrant
    const { deleteVectorsByFilter } = await import('./qdrant')

    await deleteVectorsByFilter({
      document_id: document.id,
    })

    // Process document again
    return await processDocument(document, options)
  } catch (error) {
    console.error('Document reprocessing failed:', error)
    throw error
  }
}

export async function deleteDocumentVectors(documentId: string): Promise<void> {
  try {
    const { deleteVectorsByFilter } = await import('./qdrant')

    await deleteVectorsByFilter({
      document_id: documentId,
    })

    console.log(`Deleted vectors for document: ${documentId}`)
  } catch (error) {
    console.error('Vector deletion failed:', error)
    throw error
  }
}
