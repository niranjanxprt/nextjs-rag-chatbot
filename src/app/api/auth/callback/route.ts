/**
 * Auth Callback API Route
 * 
 * Handles magic link verification and creates user session.
 */

import { NextRequest, NextResponse } from "next/server";
import { getConvexClient } from "@/lib/convex/client";
import { api } from "../../../../../convex/_generated/api";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get("token");
    const email = searchParams.get("email");
    
    if (!token || !email) {
      return NextResponse.redirect(
        new URL("/auth/login?error=missing_params", request.url)
      );
    }
    
    const convex = getConvexClient();
    
    // Verify magic link token
    const result = await convex.action(api.auth.signIn, {
      provider: "resend-magic-link",
      params: { email, token },
    });
    
    if (!result || !result.tokens) {
      return NextResponse.redirect(
        new URL("/auth/login?error=invalid_token", request.url)
      );
    }
    
    // Create response with redirect to dashboard
    const response = NextResponse.redirect(
      new URL("/dashboard", request.url)
    );
    
    // Set session token in cookie (use the token from Convex Auth)
    const sessionToken = (result.tokens as any).token;
    if (sessionToken) {
      response.cookies.set("convex_token", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
      });
    }
    
    return response;
  } catch (error) {
    console.error("Error in auth callback:", error);
    return NextResponse.redirect(
      new URL("/auth/login?error=verification_failed", request.url)
    );
  }
}
