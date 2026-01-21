/**
 * Document Processor Service
 * 
 * Handles text extraction from various document formats and chunking for RAG
 */

import pdfParse from 'pdf-parse'
import { DocumentMetadata, ChunkData, ProcessingResult } from '@/lib/types/rag'

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_CHUNK_SIZE = 500
const DEFAULT_OVERLAP = 50
const MAX_CHUNK_SIZE = 600 // Maximum before falling back to character-based chunking

// Sentence boundary regex
const SENTENCE_BOUNDARY_REGEX = /[.!?]\s+/

// =============================================================================
// Text Extraction
// =============================================================================

/**
 * Extract text content from various file formats
 * @param file - File buffer
 * @param type - MIME type (application/pdf, text/plain, text/markdown)
 * @returns Extracted text content
 */
export async function extractText(file: Buffer, type: string): Promise<string> {
  try {
    switch (type) {
      case 'application/pdf':
        return await extractPdfText(file)
      
      case 'text/plain':
      case 'text/markdown':
        return extractPlainText(file)
      
      default:
        throw new Error(`Unsupported file type: ${type}`)
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Text extraction failed: ${error.message}`)
    }
    throw new Error('Text extraction failed: Unknown error')
  }
}

/**
 * Extract text from PDF using pdf-parse
 */
async function extractPdfText(file: Buffer): Promise<string> {
  try {
    const data = await pdfParse(file)
    
    if (!data.text || data.text.trim().length === 0) {
      throw new Error('PDF contains no extractable text')
    }
    
    return data.text
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`PDF extraction failed: ${error.message}`)
    }
    throw new Error('PDF extraction failed: Unknown error')
  }
}

/**
 * Extract text from plain text or markdown files
 */
function extractPlainText(file: Buffer): string {
  try {
    const text = file.toString('utf-8')
    
    if (!text || text.trim().length === 0) {
      throw new Error('File contains no text')
    }
    
    return text
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Text extraction failed: ${error.message}`)
    }
    throw new Error('Text extraction failed: Unknown error')
  }
}

// =============================================================================
// Text Chunking
// =============================================================================

/**
 * Split text into semantic chunks with overlap
 * @param text - Full document text
 * @param chunkSize - Target chunk size in characters (default: 500)
 * @param overlap - Overlap between chunks in characters (default: 50)
 * @returns Array of text chunks with positions
 */
export function chunkText(
  text: string,
  chunkSize: number = DEFAULT_CHUNK_SIZE,
  overlap: number = DEFAULT_OVERLAP
): ChunkData[] {
  if (!text || text.trim().length === 0) {
    return []
  }

  // Try sentence-based chunking first
  const sentenceChunks = chunkBySentences(text, chunkSize, overlap)
  
  // Check if any chunks exceed max size
  const hasOversizedChunks = sentenceChunks.some(
    chunk => chunk.content.length > MAX_CHUNK_SIZE
  )
  
  // Fall back to character-based chunking if needed
  if (hasOversizedChunks) {
    return chunkByCharacters(text, chunkSize, overlap)
  }
  
  return sentenceChunks
}

/**
 * Chunk text by sentence boundaries
 */
function chunkBySentences(
  text: string,
  chunkSize: number,
  overlap: number
): ChunkData[] {
  const chunks: ChunkData[] = []
  const sentences = text.split(SENTENCE_BOUNDARY_REGEX)
  
  let currentChunk = ''
  let currentStartChar = 0
  let position = 0
  let charPosition = 0
  
  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i].trim()
    if (!sentence) continue
    
    const sentenceWithSpace = i < sentences.length - 1 ? sentence + '. ' : sentence
    
    // If adding this sentence would exceed chunk size, save current chunk
    if (currentChunk.length > 0 && 
        currentChunk.length + sentenceWithSpace.length > chunkSize) {
      
      chunks.push({
        content: currentChunk.trim(),
        position,
        start_char: currentStartChar,
        end_char: currentStartChar + currentChunk.length
      })
      
      position++
      
      // Start new chunk with overlap
      const overlapText = getOverlapText(currentChunk, overlap)
      currentStartChar = currentStartChar + currentChunk.length - overlapText.length
      currentChunk = overlapText + sentenceWithSpace
    } else {
      // Add sentence to current chunk
      if (currentChunk.length === 0) {
        currentStartChar = charPosition
      }
      currentChunk += sentenceWithSpace
    }
    
    charPosition += sentenceWithSpace.length
  }
  
  // Add final chunk if not empty
  if (currentChunk.trim().length > 0) {
    chunks.push({
      content: currentChunk.trim(),
      position,
      start_char: currentStartChar,
      end_char: currentStartChar + currentChunk.length
    })
  }
  
  return chunks
}

/**
 * Chunk text by character count (fallback method)
 */
function chunkByCharacters(
  text: string,
  chunkSize: number,
  overlap: number
): ChunkData[] {
  const chunks: ChunkData[] = []
  let position = 0
  let startChar = 0
  
  while (startChar < text.length) {
    const endChar = Math.min(startChar + chunkSize, text.length)
    const content = text.substring(startChar, endChar)
    
    chunks.push({
      content: content.trim(),
      position,
      start_char: startChar,
      end_char: endChar
    })
    
    position++
    startChar = endChar - overlap
    
    // Prevent infinite loop
    if (startChar >= text.length) break
  }
  
  return chunks
}

/**
 * Get overlap text from the end of a chunk
 */
function getOverlapText(text: string, overlapSize: number): string {
  if (text.length <= overlapSize) {
    return text
  }
  
  // Try to find a word boundary for cleaner overlap
  const overlapText = text.slice(-overlapSize)
  const firstSpaceIndex = overlapText.indexOf(' ')
  
  if (firstSpaceIndex > 0 && firstSpaceIndex < overlapSize / 2) {
    return overlapText.slice(firstSpaceIndex + 1)
  }
  
  return overlapText
}

// =============================================================================
// Document Processing Pipeline
// =============================================================================

/**
 * Process an uploaded document: extract text, chunk, and prepare for embedding
 * @param file - Uploaded file buffer
 * @param metadata - Document metadata (user_id, project_id, name, size)
 * @returns Processing result with document_id and status
 */
export async function processDocument(
  file: Buffer,
  metadata: DocumentMetadata
): Promise<{ text: string; chunks: ChunkData[] }> {
  // Validate file
  if (!file || file.length === 0) {
    throw new Error('Document is empty')
  }
  
  if (file.length > 10 * 1024 * 1024) {
    throw new Error('File size exceeds 10MB limit')
  }
  
  // Extract text
  const text = await extractText(file, metadata.type)
  
  if (!text || text.trim().length === 0) {
    throw new Error('No text content extracted from document')
  }
  
  // Chunk text
  const chunks = chunkText(text)
  
  if (chunks.length === 0) {
    throw new Error('Failed to create chunks from document text')
  }
  
  return { text, chunks }
}

// =============================================================================
// Exports
// =============================================================================

export const DocumentProcessor = {
  extractText,
  chunkText,
  processDocument,
}
