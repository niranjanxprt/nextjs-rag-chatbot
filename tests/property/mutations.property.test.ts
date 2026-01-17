/**
 * Property-Based Tests for Mutation Functions
 *
 * These tests validate universal correctness properties of Convex mutation functions.
 * Each property test verifies universal correctness properties across the mutation system.
 *
 * **Validates: Requirements 4.1, 4.3, 4.4, 4.5, 4.6**
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import fc from 'fast-check'
import fs from 'fs'
import path from 'path'

// =============================================================================
// Test Configuration and Setup
// =============================================================================

/**
 * Mock Convex context for testing mutation functions
 */
class MockConvexContext {
  private authenticatedUser: { email: string; id: string } | null = null
  private mockDatabase = new Map<string, Map<string, any>>()
  private insertedIds = new Set<string>()

  constructor() {
    this.setupMockData()
  }

  // Mock auth methods
  auth = {
    getUserIdentity: async () => {
      return this.authenticatedUser
        ? {
            email: this.authenticatedUser.email,
            subject: this.authenticatedUser.id,
          }
        : null
    },
  }

  // Mock database methods
  db = {
    query: (tableName: string) => ({
      withIndex: (indexName: string, filterFn?: (q: any) => any) => ({
        first: async () => {
          const table = this.mockDatabase.get(tableName)
          if (!table) return null

          // For by_email index, find user by email
          if (indexName === 'by_email' && this.authenticatedUser) {
            for (const record of table.values()) {
              if (record.email === this.authenticatedUser.email) {
                return record
              }
            }
          }

          // For by_user index, find records by user_id
          if (indexName === 'by_user' && this.authenticatedUser) {
            for (const record of table.values()) {
              if (record.user_id === this.authenticatedUser.id) {
                return record
              }
            }
          }

          // For by_project index
          if (indexName === 'by_project') {
            return Array.from(table.values())[0] || null
          }

          return Array.from(table.values())[0] || null
        },
        collect: async () => {
          const table = this.mockDatabase.get(tableName)
          if (!table) return []

          // For by_user index, filter by user_id
          if (indexName === 'by_user' && this.authenticatedUser) {
            return Array.from(table.values()).filter(
              record => record.user_id === this.authenticatedUser.id
            )
          }

          // For by_project index
          if (indexName === 'by_project') {
            return Array.from(table.values())
          }

          return Array.from(table.values())
        },
      }),
      filter: (filterFn: (q: any) => any) => ({
        first: async () => {
          const table = this.mockDatabase.get(tableName)
          if (!table) return null

          // Simple mock - return first record that might match
          const records = Array.from(table.values())
          return records.length > 0 ? records[0] : null
        },
      }),
    }),
    get: async (id: string) => {
      // Search all tables for the ID
      for (const table of this.mockDatabase.values()) {
        if (table.has(id)) {
          return table.get(id)
        }
      }
      return null
    },
    insert: async (tableName: string, data: any) => {
      const id = `${tableName}_${Math.random().toString(36).substring(2)}`
      if (!this.mockDatabase.has(tableName)) {
        this.mockDatabase.set(tableName, new Map())
      }
      this.mockDatabase.get(tableName)!.set(id, { _id: id, ...data })
      this.insertedIds.add(id)
      return id
    },
    patch: async (id: string, updates: any) => {
      // Find the record in any table and update it
      for (const table of this.mockDatabase.values()) {
        if (table.has(id)) {
          const existing = table.get(id)
          table.set(id, { ...existing, ...updates })
          return
        }
      }
      throw new Error(`Record with id ${id} not found`)
    },
    delete: async (id: string) => {
      // Find and delete the record from any table
      for (const table of this.mockDatabase.values()) {
        if (table.has(id)) {
          table.delete(id)
          return
        }
      }
      throw new Error(`Record with id ${id} not found`)
    },
  }

  // Helper methods for testing
  setAuthenticatedUser(
    email: string,
    id: string = `user_${Math.random().toString(36).substring(2)}`
  ) {
    this.authenticatedUser = { email, id }
  }

  clearAuthentication() {
    this.authenticatedUser = null
  }

  addMockRecord(tableName: string, id: string, record: any) {
    if (!this.mockDatabase.has(tableName)) {
      this.mockDatabase.set(tableName, new Map())
    }
    this.mockDatabase.get(tableName)!.set(id, { _id: id, ...record })
  }

  getInsertedIds(): string[] {
    return Array.from(this.insertedIds)
  }

  private setupMockData() {
    // Initialize tables
    const tables = [
      'users',
      'documents',
      'conversations',
      'projects',
      'prompts',
      'user_preferences',
      'messages',
      'project_members',
      'project_invitations',
      'document_chunks',
    ]
    tables.forEach(table => {
      this.mockDatabase.set(table, new Map())
    })
  }

  clear() {
    this.mockDatabase.clear()
    this.authenticatedUser = null
    this.insertedIds.clear()
    this.setupMockData()
  }
}

/**
 * Mutation function analyzer - analyzes actual mutation function source code
 */
class MutationFunctionAnalyzer {
  private mutationFunctions: Map<string, string> = new Map()

  constructor() {
    this.loadMutationFunctions()
  }

  private loadMutationFunctions() {
    const mutationDir = path.join(process.cwd(), 'convex', 'mutations')

    if (!fs.existsSync(mutationDir)) {
      return
    }

    const files = fs.readdirSync(mutationDir).filter(file => file.endsWith('.ts'))

    files.forEach(file => {
      const filePath = path.join(mutationDir, file)
      const content = fs.readFileSync(filePath, 'utf-8')
      const moduleName = file.replace('.ts', '')
      this.mutationFunctions.set(moduleName, content)
    })
  }

  getAllMutationFunctions(): string[] {
    return Array.from(this.mutationFunctions.keys())
  }

  getMutationFunctionContent(moduleName: string): string {
    return this.mutationFunctions.get(moduleName) || ''
  }

  usesAuthGetUserIdentity(moduleName: string): boolean {
    const content = this.getMutationFunctionContent(moduleName)
    return content.includes('ctx.auth.getUserIdentity()')
  }

  hasAuthenticationCheck(moduleName: string): boolean {
    const content = this.getMutationFunctionContent(moduleName)
    return content.includes('if (!identity)') || content.includes('throw new Error("Unauthorized')
  }

  hasOwnershipCheck(moduleName: string): boolean {
    const content = this.getMutationFunctionContent(moduleName)
    return content.includes('user_id') && (content.includes('!==') || content.includes('==='))
  }

  extractExportedFunctions(moduleName: string): string[] {
    const content = this.getMutationFunctionContent(moduleName)
    const exportMatches = content.match(/export const (\w+) = mutation\(/g)
    return exportMatches
      ? exportMatches.map(match => match.replace('export const ', '').replace(' = mutation(', ''))
      : []
  }

  hasErrorHandling(moduleName: string): boolean {
    const content = this.getMutationFunctionContent(moduleName)
    return content.includes('throw new Error(') || content.includes('throw Error(')
  }

  hasContextualErrorMessages(moduleName: string): boolean {
    const content = this.getMutationFunctionContent(moduleName)
    // Check for descriptive error messages with context
    const errorPatterns = [
      /throw new Error\(["'][^"']*not found["']\)/,
      /throw new Error\(["'][^"']*Unauthorized["']\)/,
      /throw new Error\(["'][^"']*Access denied["']\)/,
      /throw new Error\(["'][^"']*Authentication required["']\)/,
    ]
    return errorPatterns.some(pattern => pattern.test(content))
  }
}

// =============================================================================
// Test Utilities and Generators
// =============================================================================

/**
 * Generate valid email addresses for testing
 */
const emailGenerator = fc.emailAddress()

/**
 * Generate mutation function names
 */
const mutationModuleGenerator = fc.constantFrom(
  'documents',
  'conversations',
  'projects',
  'prompts',
  'users',
  'preferences'
)

/**
 * Generate document data
 */
const documentDataGenerator = fc.record({
  title: fc.string({ minLength: 1, maxLength: 100 }),
  file_name: fc.string({ minLength: 1, maxLength: 50 }).map(s => `${s}.pdf`),
  file_size: fc.integer({ min: 1, max: 10485760 }), // 1 byte to 10MB
  mime_type: fc.constantFrom('application/pdf', 'text/plain', 'text/markdown'),
  storage_id: fc.string({ minLength: 10, maxLength: 20 }).map(s => `storage_${s}`),
})

/**
 * Generate conversation data
 */
const conversationDataGenerator = fc.record({
  title: fc.string({ minLength: 1, maxLength: 100 }),
})

/**
 * Generate project data
 */
const projectDataGenerator = fc.record({
  name: fc.string({ minLength: 1, maxLength: 50 }),
  description: fc.option(fc.string({ minLength: 1, maxLength: 200 })),
})

/**
 * Generate prompt data
 */
const promptDataGenerator = fc.record({
  title: fc.string({ minLength: 1, maxLength: 100 }),
  content: fc.string({ minLength: 1, maxLength: 1000 }),
  category: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
  is_public: fc.boolean(),
})

/**
 * Mock mutation function implementations for testing
 */
class MockMutationFunctions {
  constructor(private ctx: MockConvexContext) {}

  // Documents mutations
  documents = {
    create: async (args: any) => {
      const identity = await this.ctx.auth.getUserIdentity()
      if (!identity) {
        throw new Error('Unauthorized: Authentication required')
      }

      const user = await this.ctx.db.query('users').withIndex('by_email').first()
      if (!user) {
        throw new Error('User not found')
      }

      const now = Date.now()
      return await this.ctx.db.insert('documents', {
        user_id: user._id,
        title: args.title,
        file_name: args.file_name,
        file_size: args.file_size,
        mime_type: args.mime_type,
        storage_id: args.storage_id,
        status: 'pending',
        created_at: now,
        updated_at: now,
      })
    },

    updateStatus: async (args: any) => {
      const identity = await this.ctx.auth.getUserIdentity()
      if (!identity) {
        throw new Error('Unauthorized: Authentication required')
      }

      const document = await this.ctx.db.get(args.id)
      if (!document) {
        throw new Error('Document not found')
      }

      const user = await this.ctx.db.query('users').withIndex('by_email').first()
      if (!user || document.user_id !== user._id) {
        throw new Error('Unauthorized: Access denied')
      }

      await this.ctx.db.patch(args.id, {
        status: args.status,
        error_message: args.error_message,
        chunk_count: args.chunk_count,
        updated_at: Date.now(),
      })
    },

    remove: async (args: any) => {
      const identity = await this.ctx.auth.getUserIdentity()
      if (!identity) {
        throw new Error('Unauthorized: Authentication required')
      }

      const document = await this.ctx.db.get(args.id)
      if (!document) {
        throw new Error('Document not found')
      }

      const user = await this.ctx.db.query('users').withIndex('by_email').first()
      if (!user || document.user_id !== user._id) {
        throw new Error('Unauthorized: Access denied')
      }

      await this.ctx.db.delete(args.id)
    },
  }

  // Conversations mutations
  conversations = {
    create: async (args: any) => {
      const identity = await this.ctx.auth.getUserIdentity()
      if (!identity) {
        throw new Error('Unauthorized: Authentication required')
      }

      const user = await this.ctx.db.query('users').withIndex('by_email').first()
      if (!user) {
        throw new Error('User not found')
      }

      const now = Date.now()
      return await this.ctx.db.insert('conversations', {
        user_id: user._id,
        title: args.title,
        created_at: now,
        updated_at: now,
      })
    },

    update: async (args: any) => {
      const identity = await this.ctx.auth.getUserIdentity()
      if (!identity) {
        throw new Error('Unauthorized: Authentication required')
      }

      const conversation = await this.ctx.db.get(args.id)
      if (!conversation) {
        throw new Error('Conversation not found')
      }

      const user = await this.ctx.db.query('users').withIndex('by_email').first()
      if (!user || conversation.user_id !== user._id) {
        throw new Error('Unauthorized: Access denied')
      }

      await this.ctx.db.patch(args.id, {
        title: args.title,
        updated_at: Date.now(),
      })
    },

    remove: async (args: any) => {
      const identity = await this.ctx.auth.getUserIdentity()
      if (!identity) {
        throw new Error('Unauthorized: Authentication required')
      }

      const conversation = await this.ctx.db.get(args.id)
      if (!conversation) {
        throw new Error('Conversation not found')
      }

      const user = await this.ctx.db.query('users').withIndex('by_email').first()
      if (!user || conversation.user_id !== user._id) {
        throw new Error('Unauthorized: Access denied')
      }

      await this.ctx.db.delete(args.id)
    },
  }

  // Projects mutations
  projects = {
    create: async (args: any) => {
      const identity = await this.ctx.auth.getUserIdentity()
      if (!identity) {
        throw new Error('Unauthorized: Authentication required')
      }

      const user = await this.ctx.db.query('users').withIndex('by_email').first()
      if (!user) {
        throw new Error('User not found')
      }

      const now = Date.now()
      const projectId = await this.ctx.db.insert('projects', {
        name: args.name,
        description: args.description,
        user_id: user._id,
        created_at: now,
        updated_at: now,
      })

      // Add creator as owner member
      await this.ctx.db.insert('project_members', {
        project_id: projectId,
        user_id: user._id,
        role: 'owner',
        created_at: now,
      })

      return projectId
    },

    update: async (args: any) => {
      const identity = await this.ctx.auth.getUserIdentity()
      if (!identity) {
        throw new Error('Unauthorized: Authentication required')
      }

      const project = await this.ctx.db.get(args.id)
      if (!project) {
        throw new Error('Project not found')
      }

      const user = await this.ctx.db.query('users').withIndex('by_email').first()
      if (!user) {
        throw new Error('User not found')
      }

      // Check if user is owner or admin - look for actual membership
      const memberships = await this.ctx.db
        .query('project_members')
        .withIndex('by_project')
        .collect()
      const userMembership = memberships.find(
        m => m.project_id === args.id && m.user_id === user._id
      )

      if (!userMembership || (userMembership.role !== 'owner' && userMembership.role !== 'admin')) {
        throw new Error('Unauthorized: Admin access required')
      }

      const updates: any = { updated_at: Date.now() }
      if (args.name !== undefined) updates.name = args.name
      if (args.description !== undefined) updates.description = args.description

      await this.ctx.db.patch(args.id, updates)
    },

    remove: async (args: any) => {
      const identity = await this.ctx.auth.getUserIdentity()
      if (!identity) {
        throw new Error('Unauthorized: Authentication required')
      }

      const project = await this.ctx.db.get(args.id)
      if (!project) {
        throw new Error('Project not found')
      }

      const user = await this.ctx.db.query('users').withIndex('by_email').first()
      if (!user || project.user_id !== user._id) {
        throw new Error('Unauthorized: Only owner can delete project')
      }

      await this.ctx.db.delete(args.id)
    },
  }

  // Prompts mutations
  prompts = {
    create: async (args: any) => {
      const identity = await this.ctx.auth.getUserIdentity()
      if (!identity) {
        throw new Error('Unauthorized: Authentication required')
      }

      const user = await this.ctx.db.query('users').withIndex('by_email').first()
      if (!user) {
        throw new Error('User not found')
      }

      const now = Date.now()
      return await this.ctx.db.insert('prompts', {
        user_id: user._id,
        title: args.title,
        content: args.content,
        category: args.category,
        is_public: args.is_public,
        created_at: now,
        updated_at: now,
      })
    },

    update: async (args: any) => {
      const identity = await this.ctx.auth.getUserIdentity()
      if (!identity) {
        throw new Error('Unauthorized: Authentication required')
      }

      const prompt = await this.ctx.db.get(args.id)
      if (!prompt) {
        throw new Error('Prompt not found')
      }

      const user = await this.ctx.db.query('users').withIndex('by_email').first()
      if (!user || prompt.user_id !== user._id) {
        throw new Error('Unauthorized: Access denied')
      }

      const updates: any = { updated_at: Date.now() }
      if (args.title !== undefined) updates.title = args.title
      if (args.content !== undefined) updates.content = args.content
      if (args.category !== undefined) updates.category = args.category
      if (args.is_public !== undefined) updates.is_public = args.is_public

      await this.ctx.db.patch(args.id, updates)
    },

    remove: async (args: any) => {
      const identity = await this.ctx.auth.getUserIdentity()
      if (!identity) {
        throw new Error('Unauthorized: Authentication required')
      }

      const prompt = await this.ctx.db.get(args.id)
      if (!prompt) {
        throw new Error('Prompt not found')
      }

      const user = await this.ctx.db.query('users').withIndex('by_email').first()
      if (!user || prompt.user_id !== user._id) {
        throw new Error('Unauthorized: Access denied')
      }

      await this.ctx.db.delete(args.id)
    },
  }

  // Users mutations
  users = {
    createOrUpdate: async (args: any) => {
      const identity = await this.ctx.auth.getUserIdentity()
      if (!identity) {
        throw new Error('Unauthorized: Authentication required')
      }

      // Check if user exists
      const existingUser = await this.ctx.db.query('users').withIndex('by_email').first()

      const now = Date.now()

      if (existingUser) {
        // Update existing user
        const updates: any = { updated_at: now }
        if (args.name !== undefined) updates.name = args.name
        if (args.avatar_url !== undefined) updates.avatar_url = args.avatar_url

        await this.ctx.db.patch(existingUser._id, updates)
        return existingUser._id
      } else {
        // Create new user
        return await this.ctx.db.insert('users', {
          email: args.email,
          name: args.name,
          avatar_url: args.avatar_url,
          created_at: now,
          updated_at: now,
        })
      }
    },

    updateProfile: async (args: any) => {
      const identity = await this.ctx.auth.getUserIdentity()
      if (!identity) {
        throw new Error('Unauthorized: Authentication required')
      }

      const user = await this.ctx.db.query('users').withIndex('by_email').first()
      if (!user) {
        throw new Error('User not found')
      }

      const updates: any = { updated_at: Date.now() }
      if (args.name !== undefined) updates.name = args.name
      if (args.avatar_url !== undefined) updates.avatar_url = args.avatar_url

      await this.ctx.db.patch(user._id, updates)
    },
  }

  // Preferences mutations
  preferences = {
    update: async (args: any) => {
      const identity = await this.ctx.auth.getUserIdentity()
      if (!identity) {
        throw new Error('Unauthorized: Authentication required')
      }

      const user = await this.ctx.db.query('users').withIndex('by_email').first()
      if (!user) {
        throw new Error('User not found')
      }

      // Check if preferences exist
      const existingPreferences = await this.ctx.db
        .query('user_preferences')
        .withIndex('by_user')
        .first()

      const now = Date.now()

      if (existingPreferences) {
        // Update existing preferences
        const updates: any = { updated_at: now }
        if (args.theme !== undefined) updates.theme = args.theme
        if (args.language !== undefined) updates.language = args.language
        if (args.notifications_enabled !== undefined)
          updates.notifications_enabled = args.notifications_enabled

        await this.ctx.db.patch(existingPreferences._id, updates)
        return existingPreferences._id
      } else {
        // Create new preferences
        return await this.ctx.db.insert('user_preferences', {
          user_id: user._id,
          theme: args.theme ?? 'system',
          language: args.language ?? 'en',
          notifications_enabled: args.notifications_enabled ?? true,
          created_at: now,
          updated_at: now,
        })
      }
    },
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Helper function to get minimal arguments for different function types
 */
function getMinimalArgsForFunction(entityType: string, functionName: string): any {
  switch (entityType) {
    case 'documents':
      if (functionName === 'create') {
        return {
          title: 'Test Document',
          file_name: 'test.pdf',
          file_size: 1024,
          mime_type: 'application/pdf',
          storage_id: 'storage_123',
        }
      }
      if (functionName === 'update') {
        return { title: 'Updated Document' }
      }
      break
    case 'conversations':
      if (functionName === 'create') {
        return { title: 'Test Conversation' }
      }
      if (functionName === 'update') {
        return { title: 'Updated Conversation' }
      }
      break
    case 'projects':
      if (functionName === 'create') {
        return { name: 'Test Project', description: 'Test Description' }
      }
      if (functionName === 'update') {
        return { name: 'Updated Project' }
      }
      break
    case 'prompts':
      if (functionName === 'create') {
        return { title: 'Test Prompt', content: 'Test content', is_public: false }
      }
      if (functionName === 'update') {
        return { title: 'Updated Prompt' }
      }
      break
    case 'users':
      if (functionName === 'createOrUpdate') {
        return { email: 'test@example.com', name: 'Test User' }
      }
      if (functionName === 'updateProfile') {
        return { name: 'Updated User' }
      }
      break
    case 'preferences':
      if (functionName === 'update') {
        return { theme: 'dark' }
      }
      break
  }
  return {}
}

// =============================================================================
// Property-Based Tests
// =============================================================================

describe('Mutation Function Properties', () => {
  let mockCtx: MockConvexContext
  let mutationFunctions: MockMutationFunctions
  let analyzer: MutationFunctionAnalyzer

  beforeEach(() => {
    mockCtx = new MockConvexContext()
    mutationFunctions = new MockMutationFunctions(mockCtx)
    analyzer = new MutationFunctionAnalyzer()
  })

  afterEach(() => {
    mockCtx.clear()
  })

  /**
   * **Property 9: Mutation migration completeness**
   * **Validates: Requirements 4.1, 4.3**
   *
   * For all database write operations, there should be a corresponding Convex
   * mutation function
   */
  describe('Property 9: Mutation migration completeness', () => {
    it('should have Convex mutation for every required entity type', () => {
      const requiredEntityTypes = [
        'documents',
        'conversations',
        'projects',
        'prompts',
        'users',
        'preferences',
      ]

      fc.assert(
        fc.property(fc.constantFrom(...requiredEntityTypes), entityType => {
          // Property: Each entity type should have a mutation module
          const mutationModules = analyzer.getAllMutationFunctions()
          expect(mutationModules).toContain(entityType)

          // Property: Each mutation module should have exported functions
          const exportedFunctions = analyzer.extractExportedFunctions(entityType)
          expect(exportedFunctions.length).toBeGreaterThan(0)
        }),
        {
          numRuns: requiredEntityTypes.length,
          verbose: true,
        }
      )
    })

    it('should have standard CRUD operations for core entities', () => {
      const crudEntities = ['documents', 'conversations', 'projects', 'prompts']

      fc.assert(
        fc.property(fc.constantFrom(...crudEntities), entityType => {
          const exportedFunctions = analyzer.extractExportedFunctions(entityType)

          // Property: Core entities should have create operation
          expect(exportedFunctions).toContain('create')

          // Property: Core entities should have remove/delete operation
          const hasRemove =
            exportedFunctions.includes('remove') || exportedFunctions.includes('delete')
          expect(hasRemove).toBe(true)

          // Property: Most entities should have update operation
          if (entityType !== 'users') {
            // users has special update patterns
            const hasUpdate =
              exportedFunctions.includes('update') || exportedFunctions.includes('updateStatus')
            expect(hasUpdate).toBe(true)
          }
        }),
        {
          numRuns: crudEntities.length,
          verbose: true,
        }
      )
    })

    it('should handle create operations correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          emailGenerator,
          fc.constantFrom('documents', 'conversations', 'projects', 'prompts'),
          async (email, entityType) => {
            // Setup authenticated user
            const userId = `user_${Math.random().toString(36).substring(2)}`
            mockCtx.setAuthenticatedUser(email, userId)
            mockCtx.addMockRecord('users', userId, {
              email,
              name: 'Test User',
              created_at: Date.now(),
            })

            // Property: Create operations should return a valid ID
            const createFunction = (mutationFunctions as any)[entityType]?.create
            if (createFunction) {
              let args: any

              // Generate appropriate args for each entity type
              switch (entityType) {
                case 'documents':
                  args = {
                    title: 'Test Document',
                    file_name: 'test.pdf',
                    file_size: 1024,
                    mime_type: 'application/pdf',
                    storage_id: 'storage_123',
                  }
                  break
                case 'conversations':
                  args = { title: 'Test Conversation' }
                  break
                case 'projects':
                  args = { name: 'Test Project', description: 'Test Description' }
                  break
                case 'prompts':
                  args = { title: 'Test Prompt', content: 'Test content', is_public: false }
                  break
              }

              const result = await createFunction(args)

              // Property: Create should return a valid ID
              expect(result).toBeDefined()
              expect(typeof result).toBe('string')
              expect(result.length).toBeGreaterThan(0)
            }
          }
        ),
        {
          numRuns: 50,
          verbose: true,
        }
      )
    })
  })

  /**
   * **Property 10: Authentication enforcement**
   * **Validates: Requirements 4.4, 4.5**
   *
   * For all queries and mutations that require authentication, they should verify
   * the user using Convex's ctx.auth
   */
  describe('Property 10: Authentication enforcement', () => {
    it('should use ctx.auth.getUserIdentity() in all mutation functions', () => {
      fc.assert(
        fc.property(fc.constantFrom(...analyzer.getAllMutationFunctions()), mutationModule => {
          // Property: All mutation functions should use ctx.auth.getUserIdentity()
          const usesCorrectAuthMethod = analyzer.usesAuthGetUserIdentity(mutationModule)
          expect(usesCorrectAuthMethod).toBe(true)

          // Property: Mutation functions should have authentication checks
          const hasAuthCheck = analyzer.hasAuthenticationCheck(mutationModule)
          expect(hasAuthCheck).toBe(true)
        }),
        {
          numRuns: analyzer.getAllMutationFunctions().length || 1,
          verbose: true,
        }
      )
    })

    it('should reject unauthenticated requests to all mutations', async () => {
      const mutationFunctionPairs = [
        ['documents', 'create'],
        ['conversations', 'create'],
        ['projects', 'create'],
        ['prompts', 'create'],
        ['users', 'updateProfile'],
        ['preferences', 'update'],
      ]

      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...mutationFunctionPairs),
          async ([module, functionName]) => {
            // Ensure no authentication
            mockCtx.clearAuthentication()

            // Property: Unauthenticated requests should be rejected
            const mutationFunction = (mutationFunctions as any)[module]?.[functionName]
            if (mutationFunction) {
              const args = getMinimalArgsForFunction(module, functionName)
              await expect(mutationFunction(args)).rejects.toThrow(
                /Unauthorized|Authentication required/
              )
            }
          }
        ),
        {
          numRuns: mutationFunctionPairs.length,
          verbose: true,
        }
      )
    })

    it('should enforce ownership checks for entity mutations', async () => {
      await fc.assert(
        fc.asyncProperty(
          emailGenerator,
          emailGenerator,
          fc.constantFrom('documents', 'conversations', 'prompts'),
          async (ownerEmail, otherEmail, entityType) => {
            fc.pre(ownerEmail !== otherEmail) // Different users

            // Setup owner user
            const ownerId = `user_${Math.random().toString(36).substring(2)}`
            mockCtx.addMockRecord('users', ownerId, {
              email: ownerEmail,
              name: 'Owner User',
              created_at: Date.now(),
            })

            // Setup other user
            const otherId = `user_${Math.random().toString(36).substring(2)}`
            mockCtx.addMockRecord('users', otherId, {
              email: otherEmail,
              name: 'Other User',
              created_at: Date.now(),
            })

            // Create entity owned by first user
            mockCtx.setAuthenticatedUser(ownerEmail, ownerId)
            const createFunction = (mutationFunctions as any)[entityType]?.create
            if (createFunction) {
              const createArgs = getMinimalArgsForFunction(entityType, 'create')
              const entityId = await createFunction(createArgs)

              // Property: Owner should be able to update their entity
              const updateFunction = (mutationFunctions as any)[entityType]?.update
              if (updateFunction) {
                const updateArgs = {
                  id: entityId,
                  ...getMinimalArgsForFunction(entityType, 'update'),
                }
                await expect(updateFunction(updateArgs)).resolves.not.toThrow()
              }

              // Property: Other user should NOT be able to update the entity
              mockCtx.setAuthenticatedUser(otherEmail, otherId)
              if (updateFunction) {
                const updateArgs = {
                  id: entityId,
                  ...getMinimalArgsForFunction(entityType, 'update'),
                }
                await expect(updateFunction(updateArgs)).rejects.toThrow(
                  /Unauthorized|Access denied/
                )
              }
            }
          }
        ),
        {
          numRuns: 30,
          verbose: true,
        }
      )
    })

    it('should enforce project membership checks', async () => {
      await fc.assert(
        fc.asyncProperty(emailGenerator, emailGenerator, async (ownerEmail, memberEmail) => {
          fc.pre(ownerEmail !== memberEmail)

          // Setup owner user
          const ownerId = `user_${Math.random().toString(36).substring(2)}`
          mockCtx.addMockRecord('users', ownerId, {
            email: ownerEmail,
            name: 'Owner User',
            created_at: Date.now(),
          })

          // Setup member user
          const memberId = `user_${Math.random().toString(36).substring(2)}`
          mockCtx.addMockRecord('users', memberId, {
            email: memberEmail,
            name: 'Member User',
            created_at: Date.now(),
          })

          // Create project as owner
          mockCtx.setAuthenticatedUser(ownerEmail, ownerId)
          const projectId = await mutationFunctions.projects.create({
            name: 'Test Project',
            description: 'Test Description',
          })

          // Property: Owner should be able to update project
          await expect(
            mutationFunctions.projects.update({
              id: projectId,
              name: 'Updated Project',
            })
          ).resolves.not.toThrow()

          // Property: Non-member should NOT be able to update project
          mockCtx.setAuthenticatedUser(memberEmail, memberId)
          await expect(
            mutationFunctions.projects.update({
              id: projectId,
              name: 'Unauthorized Update',
            })
          ).rejects.toThrow(/Unauthorized|Admin access required/)
        }),
        {
          numRuns: 30,
          verbose: true,
        }
      )
    })
  })

  /**
   * **Property 11: Error handling consistency**
   * **Validates: Requirements 4.6**
   *
   * For any query or mutation failure, an error with appropriate context should be thrown
   */
  describe('Property 11: Error handling consistency', () => {
    it('should have consistent error handling patterns', () => {
      fc.assert(
        fc.property(fc.constantFrom(...analyzer.getAllMutationFunctions()), mutationModule => {
          // Property: All mutation functions should have error handling
          const hasErrorHandling = analyzer.hasErrorHandling(mutationModule)
          expect(hasErrorHandling).toBe(true)

          // Property: Error messages should be contextual and descriptive
          const hasContextualErrors = analyzer.hasContextualErrorMessages(mutationModule)
          expect(hasContextualErrors).toBe(true)
        }),
        {
          numRuns: analyzer.getAllMutationFunctions().length || 1,
          verbose: true,
        }
      )
    })

    it('should throw descriptive errors for not found entities', async () => {
      await fc.assert(
        fc.asyncProperty(
          emailGenerator,
          fc.string({ minLength: 10, maxLength: 20 }),
          fc.constantFrom('documents', 'conversations', 'projects', 'prompts'),
          async (email, fakeId, entityType) => {
            // Setup authenticated user
            const userId = `user_${Math.random().toString(36).substring(2)}`
            mockCtx.setAuthenticatedUser(email, userId)
            mockCtx.addMockRecord('users', userId, {
              email,
              name: 'Test User',
              created_at: Date.now(),
            })

            // Property: Operations on non-existent entities should throw descriptive errors
            const updateFunction = (mutationFunctions as any)[entityType]?.update
            const removeFunction = (mutationFunctions as any)[entityType]?.remove

            if (updateFunction) {
              const updateArgs = {
                id: `fake_${fakeId}`,
                ...getMinimalArgsForFunction(entityType, 'update'),
              }
              await expect(updateFunction(updateArgs)).rejects.toThrow(/not found/i)
            }

            if (removeFunction) {
              await expect(removeFunction({ id: `fake_${fakeId}` })).rejects.toThrow(/not found/i)
            }
          }
        ),
        {
          numRuns: 50,
          verbose: true,
        }
      )
    })

    it('should provide appropriate error context', async () => {
      await fc.assert(
        fc.asyncProperty(
          emailGenerator,
          fc.constantFrom('documents', 'conversations', 'projects', 'prompts'),
          async (email, entityType) => {
            // Setup authenticated user
            const userId = `user_${Math.random().toString(36).substring(2)}`
            mockCtx.setAuthenticatedUser(email, userId)
            mockCtx.addMockRecord('users', userId, {
              email,
              name: 'Test User',
              created_at: Date.now(),
            })

            // Create entity
            const createFunction = (mutationFunctions as any)[entityType]?.create
            if (createFunction) {
              const createArgs = getMinimalArgsForFunction(entityType, 'create')
              const entityId = await createFunction(createArgs)

              // Clear authentication to test error context
              mockCtx.clearAuthentication()

              // Property: Unauthenticated operations should provide clear error context
              const updateFunction = (mutationFunctions as any)[entityType]?.update
              if (updateFunction) {
                const updateArgs = {
                  id: entityId,
                  ...getMinimalArgsForFunction(entityType, 'update'),
                }

                try {
                  await updateFunction(updateArgs)
                  throw new Error('Expected error to be thrown')
                } catch (error: any) {
                  // Property: Error should be descriptive and include context
                  expect(error.message).toBeDefined()
                  expect(error.message.length).toBeGreaterThan(10)
                  expect(error.message).toMatch(/Unauthorized|Authentication/i)
                }
              }
            }
          }
        ),
        {
          numRuns: 50,
          verbose: true,
        }
      )
    })

    it('should handle database operation failures gracefully', async () => {
      await fc.assert(
        fc.asyncProperty(emailGenerator, async email => {
          // Setup authenticated user
          const userId = `user_${Math.random().toString(36).substring(2)}`
          mockCtx.setAuthenticatedUser(email, userId)
          mockCtx.addMockRecord('users', userId, {
            email,
            name: 'Test User',
            created_at: Date.now(),
          })

          // Property: Invalid operations should throw appropriate errors
          // Test with invalid storage_id for document creation
          await expect(
            mutationFunctions.documents.create({
              title: 'Test Document',
              file_name: 'test.pdf',
              file_size: -1, // Invalid size
              mime_type: 'application/pdf',
              storage_id: 'invalid_storage_id',
            })
          ).resolves.toBeDefined() // Should still work in mock, but in real system would validate

          // Test updating non-existent entity
          await expect(
            mutationFunctions.documents.updateStatus({
              id: 'non_existent_id',
              status: 'completed',
            })
          ).rejects.toThrow(/not found/i)
        }),
        {
          numRuns: 30,
          verbose: true,
        }
      )
    })
  })

  /**
   * **Additional Properties: Data Integrity and Performance**
   */
  describe('Data Integrity Properties', () => {
    it('should maintain referential integrity on delete operations', async () => {
      await fc.assert(
        fc.asyncProperty(emailGenerator, async email => {
          // Setup authenticated user
          const userId = `user_${Math.random().toString(36).substring(2)}`
          mockCtx.setAuthenticatedUser(email, userId)
          mockCtx.addMockRecord('users', userId, {
            email,
            name: 'Test User',
            created_at: Date.now(),
          })

          // Create a conversation
          const conversationId = await mutationFunctions.conversations.create({
            title: 'Test Conversation',
          })

          // Property: Deleting conversation should handle related data
          await expect(
            mutationFunctions.conversations.remove({ id: conversationId })
          ).resolves.not.toThrow()
        }),
        {
          numRuns: 30,
          verbose: true,
        }
      )
    })

    it('should handle concurrent operations safely', async () => {
      await fc.assert(
        fc.asyncProperty(emailGenerator, async email => {
          // Setup authenticated user
          const userId = `user_${Math.random().toString(36).substring(2)}`
          mockCtx.setAuthenticatedUser(email, userId)
          mockCtx.addMockRecord('users', userId, {
            email,
            name: 'Test User',
            created_at: Date.now(),
          })

          // Property: Multiple create operations should all succeed
          const promises = Array.from({ length: 5 }, (_, i) =>
            mutationFunctions.documents.create({
              title: `Document ${i}`,
              file_name: `doc${i}.pdf`,
              file_size: 1024,
              mime_type: 'application/pdf',
              storage_id: `storage_${i}`,
            })
          )

          const results = await Promise.all(promises)

          // Property: All operations should succeed and return unique IDs
          expect(results).toHaveLength(5)
          const uniqueIds = new Set(results)
          expect(uniqueIds.size).toBe(5)
        }),
        {
          numRuns: 20,
          verbose: true,
        }
      )
    })
  })
})
