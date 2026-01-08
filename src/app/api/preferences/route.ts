/**
 * User Preferences API Route
 *
 * Handles retrieval and updating of user preferences
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getUserPreferences,
  createUserPreferences,
  updateUserPreferences,
} from '@/lib/database/queries'
import { createError, createErrorResponse, withErrorHandling } from '@/lib/utils/error-handler'
import type { UserPreferencesInsert, UserPreferencesUpdate } from '@/lib/types/database'

// =============================================================================
// GET /api/preferences - Get user preferences
// =============================================================================

export const GET = withErrorHandling(async (request: NextRequest) => {
  try {
    // Check authentication
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      throw createError.unauthorized('Authentication required')
    }

    if (!user) {
      throw createError.unauthorized('Authentication required')
    }

    // Get or create preferences
    let preferences = await getUserPreferences(user.id)

    if (!preferences) {
      // Create default preferences if they don't exist
      const defaultPreferences: UserPreferencesInsert = {
        user_id: user.id,
        theme: 'system',
        default_project_id: null,
        chat_settings: {
          temperature: 0.1,
          maxTokens: 1000,
        },
        ui_settings: {
          sidebarCollapsed: false,
          useKnowledgeBase: true,
        },
      }

      preferences = await createUserPreferences(defaultPreferences)
    }

    return NextResponse.json(
      {
        preferences,
        success: true,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('GET /api/preferences error:', error)
    return createErrorResponse(error instanceof Error ? error : new Error(String(error)))
  }
})

// =============================================================================
// PATCH /api/preferences - Update user preferences
// =============================================================================

export const PATCH = withErrorHandling(async (request: NextRequest) => {
  try {
    // Check authentication
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      throw createError.unauthorized('Authentication required')
    }

    if (!user) {
      throw createError.unauthorized('Authentication required')
    }

    // Parse request body
    let body
    try {
      body = await request.json()
    } catch (error) {
      throw createError.validation('Invalid JSON in request body')
    }

    const { theme, default_project_id, chat_settings, ui_settings } = body

    // Build update object - only include provided fields
    const updates: UserPreferencesUpdate = {}
    if (theme !== undefined) {
      if (!['light', 'dark', 'system'].includes(theme)) {
        throw createError.validation('Invalid theme value. Must be light, dark, or system')
      }
      updates.theme = theme
    }
    if (default_project_id !== undefined) {
      updates.default_project_id = default_project_id
    }
    if (chat_settings !== undefined) {
      updates.chat_settings = {
        temperature:
          chat_settings.temperature !== undefined
            ? Math.min(Math.max(chat_settings.temperature, 0), 2)
            : 0.1,
        maxTokens: chat_settings.maxTokens !== undefined ? Math.max(chat_settings.maxTokens, 100) : 1000,
      }
    }
    if (ui_settings !== undefined) {
      updates.ui_settings = {
        sidebarCollapsed:
          ui_settings.sidebarCollapsed !== undefined ? ui_settings.sidebarCollapsed : false,
        useKnowledgeBase:
          ui_settings.useKnowledgeBase !== undefined ? ui_settings.useKnowledgeBase : true,
      }
    }

    // Validate at least one field is provided
    if (Object.keys(updates).length === 0) {
      throw createError.validation('At least one field must be provided for update')
    }

    // Update preferences
    const preferences = await updateUserPreferences(user.id, updates)

    return NextResponse.json(
      {
        preferences,
        success: true,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('PATCH /api/preferences error:', error)
    return createErrorResponse(error instanceof Error ? error : new Error(String(error)))
  }
})
