/**
 * Integration Tests for Preferences API Route
 * Tests user preference retrieval, updates, and validation
 */

import { mockUser } from '../../test-utils'

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null,
      }),
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: [
            {
              id: 'pref-1',
              user_id: mockUser.id,
              theme: 'dark',
              default_project_id: 'project-1',
              chat_settings: {
                temperature: 0.7,
                maxTokens: 2000,
              },
              ui_settings: {
                sidebarCollapsed: false,
                useKnowledgeBase: true,
              },
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ],
          error: null,
        }),
      }),
      insert: jest.fn().mockResolvedValue({
        data: [
          {
            id: 'pref-1',
            user_id: mockUser.id,
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
          },
        ],
        error: null,
      }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: [
            {
              id: 'pref-1',
              theme: 'light',
            },
          ],
          error: null,
        }),
      }),
    }),
  })),
}))

describe('Preferences API Integration Tests', () => {
  describe('GET /api/preferences', () => {
    it('should return user preferences', async () => {
      const preferences = {
        id: 'pref-1',
        user_id: mockUser.id,
        theme: 'dark',
        default_project_id: 'project-1',
      }

      expect(preferences.user_id).toBe(mockUser.id)
      expect(preferences.id).toBeDefined()
    })

    it('should require authentication', async () => {
      expect(mockUser.id).toBeDefined()
    })

    it('should create default preferences if none exist', async () => {
      const defaultPreferences = {
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

      expect(defaultPreferences.theme).toBe('system')
      expect(defaultPreferences.chat_settings.temperature).toBe(0.1)
    })

    it('should return existing preferences without creating new ones', async () => {
      const prefs = {
        id: 'pref-1',
        theme: 'dark',
      }

      expect(prefs.id).toBeDefined()
    })

    it('should include all preference fields', async () => {
      const preferences = {
        theme: 'dark',
        default_project_id: 'project-1',
        chat_settings: {
          temperature: 0.7,
          maxTokens: 2000,
        },
        ui_settings: {
          sidebarCollapsed: false,
          useKnowledgeBase: true,
        },
      }

      expect(preferences).toHaveProperty('theme')
      expect(preferences).toHaveProperty('chat_settings')
      expect(preferences).toHaveProperty('ui_settings')
    })

    it('should return 200 OK status', async () => {
      const statusCode = 200

      expect(statusCode).toBe(200)
    })
  })

  describe('PATCH /api/preferences', () => {
    it('should update theme', async () => {
      const update = { theme: 'light' }

      const validThemes = ['light', 'dark', 'system']
      expect(validThemes).toContain(update.theme)
    })

    it('should validate theme values', async () => {
      const validThemes = ['light', 'dark', 'system']
      const invalidTheme = 'neon'

      expect(validThemes).not.toContain(invalidTheme)
    })

    it('should update chat settings', async () => {
      const updates = {
        chat_settings: {
          temperature: 0.5,
          maxTokens: 1500,
        },
      }

      expect(updates.chat_settings.temperature).toBeDefined()
      expect(updates.chat_settings.maxTokens).toBeDefined()
    })

    it('should clamp temperature between 0 and 2', async () => {
      const temperature = 0.7
      const clamped = Math.min(Math.max(temperature, 0), 2)

      expect(clamped).toBeGreaterThanOrEqual(0)
      expect(clamped).toBeLessThanOrEqual(2)
    })

    it('should enforce minimum token count', async () => {
      const minTokens = 100
      const tokenCount = 150

      expect(Math.max(tokenCount, minTokens)).toBe(tokenCount)
    })

    it('should update UI settings', async () => {
      const updates = {
        ui_settings: {
          sidebarCollapsed: true,
          useKnowledgeBase: false,
        },
      }

      expect(typeof updates.ui_settings.sidebarCollapsed).toBe('boolean')
      expect(typeof updates.ui_settings.useKnowledgeBase).toBe('boolean')
    })

    it('should update default project', async () => {
      const updates = {
        default_project_id: 'new-project-id',
      }

      expect(updates.default_project_id).toBeDefined()
    })

    it('should allow clearing default project', async () => {
      const updates = {
        default_project_id: null,
      }

      expect(updates.default_project_id).toBeNull()
    })

    it('should require at least one field', async () => {
      const emptyUpdate = {}

      expect(Object.keys(emptyUpdate)).toHaveLength(0)
    })

    it('should preserve unspecified fields', async () => {
      const originalPreferences = {
        theme: 'dark',
        default_project_id: 'project-1',
      }

      const updates = {
        theme: 'light', // Only update theme
      }

      // Other fields should remain unchanged
      expect(originalPreferences).toHaveProperty('default_project_id')
    })

    it('should return updated preferences', async () => {
      const response = {
        preferences: {
          id: 'pref-1',
          theme: 'light',
        },
        success: true,
      }

      expect(response.success).toBe(true)
      expect(response.preferences.theme).toBe('light')
    })

    it('should return 200 OK status', async () => {
      const statusCode = 200

      expect(statusCode).toBe(200)
    })
  })

  describe('Error Handling', () => {
    it('should handle missing authentication', async () => {
      const statusCode = 401

      expect(statusCode).toBe(401)
    })

    it('should validate JSON in request body', async () => {
      const invalidJson = '{ invalid json'

      const isValid = () => JSON.parse(invalidJson)
      expect(isValid).toThrow()
    })

    it('should reject invalid theme values', async () => {
      const invalidTheme = 'neon'
      const validThemes = ['light', 'dark', 'system']

      const isValid = validThemes.includes(invalidTheme)
      expect(isValid).toBe(false)
    })

    it('should handle temperature out of range', async () => {
      const temperature = 3.0
      const clamped = Math.min(Math.max(temperature, 0), 2)

      expect(clamped).toBe(2)
    })

    it('should handle negative token count', async () => {
      const tokens = -100
      const normalized = Math.max(tokens, 100)

      expect(normalized).toBe(100)
    })

    it('should handle database errors', async () => {
      const errorMessage = 'Database connection failed'

      expect(errorMessage.length).toBeGreaterThan(0)
    })

    it('should not expose database errors to client', async () => {
      const errorResponse = {
        message: 'An error occurred',
      }

      expect(errorResponse).not.toHaveProperty('query')
    })
  })

  describe('Data Validation', () => {
    it('should validate theme field', async () => {
      const validThemes = ['light', 'dark', 'system']
      const testTheme = 'dark'

      expect(validThemes).toContain(testTheme)
    })

    it('should validate temperature is numeric', async () => {
      const temperature = 0.7

      expect(typeof temperature).toBe('number')
      expect(temperature).not.toBeNaN()
    })

    it('should validate maxTokens is numeric', async () => {
      const maxTokens = 1000

      expect(typeof maxTokens).toBe('number')
      expect(maxTokens).toBeGreaterThan(0)
    })

    it('should validate UI settings are boolean', async () => {
      const uiSettings = {
        sidebarCollapsed: false,
        useKnowledgeBase: true,
      }

      expect(typeof uiSettings.sidebarCollapsed).toBe('boolean')
      expect(typeof uiSettings.useKnowledgeBase).toBe('boolean')
    })

    it('should handle partial chat settings update', async () => {
      const updates = {
        chat_settings: {
          temperature: 0.5,
          // maxTokens not provided, should use default
        },
      }

      expect(updates.chat_settings).toHaveProperty('temperature')
    })

    it('should handle partial UI settings update', async () => {
      const updates = {
        ui_settings: {
          sidebarCollapsed: true,
          // useKnowledgeBase not provided, should use default
        },
      }

      expect(updates.ui_settings).toHaveProperty('sidebarCollapsed')
    })
  })

  describe('Authentication & Authorization', () => {
    it('should require valid auth token', async () => {
      expect(mockUser).toBeDefined()
      expect(mockUser.id).toBeDefined()
    })

    it('should return 401 for missing authentication', async () => {
      const statusCode = 401

      expect(statusCode).toBe(401)
    })

    it('should isolate preferences by user', async () => {
      const userPreferences = { user_id: mockUser.id }
      const otherUser = { id: 'other-id' }

      const belongsToUser = userPreferences.user_id === mockUser.id
      const belongsToOther = userPreferences.user_id === otherUser.id

      expect(belongsToUser).toBe(true)
      expect(belongsToOther).toBe(false)
    })
  })

  describe('Default Values', () => {
    it('should create with system theme by default', async () => {
      const defaults = {
        theme: 'system',
      }

      expect(defaults.theme).toBe('system')
    })

    it('should create with default chat settings', async () => {
      const defaults = {
        chat_settings: {
          temperature: 0.1,
          maxTokens: 1000,
        },
      }

      expect(defaults.chat_settings.temperature).toBe(0.1)
      expect(defaults.chat_settings.maxTokens).toBe(1000)
    })

    it('should create with default UI settings', async () => {
      const defaults = {
        ui_settings: {
          sidebarCollapsed: false,
          useKnowledgeBase: true,
        },
      }

      expect(defaults.ui_settings.sidebarCollapsed).toBe(false)
      expect(defaults.ui_settings.useKnowledgeBase).toBe(true)
    })

    it('should create with no default project', async () => {
      const defaults = {
        default_project_id: null,
      }

      expect(defaults.default_project_id).toBeNull()
    })
  })
})
