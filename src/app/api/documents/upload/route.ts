/**
 * Document Upload API Route
 * 
 * Handles file uploads with validation, streaming support,
 * and Supabase Storage integration
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createDocument } from '@/lib/database/queries'
import { fileUploadSchema, supportedMimeTypes } from '@/lib/schemas/validation'
import { v4 as uuidv4 } from 'uuid'

// =============================================================================
// Configuration
// =============================================================================

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const UPLOAD_TIMEOUT = 30000 // 30 seconds

// =============================================================================
// Helper Functions
// =============================================================================

function validateFileType(file: File): boolean {
  return supportedMimeTypes.includes(file.type as any)
}

function validateFileSize(file: File): boolean {
  return file.size > 0 && file.size <= MAX_FILE_SIZE
}

function generateStoragePath(userId: string, filename: string): string {
  const timestamp = Date.now()
  const uuid = uuidv4()
  const extension = filename.split('.').pop()
  return `${userId}/${timestamp}-${uuid}.${extension}`
}

async function uploadToSupabaseStorage(
  file: File,
  storagePath: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    
    // Convert File to ArrayBuffer for Supabase upload
    const arrayBuffer = await file.arrayBuffer()
    
    const { error } = await supabase.storage
      .from('documents')
      .upload(storagePath, arrayBuffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      })
    
    if (error) {
      console.error('Supabase storage error:', error)
      return { success: false, error: error.message }
    }
    
    return { success: true }
  } catch (error) {
    console.error('Upload error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Upload failed' 
    }
  }
}

// =============================================================================
// API Route Handler
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      )
    }
    
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
          message: `File type ${file.type} is not supported. Supported types: ${supportedMimeTypes.join(', ')}` 
        },
        { status: 400 }
      )
    }
    
    if (!validateFileSize(file)) {
      return NextResponse.json(
        { 
          error: 'Invalid File Size', 
          message: `File size must be between 1 byte and ${MAX_FILE_SIZE / 1024 / 1024}MB` 
        },
        { status: 400 }
      )
    }
    
    // Generate storage path
    const storagePath = generateStoragePath(user.id, file.name)
    
    // Upload to Supabase Storage
    const uploadResult = await uploadToSupabaseStorage(file, storagePath)
    
    if (!uploadResult.success) {
      return NextResponse.json(
        { 
          error: 'Upload Failed', 
          message: uploadResult.error || 'Failed to upload file to storage' 
        },
        { status: 500 }
      )
    }
    
    // Create document record in database
    const document = await createDocument({
      user_id: user.id,
      filename: file.name,
      file_size: file.size,
      mime_type: file.type,
      storage_path: storagePath,
      processing_status: 'pending'
    })
    
    // Return success response
    return NextResponse.json({
      success: true,
      data: {
        document,
        message: 'File uploaded successfully'
      }
    }, { status: 201 })
    
  } catch (error) {
    console.error('Upload API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error', 
        message: error instanceof Error ? error.message : 'An unexpected error occurred' 
      },
      { status: 500 }
    )
  }
}

// =============================================================================
// Streaming Upload Handler (for large files)
// =============================================================================

export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      )
    }
    
    // Get upload parameters from headers
    const filename = request.headers.get('x-filename')
    const fileSize = parseInt(request.headers.get('x-file-size') || '0')
    const mimeType = request.headers.get('x-mime-type')
    
    if (!filename || !fileSize || !mimeType) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Missing required headers: x-filename, x-file-size, x-mime-type' },
        { status: 400 }
      )
    }
    
    // Validate file metadata
    if (!supportedMimeTypes.includes(mimeType as any)) {
      return NextResponse.json(
        { 
          error: 'Invalid File Type', 
          message: `File type ${mimeType} is not supported` 
        },
        { status: 400 }
      )
    }
    
    if (fileSize <= 0 || fileSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        { 
          error: 'Invalid File Size', 
          message: `File size must be between 1 byte and ${MAX_FILE_SIZE / 1024 / 1024}MB` 
        },
        { status: 400 }
      )
    }
    
    // Generate storage path
    const storagePath = generateStoragePath(user.id, filename)
    
    // Get request body as stream
    if (!request.body) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'No file data provided' },
        { status: 400 }
      )
    }
    
    // Convert ReadableStream to ArrayBuffer
    const reader = request.body.getReader()
    const chunks: Uint8Array[] = []
    let totalSize = 0
    
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        chunks.push(value)
        totalSize += value.length
        
        // Check if we're exceeding the expected file size
        if (totalSize > fileSize) {
          return NextResponse.json(
            { error: 'Bad Request', message: 'File size mismatch' },
            { status: 400 }
          )
        }
      }
    } finally {
      reader.releaseLock()
    }
    
    // Combine chunks into single ArrayBuffer
    const arrayBuffer = new ArrayBuffer(totalSize)
    const uint8Array = new Uint8Array(arrayBuffer)
    let offset = 0
    
    for (const chunk of chunks) {
      uint8Array.set(chunk, offset)
      offset += chunk.length
    }
    
    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, arrayBuffer, {
        contentType: mimeType,
        cacheControl: '3600',
        upsert: false
      })
    
    if (uploadError) {
      console.error('Supabase storage error:', uploadError)
      return NextResponse.json(
        { error: 'Upload Failed', message: uploadError.message },
        { status: 500 }
      )
    }
    
    // Create document record in database
    const document = await createDocument({
      user_id: user.id,
      filename,
      file_size: fileSize,
      mime_type: mimeType,
      storage_path: storagePath,
      processing_status: 'pending'
    })
    
    // Return success response
    return NextResponse.json({
      success: true,
      data: {
        document,
        message: 'File uploaded successfully via streaming'
      }
    }, { status: 201 })
    
  } catch (error) {
    console.error('Streaming upload API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error', 
        message: error instanceof Error ? error.message : 'An unexpected error occurred' 
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
      'Access-Control-Allow-Methods': 'POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-filename, x-file-size, x-mime-type',
    },
  })
}