/**
 * Langfuse Configuration Endpoint
 *
 * Returns Langfuse API configuration for frontend to use.
 * This keeps the secret key secure on the backend.
 */

import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Get Langfuse configuration from environment variables
    const publicKey = process.env.LANGFUSE_PUBLIC_KEY || process.env.NEXT_PUBLIC_LANGFUSE_PUBLIC_KEY
    const baseUrl =
      process.env.LANGFUSE_BASE_URL ||
      process.env.NEXT_PUBLIC_LANGFUSE_BASE_URL ||
      'https://cloud.langfuse.com'

    if (!publicKey) {
      return NextResponse.json({ error: 'Langfuse configuration not available' }, { status: 500 })
    }

    return NextResponse.json({
      public_key: publicKey,
      base_url: baseUrl,
    })
  } catch (error) {
    console.error('Error fetching Langfuse config:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
