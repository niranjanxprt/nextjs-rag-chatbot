/**
 * Document Upload API Route
 *
 * Handles file uploads with validation and Convex Storage integration
 */

import { NextRequest, NextResponse } from 'next/server'
import { extractSessionToken, getAuthenticatedConvexClient } from '@/lib/convex/client'
import { api } from '../../../../../convex/_generated/api'
import { supportedMimeTypes } from '@/lib/schemas/validation'

// =============================================================================
// Configuration
// =============================================================================

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

// =============================================================================
// Helper Functions
// =============================================================================

function validateFileType(file: File): boolean {
  return supportedMimeTypes.includes(file.type as any)
}

function validateFileSize(file: File): boolean {
  return file.size > 0 && file.size <= MAX_FILE_SIZE
}

// =============================================================================
// API Route Handler
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    // Extract session token
    const token = extractSessionToken(request)
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get authenticated Convex client
    const convex = getAuthenticatedConvexClient(token)

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file
    if (!validateFileType(file)) {
      return NextResponse.json(
        {
          error: 'Invalid File Type',
          message: `File type ${file.type} is not supported. Supported types: ${supportedMimeTypes.join(', ')}`,
        },
        { status: 400 }
      )
    }

    if (!validateFileSize(file)) {
      return NextResponse.json(
        {
          error: 'Invalid File Size',
          message: `File size must be between 1 byte and ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        },
        { status: 400 }
      )
    }

    // Get upload URL from Convex
    const uploadUrl = await convex.mutation(api.storage.upload.generateUploadUrl)

    // Upload file to Convex storage
    const result = await fetch(uploadUrl, {
      method: 'POST',
      headers: { 'Content-Type': file.type },
      body: file,
    })

    if (!result.ok) {
      return NextResponse.json(
        {
          error: 'Upload Failed',
          message: 'Failed to upload file to storage',
        },
        { status: 500 }
      )
    }

    const { storageId } = await result.json()

    // Create document record in Convex
    const document = await convex.mutation(api.mutations.documents.create, {
      title: file.name,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
      storage_id: storageId,
    })

    // Return success response
    return NextResponse.json(
      {
        success: true,
        data: {
          document,
          message: 'File uploaded successfully',
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Upload API error:', error)

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
      { status: 500 }
    )
  }
}

// =============================================================================
// Options Handler (for CORS)
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
