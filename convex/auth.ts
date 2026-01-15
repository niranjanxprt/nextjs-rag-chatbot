/**
 * Convex Authentication Configuration
 * 
 * Configures passwordless authentication with two providers:
 * 1. Magic Link - Users receive an email with a link to sign in
 * 2. OTP - Users receive a 6-digit code to enter manually
 * 
 * Both methods use Resend for email delivery and have 15-minute expiration.
 */

import { convexAuth } from "@convex-dev/auth/server";
import { ResendOTP } from "./auth/ResendOTP";
import { ResendMagicLink } from "./auth/ResendMagicLink";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [ResendMagicLink, ResendOTP],
});
