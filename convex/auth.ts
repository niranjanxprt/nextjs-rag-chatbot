/**
 * Convex Authentication Configuration
 *
 * Configures passwordless authentication with two providers:
 * 1. Magic Link - Users receive an email with a link to sign in
 * 2. OTP - Users receive a 6-digit code to enter manually
 *
 * Both methods use Resend for email delivery and have 15-minute expiration.
 */

import { convexAuth } from '@convex-dev/auth/server'
import { ResendOTP } from './auth/ResendOTP'
import { ResendMagicLink } from './auth/ResendMagicLink'

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [ResendMagicLink, ResendOTP],
  callbacks: {
    async afterUserCreatedOrUpdated(ctx, { existingUserId, userId }) {
      // Set timestamp fields for new or existing users
      const now = Date.now()
      const id = existingUserId ?? userId

      const user = await ctx.db.get(id)
      if (!user) return

      // Update timestamps
      await ctx.db.patch(id, {
        last_active: now,
        updated_at: now,
        // Only set created_at if it doesn't exist (new user)
        ...(!user.created_at && { created_at: now }),
      })
    },
  },
})
