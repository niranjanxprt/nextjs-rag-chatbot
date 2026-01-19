/**
 * Prompts API Route - Langfuse Proxy
 *
 * Proxies requests to Langfuse API with proper authentication.
 * This keeps the secret key secure on the backend.
 */

import { NextRequest, NextResponse } from 'next/server'

// GET /api/prompts - List prompts from Langfuse
export async function GET(request: NextRequest) {
  try {
    // Get Langfuse credentials from environment
    const publicKey = process.env.LANGFUSE_PUBLIC_KEY
    const secretKey = process.env.LANGFUSE_SECRET_KEY
    const baseUrl = process.env.LANGFUSE_BASE_URL || 'https://cloud.langfuse.com'

    if (!publicKey || !secretKey) {
      return NextResponse.json({ error: 'Langfuse API keys not configured' }, { status: 500 })
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const hideSystem = searchParams.get('hide_system') === 'true'
    const includeContent = searchParams.get('include_content') !== 'false' // Default true

    // Create Basic Auth credentials
    const credentials = Buffer.from(`${publicKey}:${secretKey}`).toString('base64')

    // Fetch from Langfuse API
    const response = await fetch(`${baseUrl}/api/public/v2/prompts`, {
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Langfuse API error:', response.status, errorText)
      return NextResponse.json(
        { error: `Langfuse API error: ${response.status}` },
        { status: response.status }
      )
    }

    let prompts = await response.json()

    // Handle both array and wrapped response
    if (!Array.isArray(prompts)) {
      prompts = prompts.data || []
    }

    // If includeContent is true, fetch full content for each prompt
    if (includeContent && prompts.length > 0) {
      const promptsWithContent = await Promise.all(
        prompts.map(async (prompt: any) => {
          try {
            const detailResponse = await fetch(
              `${baseUrl}/api/public/v2/prompts/${encodeURIComponent(prompt.name)}`,
              {
                headers: {
                  Authorization: `Basic ${credentials}`,
                  'Content-Type': 'application/json',
                },
              }
            )
            if (detailResponse.ok) {
              return await detailResponse.json()
            }
            return prompt
          } catch (error) {
            console.error(`Error fetching prompt ${prompt.name}:`, error)
            return prompt
          }
        })
      )
      prompts = promptsWithContent
    }

    // Filter system prompts if requested
    if (hideSystem) {
      const systemPrompts = ['haystack-rag-generation', 'haystack-rag-streaming', 'general-chat']
      prompts = prompts.filter((p: any) => !systemPrompts.includes(p.name))
    }

    return NextResponse.json(prompts)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
