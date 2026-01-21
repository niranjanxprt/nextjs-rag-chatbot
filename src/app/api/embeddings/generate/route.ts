/**
 * Embeddings Generation API Route (Internal)
 * 
 * Generates embeddings for document chunks and stores them in Qdrant
 */

import { NextRequest, NextResponse } from 'next/server'
import { embedChunks } from '@/lib/services/embeddings'
import { storeVectors, initializeCollection } from '@/lib/services/vector-search'
import { ChunkWithId, EmbeddingMetadata } from '@/lib/types/rag'

// =============================================================================
// POST - Generate embeddings and store in Qdrant
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { chunks, metadata } = body as {
      chunks: ChunkWithId[]
      metadata: EmbeddingMetadata
    }

    // Validate input
    if (!chunks || !Array.isArray(chunks) || chunks.length === 0) {
      return NextResponse.json(
        { error: 'Chunks array is required and must not be empty' },
        { status: 400 }
      )
    }

    if (!metadata || !metadata.user_id || !metadata.document_name) {
      return NextResponse.json(
        { error: 'Metadata with user_id and document_name is required' },
        { status: 400 }
      )
    }

    // Ensure Qdrant collection exists
    await initializeCollection()

    // Generate embeddings
    const { embeddings, chunks: processedChunks } = await embedChunks(chunks, metadata)

    // Prepare payloads for Qdrant
    const payloads = processedChunks.map((chunk, index) => ({
      chunk_id: chunk.chunk_id,
      document_id: chunk.document_id,
      user_id: metadata.user_id,
      project_id: metadata.project_id,
      content: chunk.content,
      document_name: metadata.document_name,
    }))

    // Store vectors in Qdrant
    const qdrantIds = await storeVectors(embeddings, payloads)

    // Prepare results
    const results = processedChunks.map((chunk, index) => ({
      chunk_id: chunk.chunk_id,
      qdrant_id: qdrantIds[index],
      success: true,
    }))

    return NextResponse.json(
      {
        success: true,
        results,
        message: `Successfully generated and stored ${results.length} embeddings`,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Embeddings generation error:', error)

    return NextResponse.json(
      {
        error: 'Failed to generate embeddings',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// =============================================================================
// OPTIONS - CORS support
// =============================================================================

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
