/**
 * Search Suggestions API Route
 * 
 * TODO: Migrate to Convex
 */

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: 'Not implemented - migration to Convex in progress' },
    { status: 501 }
  )
}
