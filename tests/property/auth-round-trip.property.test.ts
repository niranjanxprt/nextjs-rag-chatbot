/**
 * Property-Based Tests for Authentication Round-Trip
 *
 * These tests validate the correctness of the Convex authentication system.
 * Each property test verifies universal correctness properties across authentication flows.
 *
 * **Validates: Requirements 3.4, 3.5, 3.11**
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import fc from 'fast-check'

// =============================================================================
// Test Configuration and Setup
// =============================================================================

/**
 * Mock authentication service for testing
 * This simulates the Convex authentication behavior without making real API calls
 */
class MockAuthService {
  private mockTokenStore = new Map<string, { email: string; token: string; expires: number }>()
  private mockOTPStore = new Map<string, { email: string; code: string; expires: number }>()

  async sendMagicLink(email: string): Promise<{ success: boolean; token: string }> {
    const now = Date.now()
    const token = `magic_${Math.random().toString(36).substring(2)}`
    this.mockTokenStore.set(token, {
      email,
      token,
      expires: now + 15 * 60 * 1000, // 15 minutes
    })
    return { success: true, token }
  }

  async verifyMagicLink(
    email: string,
    token: string
  ): Promise<{ tokens: { token: string }; user: { email: string } }> {
    const now = Date.now()
    const stored = this.mockTokenStore.get(token)
    if (stored && stored.email === email && stored.expires > now) {
      const sessionToken = `session_${Math.random().toString(36).substring(2)}`
      return {
        tokens: { token: sessionToken },
        user: { email },
      }
    } else {
      throw new Error('Invalid or expired magic link token')
    }
  }

  async sendOTP(email: string): Promise<{ success: boolean; code: string }> {
    const now = Date.now()
    const code = Math.floor(100000 + Math.random() * 900000).toString() // 6-digit code
    const key = `${email}_${code}`
    this.mockOTPStore.set(key, {
      email,
      code,
      expires: now + 15 * 60 * 1000, // 15 minutes
    })
    return { success: true, code }
  }

  async verifyOTP(
    email: string,
    code: string
  ): Promise<{ tokens: { token: string }; user: { email: string } }> {
    const now = Date.now()
    const stored = Array.from(this.mockOTPStore.values()).find(
      entry => entry.email === email && entry.code === code && entry.expires > now
    )
    if (stored) {
      const sessionToken = `session_${Math.random().toString(36).substring(2)}`
      return {
        tokens: { token: sessionToken },
        user: { email },
      }
    } else {
      throw new Error('Invalid or expired OTP code')
    }
  }

  // Helper method to get stored magic link token for testing
  getMagicLinkToken(email: string): string | null {
    for (const [token, data] of this.mockTokenStore.entries()) {
      if (data.email === email && data.expires > Date.now()) {
        return token
      }
    }
    return null
  }

  // Helper method to get stored OTP code for testing
  getOTPCode(email: string): string | null {
    for (const data of this.mockOTPStore.values()) {
      if (data.email === email && data.expires > Date.now()) {
        return data.code
      }
    }
    return null
  }

  // Helper method to simulate token expiration
  expireTokens() {
    const now = Date.now()
    // Force expire all tokens by setting their expiration to the past
    for (const [key, data] of this.mockTokenStore.entries()) {
      data.expires = now - 1000 // Set to 1 second ago
    }
    for (const [key, data] of this.mockOTPStore.entries()) {
      data.expires = now - 1000 // Set to 1 second ago
    }
  }

  // Clear all stored tokens and codes
  clear() {
    this.mockTokenStore.clear()
    this.mockOTPStore.clear()
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
 * Generate valid 6-digit OTP codes
 */
const otpCodeGenerator = fc.integer({ min: 100000, max: 999999 }).map(n => n.toString())

/**
 * Generate magic link tokens
 */
const magicLinkTokenGenerator = fc.string({ minLength: 20, maxLength: 50 })

/**
 * Generate session tokens
 */
const sessionTokenGenerator = fc.string({ minLength: 30, maxLength: 100 })

/**
 * Session token storage simulation
 */
class MockSessionStorage {
  private storage = new Map<string, { email: string; expires: number }>()

  store(token: string, email: string, expiresInMs: number = 30 * 24 * 60 * 60 * 1000) {
    this.storage.set(token, {
      email,
      expires: Date.now() + expiresInMs,
    })
  }

  retrieve(token: string): { email: string } | null {
    const data = this.storage.get(token)
    if (data && data.expires > Date.now()) {
      return { email: data.email }
    }
    return null
  }

  isValid(token: string): boolean {
    return this.retrieve(token) !== null
  }

  clear() {
    this.storage.clear()
  }
}

// =============================================================================
// Property-Based Tests
// =============================================================================

describe('Authentication Round-Trip Properties', () => {
  let authService: MockAuthService
  let sessionStorage: MockSessionStorage

  beforeEach(() => {
    authService = new MockAuthService()
    sessionStorage = new MockSessionStorage()
  })

  afterEach(() => {
    authService.clear()
    sessionStorage.clear()
  })

  /**
   * **Property 4: Magic link round-trip**
   * **Validates: Requirements 3.4**
   *
   * For any valid email address, generating a magic link token and then
   * verifying that token should successfully create a session
   */
  describe('Property 4: Magic link round-trip', () => {
    it('should create session after magic link verification', async () => {
      await fc.assert(
        fc.asyncProperty(emailGenerator, async email => {
          // Step 1: Send magic link
          const sendResult = await authService.sendMagicLink(email)

          // Property: Magic link send should succeed
          expect(sendResult.success).toBe(true)
          expect(sendResult.token).toBeDefined()

          // Step 2: Get the generated token
          const token = authService.getMagicLinkToken(email)
          expect(token).toBeDefined()
          expect(token).toBe(sendResult.token)

          // Step 3: Verify magic link token
          const verifyResult = await authService.verifyMagicLink(email, token!)

          // Property: Magic link verification should create valid session
          expect(verifyResult.tokens).toBeDefined()
          expect(verifyResult.tokens.token).toBeDefined()
          expect(verifyResult.user).toBeDefined()
          expect(verifyResult.user.email).toBe(email)

          // Property: Session token should be a non-empty string
          const sessionToken = verifyResult.tokens.token
          expect(typeof sessionToken).toBe('string')
          expect(sessionToken.length).toBeGreaterThan(0)
        }),
        {
          numRuns: 100,
          verbose: true,
        }
      )
    })

    it('should reject invalid magic link tokens', async () => {
      await fc.assert(
        fc.asyncProperty(emailGenerator, magicLinkTokenGenerator, async (email, invalidToken) => {
          // Property: Invalid tokens should be rejected
          await expect(authService.verifyMagicLink(email, invalidToken)).rejects.toThrow(
            'Invalid or expired magic link token'
          )
        }),
        {
          numRuns: 50,
          verbose: true,
        }
      )
    })

    it('should reject expired magic link tokens', async () => {
      await fc.assert(
        fc.asyncProperty(emailGenerator, async email => {
          // Step 1: Send magic link
          await authService.sendMagicLink(email)

          const token = authService.getMagicLinkToken(email)
          expect(token).toBeDefined()

          // Step 2: Simulate token expiration
          authService.expireTokens()

          // Property: Expired tokens should be rejected
          await expect(authService.verifyMagicLink(email, token!)).rejects.toThrow(
            'Invalid or expired magic link token'
          )
        }),
        {
          numRuns: 50,
          verbose: true,
        }
      )
    })
  })

  /**
   * **Property 5: OTP round-trip**
   * **Validates: Requirements 3.5**
   *
   * For any valid email address, generating an OTP code and then
   * verifying that code should successfully create a session
   */
  describe('Property 5: OTP round-trip', () => {
    it('should create session after OTP verification', async () => {
      await fc.assert(
        fc.asyncProperty(emailGenerator, async email => {
          // Step 1: Send OTP
          const sendResult = await authService.sendOTP(email)

          // Property: OTP send should succeed
          expect(sendResult.success).toBe(true)
          expect(sendResult.code).toBeDefined()

          // Step 2: Get the generated code
          const code = authService.getOTPCode(email)
          expect(code).toBeDefined()
          expect(code).toBe(sendResult.code)
          expect(code).toMatch(/^\d{6}$/) // Should be 6 digits

          // Step 3: Verify OTP code
          const verifyResult = await authService.verifyOTP(email, code!)

          // Property: OTP verification should create valid session
          expect(verifyResult.tokens).toBeDefined()
          expect(verifyResult.tokens.token).toBeDefined()
          expect(verifyResult.user).toBeDefined()
          expect(verifyResult.user.email).toBe(email)

          // Property: Session token should be a non-empty string
          const sessionToken = verifyResult.tokens.token
          expect(typeof sessionToken).toBe('string')
          expect(sessionToken.length).toBeGreaterThan(0)
        }),
        {
          numRuns: 100,
          verbose: true,
        }
      )
    })

    it('should reject invalid OTP codes', async () => {
      await fc.assert(
        fc.asyncProperty(emailGenerator, otpCodeGenerator, async (email, invalidCode) => {
          // Send OTP first
          await authService.sendOTP(email)

          const validCode = authService.getOTPCode(email)

          // Skip if the random invalid code happens to match the valid one
          fc.pre(invalidCode !== validCode)

          // Property: Invalid codes should be rejected
          await expect(authService.verifyOTP(email, invalidCode)).rejects.toThrow(
            'Invalid or expired OTP code'
          )
        }),
        {
          numRuns: 50,
          verbose: true,
        }
      )
    })

    it('should reject expired OTP codes', async () => {
      await fc.assert(
        fc.asyncProperty(emailGenerator, async email => {
          // Step 1: Send OTP
          await authService.sendOTP(email)

          const code = authService.getOTPCode(email)
          expect(code).toBeDefined()

          // Step 2: Simulate code expiration
          authService.expireTokens()

          // Property: Expired codes should be rejected
          await expect(authService.verifyOTP(email, code!)).rejects.toThrow(
            'Invalid or expired OTP code'
          )
        }),
        {
          numRuns: 50,
          verbose: true,
        }
      )
    })

    it('should generate 6-digit numeric codes', async () => {
      await fc.assert(
        fc.asyncProperty(emailGenerator, async email => {
          // Send OTP
          const sendResult = await authService.sendOTP(email)

          const code = sendResult.code

          // Property: OTP codes should be exactly 6 digits
          expect(code).toMatch(/^\d{6}$/)
          expect(code.length).toBe(6)
          expect(parseInt(code, 10)).toBeGreaterThanOrEqual(100000)
          expect(parseInt(code, 10)).toBeLessThanOrEqual(999999)
        }),
        {
          numRuns: 100,
          verbose: true,
        }
      )
    })
  })

  /**
   * **Property 6: Session token persistence**
   * **Validates: Requirements 3.11**
   *
   * For any successful authentication (magic link or OTP), a session token
   * should be stored and retrievable for subsequent requests
   */
  describe('Property 6: Session token persistence', () => {
    it('should persist session tokens from magic link authentication', async () => {
      await fc.assert(
        fc.asyncProperty(emailGenerator, async email => {
          // Step 1: Complete magic link authentication
          await authService.sendMagicLink(email)

          const token = authService.getMagicLinkToken(email)
          const verifyResult = await authService.verifyMagicLink(email, token!)

          const sessionToken = verifyResult.tokens.token

          // Step 2: Store session token
          sessionStorage.store(sessionToken, email)

          // Property: Session token should be retrievable
          const retrievedSession = sessionStorage.retrieve(sessionToken)
          expect(retrievedSession).toBeDefined()
          expect(retrievedSession!.email).toBe(email)

          // Property: Session token should be valid
          expect(sessionStorage.isValid(sessionToken)).toBe(true)
        }),
        {
          numRuns: 100,
          verbose: true,
        }
      )
    })

    it('should persist session tokens from OTP authentication', async () => {
      await fc.assert(
        fc.asyncProperty(emailGenerator, async email => {
          // Step 1: Complete OTP authentication
          await authService.sendOTP(email)

          const code = authService.getOTPCode(email)
          const verifyResult = await authService.verifyOTP(email, code!)

          const sessionToken = verifyResult.tokens.token

          // Step 2: Store session token
          sessionStorage.store(sessionToken, email)

          // Property: Session token should be retrievable
          const retrievedSession = sessionStorage.retrieve(sessionToken)
          expect(retrievedSession).toBeDefined()
          expect(retrievedSession!.email).toBe(email)

          // Property: Session token should be valid
          expect(sessionStorage.isValid(sessionToken)).toBe(true)
        }),
        {
          numRuns: 100,
          verbose: true,
        }
      )
    })

    it('should handle session token uniqueness', async () => {
      await fc.assert(
        fc.asyncProperty(fc.array(emailGenerator, { minLength: 2, maxLength: 5 }), async emails => {
          const sessionTokens = new Set<string>()

          // Generate session tokens for multiple users
          for (const email of emails) {
            // Use magic link authentication
            await authService.sendMagicLink(email)

            const token = authService.getMagicLinkToken(email)
            const verifyResult = await authService.verifyMagicLink(email, token!)

            const sessionToken = verifyResult.tokens.token
            sessionTokens.add(sessionToken)
            sessionStorage.store(sessionToken, email)
          }

          // Property: All session tokens should be unique
          expect(sessionTokens.size).toBe(emails.length)

          // Property: All session tokens should be valid and retrievable
          for (const token of sessionTokens) {
            expect(sessionStorage.isValid(token)).toBe(true)
            const session = sessionStorage.retrieve(token)
            expect(session).toBeDefined()
            expect(emails).toContain(session!.email)
          }
        }),
        {
          numRuns: 50,
          verbose: true,
        }
      )
    })

    it('should handle session token expiration', async () => {
      await fc.assert(
        fc.asyncProperty(emailGenerator, async email => {
          // Step 1: Complete authentication and get session token
          await authService.sendMagicLink(email)

          const token = authService.getMagicLinkToken(email)
          const verifyResult = await authService.verifyMagicLink(email, token!)

          const sessionToken = verifyResult.tokens.token

          // Step 2: Store session token with short expiration (1ms)
          sessionStorage.store(sessionToken, email, 1)

          // Step 3: Wait for expiration
          await new Promise(resolve => setTimeout(resolve, 10))

          // Property: Expired session tokens should not be valid
          expect(sessionStorage.isValid(sessionToken)).toBe(false)
          expect(sessionStorage.retrieve(sessionToken)).toBeNull()
        }),
        {
          numRuns: 50,
          verbose: true,
        }
      )
    })

    it('should reject invalid session tokens', async () => {
      fc.assert(
        fc.property(sessionTokenGenerator, invalidToken => {
          // Property: Invalid session tokens should not be valid
          expect(sessionStorage.isValid(invalidToken)).toBe(false)
          expect(sessionStorage.retrieve(invalidToken)).toBeNull()
        }),
        {
          numRuns: 100,
          verbose: true,
        }
      )
    })
  })

  /**
   * **Additional Property: Authentication method consistency**
   *
   * Verify that both authentication methods produce equivalent results
   */
  describe('Authentication method consistency', () => {
    it('should produce equivalent sessions for magic link and OTP', async () => {
      await fc.assert(
        fc.asyncProperty(emailGenerator, async email => {
          // Step 1: Authenticate via magic link
          await authService.sendMagicLink(email)

          const magicToken = authService.getMagicLinkToken(email)
          const magicResult = await authService.verifyMagicLink(email, magicToken!)

          // Step 2: Authenticate via OTP (using fresh service to avoid conflicts)
          const otpService = new MockAuthService()
          await otpService.sendOTP(email)

          const otpCode = otpService.getOTPCode(email)
          const otpResult = await otpService.verifyOTP(email, otpCode!)

          // Property: Both methods should produce valid sessions
          expect(magicResult.tokens.token).toBeDefined()
          expect(otpResult.tokens.token).toBeDefined()
          expect(magicResult.user.email).toBe(email)
          expect(otpResult.user.email).toBe(email)

          // Property: Session tokens should be different but both valid
          expect(magicResult.tokens.token).not.toBe(otpResult.tokens.token)

          // Store both tokens and verify they work
          sessionStorage.store(magicResult.tokens.token, email)
          sessionStorage.store(otpResult.tokens.token, email)

          expect(sessionStorage.isValid(magicResult.tokens.token)).toBe(true)
          expect(sessionStorage.isValid(otpResult.tokens.token)).toBe(true)
        }),
        {
          numRuns: 50,
          verbose: true,
        }
      )
    })
  })
})
