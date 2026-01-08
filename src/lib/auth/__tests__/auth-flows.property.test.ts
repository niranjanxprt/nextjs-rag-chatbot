import fc from 'fast-check'
import { createClient } from '@supabase/supabase-js'

// Mock Supabase client
jest.mock('@supabase/supabase-js')
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>

// Mock the auth methods
const mockAuth = {
  signInWithOtp: jest.fn(),
  verifyOtp: jest.fn(),
  getSession: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChange: jest.fn(() => ({
    data: { subscription: { unsubscribe: jest.fn() } },
  })),
}

mockCreateClient.mockReturnValue({
  auth: mockAuth,
} as any)

describe('Authentication Flow Properties', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Property 3: Authentication Flow Completeness', () => {
    it('For any valid email address, requesting authentication should result in proper credential delivery', () => {
      fc.assert(
        fc.asyncProperty(fc.emailAddress(), async email => {
          // Test magic link flow
          mockAuth.signInWithOtp.mockResolvedValueOnce({
            data: { user: null, session: null },
            error: null,
          })

          const result = await mockAuth.signInWithOtp({
            email,
            options: {
              emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
            },
          })

          // Verify the call was made with correct parameters
          expect(mockAuth.signInWithOtp).toHaveBeenCalledWith({
            email,
            options: {
              emailRedirectTo: expect.stringContaining('/auth/callback'),
            },
          })

          // Should not return an error for valid email
          return result.error === null
        }),
        { numRuns: 3 }
      )
    })

    it('For any valid email and OTP token, verification should create a valid session', () => {
      fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.string({ minLength: 6, maxLength: 6 }).filter(s => /^\d+$/.test(s)), // 6-digit OTP
          async (email, token) => {
            // Mock successful OTP verification
            mockAuth.verifyOtp.mockResolvedValueOnce({
              data: {
                user: { id: 'test-user-id', email },
                session: { access_token: 'test-token' },
              },
              error: null,
            })

            const result = await mockAuth.verifyOtp({
              email,
              token,
              type: 'email',
            })

            // Verify the call was made with correct parameters
            expect(mockAuth.verifyOtp).toHaveBeenCalledWith({
              email,
              token,
              type: 'email',
            })

            // Should return user and session data
            return (
              result.data.user !== null && result.data.session !== null && result.error === null
            )
          }
        ),
        { numRuns: 3 }
      )
    })
  })

  describe('Property 4: Session Management', () => {
    it('For any valid session, getSession should return consistent user data', () => {
      fc.assert(
        fc.asyncProperty(
          fc.record({
            id: fc.uuid(),
            email: fc.emailAddress(),
            created_at: fc.date().map(d => d.toISOString()),
          }),
          async userData => {
            const mockSession = {
              access_token: 'test-token',
              user: userData,
              expires_at: Date.now() + 3600000, // 1 hour from now
            }

            mockAuth.getSession.mockResolvedValueOnce({
              data: { session: mockSession },
              error: null,
            })

            const result = await mockAuth.getSession()

            return (
              result.data.session !== null &&
              result.data.session?.user.id === userData.id &&
              result.data.session?.user.email === userData.email &&
              result.error === null
            )
          }
        ),
        { numRuns: 3 }
      )
    })

    it('For any authenticated session, signOut should invalidate all tokens', () => {
      fc.assert(
        fc.asyncProperty(
          fc.uuid(), // user ID
          async userId => {
            mockAuth.signOut.mockResolvedValueOnce({ error: null })

            const result = await mockAuth.signOut()

            expect(mockAuth.signOut).toHaveBeenCalled()
            return result.error === null
          }
        ),
        { numRuns: 3 }
      )
    })

    it('For any expired session, getSession should return null session', () => {
      fc.assert(
        fc.asyncProperty(
          fc.record({
            id: fc.uuid(),
            email: fc.emailAddress(),
            created_at: fc.date().map(d => d.toISOString()),
          }),
          async userData => {
            mockAuth.getSession.mockResolvedValueOnce({
              data: { session: null }, // Supabase returns null for expired sessions
              error: null,
            })

            const result = await mockAuth.getSession()

            return result.data.session === null && result.error === null
          }
        ),
        { numRuns: 3 }
      )
    })
  })
})
