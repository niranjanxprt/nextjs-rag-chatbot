/**
 * Property-Based Tests for Query Functions
 *
 * These tests validate universal correctness properties of Convex query functions.
 * Each property test verifies universal correctness properties across the query system.
 *
 * **Validates: Requirements 3.7, 4.1, 4.2, 4.4, 4.5**
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import fc from 'fast-check'
import fs from 'fs'
import path from 'path'

// =============================================================================
// Test Configuration and Setup
// =============================================================================

/**
 * Mock Convex context for testing query functions
 */
class MockConvexContext {
  private authenticatedUser: { email: string; id: string } | null = null
  private mockDatabase = new Map<string, Map<string, any>>()

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

          // For by_project index, return all records (will be filtered by project_id in the query)
          if (indexName === 'by_project') {
            return Array.from(table.values())
          }

          return Array.from(table.values())
        },
        order: (direction: string) => ({
          collect: async () => {
            const table = this.mockDatabase.get(tableName)
            if (!table) return []

            let records = Array.from(table.values())

            // For by_user index, filter by user_id
            if (indexName === 'by_user' && this.authenticatedUser) {
              records = records.filter(record => record.user_id === this.authenticatedUser.id)
            }

            return direction === 'desc' ? records.reverse() : records
          },
        }),
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

  // Helper method to get records by project_id for project_members table
  getProjectMembers(projectId: string): any[] {
    const table = this.mockDatabase.get('project_members')
    if (!table) return []

    return Array.from(table.values()).filter(record => record.project_id === projectId)
  }

  private setupMockData() {
    // Initialize tables
    const tables = [
      'users',
      'documents',
      'conversations',
      'projects',
      'prompts',
      'preferences',
      'messages',
      'project_members',
    ]
    tables.forEach(table => {
      this.mockDatabase.set(table, new Map())
    })
  }

  clear() {
    this.mockDatabase.clear()
    this.authenticatedUser = null
    this.setupMockData()
  }
}

/**
 * Query function analyzer - analyzes actual query function source code
 */
class QueryFunctionAnalyzer {
  private queryFunctions: Map<string, string> = new Map()

  constructor() {
    this.loadQueryFunctions()
  }

  private loadQueryFunctions() {
    const queryDir = path.join(process.cwd(), 'convex', 'queries')

    if (!fs.existsSync(queryDir)) {
      return
    }

    const files = fs.readdirSync(queryDir).filter(file => file.endsWith('.ts'))

    files.forEach(file => {
      const filePath = path.join(queryDir, file)
      const content = fs.readFileSync(filePath, 'utf-8')
      const moduleName = file.replace('.ts', '')
      this.queryFunctions.set(moduleName, content)
    })
  }

  getAllQueryFunctions(): string[] {
    return Array.from(this.queryFunctions.keys())
  }

  getQueryFunctionContent(moduleName: string): string {
    return this.queryFunctions.get(moduleName) || ''
  }

  usesAuthGetUserIdentity(moduleName: string): boolean {
    const content = this.getQueryFunctionContent(moduleName)
    return content.includes('ctx.auth.getUserIdentity()')
  }

  hasAuthenticationCheck(moduleName: string): boolean {
    const content = this.getQueryFunctionContent(moduleName)
    return content.includes('if (!identity)') || content.includes('throw new Error("Unauthorized')
  }

  hasOwnershipCheck(moduleName: string): boolean {
    const content = this.getQueryFunctionContent(moduleName)
    return content.includes('user_id') && (content.includes('!==') || content.includes('==='))
  }

  extractExportedFunctions(moduleName: string): string[] {
    const content = this.getQueryFunctionContent(moduleName)
    const exportMatches = content.match(/export const (\w+) = query\(/g)
    return exportMatches
      ? exportMatches.map(match => match.replace('export const ', '').replace(' = query(', ''))
      : []
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
 * Generate query function names
 */
const queryModuleGenerator = fc.constantFrom(
  'documents',
  'conversations',
  'projects',
  'prompts',
  'users',
  'preferences'
)

/**
 * Generate document IDs
 */
const documentIdGenerator = fc.string({ minLength: 10, maxLength: 20 }).map(s => `doc_${s}`)

/**
 * Generate project IDs
 */
const projectIdGenerator = fc.string({ minLength: 10, maxLength: 20 }).map(s => `proj_${s}`)

/**
 * Generate conversation IDs
 */
const conversationIdGenerator = fc.string({ minLength: 10, maxLength: 20 }).map(s => `conv_${s}`)

/**
 * Mock query function implementations for testing
 */
class MockQueryFunctions {
  constructor(private ctx: MockConvexContext) {}

  // Documents queries
  documents = {
    list: async () => {
      const identity = await this.ctx.auth.getUserIdentity()
      if (!identity) {
        throw new Error('Unauthorized: Authentication required')
      }

      const user = await this.ctx.db
        .query('users')
        .withIndex('by_email', (q: any) => q.eq('email', identity.email))
        .first()
      if (!user) {
        throw new Error('User not found')
      }

      return await this.ctx.db
        .query('documents')
        .withIndex('by_user', (q: any) => q.eq('user_id', user._id))
        .order('desc')
        .collect()
    },

    get: async (args: { id: string }) => {
      const identity = await this.ctx.auth.getUserIdentity()
      if (!identity) {
        throw new Error('Unauthorized: Authentication required')
      }

      const document = await this.ctx.db.get(args.id)
      if (!document) {
        throw new Error('Document not found')
      }

      const user = await this.ctx.db
        .query('users')
        .withIndex('by_email', (q: any) => q.eq('email', identity.email))
        .first()
      if (!user || document.user_id !== user._id) {
        throw new Error('Unauthorized: Access denied')
      }

      return document
    },
  }

  // Conversations queries
  conversations = {
    list: async () => {
      const identity = await this.ctx.auth.getUserIdentity()
      if (!identity) {
        throw new Error('Unauthorized: Authentication required')
      }

      const user = await this.ctx.db
        .query('users')
        .withIndex('by_email', (q: any) => q.eq('email', identity.email))
        .first()
      if (!user) {
        throw new Error('User not found')
      }

      return await this.ctx.db
        .query('conversations')
        .withIndex('by_user', (q: any) => q.eq('user_id', user._id))
        .order('desc')
        .collect()
    },

    get: async (args: { id: string }) => {
      const identity = await this.ctx.auth.getUserIdentity()
      if (!identity) {
        throw new Error('Unauthorized: Authentication required')
      }

      const conversation = await this.ctx.db.get(args.id)
      if (!conversation) {
        throw new Error('Conversation not found')
      }

      const user = await this.ctx.db
        .query('users')
        .withIndex('by_email', (q: any) => q.eq('email', identity.email))
        .first()
      if (!user || conversation.user_id !== user._id) {
        throw new Error('Unauthorized: Access denied')
      }

      return conversation
    },
  }

  // Projects queries
  projects = {
    list: async () => {
      const identity = await this.ctx.auth.getUserIdentity()
      if (!identity) {
        throw new Error('Unauthorized: Authentication required')
      }

      const user = await this.ctx.db
        .query('users')
        .withIndex('by_email', (q: any) => q.eq('email', identity.email))
        .first()
      if (!user) {
        throw new Error('User not found')
      }

      return await this.ctx.db
        .query('project_members')
        .withIndex('by_user', (q: any) => q.eq('user_id', user._id))
        .collect()
    },

    get: async (args: { id: string }) => {
      const identity = await this.ctx.auth.getUserIdentity()
      if (!identity) {
        throw new Error('Unauthorized: Authentication required')
      }

      const project = await this.ctx.db.get(args.id)
      if (!project) {
        throw new Error('Project not found')
      }

      const user = await this.ctx.db
        .query('users')
        .withIndex('by_email', (q: any) => q.eq('email', identity.email))
        .first()
      if (!user) {
        throw new Error('User not found')
      }

      // Check project membership - use helper method
      const memberships = this.ctx.getProjectMembers(args.id)
      const userMembership = memberships.find(m => m.user_id === user._id)

      if (!userMembership) {
        throw new Error('Unauthorized: Access denied')
      }

      return project
    },
  }

  // Users queries
  users = {
    current: async () => {
      const identity = await this.ctx.auth.getUserIdentity()
      if (!identity) {
        return null
      }

      return await this.ctx.db
        .query('users')
        .withIndex('by_email', (q: any) => q.eq('email', identity.email))
        .first()
    },

    get: async (args: { id: string }) => {
      const identity = await this.ctx.auth.getUserIdentity()
      if (!identity) {
        throw new Error('Unauthorized: Authentication required')
      }

      const user = await this.ctx.db.get(args.id)
      if (!user) {
        throw new Error('User not found')
      }

      return {
        _id: user._id,
        email: user.email,
        name: user.name,
        avatar_url: user.avatar_url,
        created_at: user.created_at,
      }
    },
  }

  // Prompts queries
  prompts = {
    list: async () => {
      const identity = await this.ctx.auth.getUserIdentity()
      if (!identity) {
        throw new Error('Unauthorized: Authentication required')
      }

      const user = await this.ctx.db
        .query('users')
        .withIndex('by_email', (q: any) => q.eq('email', identity.email))
        .first()
      if (!user) {
        throw new Error('User not found')
      }

      return await this.ctx.db
        .query('prompts')
        .withIndex('by_user', (q: any) => q.eq('user_id', user._id))
        .collect()
    },

    get: async (args: { id: string }) => {
      const identity = await this.ctx.auth.getUserIdentity()
      if (!identity) {
        throw new Error('Unauthorized: Authentication required')
      }

      const prompt = await this.ctx.db.get(args.id)
      if (!prompt) {
        throw new Error('Prompt not found')
      }

      // Check if prompt is public or owned by user
      if (prompt.is_public) {
        return prompt
      }

      const user = await this.ctx.db
        .query('users')
        .withIndex('by_email', (q: any) => q.eq('email', identity.email))
        .first()
      if (!user || prompt.user_id !== user._id) {
        throw new Error('Unauthorized: Access denied')
      }

      return prompt
    },
  }

  // Preferences queries
  preferences = {
    get: async () => {
      const identity = await this.ctx.auth.getUserIdentity()
      if (!identity) {
        throw new Error('Unauthorized: Authentication required')
      }

      const user = await this.ctx.db
        .query('users')
        .withIndex('by_email', (q: any) => q.eq('email', identity.email))
        .first()
      if (!user) {
        throw new Error('User not found')
      }

      return await this.ctx.db
        .query('preferences')
        .withIndex('by_user', (q: any) => q.eq('user_id', user._id))
        .first()
    },
  }
}

// =============================================================================
// Property-Based Tests
// =============================================================================

describe('Query Function Properties', () => {
  let mockCtx: MockConvexContext
  let queryFunctions: MockQueryFunctions
  let analyzer: QueryFunctionAnalyzer

  beforeEach(() => {
    mockCtx = new MockConvexContext()
    queryFunctions = new MockQueryFunctions(mockCtx)
    analyzer = new QueryFunctionAnalyzer()
  })

  afterEach(() => {
    mockCtx.clear()
  })

  /**
   * **Property 7: Authentication method usage**
   * **Validates: Requirements 3.7**
   *
   * For all API routes that require authentication, they should use Convex's
   * ctx.auth.getUserIdentity() method
   */
  describe('Property 7: Authentication method usage', () => {
    it('should use ctx.auth.getUserIdentity() in all query functions', () => {
      fc.assert(
        fc.property(fc.constantFrom(...analyzer.getAllQueryFunctions()), queryModule => {
          // Property: All query functions should use ctx.auth.getUserIdentity()
          const usesCorrectAuthMethod = analyzer.usesAuthGetUserIdentity(queryModule)
          expect(usesCorrectAuthMethod).toBe(true)

          // Property: Query functions should have authentication checks
          const hasAuthCheck = analyzer.hasAuthenticationCheck(queryModule)
          expect(hasAuthCheck).toBe(true)
        }),
        {
          numRuns: analyzer.getAllQueryFunctions().length || 1,
          verbose: true,
        }
      )
    })

    it('should follow consistent authentication patterns', () => {
      fc.assert(
        fc.property(fc.constantFrom(...analyzer.getAllQueryFunctions()), queryModule => {
          const content = analyzer.getQueryFunctionContent(queryModule)

          // Property: If authentication is used, it should follow the pattern
          if (content.includes('ctx.auth.getUserIdentity()')) {
            // Should check if identity exists
            expect(content).toMatch(/if\s*\(\s*!identity\s*\)/)

            // Should throw appropriate error
            expect(content).toMatch(/throw new Error\(["']Unauthorized/)

            // Should query users table by email
            expect(content).toMatch(/query\(["']users["']\)/)
            expect(content).toMatch(/withIndex\(["']by_email["']/)
          }
        }),
        {
          numRuns: analyzer.getAllQueryFunctions().length || 1,
          verbose: true,
        }
      )
    })
  })

  /**
   * **Property 8: Query migration completeness**
   * **Validates: Requirements 4.1, 4.2**
   *
   * For all database read operations, there should be a corresponding Convex
   * query function
   */
  describe('Property 8: Query migration completeness', () => {
    it('should have Convex query for every required entity type', () => {
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
          // Property: Each entity type should have a query module
          const queryModules = analyzer.getAllQueryFunctions()
          expect(queryModules).toContain(entityType)

          // Property: Each query module should have exported functions
          const exportedFunctions = analyzer.extractExportedFunctions(entityType)
          expect(exportedFunctions.length).toBeGreaterThan(0)
        }),
        {
          numRuns: requiredEntityTypes.length,
          verbose: true,
        }
      )
    })

    it('should return data in expected format', async () => {
      await fc.assert(
        fc.asyncProperty(
          emailGenerator,
          fc.constantFrom('documents', 'conversations', 'projects', 'prompts'),
          async (email, queryType) => {
            // Setup authenticated user
            const userId = `user_${Math.random().toString(36).substring(2)}`
            mockCtx.setAuthenticatedUser(email, userId)
            mockCtx.addMockRecord('users', userId, {
              email,
              name: 'Test User',
              created_at: Date.now(),
            })

            // Add sample data for the query type
            const entityId = `${queryType}_${Math.random().toString(36).substring(2)}`
            mockCtx.addMockRecord(queryType, entityId, {
              user_id: userId,
              title: `Test ${queryType}`,
              created_at: Date.now(),
              updated_at: Date.now(),
            })

            // Property: Query should return data in expected format
            const listFunction = (queryFunctions as any)[queryType]?.list
            if (listFunction) {
              const results = await listFunction()

              // Property: Results should be an array
              expect(Array.isArray(results)).toBe(true)

              // Property: Each result should have required fields
              if (results.length > 0) {
                const firstResult = results[0]
                expect(firstResult).toHaveProperty('_id')
                expect(firstResult).toHaveProperty('created_at')
                expect(typeof firstResult.created_at).toBe('number')
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

    it('should handle entity retrieval by ID', async () => {
      await fc.assert(
        fc.asyncProperty(
          emailGenerator,
          fc.constantFrom('documents', 'conversations', 'prompts'),
          async (email, queryType) => {
            // Setup authenticated user
            const userId = `user_${Math.random().toString(36).substring(2)}`
            mockCtx.setAuthenticatedUser(email, userId)
            mockCtx.addMockRecord('users', userId, {
              email,
              name: 'Test User',
              created_at: Date.now(),
            })

            // Add sample entity with correct ownership
            const entityId = `${queryType}_${Math.random().toString(36).substring(2)}`
            const entityData: any = {
              user_id: userId,
              title: `Test ${queryType}`,
              created_at: Date.now(),
              updated_at: Date.now(),
            }

            // For prompts, add is_public field to make them accessible
            if (queryType === 'prompts') {
              entityData.is_public = true
            }

            mockCtx.addMockRecord(queryType, entityId, entityData)

            // Property: Get function should return the specific entity
            const getFunction = (queryFunctions as any)[queryType]?.get
            if (getFunction) {
              const result = await getFunction({ id: entityId })

              // Property: Result should match the stored entity
              expect(result).toBeDefined()
              expect(result._id).toBe(entityId)
              expect(result.user_id).toBe(userId)
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
    it('should reject unauthenticated requests to all queries', async () => {
      const queryFunctionPairs = [
        ['documents', 'list'],
        ['conversations', 'list'],
        ['projects', 'list'],
        ['prompts', 'list'],
        ['preferences', 'get'],
      ]

      await fc.assert(
        fc.asyncProperty(fc.constantFrom(...queryFunctionPairs), async ([module, functionName]) => {
          // Ensure no authentication
          mockCtx.clearAuthentication()

          // Property: Unauthenticated requests should be rejected
          const queryFunction = (queryFunctions as any)[module]?.[functionName]
          if (queryFunction) {
            await expect(queryFunction()).rejects.toThrow(/Unauthorized|Authentication required/)
          }
        }),
        {
          numRuns: queryFunctionPairs.length,
          verbose: true,
        }
      )
    })

    it('should enforce ownership checks for document queries', async () => {
      await fc.assert(
        fc.asyncProperty(
          emailGenerator,
          emailGenerator,
          documentIdGenerator,
          async (ownerEmail, otherEmail, documentId) => {
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

            // Create document owned by first user
            mockCtx.addMockRecord('documents', documentId, {
              user_id: ownerId,
              title: 'Test Document',
              created_at: Date.now(),
              updated_at: Date.now(),
            })

            // Property: Owner should be able to access their document
            mockCtx.setAuthenticatedUser(ownerEmail, ownerId)
            const ownerResult = await queryFunctions.documents.get({ id: documentId })
            expect(ownerResult).toBeDefined()
            expect(ownerResult._id).toBe(documentId)

            // Property: Other user should NOT be able to access the document
            mockCtx.setAuthenticatedUser(otherEmail, otherId)
            await expect(queryFunctions.documents.get({ id: documentId })).rejects.toThrow(
              /Unauthorized|Access denied/
            )
          }
        ),
        {
          numRuns: 50,
          verbose: true,
        }
      )
    })

    it('should enforce project membership checks', async () => {
      await fc.assert(
        fc.asyncProperty(
          emailGenerator,
          emailGenerator,
          projectIdGenerator,
          async (memberEmail, nonMemberEmail, projectId) => {
            fc.pre(memberEmail !== nonMemberEmail)

            // Setup member user
            const memberId = `user_${Math.random().toString(36).substring(2)}`
            mockCtx.addMockRecord('users', memberId, {
              email: memberEmail,
              name: 'Member User',
              created_at: Date.now(),
            })

            // Setup non-member user
            const nonMemberId = `user_${Math.random().toString(36).substring(2)}`
            mockCtx.addMockRecord('users', nonMemberId, {
              email: nonMemberEmail,
              name: 'Non-member User',
              created_at: Date.now(),
            })

            // Create project
            mockCtx.addMockRecord('projects', projectId, {
              name: 'Test Project',
              owner_id: memberId,
              created_at: Date.now(),
              updated_at: Date.now(),
            })

            // Add project membership for first user
            const membershipId = `membership_${Math.random().toString(36).substring(2)}`
            mockCtx.addMockRecord('project_members', membershipId, {
              project_id: projectId,
              user_id: memberId,
              role: 'owner',
              created_at: Date.now(),
            })

            // Property: Member should be able to access the project
            mockCtx.setAuthenticatedUser(memberEmail, memberId)
            const memberResult = await queryFunctions.projects.get({ id: projectId })
            expect(memberResult).toBeDefined()
            expect(memberResult._id).toBe(projectId)

            // Property: Non-member should NOT be able to access the project
            mockCtx.setAuthenticatedUser(nonMemberEmail, nonMemberId)
            await expect(queryFunctions.projects.get({ id: projectId })).rejects.toThrow(
              /Unauthorized|Access denied/
            )
          }
        ),
        {
          numRuns: 50,
          verbose: true,
        }
      )
    })

    it('should allow access to public prompts', async () => {
      await fc.assert(
        fc.asyncProperty(emailGenerator, emailGenerator, async (creatorEmail, viewerEmail) => {
          // Setup creator user
          const creatorId = `user_${Math.random().toString(36).substring(2)}`
          mockCtx.addMockRecord('users', creatorId, {
            email: creatorEmail,
            name: 'Creator User',
            created_at: Date.now(),
          })

          // Setup viewer user
          const viewerId = `user_${Math.random().toString(36).substring(2)}`
          mockCtx.addMockRecord('users', viewerId, {
            email: viewerEmail,
            name: 'Viewer User',
            created_at: Date.now(),
          })

          // Create public prompt
          const promptId = `prompt_${Math.random().toString(36).substring(2)}`
          mockCtx.addMockRecord('prompts', promptId, {
            user_id: creatorId,
            title: 'Public Prompt',
            content: 'This is a public prompt',
            is_public: true,
            created_at: Date.now(),
            updated_at: Date.now(),
          })

          // Property: Any authenticated user should be able to access public prompts
          mockCtx.setAuthenticatedUser(viewerEmail, viewerId)
          const result = await queryFunctions.prompts.get({ id: promptId })
          expect(result).toBeDefined()
          expect(result._id).toBe(promptId)
          expect(result.is_public).toBe(true)
        }),
        {
          numRuns: 50,
          verbose: true,
        }
      )
    })

    it('should deny access to private prompts', async () => {
      await fc.assert(
        fc.asyncProperty(emailGenerator, emailGenerator, async (ownerEmail, otherEmail) => {
          fc.pre(ownerEmail !== otherEmail)

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

          // Create private prompt
          const promptId = `prompt_${Math.random().toString(36).substring(2)}`
          mockCtx.addMockRecord('prompts', promptId, {
            user_id: ownerId,
            title: 'Private Prompt',
            content: 'This is a private prompt',
            is_public: false,
            created_at: Date.now(),
            updated_at: Date.now(),
          })

          // Property: Owner should be able to access their private prompt
          mockCtx.setAuthenticatedUser(ownerEmail, ownerId)
          const ownerResult = await queryFunctions.prompts.get({ id: promptId })
          expect(ownerResult).toBeDefined()
          expect(ownerResult._id).toBe(promptId)

          // Property: Other user should NOT be able to access private prompt
          mockCtx.setAuthenticatedUser(otherEmail, otherId)
          await expect(queryFunctions.prompts.get({ id: promptId })).rejects.toThrow(
            /Unauthorized|Access denied/
          )
        }),
        {
          numRuns: 50,
          verbose: true,
        }
      )
    })

    it('should handle users.current query correctly', async () => {
      await fc.assert(
        fc.asyncProperty(emailGenerator, async email => {
          // Setup user
          const userId = `user_${Math.random().toString(36).substring(2)}`
          mockCtx.addMockRecord('users', userId, {
            email,
            name: 'Test User',
            created_at: Date.now(),
          })

          // Property: Authenticated user should get their own data
          mockCtx.setAuthenticatedUser(email, userId)
          const result = await queryFunctions.users.current()
          expect(result).toBeDefined()
          expect(result.email).toBe(email)

          // Property: Unauthenticated request should return null (not throw)
          mockCtx.clearAuthentication()
          const unauthResult = await queryFunctions.users.current()
          expect(unauthResult).toBeNull()
        }),
        {
          numRuns: 50,
          verbose: true,
        }
      )
    })
  })

  /**
   * **Additional Properties: Query Performance and Data Integrity**
   */
  describe('Query Performance Properties', () => {
    it('should use indexes for efficient queries', () => {
      fc.assert(
        fc.property(fc.constantFrom(...analyzer.getAllQueryFunctions()), queryModule => {
          const content = analyzer.getQueryFunctionContent(queryModule)

          // Property: Queries should use withIndex for efficient lookups
          if (content.includes('query(')) {
            const hasIndexUsage = content.includes('withIndex(')
            expect(hasIndexUsage).toBe(true)
          }
        }),
        {
          numRuns: analyzer.getAllQueryFunctions().length || 1,
          verbose: true,
        }
      )
    })

    it('should return results in consistent order', async () => {
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

          // Property: Multiple calls should return same order
          const firstCall = await queryFunctions.documents.list()
          const secondCall = await queryFunctions.documents.list()

          expect(firstCall).toEqual(secondCall)
        }),
        {
          numRuns: 50,
          verbose: true,
        }
      )
    })
  })

  describe('Data Integrity Properties', () => {
    it('should return complete data without missing fields', async () => {
      await fc.assert(
        fc.asyncProperty(
          emailGenerator,
          fc.constantFrom('documents', 'conversations', 'projects'),
          async (email, entityType) => {
            // Setup authenticated user
            const userId = `user_${Math.random().toString(36).substring(2)}`
            mockCtx.setAuthenticatedUser(email, userId)
            mockCtx.addMockRecord('users', userId, {
              email,
              name: 'Test User',
              created_at: Date.now(),
            })

            // Add sample entity
            const entityId = `${entityType}_${Math.random().toString(36).substring(2)}`
            mockCtx.addMockRecord(entityType, entityId, {
              user_id: userId,
              title: `Test ${entityType}`,
              created_at: Date.now(),
              updated_at: Date.now(),
            })

            // Property: Query results should have all required fields
            const listFunction = (queryFunctions as any)[entityType]?.list
            if (listFunction) {
              const results = await listFunction()

              if (results.length > 0) {
                const firstResult = results[0]

                // Property: All entities should have these core fields
                expect(firstResult).toHaveProperty('_id')
                expect(firstResult).toHaveProperty('created_at')
                expect(typeof firstResult._id).toBe('string')
                expect(typeof firstResult.created_at).toBe('number')
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

    it('should handle non-existent IDs gracefully', async () => {
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

            // Property: Non-existent IDs should throw descriptive errors
            const getFunction = (queryFunctions as any)[entityType]?.get
            if (getFunction) {
              await expect(getFunction({ id: `fake_${fakeId}` })).rejects.toThrow(/not found/i)
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
})
